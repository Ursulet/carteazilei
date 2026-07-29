import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { PublicBookCard } from "@/db/queries/public-book-pages";

import { BookCover } from "./book-cover";

export function PublicBookCard({ book, reason }: { book: PublicBookCard; reason?: string | null }) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-5 transition duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-sm">
      <Link href={`/carte/${book.slug}`} className="group block">
        <BookCover cover={book.cover} title={book.title} className="mx-auto max-w-[12rem]" />
        <h3 className="mt-5 font-display text-2xl font-semibold leading-tight">{book.title}</h3>
        <p className="mt-1 text-sm text-muted">de {book.author}</p>
        {reason ?? book.verdict ? <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">{reason ?? book.verdict}</p> : null}
        <span className="mt-5 inline-flex items-center text-sm font-bold text-brand">Vezi analiza<ArrowRight aria-hidden="true" className="ms-2 size-4 transition-transform group-hover:translate-x-0.5" /></span>
      </Link>
    </article>
  );
}
