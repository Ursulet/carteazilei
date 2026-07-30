export const cookieConsentName = "cz_cookie_consent";
export const cookieConsentMaxAgeSeconds = 180 * 24 * 60 * 60;
export const cookieConsentVersion = "v1";

export type CookieConsentChoice = "necessary" | "analytics";

export function serializeCookieConsent(choice: CookieConsentChoice) {
  return `${cookieConsentVersion}:${choice}`;
}

export function parseCookieConsent(value: string | null | undefined): CookieConsentChoice | null {
  if (value === serializeCookieConsent("necessary")) return "necessary";
  if (value === serializeCookieConsent("analytics")) return "analytics";
  return null;
}

export function hasAnalyticsConsent(value: string | null | undefined) {
  return parseCookieConsent(value) === "analytics";
}

export function hasBrowserAnalyticsConsent() {
  if (typeof document === "undefined") return false;
  const encodedName = `${encodeURIComponent(cookieConsentName)}=`;
  const value = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(encodedName))
    ?.slice(encodedName.length);
  return hasAnalyticsConsent(value ? decodeURIComponent(value) : null);
}
