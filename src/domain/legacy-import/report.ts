import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export type ImportSourceType = "author" | "media" | "book" | "review" | "daily_feature" | "settings";

export type ImportLogEntry = {
  timestamp: string;
  level: "info" | "warning" | "error";
  sourceType: ImportSourceType;
  legacyId?: string;
  action: "import" | "link" | "skip" | "quarantine" | "reject";
  message: string;
  targetId?: string;
};

export type ImportReject = {
  sourceType: ImportSourceType;
  legacyId?: string;
  reason: string;
};

export type DuplicateFinding = {
  sourceType: ImportSourceType;
  legacyId: string;
  matchedBy: "source_identity" | "slug" | "name" | "isbn" | "storage_hash" | "date";
  targetId?: string;
  resolution: "linked" | "skipped" | "rejected";
};

export type RedirectSuggestion = {
  source: string;
  destination: string;
  sourceType: "author" | "book";
  legacyId: string;
  reason: string;
  status: "pending_review";
};

export type QuarantineReportRow = {
  legacyId: string;
  reviewer: string;
  source: string;
  linkedBook: string;
  originVerified: boolean;
  reason: string;
};

export type LegacyImportResult = {
  mode: "dry-run" | "apply";
  sourceSystem: string;
  startedAt: string;
  finishedAt: string;
  inputDigest: string;
  counts: Record<"imported" | "linked" | "skipped" | "quarantined" | "rejected" | "warnings", number>;
  ignoredLegacySections: { displaySettings: number; quizTags: number; siteSettings: number };
  logs: ImportLogEntry[];
  rejects: ImportReject[];
  duplicates: DuplicateFinding[];
  redirects: RedirectSuggestion[];
  quarantine: QuarantineReportRow[];
};

function csvCell(value: string | boolean) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function writeLegacyImportReports(result: LegacyImportResult, outputDirectory: string) {
  const directory = resolve(outputDirectory);
  await mkdir(directory, { recursive: true });
  const stamp = result.startedAt.replace(/[:.]/g, "-");
  const prefix = `${result.mode}-${stamp}`;
  const reportPath = resolve(directory, `${prefix}-report.json`);
  const rejectsPath = resolve(directory, `${prefix}-rejects.jsonl`);
  const quarantinePath = resolve(directory, `${prefix}-review-quarantine.csv`);
  const redirectsPath = resolve(directory, `${prefix}-redirect-suggestions.json`);

  await Promise.all([
    writeFile(reportPath, `${JSON.stringify({ ...result, quarantine: undefined, redirects: undefined }, null, 2)}\n`, "utf8"),
    writeFile(rejectsPath, result.rejects.map((reject) => JSON.stringify(reject)).join("\n") + (result.rejects.length ? "\n" : ""), "utf8"),
    writeFile(quarantinePath, [
      ["legacy_id", "reviewer", "source", "linked_book", "origin_verified", "reason"].join(","),
      ...result.quarantine.map((row) => [row.legacyId, row.reviewer, row.source, row.linkedBook, row.originVerified, row.reason].map(csvCell).join(",")),
    ].join("\n") + "\n", "utf8"),
    writeFile(redirectsPath, `${JSON.stringify({ generatedAt: result.finishedAt, suggestions: result.redirects }, null, 2)}\n`, "utf8"),
  ]);

  return { reportPath, rejectsPath, quarantinePath, redirectsPath };
}
