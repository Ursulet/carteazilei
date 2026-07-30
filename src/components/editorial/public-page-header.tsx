import { Breadcrumbs } from "./breadcrumbs";

export function PublicPageHeader({
  eyebrow,
  title,
  description,
  currentLabel,
  currentPath,
  width = "wide",
}: {
  eyebrow: string;
  title: string;
  description: string;
  currentLabel: string;
  currentPath?: string;
  width?: "wide" | "reading";
}) {
  return (
    <header className="border-b border-border bg-surface py-12 md:py-20">
      <div className={`mx-auto w-full px-5 sm:px-6 lg:px-8 ${width === "reading" ? "max-w-5xl" : "max-w-7xl"}`}>
        <Breadcrumbs
          items={[{ label: "Acasă", href: "/" }, { label: currentLabel }]}
          currentPath={currentPath}
        />
        <p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl font-display text-5xl font-semibold tracking-[-0.03em] text-balance sm:text-6xl">{title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">{description}</p>
      </div>
    </header>
  );
}
