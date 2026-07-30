import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import type { PublicRelationshipLanding } from "@/db/queries/public-seo-hubs";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/schema";

import { Breadcrumbs } from "./breadcrumbs";
import { PublicBookCard } from "./public-book-card";
import { RelatedHubNavigation, type RelatedHubLink } from "./related-hub-navigation";

const nextReadLabels: Record<string, string> = {
  theme: "Dacă ți-a plăcut tema",
  pace: "Dacă ți-a plăcut ritmul",
  style: "Dacă ți-a plăcut stilul",
  world: "Dacă ți-a plăcut lumea",
  emotional_effect: "Dacă vrei același efect emoțional",
};

const similarityLabels: Record<string, string> = {
  similar_theme: "Teme apropiate",
  similar_pace: "Ritm apropiat",
  similar_style: "Stil apropiat",
  similar_world: "Lumi apropiate",
};

export function RelationshipLanding({ page, relatedHubs }: { page: PublicRelationshipLanding; relatedHubs: RelatedHubLink[] }) {
  const nextRead = page.mode === "next_read";
  const title = nextRead
    ? `Ce să citești după „${page.source.book.title}”`
    : `Cărți asemănătoare cu „${page.source.book.title}”`;
  const intro = nextRead
    ? `O continuare bună depinde de ceea ce vrei să păstrezi din experiența lecturii: tema, ritmul, stilul, lumea sau efectul emoțional. Am separat direcțiile pentru ca următoarea alegere să nu fie doar o copie superficială.`
    : `Asemănarea nu înseamnă aceeași intrigă. Relațiile de mai jos sunt aprobate editorial și explică precis dacă apropierea vine din temă, ritm, stil sau construcția lumii.`;
  const labelMap = nextRead ? nextReadLabels : similarityLabels;
  const groups = Object.entries(Object.groupBy(page.relationships, (relationship) => nextRead ? relationship.nextReadBasis! : relationship.type));
  const updatedAt = new Intl.DateTimeFormat("ro-RO", { dateStyle: "long" }).format(page.source.book.updatedAt);
  const breadcrumbItems = [
    { name: "Acasă", path: "/" },
    { name: "Cărți", path: "/carti" },
    { name: page.source.book.title, path: `/carte/${page.source.book.slug}` },
    { name: nextRead ? "Ce să citești după" : "Cărți asemănătoare", path: page.href },
  ];

  return (
    <div>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <JsonLd data={itemListJsonLd({ name: title, path: page.href, items: page.relationships.map((relationship) => ({ name: relationship.target.title, path: `/carte/${relationship.target.slug}` })) })} />
      <header className="border-b border-border bg-surface py-12 md:py-20">
        <div className="mx-auto w-full max-w-5xl px-5 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Acasă", href: "/" }, { label: "Cărți", href: "/carti" }, { label: page.source.book.title, href: `/carte/${page.source.book.slug}` }, { label: nextRead ? "Ce să citești după" : "Cărți asemănătoare" }]} />
          <p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">{nextRead ? "Continuare editorială" : "Similaritate explicată"}</p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl font-semibold tracking-[-0.03em] text-balance sm:text-6xl">{title}</h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-muted">{intro}</p>
          <p className="mt-6 text-sm text-muted">Actualizat {updatedAt} · selecție de <strong className="text-foreground">{page.source.review.editor.name}</strong></p>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-16 px-5 py-16 sm:px-6 md:py-24 lg:px-8">
        {groups.map(([segment, relationships]) => relationships?.length ? (
          <section key={segment} aria-labelledby={`segment-${segment}`}>
            <h2 id={`segment-${segment}`} className="font-display text-3xl font-semibold">{labelMap[segment] ?? segment}</h2>
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {relationships.map((relationship) => <PublicBookCard key={relationship.target.id} book={relationship.target} reason={relationship.reason} />)}
            </div>
          </section>
        ) : null)}

        <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8" aria-labelledby="relationship-methodology">
          <h2 id="relationship-methodology" className="flex items-center gap-3 font-display text-3xl font-semibold"><ShieldCheck aria-hidden="true" className="size-6 text-brand" />Cum alegem relațiile</h2>
          <p className="mt-5 max-w-4xl leading-7 text-muted">{nextRead ? "Am grupat recomandările după lucrul pe care ai putea vrea să-l păstrezi din lectura anterioară: tema, ritmul, stilul, lumea sau efectul emoțional." : "Fiecare carte are un motiv clar pentru care seamănă cu titlul de la care ai pornit, fie prin temă, ritm, stil sau lume."}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/carte/${page.source.book.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-bold hover:border-brand">Înapoi la analiza cărții</Link>
            <Link href={nextRead ? `/carti-asemanatoare-cu/${page.source.book.slug}` : `/ce-sa-citesc-dupa/${page.source.book.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-bold hover:border-brand">{nextRead ? "Vezi cărțile asemănătoare" : "Vezi ce să citești după"}</Link>
          </div>
        </section>

        <RelatedHubNavigation hubs={relatedHubs} />

        <section className="rounded-[2rem] bg-brand px-6 py-10 text-white sm:px-10">
          <h2 className="font-display text-4xl font-semibold">Vrei o singură alegere pentru momentul tău?</h2>
          <p className="mt-4 max-w-2xl leading-7 text-white/75">Răspunde la câteva întrebări și primești o recomandare explicată.</p>
          <Link href="/recomanda-mi" className="mt-7 inline-flex min-h-11 items-center rounded-full bg-white px-6 text-sm font-bold text-brand hover:bg-paper">Recomandă-mi o carte</Link>
        </section>
      </div>
    </div>
  );
}
