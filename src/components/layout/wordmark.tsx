import Link from "next/link";

export function Wordmark({
  onDark = false,
  onClick,
}: {
  onDark?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href="/"
      className={`inline-flex items-baseline gap-1 font-display text-2xl font-semibold tracking-[-0.025em] ${
        onDark ? "text-white" : "text-foreground"
      }`}
      aria-label="Cartea Zilei — pagina principală"
      onClick={onClick}
    >
      Cartea
      <span className={onDark ? "text-[#d5ad68]" : "text-accent-dark"}>Zilei</span>
    </Link>
  );
}
