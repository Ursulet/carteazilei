import Link from "next/link";

export function AuthorLink({ name, slug, className = "" }: { name: string; slug: string; className?: string }) {
  return (
    <Link
      href={`/autor/${slug}`}
      className={`font-semibold text-rust underline decoration-rust/35 underline-offset-4 transition hover:text-rust-dark hover:decoration-rust ${className}`}
    >
      {name}
    </Link>
  );
}
