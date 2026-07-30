"use client";

import { useEffect, useRef } from "react";

import { useCookieConsent } from "@/components/privacy/cookie-consent-provider";
import type { CommercialTrackingContext } from "@/domain/commercial/tracking-service";

export function CommercialImpressionTracker({
  offerIds,
  context,
}: {
  offerIds: string[];
  context: CommercialTrackingContext;
}) {
  const { analyticsAllowed } = useCookieConsent();
  const sent = useRef(false);

  useEffect(() => {
    if (!analyticsAllowed || sent.current || offerIds.length === 0) return;
    sent.current = true;
    void fetch("/api/commercial/impressions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ offerIds, ...context }),
      keepalive: true,
      credentials: "same-origin",
    });
  }, [analyticsAllowed, context, offerIds]);

  return null;
}
