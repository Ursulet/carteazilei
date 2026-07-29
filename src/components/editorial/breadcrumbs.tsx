import Link from "next/link";

import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo/schema";

export type BreadcrumbItem = { label: string; href?: string };

const staticIndexPaths: Record<string, string> = {
  Autori: "/autori",
  "Cărți": "/carti",
  Echipa: "/echipa",
  Liste: "/liste",
};

export function Breadcrumbs({ items, currentPath }: { items: readonly BreadcrumbItem[]; currentPath?: string }) {
  const resolvedPath = currentPath ?? staticIndexPaths[items.at(-1)?.label ?? ""];
  const structuredItems = resolvedPath
    ? items.map((item, index) => ({ name: item.label, path: item.href ?? (index === items.length - 1 ? resolvedPath : "/") }))
    : null;
  return (
    <>
      {structuredItems ? <JsonLd data={breadcrumbJsonLd(structuredItems)} /> : null}
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          {items.map((item, index) => (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {item.href ? <Link href={item.href} className="underline decoration-border underline-offset-4 hover:text-foreground">{item.label}</Link> : <span aria-current="page">{item.label}</span>}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
