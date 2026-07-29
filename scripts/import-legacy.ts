import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { z } from "zod";

import { createCliDatabaseConnection } from "@/db/cli";
import { legacyImportConfigSchema } from "@/domain/legacy-import/config";
import { normalizeLegacyExport } from "@/domain/legacy-import/input";
import { writeLegacyImportReports } from "@/domain/legacy-import/report";
import { runLegacyImport } from "@/domain/legacy-import/service";

type CliOptions = {
  inputPath: string;
  configPath: string;
  outputDirectory: string;
  apply: boolean;
};

function optionValue(args: string[], name: string) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Opțiunea ${name} necesită o valoare.`);
  return value;
}

function parseOptions(args: string[]): CliOptions {
  if (args.includes("--help")) {
    console.log("pnpm legacy:import -- --input <export.json> --config <mapping.json> [--output <director>] [--apply]");
    console.log("Modul implicit este dry-run. --apply activează scrierile în DB și reîncărcarea media în S3.");
    process.exit(0);
  }
  const inputPath = optionValue(args, "--input");
  const configPath = optionValue(args, "--config");
  if (!inputPath || !configPath) throw new Error("--input și --config sunt obligatorii. Rulează cu --help pentru sintaxă.");
  return {
    inputPath: resolve(inputPath),
    configPath: resolve(configPath),
    outputDirectory: resolve(optionValue(args, "--output") ?? "reports/legacy-import"),
    apply: args.includes("--apply"),
  };
}

async function readJson(path: string) {
  const text = await readFile(path, "utf8");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`Fișierul ${path} nu conține JSON valid.`);
  }
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const [rawInput, rawConfig] = await Promise.all([readJson(options.inputPath), readJson(options.configPath)]);
  const parsedConfig = legacyImportConfigSchema.safeParse(rawConfig);
  if (!parsedConfig.success) throw new Error(`Configurația importului este invalidă:\n${z.prettifyError(parsedConfig.error)}`);
  const config = {
    ...parsedConfig.data,
    mediaRoot: resolve(dirname(options.configPath), parsedConfig.data.mediaRoot),
  };
  const normalized = normalizeLegacyExport(rawInput);
  const { db, client } = createCliDatabaseConnection();

  try {
    const result = await runLegacyImport({
      db,
      data: normalized.data,
      invalid: normalized.invalid,
      config,
      dryRun: !options.apply,
      rawInput,
    });
    const paths = await writeLegacyImportReports(result, options.outputDirectory);
    console.log(JSON.stringify({
      mode: result.mode,
      sourceSystem: result.sourceSystem,
      counts: result.counts,
      reports: paths,
    }, null, 2));
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Importul legacy a eșuat.");
  process.exitCode = 1;
});
