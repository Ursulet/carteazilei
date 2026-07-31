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
}: {
  eyebrow: string;
  title: string;
  description: string;
  currentLabel: string;
  currentPath?: string;
  width?: "wide" | "reading";
  aside?: ReactNode;
}) {
  return (
    <header className="border-b border-border bg-surface py-8 md:py-12">
      <div className={`mx-auto w-full px-5 sm:px-6 lg:px-8 ${width === "reading" ? "max-w-5xl" : "max-w-7xl"}`}>
        <Breadcrumbs
          items={[{ label: "Acasă", href: "/" }, { label: currentLabel }]}
          currentPath={currentPath}
        />
        <div className={`mt-7 items-center gap-10 ${aside ? "grid lg:grid-cols-[minmax(0,1fr)_22rem]" : ""}`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">{eyebrow}</p>
            <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted sm:text-lg">{description}</p>
          </div>
          {aside ? <div className="mt-7 lg:mt-0">{aside}</div> : null}
        </div>
      </div>
    </header>
  );
}
