import { BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Wordmark({
  onDark = false,
  compact = false,
  onClick,
  siteName = "Cartea Zilei",
  logoAssetId,
}: {
  onDark?: boolean;
  compact?: boolean;
  onClick?: () => void;
  siteName?: string;
  logoAssetId?: string | null;
}) {
  const normalizedName = siteName.trim();
  const words = normalizedName.split(/\s+/);
  const compactAccent = words.length === 1 && normalizedName.toLocaleLowerCase("ro").endsWith("zilei")
    ? normalizedName.slice(-5)
    : null;
  const accent = words.length > 1 ? words.at(-1) : compactAccent;
  const base = words.length > 1
    ? words.slice(0, -1).join(" ")
    : compactAccent
      ? normalizedName.slice(0, -5)
      : normalizedName;

  return (
    <Link
      href="/"
      className={`inline-flex items-center font-display font-semibold tracking-[-0.025em] ${compact ? "gap-1.5 text-xl" : "gap-2 text-2xl sm:text-[1.7rem]"} ${onDark ? "text-white" : "text-foreground"}`}
      aria-label={`${siteName} — pagina principală`}
      onClick={onClick}
    >
      {logoAssetId ? (
        <Image
          src={`/media/${logoAssetId}`}
          alt={siteName}
          width={190}
          height={52}
          className={`${compact ? "h-8 max-w-[9rem]" : "h-10 max-w-[12rem]"} w-auto object-contain`}
          priority
        />
      ) : (
        <>
          <BookOpen aria-hidden="true" className={`${compact ? "size-6" : "size-7"} shrink-0 stroke-[1.7] ${onDark ? "text-[#e0a36f]" : "text-rust"}`} />
          <span>{base}{accent ? <span className={onDark ? "text-[#e0a36f]" : "text-rust"}>{accent}</span> : null}</span>
        </>
      )}
    </Link>
  );
}
