import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);

export const slugSchema = z
  .string()
  .trim()
  .min(2, "Slugul trebuie să aibă minimum 2 caractere.")
  .max(160, "Slugul este prea lung.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Folosește litere mici, cifre și cratime.");

export function stringValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function optionalStringValue(formData: FormData, name: string) {
  const value = stringValue(formData, name);
  return value || undefined;
}

export function stringValues(formData: FormData, name: string) {
  return formData
    .getAll(name)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function linesValue(formData: FormData, name: string) {
  return stringValue(formData, name)
    .split(/\r?\n/)
    .map((value) => value.trim().replace(/^[-•]\s*/, ""))
    .filter(Boolean);
}

export function nullableInteger(value: string) {
  return value === "" ? undefined : Number(value);
}

export { optionalText };

export function zodFieldErrors(error: z.ZodError) {
  const flattened = z.flattenError(error) as {
    fieldErrors: Record<string, string[] | undefined>;
  };
  const fieldErrors = Object.fromEntries(
    Object.entries(flattened.fieldErrors).filter(([, messages]) => messages?.length),
  ) as Record<string, string[]>;
  for (const issue of error.issues) {
    if (!issue.path.length) continue;
    const key = issue.path.map(String).join(".");
    fieldErrors[key] = [...new Set([...(fieldErrors[key] ?? []), issue.message])];
  }
  return fieldErrors;
}
