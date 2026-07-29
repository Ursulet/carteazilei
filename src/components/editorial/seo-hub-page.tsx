import { CalendarDays, ShieldCheck } from "lucide-react";
import Link from "next/link";

import type { PublicBookCard } from "@/db/queries/public-book-pages";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/schema";

import { Breadcrumbs, type BreadcrumbItem } from "./breadcrumbs";
import { PublicBookCard as BookCard } from "./public-book-card";
import { RelatedHubNavigation, type RelatedHubLink } from "./related-hub-navigation";

type HubBook = PublicBookCard & { reason: string };

export function SeoHubPage({
  eyebrow,
  title,
  intro,
  methodology,
  editor,
  updatedAt,
  books,
  breadcrumbs,
  relatedHubs,
  canonicalPath,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  methodology: string;
  editor: { name: string; slug: string; publicProfile: boolean };
  updatedAt: Date;
  books: HubBook[];
  breadcrumbs: BreadcrumbItem[];
  relatedHubs: RelatedHubLink[];
  canonicalPath: string;
}) {
  const formattedDate = new Intl.DateTimeFormat("ro-RO", { dateStyle: "long" }).format(updatedAt);
  const structuredBreadcrumbs = breadcrumbJsonLd(breadcrumbs.map((item, index) => ({
    name: item.label,
    path: item.href ?? (index === breadcrumbs.length - 1 ? canonicalPath : "/"),
  })));
  const structuredList = itemListJsonLd({
    name: title,
    path: canonicalPath,
    items: books.map((book) => ({ name: book.title, path: `/carte/${book.slug}` })),
  });
  return (
    <main>
      <JsonLd data={structuredBreadcrumbs} />
      <JsonLd data={structuredList} />
      <header className="border-b border-border bg-surface py-12 md:py-20">
        <div className="mx-auto w-full max-w-5xl px-5 sm:px-6 lg:px-8">
          <Breadcrumbs items={breadcrumbs} />
          <p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl font-semibold tracking-[-0.03em] text-balance sm:text-6xl">{title}</h1>
          <p className="mt-7 max-w-3xl whitespace-pre-line text-lg leading-8 text-muted">{intro}</p>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            <span className="inline-flex items-center"><CalendarDays aria-hidden="true" className="me-2 size-4" />Actualizat {formattedDate}</span>
            <span>Selecție de <strong className="text-foreground">{editor.name}</strong></span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-16 px-5 py-16 sm:px-6 md:py-24 lg:px-8">
        <section aria-labelledby="hub-selections-title">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Selecții argumentate</p>
            <h2 id="hub-selections-title" className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em]">De ce sunt aici aceste cărți</h2>
            <p className="mt-4 leading-7 text-muted">Fiecare titlu este publicat numai după verificarea fișei editoriale, iar motivul explică legătura cu intenția acestei pagini.</p>
          </div>
          {books.length ? <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {books.map((book) => <BookCard key={book.id} book={book} reason={book.reason} />)}
          </div> : <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">Selecția publică nu are încă suficiente cărți explicate.</div>}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8" aria-labelledby="hub-methodology-title">
          <h2 id="hub-methodology-title" className="flex items-center gap-3 font-display text-3xl font-semibold"><ShieldCheck aria-hidden="true" className="size-6 text-brand" />Cum am făcut selecția</h2>
          <p className="mt-5 max-w-4xl whitespace-pre-line leading-7 text-muted">{methodology}</p>
          <Link href="/cum-recomandam" className="mt-6 inline-flex text-sm font-bold text-brand underline decoration-border underline-offset-4 hover:decoration-brand">Citește metodologia editorială completă</Link>
        </section>

        <RelatedHubNavigation hubs={relatedHubs} />

        <section className="rounded-[2rem] bg-brand px-6 py-10 text-white sm:px-10 sm:py-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">O alegere, nu încă o listă</p>
          <h2 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-[-0.03em]">Spune-ne ce cauți. Noi alegem cartea.</h2>
          <p className="mt-4 max-w-2xl leading-7 text-white/75">Dacă vrei să reduci selecția la un singur titlu potrivit contextului tău, răspunde la șase întrebări.</p>
          <Link href="/recomanda-mi" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-brand hover:bg-paper">Recomandă-mi o carte</Link>
        </section>
      </div>
    </main>
  );
}
