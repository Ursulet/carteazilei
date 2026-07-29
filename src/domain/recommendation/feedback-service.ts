import "server-only";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import {
  productEvents,
  recommendationFeedback,
  recommendationResults,
  recommendationSessions,
} from "@/db/schema";

import { publicResultTokenHash } from "./result-service";
import { RecommendationSessionError } from "./session-service";

export const recommendationFeedbackInputSchema = z
  .object({
    resultToken: z.string().regex(/^[A-Za-z0-9_-]{32,128}$/),
    resultId: z.uuid(),
    action: z.enum(["positive", "negative", "started", "finished", "rating"]),
    rating: z.number().int().min(1).max(5).optional(),
  })
  .superRefine((value, context) => {
    if (value.action === "rating" && value.rating === undefined) {
      context.addIssue({ code: "custom", path: ["rating"], message: "Alege o notă." });
    }
    if (value.action !== "rating" && value.rating !== undefined) {
      context.addIssue({ code: "custom", path: ["rating"], message: "Nota nu este permisă pentru această acțiune." });
    }
  });

export type RecommendationFeedbackInput = z.infer<
  typeof recommendationFeedbackInputSchema
>;

/** Persistă feedbackul separat; nu recalculează și nu mută rezultatul curent. */
export async function saveRecommendationFeedback(input: RecommendationFeedbackInput) {
  const db = getDb();
  await db.transaction(async (transaction) => {
    const [result] = await transaction
      .select({
        sessionId: recommendationResults.sessionId,
        bookId: recommendationResults.bookId,
        rank: recommendationResults.rank,
        algorithmVersion: recommendationResults.algorithmVersion,
        anonymousSessionId: recommendationSessions.anonymousSessionId,
      })
      .from(recommendationResults)
      .innerJoin(
        recommendationSessions,
        eq(recommendationSessions.id, recommendationResults.sessionId),
      )
      .where(
        and(
          eq(recommendationResults.id, input.resultId),
          eq(
            recommendationSessions.resultTokenHash,
            publicResultTokenHash(input.resultToken),
          ),
        ),
      )
      .limit(1);
    if (!result) throw new RecommendationSessionError("Rezultatul nu mai este disponibil.", 404);

    if (input.action === "positive" || input.action === "negative") {
      const opposite = input.action === "positive" ? "negative" : "positive";
      await transaction
        .delete(recommendationFeedback)
        .where(
          and(
            eq(recommendationFeedback.resultId, input.resultId),
            eq(recommendationFeedback.action, opposite),
          ),
        );
    }
    await transaction
      .insert(recommendationFeedback)
      .values({
        resultId: input.resultId,
        action: input.action,
        rating: input.action === "rating" ? input.rating! : null,
      })
      .onConflictDoUpdate({
        target: [recommendationFeedback.resultId, recommendationFeedback.action],
        set: {
          rating: input.action === "rating" ? input.rating! : null,
          createdAt: new Date(),
        },
      });

    const eventName = input.action === "positive"
      ? "recommendation_feedback_positive"
      : input.action === "negative"
        ? "recommendation_feedback_negative"
        : input.action === "started"
          ? "book_started"
          : input.action === "finished"
            ? "book_finished"
            : null;
    if (eventName) {
      await transaction.insert(productEvents).values({
        eventName,
        anonymousSessionId: result.anonymousSessionId,
        recommendationSessionId: result.sessionId,
        recommendationResultId: input.resultId,
        bookId: result.bookId,
        resultRank: result.rank,
        algorithmVersion: result.algorithmVersion,
        sourcePath: "/recomanda-mi/rezultat",
        dedupeKey: `feedback:${input.resultId}:${eventName}`,
      }).onConflictDoNothing({ target: productEvents.dedupeKey });
    }
  });
}
