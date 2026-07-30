import { BookOpen, Sparkles, Tags, UsersRound, type LucideIcon } from "lucide-react";
import Link from "next/link";

type TaxonomyItem = { id: string; name: string; slug: string };

export function BookTaxonomyProfile({
  genres,
  themes,
  moods,
  audiences,
}: {
  genres: TaxonomyItem[];
  themes: TaxonomyItem[];
  moods: TaxonomyItem[];
  audiences: TaxonomyItem[];
}) {
  const groups = [
    { title: "Genuri", icon: BookOpen, items: genres, route: "gen", tone: "bg-[#e9ede4] text-brand" },
    { title: "Teme", icon: Tags, items: themes, route: "tema", tone: "bg-rust-soft text-rust-dark" },
    { title: "Atmosferă", icon: Sparkles, items: moods, route: "stare", tone: "bg-[#ebe7f1] text-[#594876]" },
    { title: "Potrivită pentru", icon: UsersRound, items: audiences, route: "pentru", tone: "bg-[#e4eceb] text-brand" },
  ].filter((group) => group.items.length > 0);

  if (!groups.length) return null;

  return (
    <section aria-labelledby="book-taxonomy-heading">
      <h2 id="book-taxonomy-heading" className="font-display text-3xl font-semibold">Cum este această carte</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Etichetele de mai jos sunt cele selectate în fișa editorială a cărții.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {groups.map((group) => <TaxonomyGroup key={group.title} {...group} />)}
      </div>
    </section>
  );
}

function TaxonomyGroup({
  title,
  icon: Icon,
  items,
  route,
  tone,
}: {
  title: string;
  icon: LucideIcon;
  items: TaxonomyItem[];
  route: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-paper p-5">
      <h3 className="flex items-center gap-3 font-display text-xl font-semibold">
        <span className={`inline-flex size-9 items-center justify-center rounded-full ${tone}`}><Icon aria-hidden="true" className="size-4" /></span>
        {title}
      </h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <Link key={item.id} href={`/carti/${route}/${item.slug}`} className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold transition hover:border-rust hover:text-rust-dark">
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
