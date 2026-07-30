import type { ReactNode } from "react";
import { PublicPageHeader } from "./public-page-header";

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
    <div>
      <PublicPageHeader eyebrow={eyebrow} title={title} description={intro} currentLabel={title} currentPath={path} width="reading" />
      <article className="mx-auto grid w-full max-w-3xl gap-12 px-5 py-16 sm:px-6 md:py-24 lg:px-8 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-bold [&_li]:leading-7 [&_p]:leading-8 [&_p]:text-muted [&_ul]:space-y-3">
        {children}
      </article>
    </div>
  );
}
