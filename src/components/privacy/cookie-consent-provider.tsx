"use client";

import Link from "next/link";
import { createContext, useContext, useState, type ReactNode } from "react";

import type { CookieConsentChoice } from "@/lib/privacy/consent";

type CookieConsentConfig = {
  bannerEnabled: boolean;
  analyticsEnabled: boolean;
  title: string;
  description: string;
};

type CookieConsentContextValue = {
  choice: CookieConsentChoice | null;
  analyticsAllowed: boolean;
  openPreferences: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) throw new Error("CookieConsentProvider lipsește din layoutul public.");
  return context;
}

export function CookieConsentProvider({
  children,
  initialChoice,
  config,
}: {
  children: ReactNode;
  initialChoice: CookieConsentChoice | null;
  config: CookieConsentConfig;
}) {
  const [choice, setChoice] = useState(initialChoice);
  const [open, setOpen] = useState(config.bannerEnabled && initialChoice === null && config.analyticsEnabled);
  const [details, setDetails] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(nextChoice: CookieConsentChoice) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/privacy/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ choice: nextChoice }),
      });
      const body = (await response.json()) as { ok?: boolean; choice?: CookieConsentChoice };
      if (!response.ok || !body.ok || !body.choice) throw new Error();
      setChoice(body.choice);
      setOpen(false);
      setDetails(false);
    } catch {
      setError("Preferința nu a putut fi salvată. Încearcă din nou.");
    } finally {
      setPending(false);
    }
  }

  const analyticsAllowed = config.analyticsEnabled && choice === "analytics";

  return (
    <CookieConsentContext.Provider
      value={{
        choice,
        analyticsAllowed,
        openPreferences: () => {
          setDetails(true);
          setOpen(true);
          setError(null);
        },
      }}
    >
      {children}
      {open ? (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-consent-title"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-4xl rounded-2xl border border-border bg-surface p-5 shadow-[0_20px_70px_rgba(23,21,18,0.22)] sm:inset-x-6 sm:bottom-6 sm:p-6"
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 id="cookie-consent-title" className="font-display text-2xl font-semibold">{config.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{config.description}</p>
              <p className="mt-2 text-xs leading-5 text-muted">Poți schimba oricând alegerea din subsol. Citește <Link href="/legal/confidentialitate" className="font-semibold text-foreground underline underline-offset-4">politica de confidențialitate</Link>.</p>
              {details ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-paper p-3 text-sm"><strong>Necesare</strong><span className="mt-1 block text-xs leading-5 text-muted">Sesiuni, securitate și preferința de consimțământ. Mereu active.</span></div>
                  <div className="rounded-xl border border-border bg-paper p-3 text-sm"><strong>Statistici</strong><span className="mt-1 block text-xs leading-5 text-muted">Pagini vizitate și interacțiuni agregate. Numai cu acord.</span></div>
                </div>
              ) : null}
              {error ? <p role="alert" className="mt-3 text-sm font-semibold text-danger">{error}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2 lg:max-w-xs lg:justify-end">
              {!details ? <button type="button" onClick={() => setDetails(true)} className="min-h-11 rounded-full px-4 text-sm font-bold text-muted hover:text-foreground">Preferințe</button> : null}
              <button type="button" disabled={pending} onClick={() => void save("necessary")} className="min-h-11 rounded-full border border-brand px-5 text-sm font-bold text-brand hover:bg-accent-soft disabled:opacity-60">Doar necesare</button>
              {config.analyticsEnabled ? <button type="button" disabled={pending} onClick={() => void save("analytics")} className="min-h-11 rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-60">Acceptă statisticile</button> : null}
            </div>
          </div>
        </section>
      ) : null}
    </CookieConsentContext.Provider>
  );
}
