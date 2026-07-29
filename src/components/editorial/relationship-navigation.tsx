import { ArrowRight, GitCompareArrows, LibraryBig } from "lucide-react";
import Link from "next/link";

export function RelationshipNavigation({ bookSlug, bookTitle, hasSimilar, hasNextReads }: { bookSlug: string; bookTitle: string; hasSimilar: boolean; hasNextReads: boolean }) {
  if (!hasSimilar && !hasNextReads) return null;
  return (
    <nav aria-label={`Trasee editoriale pentru ${bookTitle}`} className="grid gap-4 sm:grid-cols-2">
      {hasSimilar ? <Link href={`/carti-asemanatoare-cu/${bookSlug}`} className="group rounded-2xl border border-border bg-surface p-5 hover:border-accent">
        <GitCompareArrows aria-hidden="true" className="size-5 text-brand" />
        <strong className="mt-4 block font-display text-2xl font-semibold">Cărți asemănătoare cu {bookTitle}</strong>
        <span className="mt-4 inline-flex items-center text-sm font-bold text-brand">Compară direcțiile editoriale<ArrowRight aria-hidden="true" className="ms-2 size-4 transition-transform group-hover:translate-x-0.5" /></span>
      </Link> : null}
      {hasNextReads ? <Link href={`/ce-sa-citesc-dupa/${bookSlug}`} className="group rounded-2xl border border-border bg-surface p-5 hover:border-accent">
        <LibraryBig aria-hidden="true" className="size-5 text-brand" />
        <strong className="mt-4 block font-display text-2xl font-semibold">Ce să citești după {bookTitle}</strong>
        <span className="mt-4 inline-flex items-center text-sm font-bold text-brand">Alege ce vrei să păstrezi<ArrowRight aria-hidden="true" className="ms-2 size-4 transition-transform group-hover:translate-x-0.5" /></span>
      </Link> : null}
    </nav>
  );
}
