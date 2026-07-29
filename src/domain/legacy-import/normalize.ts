import "server-only";

import { createHash } from "node:crypto";
import { isAbsolute, relative, resolve } from "node:path";

export function normalizeLookup(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("ro-RO").replace(/\s+/g, " ");
}

export function slugifyLegacy(value: string) {
  return normalizeLookup(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, nested]) => [key, stableValue(nested)]));
  }
  return value;
}

export function contentHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");
}

export function chunked<T>(rows: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) chunks.push(rows.slice(index, index + size));
  return chunks;
}

export function resolveMediaPath(mediaRoot: string, filePath: string) {
  if (isAbsolute(filePath)) throw new Error("Calea media trebuie să fie relativă la mediaRoot.");
  const root = resolve(mediaRoot);
  const target = resolve(root, filePath);
  const relation = relative(root, target);
  if (!relation || relation.startsWith("..") || isAbsolute(relation)) throw new Error("Calea media iese din directorul aprobat.");
  return target;
}

export function normalizeHostname(value: string) {
  return value.trim().toLowerCase().replace(/^www\./, "");
}

export function approvedRetailerSlug(purchaseUrl: string, retailerHosts: Record<string, string>) {
  const parsed = new URL(purchaseUrl);
  if (parsed.protocol !== "https:") return null;
  const host = normalizeHostname(parsed.hostname);
  const entry = Object.entries(retailerHosts).find(([configuredHost]) => normalizeHostname(configuredHost) === host);
  return entry?.[1] ?? null;
}

export function legacyRedirectPath(legacyUrl: string | undefined, legacyOrigins: string[]) {
  if (!legacyUrl) return null;
  if (legacyUrl.startsWith("/") && !legacyUrl.startsWith("//")) return new URL(legacyUrl, "https://legacy.invalid").pathname;
  const parsed = new URL(legacyUrl);
  const approvedOrigins = new Set(legacyOrigins.map((origin) => new URL(origin).origin));
  if (!approvedOrigins.has(parsed.origin)) return null;
  return parsed.pathname;
}
