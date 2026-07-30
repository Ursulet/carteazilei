import "server-only";

import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb, type Database } from "@/db";
import { recommendationConfigurations } from "@/db/schema";
import { EditorialServiceError } from "@/domain/editorial/action-state";
import { stringValue, zodFieldErrors } from "@/domain/editorial/form-data";
import { writeAuditLog } from "@/lib/audit/service";
import {
  defaultRecommendationConfiguration,
  recommendationConfigurationKey,
  type RecommendationConfiguration,
} from "./configuration-model";

const configurationSchema = z.object({
  minimumScore: z.coerce.number().int().min(0).max(100),
  needWeight: z.coerce.number().int().min(0).max(100),
  genreWeight: z.coerce.number().int().min(0).max(100),
  paceWeight: z.coerce.number().int().min(0).max(100),
  lengthWeight: z.coerce.number().int().min(0).max(100),
  referenceWeight: z.coerce.number().int().min(0).max(100),
  editorialConfidenceWeight: z.coerce.number().int().min(0).max(100),
  freshnessWeight: z.coerce.number().int().min(0).max(100),
}).superRefine((value, context) => {
  const total = value.needWeight + value.genreWeight + value.paceWeight + value.lengthWeight + value.referenceWeight + value.editorialConfidenceWeight + value.freshnessWeight;
  if (total === 0) context.addIssue({ code: "custom", path: ["needWeight"], message: "Cel puțin o pondere trebuie să fie mai mare decât zero." });
});

export type RecommendationConfigurationInput = z.infer<typeof configurationSchema>;

export function parseRecommendationConfigurationFormData(formData: FormData) {
  const parsed = configurationSchema.safeParse(Object.fromEntries([
    "minimumScore", "needWeight", "genreWeight", "paceWeight", "lengthWeight", "referenceWeight", "editorialConfidenceWeight", "freshnessWeight",
  ].map((key) => [key, stringValue(formData, key)])));
  if (!parsed.success) throw new EditorialServiceError("Corectează valorile marcate.", zodFieldErrors(parsed.error));
  return parsed.data;
}

export async function getRecommendationConfiguration(db: Database = getDb()): Promise<RecommendationConfiguration> {
  const [record] = await db.select({
    minimumScore: recommendationConfigurations.minimumScore,
    needWeight: recommendationConfigurations.needWeight,
    genreWeight: recommendationConfigurations.genreWeight,
    paceWeight: recommendationConfigurations.paceWeight,
    lengthWeight: recommendationConfigurations.lengthWeight,
    referenceWeight: recommendationConfigurations.referenceWeight,
    editorialConfidenceWeight: recommendationConfigurations.editorialConfidenceWeight,
    freshnessWeight: recommendationConfigurations.freshnessWeight,
    revision: recommendationConfigurations.revision,
  }).from(recommendationConfigurations).where(eq(recommendationConfigurations.key, recommendationConfigurationKey)).limit(1);
  return record ?? defaultRecommendationConfiguration;
}

export async function saveRecommendationConfiguration(input: RecommendationConfigurationInput, actorUserId: string) {
  const db = getDb();
  await db.transaction(async (transaction) => {
    await transaction.insert(recommendationConfigurations).values({ key: recommendationConfigurationKey, ...input, revision: 1, updatedBy: actorUserId }).onConflictDoUpdate({
      target: recommendationConfigurations.key,
      set: { ...input, revision: sql`${recommendationConfigurations.revision} + 1`, updatedBy: actorUserId, updatedAt: new Date() },
    });
    await writeAuditLog({ actorUserId, action: "recommendation.configuration.edit", entityType: "recommendation_configuration", diff: input }, transaction);
  });
}
