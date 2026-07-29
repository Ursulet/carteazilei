import type { ReactNode } from "react";
import { Breadcrumbs } from "./breadcrumbs";

export function TrustPage({
  eyebrow,
  title,
  intro,
  path,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  path: string;
  children: ReactNode;
}) {
  return (
    <main>
      <header className="border-b border-border bg-surface py-12 md:py-20">
        <div className="mx-auto w-full max-w-5xl px-5 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Acasă", href: "/" }, { label: title }]} currentPath={path} />
          <p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl font-semibold tracking-[-0.03em] text-balance sm:text-6xl">{title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">{intro}</p>
        </div>
      </header>
      <article className="mx-auto grid w-full max-w-3xl gap-12 px-5 py-16 sm:px-6 md:py-24 lg:px-8 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-bold [&_li]:leading-7 [&_p]:leading-8 [&_p]:text-muted [&_ul]:space-y-3">
        {children}
      </article>
    </main>
  );
}
