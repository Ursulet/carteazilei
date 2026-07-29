import "server-only";

import { z } from "zod";

const mappingSchema = z.record(z.string().trim().min(1), z.string().trim().min(1));
const httpUrl = z.url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol), "URL-ul trebuie să folosească HTTP(S).");
const hostnameMappingSchema = z.record(
  z.string().trim().toLowerCase().regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/),
  z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
);

export const legacyImportConfigSchema = z.object({
  sourceSystem: z.string().trim().min(1).max(100).regex(/^[a-z0-9][a-z0-9._-]*$/),
  batchSize: z.number().int().min(1).max(500).default(100),
  mediaRoot: z.string().trim().min(1).max(2_000),
  defaultEditorId: z.uuid().optional(),
  legacyOrigins: z.array(httpUrl).max(20).default([]),
  taxonomyMappings: z.object({
    genres: mappingSchema.default({}),
    themes: mappingSchema.default({}),
    moods: mappingSchema.default({}),
  }),
  retailerHosts: hostnameMappingSchema.default({}),
  verifiedDailyFeatures: z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), httpUrl).default({}),
});

export type LegacyImportConfig = z.infer<typeof legacyImportConfigSchema>;
