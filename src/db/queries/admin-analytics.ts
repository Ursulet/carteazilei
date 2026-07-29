import "server-only";

import { and, asc, desc, eq, gte, isNotNull, sql } from "drizzle-orm";

import { getDb, type Database } from "@/db";
import {
  books,
  productEvents,
  recommendationFeedback,
  recommendationResults,
  recommendationSessions,
} from "@/db/schema";

const ANALYTICS_WINDOW_DAYS = 30;

export async function getRecommendationAnalyticsOverview(db: Database = getDb()) {
  const since = new Date(Date.now() - ANALYTICS_WINDOW_DAYS * 24 * 60 * 60 * 1_000);
  const needExpression = sql<string>`(${recommendationSessions.answersJson}->'steps'->>'need')`;

  const [
    quizCohort,
    recommendationEvents,
    feedbackTotals,
    commercialTotals,
    distribution,
    needs,
    acquisitionTotals,
    topPages,
    confidenceSituations,
  ] = await Promise.all([
    db
      .select({
        starts: sql<number>`count(*)::int`,
        completions: sql<number>`count(*) filter (where ${recommendationSessions.completedAt} is not null)::int`,
      })
      .from(recommendationSessions)
      .where(gte(recommendationSessions.createdAt, since)),
    db
      .select({
        primaryResultsShown: sql<number>`count(distinct ${productEvents.recommendationSessionId}) filter (where ${productEvents.eventName} = 'recommendation_result_shown' and ${productEvents.resultRank} = 1)::int`,
        alternativesRequested: sql<number>`count(distinct ${productEvents.recommendationSessionId}) filter (where ${productEvents.eventName} = 'recommendation_alternative_requested')::int`,
      })
      .from(productEvents)
      .where(gte(productEvents.occurredAt, since)),
    db
      .select({
        positive: sql<number>`count(*) filter (where ${recommendationFeedback.action} = 'positive')::int`,
        negative: sql<number>`count(*) filter (where ${recommendationFeedback.action} = 'negative')::int`,
        started: sql<number>`count(*) filter (where ${recommendationFeedback.action} = 'started')::int`,
        finished: sql<number>`count(*) filter (where ${recommendationFeedback.action} = 'finished')::int`,
      })
      .from(recommendationFeedback)
      .where(gte(recommendationFeedback.createdAt, since)),
    db.execute(sql<{ clicks: number; impressions: number }>`
      select
        (select count(*)::int from commercial_click_events where clicked_at >= ${since}) as clicks,
        (select count(*)::int from commercial_impression_events where displayed_at >= ${since}) as impressions
    `),
    db
      .select({
        bookId: books.id,
        title: books.title,
        rank: recommendationResults.rank,
        total: sql<number>`count(*)::int`,
      })
      .from(recommendationResults)
      .innerJoin(books, eq(books.id, recommendationResults.bookId))
      .where(gte(recommendationResults.createdAt, since))
      .groupBy(books.id, books.title, recommendationResults.rank)
      .orderBy(desc(sql`count(*)`), asc(books.title), asc(recommendationResults.rank))
      .limit(15),
    db
      .select({ need: needExpression, total: sql<number>`count(*)::int` })
      .from(recommendationSessions)
      .where(and(
        gte(recommendationSessions.createdAt, since),
        sql`${needExpression} is not null`,
      ))
      .groupBy(needExpression)
      .orderBy(desc(sql`count(*)`))
      .limit(8),
    db
      .select({
        landings: sql<number>`count(*) filter (where ${productEvents.eventName} = 'page_viewed' and ${productEvents.isLanding})::int`,
        organicLandings: sql<number>`count(*) filter (where ${productEvents.eventName} = 'page_viewed' and ${productEvents.isLanding} and ${productEvents.acquisitionChannel} = 'organic')::int`,
      })
      .from(productEvents)
      .where(gte(productEvents.occurredAt, since)),
    db
      .select({
        path: productEvents.sourcePath,
        views: sql<number>`count(*)::int`,
      })
      .from(productEvents)
      .where(and(
        gte(productEvents.occurredAt, since),
        eq(productEvents.eventName, "page_viewed"),
        isNotNull(productEvents.sourcePath),
      ))
      .groupBy(productEvents.sourcePath)
      .orderBy(desc(sql`count(*)`), asc(productEvents.sourcePath))
      .limit(10),
    db.execute(sql<{
      issue_type: string;
      need: string;
      pace: string;
      reading_length: string;
      total: number;
    }>`
      with evaluated as (
        select
          session.id,
          coalesce(session.answers_json->'steps'->>'need', 'nespecificat') as need,
          coalesce(session.answers_json->'steps'->>'pace', 'nespecificat') as pace,
          coalesce(session.answers_json->'steps'->>'length', 'nespecificat') as reading_length,
          case
            when count(result.id) = 0 then 'zero_result'
            when max(result.score::numeric) filter (where result.rank = 1) < 50 then 'low_confidence'
            else null
          end as issue_type
        from recommendation_sessions session
        left join recommendation_results result on result.session_id = session.id
        where session.status = 'completed'
          and session.result_token_hash is not null
          and session.completed_at >= ${since}
        group by session.id
      )
      select issue_type, need, pace, reading_length, count(*)::int as total
      from evaluated
      where issue_type is not null
      group by issue_type, need, pace, reading_length
      order by count(*) desc, issue_type, need, pace, reading_length
      limit 10
    `),
  ]);

  const starts = Number(quizCohort[0]?.starts ?? 0);
  const completions = Number(quizCohort[0]?.completions ?? 0);
  const eventTotals = recommendationEvents[0] ?? { primaryResultsShown: 0, alternativesRequested: 0 };
  const feedback = feedbackTotals[0] ?? { positive: 0, negative: 0, started: 0, finished: 0 };
  const commercial = commercialTotals[0] ?? { clicks: 0, impressions: 0 };
  const acquisition = acquisitionTotals[0] ?? { landings: 0, organicLandings: 0 };

  return {
    windowDays: ANALYTICS_WINDOW_DAYS,
    since,
    quiz: {
      starts,
      completions,
      completionRate: starts > 0 ? completions / starts : null,
    },
    alternatives: {
      primaryResultsShown: Number(eventTotals.primaryResultsShown),
      requested: Number(eventTotals.alternativesRequested),
      rate: Number(eventTotals.primaryResultsShown) > 0
        ? Number(eventTotals.alternativesRequested) / Number(eventTotals.primaryResultsShown)
        : null,
    },
    commercial: {
      clicks: Number(commercial.clicks),
      impressions: Number(commercial.impressions),
      ctr: Number(commercial.impressions) > 0
        ? Number(commercial.clicks) / Number(commercial.impressions)
        : null,
    },
    acquisition: {
      landings: Number(acquisition.landings),
      organicLandings: Number(acquisition.organicLandings),
      organicRate: Number(acquisition.landings) > 0
        ? Number(acquisition.organicLandings) / Number(acquisition.landings)
        : null,
    },
    indexation: {
      status: "not_connected" as const,
      sampleSize: 0,
      indexed: null,
    },
    feedback: {
      positive: Number(feedback.positive),
      negative: Number(feedback.negative),
      started: Number(feedback.started),
      finished: Number(feedback.finished),
      positiveRate: Number(feedback.positive) + Number(feedback.negative) > 0
        ? Number(feedback.positive) / (Number(feedback.positive) + Number(feedback.negative))
        : null,
    },
    distribution: distribution.map((row) => ({ ...row, total: Number(row.total) })),
    needs: needs.map((row) => ({ need: row.need, total: Number(row.total) })),
    topPages: topPages.map((row) => ({
      path: row.path ?? "/",
      views: Number(row.views),
    })),
    confidenceSituations: confidenceSituations.map((row) => ({
      issueType: String(row.issue_type) as "zero_result" | "low_confidence",
      need: String(row.need),
      pace: String(row.pace),
      length: String(row.reading_length),
      total: Number(row.total),
    })),
  };
}
