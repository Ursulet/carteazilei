const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const EDITORIAL_TIMEZONE = "Europe/Bucharest";

export function assertEditorialDate(value: string) {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const candidate = new Date(Date.UTC(year!, month! - 1, day!));
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month! - 1 &&
    candidate.getUTCDate() === day
  );
}

export function formatEditorialDate(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "long",
    timeZone: EDITORIAL_TIMEZONE,
  }).format(new Date(`${value}T12:00:00+03:00`));
}
