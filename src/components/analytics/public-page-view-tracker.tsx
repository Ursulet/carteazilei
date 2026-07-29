"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { sendProductEvent } from "./product-event-tracker";

const landingMarker = "cz_landing_tracked";

function currentReferrerHost() {
  if (!document.referrer) return undefined;
  try {
    const hostname = new URL(document.referrer).hostname.toLowerCase();
    return hostname || undefined;
  } catch {
    return undefined;
  }
}

export function PublicPageViewTracker() {
  const pathname = usePathname();
  const sentPaths = useRef(new Set<string>());
  const firstRuntimePage = useRef(true);

  useEffect(() => {
    if (!pathname || sentPaths.current.has(pathname)) return;
    sentPaths.current.add(pathname);

    let isLanding = firstRuntimePage.current;
    try {
      isLanding = sessionStorage.getItem(landingMarker) !== "1";
      sessionStorage.setItem(landingMarker, "1");
    } catch {
      // Stocarea poate fi blocată; limita rămâne prima pagină a layoutului curent.
    }
    firstRuntimePage.current = false;

    const referrerHost = isLanding ? currentReferrerHost() : undefined;
    void sendProductEvent({
      event: "page_viewed",
      sourcePath: pathname,
      isLanding,
      ...(referrerHost ? { referrerHost } : {}),
    });
  }, [pathname]);

  return null;
}
