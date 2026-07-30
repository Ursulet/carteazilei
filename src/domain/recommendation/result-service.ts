import "server-only";

import { createHmac } from "node:crypto";

import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb, type Database } from "@/db";
import { getRecommendationCandidates } from "@/db/queries/recommendation-candidates";
import { listOffersForResolvedRecommendation } from "@/db/queries/public-commercial-offers";
import {
  authors,
  bookEditions,
  books,
  mediaAssets,
  recommendationResults,
  recommendationSessions,
} from "@/db/schema";
import { getServerEnv } from "@/lib/env/server";

import { recommendationEngineInputForBranch } from "./branch-adapter";
import type { RecommendationExplanationSnapshot } from "./engine-types";
import { RECOMMENDATION_ALGORITHM_VERSION, runRecommendationEngineV1 } from "./engine-v1";
import { getRecommendationConfiguration } from "./configuration-service";
import {
  parseCompleteRecommendationAnswers,
  recommendationSnapshotSchema,
} from "./input";
import { RecommendationSessionError } from "./session-service";

const opaqueTokenPattern = /^[A-Za-z0-9_-]{32,128}$/;

const explanationSchema = z.object({
  schemaVersion: z.literal(1),
  confidenceLabel: z.enum([
    "Potrivire excelentă",
    "Potrivire foarte bună",
    "Potrivire bună",
  ]),
  reasons: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1)]),
  caveat: z.string().min(1),
});

/** Calculează HMAC-ul tokenului sesiunii fără a expune valoarea brută bazei de date. */
function sessionTokenHash(rawToken: string) {
  return createHmac("sha256", getServerEnv().AUTH_SECRET)
    .update(`session:${rawToken}`)
    .digest("hex");
}

/** Derivă determinist un capability token separat pentru URL-ul rezultatului. */
function derivePublicResultToken(rawSessionToken: string) {
  return createHmac("sha256", getServerEnv().AUTH_SECRET)
    .update(`result-route:${rawSessionToken}`)
    .digest("base64url");
}

/** Calculează valoarea persistentă a tokenului public de rezultat. */
export function publicResultTokenHash(rawResultToken: string) {
  return createHmac("sha256", getServerEnv().AUTH_SECRET)
    .update(`result-access:${rawResultToken}`)
    .digest("hex");
}

/** Validează forma tokenului opac înainte de orice query. */
function validOpaqueToken(value: string | null | undefined) {
  return value && opaqueTokenPattern.test(value) ? value : null;
}

/** Parsează snapshotul de explicație persistat de versiunea motorului. */
function parseExplanation(value: string): RecommendationExplanationSnapshot | null {
  try {
    const parsed = explanationSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Generează o singură dată rezultatele unei sesiuni complete. Motorul primește
 * numai catalog editorial; ofertele sunt încărcate ulterior de pagina publică.
 */
export async function generateRecommendationResults(
  rawSessionToken: string | null | undefined,
) {
  const token = validOpaqueToken(rawSessionToken);
  if (!token) throw new RecommendationSessionError("Sesiunea lipsește.", 401);
  const db = getDb();
  const [session] = await db
    .select({
      id: recommendationSessions.id,
      status: recommendationSessions.status,
      branch: recommendationSessions.branch,
      answersJson: recommendationSessions.answersJson,
      resultTokenHash: recommendationSessions.resultTokenHash,
    })
    .from(recommendationSessions)
    .where(eq(recommendationSessions.opaqueToken, sessionTokenHash(token)))
    .limit(1);
  if (!session) throw new RecommendationSessionError("Sesiunea nu mai există.", 401);
  if (session.status !== "completed") {
    throw new RecommendationSessionError("Profilul trebuie finalizat înainte de recomandare.", 409);
  }

  const publicToken = derivePublicResultToken(token);
  const expectedHash = publicResultTokenHash(publicToken);
  if (session.resultTokenHash === expectedHash) {
    return { resultPath: `/recomanda-mi/rezultat/${publicToken}` };
  }

  const snapshot = recommendationSnapshotSchema.safeParse(session.answersJson);
  const answers = snapshot.success
    ? parseCompleteRecommendationAnswers(session.branch, snapshot.data.steps)
    : null;
  if (!answers) {
    throw new RecommendationSessionError("Răspunsurile complete nu mai pot fi validate.", 409);
  }

  const [candidates, configuration] = await Promise.all([
    getRecommendationCandidates(session.branch === "self" ? answers.likedBookId : null, db),
    getRecommendationConfiguration(db),
  ]);
  const engineResults = runRecommendationEngineV1(
    recommendationEngineInputForBranch(session.branch, answers, candidates),
    configuration,
  );

  await db.transaction(async (transaction) => {
    const [locked] = await transaction
      .select({
        id: recommendationSessions.id,
        resultTokenHash: recommendationSessions.resultTokenHash,
      })
      .from(recommendationSessions)
      .where(eq(recommendationSessions.id, session.id))
      .for("update")
      .limit(1);
    if (!locked) throw new RecommendationSessionError("Sesiunea nu mai există.", 401);
    if (locked.resultTokenHash === expectedHash) return;

    if (engineResults.length) {
      await transaction.insert(recommendationResults).values(
        engineResults.map((result) => ({
          sessionId: session.id,
          bookId: result.candidate.id,
          rank: result.rank,
          score: result.score.toFixed(2),
          reasonCodes: result.reasonCodes,
          explanationSnapshot: JSON.stringify(result.explanation),
          algorithmVersion: `${RECOMMENDATION_ALGORITHM_VERSION}:${session.branch}:r${configuration.revision}`,
        })),
      );
    }
    await transaction
      .update(recommendationSessions)
      .set({ resultTokenHash: expectedHash })
      .where(eq(recommendationSessions.id, session.id));
  });
  return { resultPath: `/recomanda-mi/rezultat/${publicToken}` };
}

/**
 * Hidratează snapshoturile publice. Nu reface scoringul și nu schimbă ordinea
 * dacă între timp catalogul sau ofertele s-au modificat.
 */
export async function getPublicRecommendationResult(
  rawResultToken: string,
  db: Database = getDb(),
) {
  const token = validOpaqueToken(rawResultToken);
  if (!token) return null;
  const [session] = await db
    .select({ id: recommendationSessions.id, branch: recommendationSessions.branch })
    .from(recommendationSessions)
    .where(
      and(
        eq(recommendationSessions.resultTokenHash, publicResultTokenHash(token)),
        eq(recommendationSessions.status, "completed"),
      ),
    )
    .limit(1);
  if (!session) return null;

  const rows = await db
    .select({
      id: recommendationResults.id,
      rank: recommendationResults.rank,
      algorithmVersion: recommendationResults.algorithmVersion,
      explanationSnapshot: recommendationResults.explanationSnapshot,
      book: {
        id: books.id,
        title: books.title,
        slug: books.slug,
        verdict: books.shortVerdict,
      },
      author: { id: authors.id, name: authors.name, slug: authors.slug },
      cover: {
        id: mediaAssets.id,
        altText: mediaAssets.altText,
        width: mediaAssets.width,
        height: mediaAssets.height,
      },
      pageCount: bookEditions.pageCount,
    })
    .from(recommendationResults)
    .innerJoin(books, eq(books.id, recommendationResults.bookId))
    .innerJoin(authors, eq(authors.id, books.primaryAuthorId))
    .innerJoin(bookEditions, eq(bookEditions.bookId, books.id))
    .innerJoin(mediaAssets, eq(mediaAssets.id, bookEditions.coverAssetId))
    .where(
      and(
        eq(recommendationResults.sessionId, session.id),
        eq(books.status, "published"),
        isNull(books.deletedAt),
        eq(authors.status, "published"),
        isNull(authors.deletedAt),
        eq(bookEditions.active, true),
        isNull(bookEditions.deletedAt),
        sql`${bookEditions.id} = (
          select selected_edition.id from book_editions selected_edition
          where selected_edition.book_id = ${books.id}
            and selected_edition.active
            and selected_edition.deleted_at is null
          order by selected_edition.updated_at desc
          limit 1
        )`,
        isNull(mediaAssets.deletedAt),
      ),
    )
    .orderBy(asc(recommendationResults.rank));

  const results = await Promise.all(
    rows.flatMap((row) => {
      const explanation = parseExplanation(row.explanationSnapshot);
      if (
        !explanation ||
        !row.book.verdict ||
        !row.cover.altText ||
        !row.cover.width ||
        !row.cover.height
      ) {
        return [];
      }
      return [
        (async () => ({
          ...row,
          book: { ...row.book, verdict: row.book.verdict },
          cover: {
            id: row.cover.id,
            altText: row.cover.altText,
            width: row.cover.width,
            height: row.cover.height,
          },
          explanation,
          offers: await listOffersForResolvedRecommendation(row.book.id, db),
        }))(),
      ];
    }),
  );
  return { sessionId: session.id, branch: session.branch, results };
}

export type PublicRecommendationResult = NonNullable<
  Awaited<ReturnType<typeof getPublicRecommendationResult>>
>;
