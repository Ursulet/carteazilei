import "server-only";

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { getServerEnv } from "@/lib/env/server";

let cachedClient: S3Client | undefined;

function storageConfiguration() {
  const env = getServerEnv();
  if (!env.S3_ENDPOINT || !env.S3_REGION || !env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    throw new Error("Stocarea S3 nu este configurată.");
  }
  return env;
}

function getClient() {
  const env = storageConfiguration();
  cachedClient ??= new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID!,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
    },
  });
  return cachedClient;
}

export async function putMediaObject(input: {
  key: string;
  body: Uint8Array;
  contentType: string;
  checksumSha256Base64: string;
}) {
  const env = storageConfiguration();
  await getClient().send(new PutObjectCommand({
    Bucket: env.S3_BUCKET!,
    Key: input.key,
    Body: input.body,
    ContentType: input.contentType,
    ChecksumSHA256: input.checksumSha256Base64,
    CacheControl: "public, max-age=31536000, immutable",
  }));
}

export async function deleteMediaObject(key: string) {
  const env = storageConfiguration();
  await getClient().send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET!, Key: key }));
}

export async function getMediaObject(key: string) {
  const env = storageConfiguration();
  return getClient().send(new GetObjectCommand({ Bucket: env.S3_BUCKET!, Key: key }));
}
