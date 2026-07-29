import type { ReactNode } from "react";

import { PublicPageViewTracker } from "@/components/analytics/public-page-view-tracker";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";

export default function PublicLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicPageViewTracker />
      <SkipLink />
      <SiteHeader />
      <main id="continut-principal" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
