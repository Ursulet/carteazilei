"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, BookOpen, LibraryBig, LoaderCircle, Search, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";

type SearchBook = {
  id: string;
  title: string;
  slug: string;
  author: string;
  verdict: string | null;
};

type SearchAuthor = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  bookCount: number;
};

type SearchGuide = {
  id: string;
  title: string;
  href: string;
  intro: string | null;
  kindLabel: string;
  selectionCount: number;
};

type SearchPayload = {
  ok: boolean;
  message?: string;
  books: SearchBook[];
  authors: SearchAuthor[];
  guides: SearchGuide[];
};

type CommandItem = {
  key: string;
  href: string;
};

const emptyResults: SearchPayload = {
  ok: true,
  books: [],
  authors: [],
  guides: [],
};

export function SearchCommand() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchPayload>(emptyResults);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const normalizedQuery = query.trim();
  const items = useMemo<CommandItem[]>(
    () => [
      ...results.books.map((book) => ({ key: `book-${book.id}`, href: `/carte/${book.slug}` })),
      ...results.authors.map((author) => ({ key: `author-${author.id}`, href: `/autor/${author.slug}` })),
      ...results.guides.map((guide) => ({ key: `guide-${guide.id}`, href: guide.href })),
    ],
    [results],
  );

  useEffect(() => {
    if (!open || normalizedQuery.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setMessage(null);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(normalizedQuery)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as SearchPayload;

        if (!response.ok || !payload.ok) {
          setResults(emptyResults);
          setMessage(payload.message ?? "Căutarea nu este disponibilă momentan.");
          return;
        }

        setResults(payload);
        setActiveIndex(-1);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResults(emptyResults);
          setMessage("Căutarea nu este disponibilă momentan.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [normalizedQuery, open]);

  function goTo(href: string) {
    setOpen(false);
    router.push(href);
  }

  function changeOpen(nextOpen: boolean) {
    setOpen(nextOpen);
    setActiveIndex(-1);
    if (nextOpen && normalizedQuery.length >= 2) {
      setResults(emptyResults);
      setMessage(null);
      setLoading(true);
    }
  }

  function changeQuery(value: string) {
    setQuery(value);
    setResults(emptyResults);
    setMessage(null);
    setActiveIndex(-1);
    setLoading(value.trim().length >= 2);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (normalizedQuery.length < 2) return;
    goTo(`/cauta?q=${encodeURIComponent(normalizedQuery)}`);
  }

  function handleKeyboard(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && items.length) {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % items.length);
    } else if (event.key === "ArrowUp" && items.length) {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? items.length - 1 : current - 1));
    } else if (event.key === "Enter" && activeIndex >= 0 && items[activeIndex]) {
      event.preventDefault();
      goTo(items[activeIndex].href);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const hasResults = items.length > 0;
  const searchedWithoutResults =
    normalizedQuery.length >= 2 && !loading && !message && !hasResults;

  return (
    <Dialog.Root open={open} onOpenChange={changeOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-paper hover:text-foreground"
          aria-label="Caută o carte, un autor sau o temă"
        >
          <Search aria-hidden="true" className="size-5" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[3px]" />
        <Dialog.Content className="fixed inset-x-3 top-[5vh] z-[90] mx-auto flex max-h-[90vh] w-auto max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl focus:outline-none sm:inset-x-6 sm:top-[10vh]">
          <Dialog.Title className="sr-only">Caută în CarteaZilei</Dialog.Title>
          <Dialog.Description className="sr-only">
            Caută rapid cărți, autori, liste și ghiduri editoriale.
          </Dialog.Description>

          <form onSubmit={submitSearch} role="search" className="flex items-center gap-3 border-b border-border px-4 sm:px-6">
            {loading ? (
              <LoaderCircle aria-hidden="true" className="size-5 shrink-0 animate-spin text-accent-dark" />
            ) : (
              <Search aria-hidden="true" className="size-5 shrink-0 text-muted" />
            )}
            <input
              autoFocus
              type="search"
              value={query}
              maxLength={100}
              onChange={(event) => changeQuery(event.target.value)}
              onKeyDown={handleKeyboard}
              placeholder="Caută o carte, un autor sau o temă"
              className="min-h-16 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted sm:text-lg"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={hasResults}
              aria-controls="search-command-results"
              aria-activedescendant={activeIndex >= 0 ? `search-command-option-${activeIndex}` : undefined}
            />
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-paper hover:text-foreground"
                aria-label="Închide căutarea"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </Dialog.Close>
          </form>

          <div id="search-command-results" role="listbox" className="min-h-44 overflow-y-auto p-3 sm:p-4">
            {normalizedQuery.length < 2 ? (
              <div className="flex min-h-36 flex-col items-center justify-center px-5 text-center">
                <BookOpen aria-hidden="true" className="size-8 text-accent" />
                <p className="mt-4 font-display text-2xl font-semibold">Începe cu două caractere</p>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                  Poți căuta fără diacritice și chiar dacă nu știi exact ortografia.
                </p>
              </div>
            ) : null}

            {message ? <p role="status" className="px-4 py-10 text-center text-sm text-danger">{message}</p> : null}

            {results.books.length ? (
              <SearchGroup label="Cărți" icon={<BookOpen aria-hidden="true" className="size-4" />}>
                {results.books.map((book, index) => {
                  return (
                    <SearchOption
                      key={book.id}
                      id={`search-command-option-${index}`}
                      href={`/carte/${book.slug}`}
                      active={activeIndex === index}
                      onActivate={() => setActiveIndex(index)}
                      onSelect={() => setOpen(false)}
                      title={book.title}
                      description={`de ${book.author}`}
                    />
                  );
                })}
              </SearchGroup>
            ) : null}

            {results.authors.length ? (
              <SearchGroup label="Autori" icon={<UserRound aria-hidden="true" className="size-4" />}>
                {results.authors.map((author, authorIndex) => {
                  const index = results.books.length + authorIndex;
                  return (
                    <SearchOption
                      key={author.id}
                      id={`search-command-option-${index}`}
                      href={`/autor/${author.slug}`}
                      active={activeIndex === index}
                      onActivate={() => setActiveIndex(index)}
                      onSelect={() => setOpen(false)}
                      title={author.name}
                      description={`${author.bookCount} ${author.bookCount === 1 ? "carte analizată" : "cărți analizate"}`}
                    />
                  );
                })}
              </SearchGroup>
            ) : null}

            {results.guides.length ? (
              <SearchGroup label="Liste / ghiduri" icon={<LibraryBig aria-hidden="true" className="size-4" />}>
                {results.guides.map((guide, guideIndex) => {
                  const index = results.books.length + results.authors.length + guideIndex;
                  return (
                    <SearchOption
                      key={guide.id}
                      id={`search-command-option-${index}`}
                      href={guide.href}
                      active={activeIndex === index}
                      onActivate={() => setActiveIndex(index)}
                      onSelect={() => setOpen(false)}
                      title={guide.title}
                      description={`${guide.kindLabel} · ${guide.selectionCount} cărți`}
                    />
                  );
                })}
              </SearchGroup>
            ) : null}

            {searchedWithoutResults ? (
              <div className="px-5 py-10 text-center">
                <p className="font-display text-2xl font-semibold">Nu am găsit o potrivire.</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Încearcă un titlu mai scurt sau pornește recomandarea personalizată.
                </p>
                <Link
                  href="/recomanda-mi"
                  onClick={() => setOpen(false)}
                  className="mt-5 inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-bold hover:border-brand"
                >
                  Recomandă-mi o carte
                </Link>
              </div>
            ) : null}
          </div>

          {normalizedQuery.length >= 2 ? (
            <button
              type="button"
              onClick={() => goTo(`/cauta?q=${encodeURIComponent(normalizedQuery)}`)}
              className="flex min-h-14 items-center justify-between border-t border-border px-6 text-left text-sm font-bold text-brand hover:bg-paper"
            >
              Vezi toate rezultatele
              <ArrowRight aria-hidden="true" className="size-4" />
            </button>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SearchGroup({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="not-last:mb-3" aria-labelledby={`search-group-${label}`}>
      <h2 id={`search-group-${label}`} className="flex items-center gap-2 px-3 pb-2 pt-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">
        {icon}
        {label}
      </h2>
      <div>{children}</div>
    </section>
  );
}

function SearchOption({
  id,
  href,
  active,
  onActivate,
  onSelect,
  title,
  description,
}: {
  id: string;
  href: string;
  active: boolean;
  onActivate: () => void;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <Link
      id={id}
      href={href}
      role="option"
      aria-selected={active}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onClick={onSelect}
      className={`block rounded-xl px-3 py-3 ${active ? "bg-accent-soft" : "hover:bg-paper"}`}
    >
      <span className="block font-semibold text-foreground">{title}</span>
      <span className="mt-0.5 block truncate text-sm text-muted">{description}</span>
    </Link>
  );
}
