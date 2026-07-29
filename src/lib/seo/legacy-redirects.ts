import type { Redirect } from "next";

/**
 * Redirecturile se activează numai după verificarea URL-ului sursă în importul legacy.
 * Faza de import poate adăuga aici intrările aprobate fără a modifica next.config.ts.
 */
export const legacyRedirects = [] satisfies Redirect[];
