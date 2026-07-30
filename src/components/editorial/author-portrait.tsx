import { UserRound } from "lucide-react";
import Image from "next/image";

type Portrait = {
  id: string | null;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export function AuthorPortrait({
  portrait,
  name,
  priority = false,
  className = "",
}: {
  portrait: Portrait | null;
  name: string;
  priority?: boolean;
  className?: string;
}) {
  if (!portrait?.id || !portrait.altText || !portrait.width || !portrait.height) {
    return (
      <div className={`flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[1.75rem] border border-border bg-gradient-to-br from-rust-soft to-[#e7ebdf] text-brand ${className}`}>
        <div className="text-center">
          <UserRound aria-hidden="true" className="mx-auto size-14 stroke-[1.35]" />
          <span className="mt-3 block font-display text-3xl font-semibold">{initials(name)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-paper shadow-[0_20px_55px_rgba(35,27,20,0.16)] ${className}`}>
      <Image
        src={`/media/${portrait.id}`}
        alt={portrait.altText}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 320px, (min-width: 640px) 240px, 42vw"
        className="object-cover"
      />
    </div>
  );
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toLocaleUpperCase("ro") ?? "")
    .join("");
}
