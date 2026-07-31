import type { ReactNode } from "react";

import { Breadcrumbs } from "./breadcrumbs";

export function PublicPageHeader({
  eyebrow,
  title,
  description,
  currentLabel,
  currentPath,
  width = "wide",
  aside,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  currentLabel: string;
  currentPath?: string;
  width?: "wide" | "reading";
  aside?: ReactNode;
  compact?: boolean;
}) {
  return (
    <header className={`border-b border-border bg-surface ${compact ? "py-5 md:py-7" : "py-8 md:py-12"}`}>
      <div className={`mx-auto w-full px-5 sm:px-6 lg:px-8 ${width === "reading" ? "max-w-5xl" : "max-w-7xl"}`}>
        <Breadcrumbs
          items={[{ label: "Acasă", href: "/" }, { label: currentLabel }]}
          currentPath={currentPath}
        />
        <div className={`${compact ? "mt-4" : "mt-7"} items-center gap-10 ${aside ? "grid lg:grid-cols-[minmax(0,1fr)_22rem]" : ""}`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">{eyebrow}</p>
            <h1 className={`${compact ? "mt-2 text-3xl sm:text-4xl" : "mt-3 text-4xl sm:text-5xl"} max-w-4xl font-display font-semibold tracking-[-0.03em] text-balance`}>{title}</h1>
            <p className={`${compact ? "mt-2 max-w-2xl text-sm leading-6 sm:text-base" : "mt-4 max-w-3xl text-base leading-7 sm:text-lg"} text-muted`}>{description}</p>
          </div>
          {aside ? <div className="mt-7 lg:mt-0">{aside}</div> : null}
        </div>
      </div>
    </header>
  );
}
