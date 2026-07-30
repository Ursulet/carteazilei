import type { Metadata } from "next";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  FileText,
  Gauge,
  Info,
  Languages,
  LibraryBig,
  ListChecks,
  ShoppingBag,
  Sparkles,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { ProductEventTracker } from "@/components/analytics/product-event-tracker";
import { AuthorPortrait } from "@/components/editorial/author-portrait";
import { BookFeedbackEntry } from "@/components/editorial/book-feedback-entry";
import { BookCover } from "@/components/editorial/book-cover";
import { BookTaxonomyProfile } from "@/components/editorial/book-taxonomy-profile";
import { Breadcrumbs } from "@/components/editorial/breadcrumbs";
import { PublicBookCard } from "@/components/editorial/public-book-card";
import { ReadingProfile } from "@/components/editorial/reading-profile";
import { RetailerOffers } from "@/components/editorial/retailer-offers";
import { RelationshipNavigation } from "@/components/editorial/relationship-navigation";
import { getPublicBookPage } from "@/db/queries/public-book-pages";
import { JsonLd } from "@/lib/seo/json-ld";
import { buildMissingMetadata, buildPublicMetadata } from "@/lib/seo/metadata";
import { bookJsonLd, breadcrumbJsonLd } from "@/lib/seo/schema";

export const dynamic = "force-dynamic";
const getBook = cache(getPublicBookPage);

const relationLabels: Record<string, string> = {
  similar_theme: "Teme apropiate",
  similar_style: "Stil apropiat",
  similar_pace: "Ritm apropiat",
  similar_world: "Lume asemănătoare",
  next_read: "Următoarea lectură",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getBook(slug);
  if (!page) return buildMissingMetadata("Carte");
  const title = page.seo?.title || `${page.book.title} de ${page.author.name} — Merită citită?`;
  const description = (page.seo?.description || page.book.verdict || "").slice(0, 160);
  const canonical = page.seo?.canonical || `/carte/${page.book.slug}`;
  return buildPublicMetadata({
    title,
    description,
    canonical,
    index: Boolean(page.seo?.indexable),
    type: "article",
    image: `/media/${page.edition.cover.id}`,
    imageAlt: page.edition.cover.altText,
  });
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getBook(slug);
  if (!page) notFound();
  const canonical = page.seo?.canonical || `/carte/${page.book.slug}`;
  const structuredBook = bookJsonLd({
    path: canonical,
    title: page.book.title,
    alternateTitle: page.book.originalTitle,
    description: page.book.verdict ?? page.review.verdict ?? `Analiză editorială pentru ${page.book.title}.`,
    coverPath: `/media/${page.edition.cover.id}`,
    author: { name: page.author.name, path: `/autor/${page.author.slug}` },
    isbn: page.edition.isbn13 || page.edition.isbn10,
    language: page.edition.language,
    pageCount: page.edition.pageCount,
    publicationDate: page.edition.publicationDate || page.edition.publicationYear,
    publisher: page.edition.publisher,
    genres: page.genres.map((genre) => genre.name),
  });
  const structuredBreadcrumbs = breadcrumbJsonLd([
    { name: "Acasă", path: "/" },
    { name: "Cărți", path: "/carti" },
    { name: page.book.title, path: canonical },
  ]);
  return (
    <article>
      <ProductEventTracker event={{ event: "book_viewed", bookId: page.book.id, sourcePath: `/carte/${page.book.slug}` }} />
      <JsonLd data={structuredBook} />
      <JsonLd data={structuredBreadcrumbs} />

      <section className="py-10 md:py-14">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Acasă", href: "/" }, { label: "Cărți", href: "/carti" }, { label: page.book.title }]} />
          <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5"><BookCover cover={page.edition.cover} title={page.book.title} priority className="mx-auto max-w-sm" /></div>
            <div className="self-center lg:col-span-7">
              {page.genres.length ? <div className="flex flex-wrap gap-2">{page.genres.map((genre) => <Link key={genre.id} href={`/carti/gen/${genre.slug}`} className="rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-brand">{genre.name}</Link>)}</div> : null}
              <h1 className="mt-5 font-display text-5xl font-semibold tracking-[-0.03em] text-balance sm:text-6xl">{page.book.title}</h1>
              {page.book.subtitle ? <p className="mt-3 text-xl text-muted">{page.book.subtitle}</p> : null}
              <p className="mt-4 text-lg">de <Link href={`/autor/${page.author.slug}`} className="font-bold underline decoration-border underline-offset-4 hover:decoration-brand">{page.author.name}</Link></p>
              <dl className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted">{page.edition.publisher ? <BookMetaDetail icon={Building2} term="Editură" value={page.edition.publisher} /> : null}{page.edition.publicationYear ? <BookMetaDetail icon={CalendarDays} term="Anul publicării" value={String(page.edition.publicationYear)} /> : null}{page.edition.pageCount ? <BookMetaDetail icon={BookOpen} term="Lungime" value={`${page.edition.pageCount} pagini`} /> : null}<BookMetaDetail icon={Languages} term="Limbă" value={page.edition.language.toUpperCase()} /></dl>
              <p className="mt-8 border-s-4 border-accent ps-5 font-display text-2xl leading-9">{page.book.verdict}</p>
              <p className="mt-6 text-sm text-muted">Analiză de {page.review.editor.publicProfile ? <Link href={`/editor/${page.review.editor.slug}`} className="font-bold text-foreground underline decoration-border underline-offset-4">{page.review.editor.name}</Link> : <strong className="text-foreground">{page.review.editor.name}</strong>}{page.review.reviewedAt ? ` · revizuită ${new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium" }).format(page.review.reviewedAt)}` : ""}</p>
              <div className="mt-8 flex flex-wrap gap-3"><a href="#verdict" className="inline-flex min-h-11 items-center rounded-full bg-brand px-6 text-sm font-bold text-white hover:bg-brand-hover">Vezi analiza <ArrowRight aria-hidden="true" className="ms-2 size-4" /></a><a href="#unde-o-gasesti" className="inline-flex min-h-11 items-center rounded-full border border-border px-6 text-sm font-bold hover:border-brand"><ShoppingBag aria-hidden="true" className="me-2 size-4" />Vezi unde o găsești</a></div>
            </div>
          </div>
        </div>
      </section>

      <div id="verdict" className="border-y border-border bg-surface">
        <div className="mx-auto grid w-full max-w-5xl gap-12 px-5 py-16 sm:px-6 md:py-24 lg:px-8">
          {page.review.whyRead ? <section><h2 className="flex items-center gap-3 font-display text-3xl font-semibold"><Check aria-hidden="true" className="size-6 text-brand" />Merită să o citești dacă…</h2><p className="mt-5 whitespace-pre-line text-lg leading-8 text-muted">{page.review.whyRead}</p></section> : null}
          {page.review.whyNot ? <section><h2 className="flex items-center gap-3 font-display text-3xl font-semibold"><X aria-hidden="true" className="size-6 text-danger" />Poate să nu fie pentru tine dacă…</h2><p className="mt-5 whitespace-pre-line text-lg leading-8 text-muted">{page.review.whyNot}</p></section> : null}
          <section><h2 className="flex items-center gap-3 font-display text-3xl font-semibold"><FileText aria-hidden="true" className="size-6 text-rust" />Despre ce este — fără spoilere</h2><p className="mt-5 whitespace-pre-line text-lg leading-8 text-muted">{page.book.summary}</p></section>
          <BookTaxonomyProfile genres={page.genres} themes={page.themes} moods={page.moods} audiences={page.audiences} />
          {page.traits.length ? <section><h2 className="flex items-center gap-3 font-display text-3xl font-semibold"><Gauge aria-hidden="true" className="size-6 text-rust" />Profil de lectură</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Indicatorii descriu experiența lecturii, nu o notă de calitate.</p><div className="mt-7"><ReadingProfile traits={page.traits} /></div></section> : null}
          {page.review.strengths.length ? <section><h2 className="flex items-center gap-3 font-display text-3xl font-semibold"><Sparkles aria-hidden="true" className="size-6 text-rust" />Puncte forte editoriale</h2><ul className="mt-5 grid gap-3 sm:grid-cols-2">{page.review.strengths.map((strength) => <li key={strength} className="flex items-start gap-3 rounded-2xl border border-border bg-paper p-5 leading-7"><Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-brand" /><span>{strength}</span></li>)}</ul></section> : null}
          {page.review.caveats.length ? <section><h2 className="flex items-center gap-3 font-display text-3xl font-semibold"><Info aria-hidden="true" className="size-6 text-accent-dark" />Ce poate împărți cititorii</h2><ul className="mt-5 space-y-3">{page.review.caveats.map((caveat) => <li key={caveat} className="border-s-2 border-accent ps-4 leading-7 text-muted">{caveat}</li>)}</ul></section> : null}
        </div>
      </div>

      {page.similarBooks.length ? <section className="py-16 md:py-24"><div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Mai multe idei de lectură</p><h2 className="mt-3 flex items-center gap-3 font-display text-4xl font-semibold tracking-[-0.03em]"><LibraryBig aria-hidden="true" className="size-7 text-rust" />Cărți asemănătoare</h2><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{page.similarBooks.map((relation) => <div key={`${relation.target.id}-${relation.type}`}><p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{relationLabels[relation.type] ?? relation.type}</p><PublicBookCard book={relation.target} reason={relation.reason} /></div>)}</div></div></section> : null}
      {page.nextReads.length ? <section className="border-y border-border bg-surface py-16 md:py-24"><div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Continuă traseul</p><h2 className="mt-3 flex items-center gap-3 font-display text-4xl font-semibold tracking-[-0.03em]"><ArrowRight aria-hidden="true" className="size-7 text-rust" />Ce să citești după {page.book.title}</h2><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{page.nextReads.map((relation) => <PublicBookCard key={relation.target.id} book={relation.target} reason={relation.reason} />)}</div></div></section> : null}

      {page.similarBooks.length || page.nextReads.length ? <section className="py-12"><div className="mx-auto w-full max-w-5xl px-5 sm:px-6 lg:px-8"><RelationshipNavigation bookSlug={page.book.slug} bookTitle={page.book.title} hasSimilar={page.similarBooks.length > 0} hasNextReads={page.nextReads.some((relationship) => Boolean(relationship.nextReadBasis))} /></div></section> : null}

      <section className="py-16 md:py-24"><div className="mx-auto grid w-full max-w-5xl items-center gap-8 px-5 sm:px-6 md:grid-cols-[10rem_minmax(0,1fr)_auto] lg:px-8"><AuthorPortrait portrait={page.author.portrait} name={page.author.name} className="mx-auto w-36 md:w-full" /><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-rust-dark"><UserRound aria-hidden="true" className="size-4" />Despre autor</p><h2 className="mt-3 font-display text-4xl font-semibold">{page.author.name}</h2>{page.author.bio ? <p className="mt-5 line-clamp-5 whitespace-pre-line text-base leading-7 text-muted">{page.author.bio}</p> : null}</div><Link href={`/autor/${page.author.slug}`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-bold hover:border-rust">Vezi pagina autorului <ArrowRight aria-hidden="true" className="ms-2 size-4" /></Link></div></section>

      {page.lists.length ? <section className="border-y border-border bg-surface py-12"><div className="mx-auto w-full max-w-5xl px-5 sm:px-6 lg:px-8"><h2 className="flex items-center gap-3 font-display text-3xl font-semibold"><ListChecks aria-hidden="true" className="size-6 text-rust" />Apare în listele editoriale</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{page.lists.map((list) => <Link key={list.slug} href={`/liste/${list.slug}`} className="group rounded-2xl border border-border bg-paper p-5"><strong>{list.title}</strong><span className="mt-2 block text-sm leading-6 text-muted">{list.reason}</span><span className="mt-3 inline-flex items-center text-xs font-bold text-brand">Vezi lista <ArrowRight aria-hidden="true" className="ms-1 size-3.5 transition-transform group-hover:translate-x-0.5" /></span></Link>)}</div></div></section> : null}

      <section id="unde-o-gasesti" className="py-16 md:py-24"><div className="mx-auto w-full max-w-5xl px-5 sm:px-6 lg:px-8"><h2 className="flex items-center gap-3 font-display text-4xl font-semibold tracking-[-0.03em]"><ShoppingBag aria-hidden="true" className="size-7 text-rust" />Unde o găsești</h2><RetailerOffers offers={page.offers} context={{ sourceContext: "book_page", sourcePath: `/carte/${page.book.slug}` }} /></div></section>

      <section className="border-y border-border bg-surface py-16"><div className="mx-auto w-full max-w-5xl px-5 sm:px-6 lg:px-8"><h2 className="flex items-center gap-3 font-display text-3xl font-semibold"><Building2 aria-hidden="true" className="size-6 text-rust" />Ediție și surse</h2><dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">{page.edition.label ? <div><dt className="font-bold">Ediție</dt><dd className="mt-1 text-muted">{page.edition.label}</dd></div> : null}{page.edition.publisher ? <div><dt className="font-bold">Editură</dt><dd className="mt-1 text-muted">{page.edition.publisher}</dd></div> : null}{page.edition.isbn13 || page.edition.isbn10 ? <div><dt className="font-bold">ISBN</dt><dd className="mt-1 text-muted">{page.edition.isbn13 || page.edition.isbn10}</dd></div> : null}{page.edition.pageCount ? <div><dt className="font-bold">Lungime</dt><dd className="mt-1 text-muted">{page.edition.pageCount} pagini</dd></div> : null}<div><dt className="font-bold">Limba ediției</dt><dd className="mt-1 text-muted">{page.edition.language.toUpperCase()}</dd></div>{page.edition.cover.source ? <div><dt className="font-bold">Sursa copertei</dt><dd className="mt-1 text-muted">{page.edition.cover.sourceUrl ? <a href={page.edition.cover.sourceUrl} target="_blank" rel="nofollow noopener" className="underline underline-offset-4">{page.edition.cover.source}</a> : page.edition.cover.source}</dd></div> : null}</dl>{page.edition.cover.attribution ? <p className="mt-6 text-xs leading-5 text-muted">Atribuire copertă: {page.edition.cover.attribution}</p> : null}</div></section>

      <section className="py-16 md:py-24"><div className="mx-auto w-full max-w-5xl px-5 sm:px-6 lg:px-8"><BookFeedbackEntry slug={page.book.slug} /></div></section>
    </article>
  );
}

function BookMetaDetail({ icon: Icon, term, value }: { icon: LucideIcon; term: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <dt className="sr-only">{term}</dt>
      <dd className="inline-flex items-center gap-2"><Icon aria-hidden="true" className="size-4 text-rust-dark" />{value}</dd>
    </div>
  );
}
