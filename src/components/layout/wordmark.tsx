import Image from "next/image";
import Link from "next/link";

export function Wordmark({
  onDark = false,
  onClick,
  siteName = "Cartea Zilei",
  logoAssetId,
}: {
  onDark?: boolean;
  onClick?: () => void;
  siteName?: string;
  logoAssetId?: string | null;
}) {
  const words = siteName.trim().split(/\s+/);
  const accent = words.length > 1 ? words.pop() : null;
  const base = words.join(" ") || siteName;
  return (
    <Link
      href="/"
      className={`inline-flex items-baseline gap-1 font-display text-2xl font-semibold tracking-[-0.025em] ${
        onDark ? "text-white" : "text-foreground"
      }`}
      aria-label={`${siteName} — pagina principală`}
      onClick={onClick}
    >
      {logoAssetId ? <Image src={`/media/${logoAssetId}`} alt={siteName} width={190} height={52} className="h-10 w-auto max-w-[12rem] object-contain" priority /> : <>{base}{accent ? <span className={onDark ? "text-[#d5ad68]" : "text-accent-dark"}>{accent}</span> : null}</>}
    </Link>
  );
}
