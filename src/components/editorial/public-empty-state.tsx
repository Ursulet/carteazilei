import type { ReactNode } from "react";

export function PublicEmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center shadow-sm">
      <h2 className="font-display text-3xl font-semibold">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>
      {children ? <div className="mt-7 flex flex-wrap justify-center gap-3">{children}</div> : null}
    </div>
  );
}
