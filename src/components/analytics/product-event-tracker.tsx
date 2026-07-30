"use client";

import { useEffect, useRef } from "react";

import { useCookieConsent } from "@/components/privacy/cookie-consent-provider";
import type { PublicProductEventInput } from "@/domain/analytics/event-contract";
import { hasBrowserAnalyticsConsent } from "@/lib/privacy/consent";

export function sendProductEvent(event: PublicProductEventInput) {
  if (!hasBrowserAnalyticsConsent()) return Promise.resolve(undefined);
  return fetch("/api/analytics/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    keepalive: true,
    body: JSON.stringify(event),
  }).catch(() => undefined);
}

export function ProductEventTracker({ event }: { event: PublicProductEventInput }) {
  const { analyticsAllowed } = useCookieConsent();
  const serialized = JSON.stringify(event);
  const sent = useRef<string | null>(null);

  useEffect(() => {
    if (!analyticsAllowed || sent.current === serialized) return;
    sent.current = serialized;
    void sendProductEvent(JSON.parse(serialized) as PublicProductEventInput);
  }, [analyticsAllowed, serialized]);

  return null;
}
