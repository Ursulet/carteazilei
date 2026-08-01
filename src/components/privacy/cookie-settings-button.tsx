"use client";

import { useCookieConsent } from "./cookie-consent-provider";

export function CookieSettingsButton({ variant = "footer" }: { variant?: "footer" | "button" }) {
  const { openPreferences } = useCookieConsent();
  return <button type="button" onClick={openPreferences} className={variant === "footer" ? "text-left text-[11px] text-white/55 transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-accent" : "inline-flex min-h-11 items-center rounded-full border border-brand px-5 text-sm font-bold text-brand hover:bg-accent-soft"}>Setări cookie</button>;
}
