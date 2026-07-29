import "server-only";

import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { getServerEnv } from "@/lib/env/server";

let cachedClient: S3Client | undefined;

function assertStorageKey(key: string) {
  if (
    !key ||
    key.includes("\\") ||
    key.startsWith("/") ||
    key.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    throw new Error("Cheie media invalidă.");
  }
  return key;
}

function localRoot() {
  return path.resolve(getServerEnv().MEDIA_LOCAL_ROOT);
}

function localFilePath(key: string) {
  const root = localRoot();
  const target = path.resolve(root, ...assertStorageKey(key).split("/"));
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    throw new Error("Cheia media iese din directorul configurat.");
  }
  return target;
}

function s3Configuration() {
  const env = getServerEnv();
  if (!env.S3_ENDPOINT || !env.S3_REGION || !env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    throw new Error("Stocarea S3 nu este configurată complet.");
  }
  return {
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    bucket: env.S3_BUCKET,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
  };
}

function getS3Client() {
  const env = s3Configuration();
  cachedClient ??= new S3Client({
    endpoint: env.endpoint,
    region: env.region,
    forcePathStyle: env.forcePathStyle,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
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
  assertStorageKey(input.key);
  const env = getServerEnv();
  if (env.MEDIA_STORAGE_DRIVER === "s3") {
    const s3 = s3Configuration();
    await getS3Client().send(new PutObjectCommand({
      Bucket: s3.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      ChecksumSHA256: input.checksumSha256Base64,
      CacheControl: "public, max-age=31536000, immutable",
    }));
    return;
  }

  const target = localFilePath(input.key);
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, input.body, { flag: "wx" });
    await rename(temporary, target);
  } catch (error) {
    await rm(temporary, { force: true }).catch(() => undefined);
    throw error;
  }
}

export async function deleteMediaObject(key: string) {
  assertStorageKey(key);
  const env = getServerEnv();
  if (env.MEDIA_STORAGE_DRIVER === "s3") {
    const s3 = s3Configuration();
    await getS3Client().send(new DeleteObjectCommand({ Bucket: s3.bucket, Key: key }));
    return;
  }
  await rm(localFilePath(key), { force: true });
}

export async function readMediaObject(key: string) {
  assertStorageKey(key);
  const env = getServerEnv();
  if (env.MEDIA_STORAGE_DRIVER === "s3") {
    const s3 = s3Configuration();
    const object = await getS3Client().send(new GetObjectCommand({ Bucket: s3.bucket, Key: key }));
    if (!object.Body) throw new Error("Fișierul media nu există în stocare.");
    return object.Body.transformToByteArray();
  }
  return readFile(localFilePath(key));
}

export async function getMediaStorageStatus() {
  const env = getServerEnv();
  if (env.MEDIA_STORAGE_DRIVER === "s3") {
    return {
      driver: "s3" as const,
      ready: Boolean(env.S3_ENDPOINT && env.S3_REGION && env.S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY),
      location: env.S3_BUCKET ?? "Neconfigurat",
    };
  }

  const root = localRoot();
  try {
    await mkdir(root, { recursive: true });
    await access(root, constants.R_OK | constants.W_OK);
    return { driver: "local" as const, ready: true, location: root };
  } catch {
    return { driver: "local" as const, ready: false, location: root };
  }
}
