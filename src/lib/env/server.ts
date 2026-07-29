import "server-only";

import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.url().optional(),
);

const serverEnvSchema = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL lipsește."),
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET trebuie să aibă minimum 32 de caractere."),
    NEXTAUTH_URL: z.url(),
    NEXT_PUBLIC_SITE_URL: z.url(),
    S3_ENDPOINT: optionalUrl,
    S3_REGION: optionalString,
    S3_BUCKET: optionalString,
    S3_ACCESS_KEY_ID: optionalString,
    S3_SECRET_ACCESS_KEY: optionalString,
    S3_FORCE_PATH_STYLE: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
    S3_PUBLIC_BASE_URL: optionalUrl,
  })
  .superRefine((env, context) => {
    const storageValues = [
      env.S3_ENDPOINT,
      env.S3_REGION,
      env.S3_BUCKET,
      env.S3_ACCESS_KEY_ID,
      env.S3_SECRET_ACCESS_KEY,
    ];
    const configuredValues = storageValues.filter(Boolean).length;

    if (configuredValues > 0 && configuredValues < storageValues.length) {
      context.addIssue({
        code: "custom",
        message: "Configurația S3 trebuie completată integral sau lăsată integral goală.",
        path: ["S3_ENDPOINT"],
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cachedEnv ??= serverEnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_REGION: process.env.S3_REGION,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE,
    S3_PUBLIC_BASE_URL: process.env.S3_PUBLIC_BASE_URL,
  });

  return cachedEnv;
}
