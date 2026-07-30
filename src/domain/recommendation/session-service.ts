import "server-only";

import { createHmac, randomBytes } from "node:crypto";

import { and, eq, gt, isNull } from "drizzle-orm";

import { getDb, type Database } from "@/db";
import {
  authors,
  books,
  genres,
  productEvents,
  recommendationQuizEvents,
  recommendationSessions,
  type RecommendationAnswerValue,
  type RecommendationAnswersSnapshot,
} from "@/db/schema";
import { getServerEnv } from "@/lib/env/server";

import {
  parseCompleteRecommendationAnswers,
  parsePartialRecommendationAnswers,
  recommendationSnapshotSchema,
  type RecommendationStepPayload,
} from "./input";
import type {
  RecommendationAnswers,
  RecommendationBranch,
  RecommendationSessionView,
} from "./types";
import { recommendationStepsForBranch } from "./types";

export const recommendationSessionCookie = "cz_rec_session";
export const recommendationAnonymousCookie = "cz_rec_anon";
export const recommendationSessionMaxAgeSeconds = 7 * 24 * 60 * 60;
export const recommendationAnonymousMaxAgeSeconds = 90 * 24 * 60 * 60;

const rawTokenPattern = /^[A-Za-z0-9_-]{32,128}$/;

export class RecommendationSessionError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
    this.name = "RecommendationSessionError";
  }
}

function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

function validRawToken(value: string | null | undefined) {
  return value && rawTokenPattern.test(value) ? value : null;
}

function tokenHash(scope: "session" | "anonymous", rawToken: string) {
  return createHmac("sha256", getServerEnv().AUTH_SECRET)
    .update(`${scope}:${rawToken}`)
    .digest("hex");
}

function emptySnapshot(): RecommendationAnswersSnapshot {
  return { schemaVersion: 1, steps: {} };
}

function snapshotFromAnswers(answers: RecommendationAnswers): RecommendationAnswersSnapshot {
  return {
    schemaVersion: 1,
    steps: answers as Record<string, RecommendationAnswerValue>,
  };
}

function parseAnswers(snapshot: unknown, branch: RecommendationBranch) {
  const parsed = recommendationSnapshotSchema.safeParse(snapshot);
  if (!parsed.success) {
    throw new RecommendationSessionError("Sesiunea are un format incompatibil.", 409);
  }
  const answers = parsePartialRecommendationAnswers(branch, parsed.data.steps);
  if (!answers) {
    throw new RecommendationSessionError("Răspunsurile sesiunii nu corespund contextului ales.", 409);
  }
  return answers;
}

async function likedBookSummary(
  likedBookId: string | null | undefined,
  db: Database,
) {
  if (!likedBookId) return null;
  const [book] = await db
    .select({ id: books.id, title: books.title, author: authors.name })
    .from(books)
    .innerJoin(authors, eq(authors.id, books.primaryAuthorId))
    .where(
      and(
        eq(books.id, likedBookId),
        eq(books.status, "published"),
        isNull(books.deletedAt),
        eq(authors.status, "published"),
        isNull(authors.deletedAt),
      ),
    )
    .limit(1);
  return book ?? null;
}

async function toSessionView(
  row: { branch: RecommendationBranch; status: "started" | "completed" | "expired"; answersJson: unknown },
  db: Database,
): Promise<RecommendationSessionView> {
  if (row.status === "expired") {
    throw new RecommendationSessionError("Sesiunea a expirat.", 410);
  }
  const answers = parseAnswers(row.answersJson, row.branch);
  return {
    branch: row.branch,
    status: row.status,
    answers,
    likedBook: await likedBookSummary(answers.likedBookId, db),
  };
}

export async function getRecommendationSessionByRawToken(
  rawToken: string | null | undefined,
  db: Database = getDb(),
) {
  const token = validRawToken(rawToken);
  if (!token) return null;
  const [row] = await db
    .select({
      branch: recommendationSessions.branch,
      status: recommendationSessions.status,
      answersJson: recommendationSessions.answersJson,
      expiresAt: recommendationSessions.expiresAt,
    })
    .from(recommendationSessions)
    .where(
      and(
        eq(recommendationSessions.opaqueToken, tokenHash("session", token)),
        gt(recommendationSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!row) return null;
  return toSessionView(row, db);
}

export async function createOrResumeRecommendationSession({
  branch,
  rawSessionToken,
  rawAnonymousToken,
  forceNew = false,
}: {
  branch: RecommendationBranch;
  rawSessionToken?: string | null;
  rawAnonymousToken?: string | null;
  forceNew?: boolean;
}) {
  const db = getDb();
  const existingToken = validRawToken(rawSessionToken);
  if (existingToken && !forceNew) {
    const session = await getRecommendationSessionByRawToken(existingToken, db);
    if (session?.branch === branch) {
      return {
        rawSessionToken: existingToken,
        rawAnonymousToken: validRawToken(rawAnonymousToken) ?? randomToken(24),
        session,
      };
    }
  }

  const newSessionToken = randomToken();
  const anonymousToken = validRawToken(rawAnonymousToken) ?? randomToken(24);
  const anonymousSessionId = tokenHash("anonymous", anonymousToken);
  const expiresAt = new Date(Date.now() + recommendationSessionMaxAgeSeconds * 1_000);
  const row = await db.transaction(async (transaction) => {
    const [created] = await transaction
      .insert(recommendationSessions)
      .values({
        opaqueToken: tokenHash("session", newSessionToken),
        anonymousSessionId,
        branch,
        status: "started",
        answersJson: emptySnapshot(),
        expiresAt,
      })
      .returning({
        id: recommendationSessions.id,
        branch: recommendationSessions.branch,
        status: recommendationSessions.status,
        answersJson: recommendationSessions.answersJson,
      });
    if (!created) throw new RecommendationSessionError("Sesiunea nu a putut fi creată.", 500);
    await transaction.insert(recommendationQuizEvents).values({
      sessionId: created.id,
      eventType: "started",
    });
    await transaction.insert(productEvents).values({
      eventName: "recommendation_quiz_started",
      anonymousSessionId,
      recommendationSessionId: created.id,
      sourcePath: "/recomanda-mi",
      dedupeKey: `quiz-started:${created.id}`,
    });
    return created;
  });

  return {
    rawSessionToken: newSessionToken,
    rawAnonymousToken: anonymousToken,
    session: await toSessionView(row, db),
  };
}

async function assertStepReferences(payload: RecommendationStepPayload, db: Database) {
  if (["genres", "gift_interests", "child_interests"].includes(payload.step)) {
    const genrePayload = payload as Extract<RecommendationStepPayload, { step: "genres" | "gift_interests" | "child_interests" }>;
    const selectedIds = genrePayload.value.filter((value) => value !== "any");
    if (!selectedIds.length) return;
    const rows = await Promise.all(
      selectedIds.map(async (id) => {
        const [row] = await db
          .select({ id: genres.id })
          .from(genres)
          .where(and(eq(genres.id, id), eq(genres.status, "published"), isNull(genres.deletedAt)))
          .limit(1);
        return row;
      }),
    );
    if (rows.some((row) => !row)) {
      throw new RecommendationSessionError("Unul dintre genurile alese nu mai este disponibil.");
    }
  }

  if (payload.step === "liked_book" && payload.value) {
    const book = await likedBookSummary(payload.value, db);
    if (!book) {
      throw new RecommendationSessionError("Cartea de referință nu mai este disponibilă.");
    }
  }
}

function applyStep(
  answers: RecommendationAnswers,
  payload: RecommendationStepPayload,
): RecommendationAnswers {
  switch (payload.step) {
    case "need": return { ...answers, need: payload.value };
    case "genres": return { ...answers, genres: payload.value };
    case "pace": return { ...answers, pace: payload.value };
    case "length": return { ...answers, length: payload.value };
    case "liked_book": return { ...answers, likedBookId: payload.value };
    case "deal_breakers": return { ...answers, dealBreakers: payload.value };
    case "gift_relationship": return { ...answers, giftRelationship: payload.value };
    case "gift_age": return { ...answers, giftAge: payload.value };
    case "gift_occasion": return { ...answers, giftOccasion: payload.value };
    case "gift_interests": return { ...answers, giftInterests: payload.value };
    case "gift_reading_habit": return { ...answers, giftReadingHabit: payload.value };
    case "gift_style": return { ...answers, giftStyle: payload.value };
    case "child_age": return { ...answers, childAge: payload.value };
    case "child_reading_level": return { ...answers, childReadingLevel: payload.value };
    case "child_reading_mode": return { ...answers, childReadingMode: payload.value };
    case "child_interests": return { ...answers, childInterests: payload.value };
    case "child_goal": return { ...answers, childGoal: payload.value };
    case "child_sensitivities": return { ...answers, childSensitivities: payload.value };
  }
}

export async function saveRecommendationStep(
  rawToken: string | null | undefined,
  payload: RecommendationStepPayload,
) {
  const token = validRawToken(rawToken);
  if (!token) throw new RecommendationSessionError("Sesiunea lipsește.", 401);
  const db = getDb();
  await assertStepReferences(payload, db);
  const row = await db.transaction(async (transaction) => {
    const [current] = await transaction
      .select({
        id: recommendationSessions.id,
        branch: recommendationSessions.branch,
        anonymousSessionId: recommendationSessions.anonymousSessionId,
        status: recommendationSessions.status,
        answersJson: recommendationSessions.answersJson,
        expiresAt: recommendationSessions.expiresAt,
      })
      .from(recommendationSessions)
      .where(eq(recommendationSessions.opaqueToken, tokenHash("session", token)))
      .for("update")
      .limit(1);
    if (!current) throw new RecommendationSessionError("Sesiunea nu mai există.", 401);
    if (current.expiresAt <= new Date()) {
      await transaction
        .update(recommendationSessions)
        .set({ status: "expired" })
        .where(eq(recommendationSessions.id, current.id));
      throw new RecommendationSessionError("Sesiunea a expirat.", 410);
    }
    if (current.status !== "started") {
      throw new RecommendationSessionError("Sesiunea a fost deja finalizată.", 409);
    }
    if (!recommendationStepsForBranch(current.branch).includes(payload.step)) {
      throw new RecommendationSessionError("Întrebarea nu aparține contextului de recomandare ales.");
    }
    const nextAnswers = applyStep(parseAnswers(current.answersJson, current.branch), payload);
    const [updated] = await transaction
      .update(recommendationSessions)
      .set({ answersJson: snapshotFromAnswers(nextAnswers) })
      .where(eq(recommendationSessions.id, current.id))
      .returning({
        branch: recommendationSessions.branch,
        status: recommendationSessions.status,
        answersJson: recommendationSessions.answersJson,
      });
    await transaction
      .insert(recommendationQuizEvents)
      .values({ sessionId: current.id, eventType: "step_completed", step: payload.step })
      .onConflictDoNothing();
    if (!updated) throw new RecommendationSessionError("Răspunsul nu a putut fi salvat.", 500);
    return updated;
  });
  return toSessionView(row, db);
}

export async function completeRecommendationSession(rawToken: string | null | undefined) {
  const token = validRawToken(rawToken);
  if (!token) throw new RecommendationSessionError("Sesiunea lipsește.", 401);
  const db = getDb();
  const row = await db.transaction(async (transaction) => {
    const [current] = await transaction
      .select({
        id: recommendationSessions.id,
        branch: recommendationSessions.branch,
        anonymousSessionId: recommendationSessions.anonymousSessionId,
        status: recommendationSessions.status,
        answersJson: recommendationSessions.answersJson,
        expiresAt: recommendationSessions.expiresAt,
      })
      .from(recommendationSessions)
      .where(eq(recommendationSessions.opaqueToken, tokenHash("session", token)))
      .for("update")
      .limit(1);
    if (!current) throw new RecommendationSessionError("Sesiunea nu mai există.", 401);
    if (current.expiresAt <= new Date()) {
      await transaction
        .update(recommendationSessions)
        .set({ status: "expired" })
        .where(eq(recommendationSessions.id, current.id));
      throw new RecommendationSessionError("Sesiunea a expirat.", 410);
    }
    if (current.status === "completed") {
      await transaction.insert(productEvents).values({
        eventName: "recommendation_quiz_completed",
        anonymousSessionId: current.anonymousSessionId,
        recommendationSessionId: current.id,
        sourcePath: "/recomanda-mi",
        dedupeKey: `quiz-completed:${current.id}`,
      }).onConflictDoNothing({ target: productEvents.dedupeKey });
      return current;
    }
    const answers = parseAnswers(current.answersJson, current.branch);
    const complete = parseCompleteRecommendationAnswers(current.branch, answers);
    if (!complete) {
      throw new RecommendationSessionError("Completează toate cele șase etape înainte de finalizare.");
    }
    const [updated] = await transaction
      .update(recommendationSessions)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(recommendationSessions.id, current.id))
      .returning({
        branch: recommendationSessions.branch,
        status: recommendationSessions.status,
        answersJson: recommendationSessions.answersJson,
      });
    await transaction
      .insert(recommendationQuizEvents)
      .values({ sessionId: current.id, eventType: "completed" })
      .onConflictDoNothing();
    await transaction.insert(productEvents).values({
      eventName: "recommendation_quiz_completed",
      anonymousSessionId: current.anonymousSessionId,
      recommendationSessionId: current.id,
      sourcePath: "/recomanda-mi",
      dedupeKey: `quiz-completed:${current.id}`,
    }).onConflictDoNothing({ target: productEvents.dedupeKey });
    if (!updated) throw new RecommendationSessionError("Sesiunea nu a putut fi finalizată.", 500);
    return updated;
  });
  return toSessionView(row, db);
}
