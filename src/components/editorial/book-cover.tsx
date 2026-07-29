import Image from "next/image";

type Cover = {
  id: string | null;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export function BookCover({ cover, title, priority = false, className = "" }: {
  cover: Cover;
  title: string;
  priority?: boolean;
  className?: string;
}) {
  if (!cover.id || !cover.altText || !cover.width || !cover.height) {
    return (
      <div className={`flex aspect-[2/3] items-end rounded-xl border border-border bg-paper p-5 ${className}`}>
        <p className="font-display text-2xl font-semibold leading-tight">{title}</p>
      </div>
    );
  }

  return (
    <div className={`relative aspect-[2/3] overflow-hidden rounded-xl bg-paper shadow-[0_22px_55px_rgba(23,21,18,0.18)] ${className}`}>
      <Image
        src={`/media/${cover.id}`}
        alt={cover.altText}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 360px, (min-width: 640px) 300px, 72vw"
        className="object-contain"
      />
    </div>
  );
}
