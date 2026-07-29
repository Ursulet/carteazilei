"use client";

import { useEffect, useRef } from "react";

import type { CommercialTrackingContext } from "@/domain/commercial/tracking-service";

export function CommercialImpressionTracker({
  offerIds,
  context,
}: {
  offerIds: string[];
  context: CommercialTrackingContext;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || offerIds.length === 0) return;
    sent.current = true;
    void fetch("/api/commercial/impressions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ offerIds, ...context }),
      keepalive: true,
      credentials: "same-origin",
    });
  }, [context, offerIds]);

  return null;
}
