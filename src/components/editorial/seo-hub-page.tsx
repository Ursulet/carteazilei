import { CalendarDays, ShieldCheck } from "lucide-react";
import Link from "next/link";

import type { PublicBookCard } from "@/db/queries/public-book-pages";
import { JsonLd } from "@/lib/seo/json-ld";
import { itemListJsonLd } from "@/lib/seo/schema";

import type { BreadcrumbItem } from "./breadcrumbs";
import { PublicBookCard as BookCard } from "./public-book-card";
import { PublicPageHeader } from "./public-page-header";
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
  intro: string | null;
  methodology: string | null;
  editor: { name: string; slug: string; publicProfile: boolean };
  updatedAt: Date;
  books: HubBook[];
  breadcrumbs: BreadcrumbItem[];
  relatedHubs: RelatedHubLink[];
  canonicalPath: string;
}) {
  const formattedDate = new Intl.DateTimeFormat("ro-RO", { dateStyle: "long" }).format(updatedAt);
  const structuredList = itemListJsonLd({
    name: title,
    path: canonicalPath,
    items: books.map((book) => ({ name: book.title, path: `/carte/${book.slug}` })),
  });
  return (
    <div>
      <JsonLd data={structuredList} />
      <PublicPageHeader
        eyebrow={eyebrow}
        title={title}
        description={intro}
        currentLabel={title}
        currentPath={canonicalPath}
        breadcrumbs={breadcrumbs}
        meta={<>
          <span className="inline-flex items-center"><CalendarDays aria-hidden="true" className="me-2 size-4" />Actualizat {formattedDate}</span>
          <span>Selecție de {editor.publicProfile ? <Link href={`/editor/${editor.slug}`} className="font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-brand">{editor.name}</Link> : <strong className="text-foreground">{editor.name}</strong>}</span>
        </>}
      />

      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-10 sm:px-6 md:py-14 lg:px-8">
        <div className="grid gap-6">
          {methodology ? <section className="grid gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6 lg:grid-cols-[15rem_minmax(0,1fr)_auto] lg:items-start" aria-labelledby="hub-methodology-title">
            <h2 id="hub-methodology-title" className="flex items-center gap-3 font-display text-2xl font-semibold leading-tight"><span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-brand"><ShieldCheck aria-hidden="true" className="size-5" /></span>Cum am făcut selecția</h2>
            <p className="whitespace-pre-line text-sm leading-6 text-muted sm:text-base sm:leading-7">{methodology}</p>
            <Link href="/cum-recomandam" className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-border px-4 text-sm font-bold text-brand transition hover:border-brand hover:bg-paper">Cum recomandăm</Link>
          </section> : null}

          <section aria-label={`Cărțile din selecția ${title}`}>
            {books.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {books.map((book) => <BookCard key={book.id} book={book} reason={book.reason} />)}
            </div> : <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">Această selecție nu are încă titluri disponibile.</div>}
          </section>
        </div>

        <RelatedHubNavigation hubs={relatedHubs} />

        <section className="rounded-[2rem] bg-brand px-6 py-10 text-white sm:px-10 sm:py-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">O alegere, nu încă o listă</p>
          <h2 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-[-0.03em]">Spune-ne ce cauți. Noi alegem cartea.</h2>
          <p className="mt-4 max-w-2xl leading-7 text-white/75">Dacă vrei să reduci selecția la un singur titlu potrivit contextului tău, răspunde la șase întrebări.</p>
          <Link href="/recomanda-mi" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-brand hover:bg-paper">Recomandă-mi o carte</Link>
        </section>
      </div>
    </div>
  );
}
