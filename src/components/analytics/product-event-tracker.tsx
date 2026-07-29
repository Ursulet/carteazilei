"use client";

import { useEffect, useRef } from "react";

import type { PublicProductEventInput } from "@/domain/analytics/event-contract";

export function sendProductEvent(event: PublicProductEventInput) {
  return fetch("/api/analytics/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    keepalive: true,
    body: JSON.stringify(event),
  }).catch(() => undefined);
}

export function ProductEventTracker({ event }: { event: PublicProductEventInput }) {
  const serialized = JSON.stringify(event);
  const sent = useRef<string | null>(null);

  useEffect(() => {
    if (sent.current === serialized) return;
    sent.current = serialized;
    void sendProductEvent(JSON.parse(serialized) as PublicProductEventInput);
  }, [serialized]);

  return null;
}
