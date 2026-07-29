import type { ReactNode } from "react";

type PhasePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  note?: ReactNode;
};

export function PhasePlaceholder({
  eyebrow,
  title,
  description,
  note,
}: PhasePlaceholderProps) {
  return (
    <section className="py-16 md:py-24 lg:py-28">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-6 lg:px-8">
        <p className="text-xs font-bold tracking-[0.18em] text-accent-dark uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-5 font-display text-4xl font-medium tracking-[-0.03em] text-balance sm:text-5xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">{description}</p>
        {note ? (
          <div className="mt-10 rounded-2xl border border-border bg-surface p-6 text-sm leading-6 text-muted">
            {note}
          </div>
        ) : null}
      </div>
    </section>
  );
}

