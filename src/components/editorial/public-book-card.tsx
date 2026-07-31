import { ArrowRight, Feather, Sparkles } from "lucide-react";
import Link from "next/link";

import type { PublicBookCard } from "@/db/queries/public-book-pages";

import { AuthorLink } from "./author-link";
import { BookCover } from "./book-cover";

export function PublicBookCard({ book, reason }: { book: PublicBookCard; reason?: string | null }) {
  return (
    <article className="group rounded-2xl border border-border bg-surface p-5 transition duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-sm">
      <Link href={`/carte/${book.slug}`} className="block">
        <BookCover cover={book.cover} title={book.title} className="mx-auto max-w-[12rem]" />
        <h3 className="mt-5 font-display text-2xl font-semibold leading-tight">{book.title}</h3>
      </Link>
      <p className="mt-2 flex items-center gap-2 text-sm text-muted"><Feather aria-hidden="true" className="size-4 text-rust" />de <AuthorLink name={book.author} slug={book.authorSlug} /></p>
      {reason ?? book.verdict ? <p className="mt-4 grid grid-cols-[1rem_minmax(0,1fr)] items-start gap-2 text-sm leading-6 text-muted"><Sparkles aria-hidden="true" className="mt-1 size-4 text-rust" /><span className="line-clamp-3">{reason ?? book.verdict}</span></p> : null}
      <Link href={`/carte/${book.slug}`} className="mt-5 inline-flex items-center text-sm font-bold text-brand">Vezi analiza<ArrowRight aria-hidden="true" className="ms-2 size-4 transition-transform group-hover:translate-x-0.5" /></Link>
    </article>
  );
}
