import Image from "next/image";
import Link from "next/link";

import { Wordmark } from "@/components/layout/wordmark";
import { CookieSettingsButton } from "@/components/privacy/cookie-settings-button";

type Item = {
  id?: string;
  label: string;
  href: string;
  groupLabel?: string | null;
  external?: boolean;
  openInNewTab?: boolean;
};

type SocialItem = { label: string; href: string };

const footerLinkClass =
  "w-fit text-sm leading-5 text-white/70 transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-accent";

function isPath(item: Item, path: string) {
  return item.href === path || item.href.startsWith(`${path}#`) || item.href.startsWith(`${path}?`);
}

function FooterLink({ item }: { item: Item }) {
  return (
    <Link
      href={item.href}
      target={item.openInNewTab ? "_blank" : undefined}
      rel={item.external || item.openInNewTab ? "noopener noreferrer" : undefined}
      className={footerLinkClass}
    >
      {item.label}
    </Link>
  );
}

function SocialMark({ label }: { label: string }) {
  const name = label.toLocaleLowerCase("ro");

  if (name === "facebook") {
    return <path d="M13.8 21v-8h2.8l.4-3h-3.2V8.1c0-.9.3-1.6 1.7-1.6h1.7V3.8c-.8-.1-1.6-.2-2.4-.2-2.5 0-4.2 1.5-4.2 4.3V10H8v3h2.6v8h3.2Z" />;
  }

  if (name === "instagram") {
    return (
      <>
        <rect x="4" y="4" width="16" height="16" rx="4.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.4" cy="6.7" r="1" />
      </>
    );
  }

  if (name === "youtube") {
    return (
      <>
        <rect x="3" y="6" width="18" height="12" rx="4" />
        <path d="m10 9 5 3-5 3V9Z" className="fill-brand" />
      </>
    );
  }

  if (name === "linkedin") {
    return <path d="M6.2 8.2H3.4V21h2.8V8.2ZM4.8 3A1.8 1.8 0 1 0 4.8 6.6 1.8 1.8 0 0 0 4.8 3Zm8 5.2H10V21h2.8v-6.3c0-1.7.3-3.3 2.4-3.3 2 0 2 1.9 2 3.4V21H20v-7c0-3.5-.7-6.1-4.7-6.1-1.9 0-3.1 1-3.6 2h-.1l.1-1.7h1.1Z" />;
  }

  if (name === "x") {
    return <path d="M5 4h3.7l4.1 5.6L17.5 4H20l-6 7.4L20.4 20h-3.7l-4.6-6.2L7 20H4.5l6.4-8L5 4Zm2.4 1.8 10 12.4h1L8.5 5.8H7.4Z" />;
  }

  if (name === "tiktok") {
    return <path d="M14.2 3h3c.2 1.7 1.2 3.1 2.8 3.8v3a8.5 8.5 0 0 1-2.8-1.1v5.9A6.4 6.4 0 1 1 11.7 8v3a3.4 3.4 0 1 0 2.5 3.3V3Z" />;
  }

  return (
    <text x="12" y="16.2" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor">
      {label.slice(0, 1).toLocaleUpperCase("ro")}
    </text>
  );
}

function SocialLinks({ social }: { social: SocialItem[] }) {
  if (!social.length) return null;

  return (
    <div className="mt-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/55">Urmărește-ne</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {social.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${item.label} — se deschide într-o filă nouă`}
            className="grid size-7 place-items-center rounded-full border border-accent/35 bg-accent/10 text-accent transition hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-brand focus-visible:outline-accent"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5 fill-current">
              <SocialMark label={item.label} />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}

export function SiteFooter({
  siteName,
  siteTagline,
  logoAssetId,
  navigation,
  social,
  copyrightText,
  contactEmail,
  contactPhone,
}: {
  siteName: string;
  siteTagline: string;
  logoAssetId: string | null;
  navigation: Item[];
  social: SocialItem[];
  copyrightText: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}) {
  const contactItem = navigation.find((item) => isPath(item, "/contact"));
  const editorialPolicyItem = navigation.find((item) => isPath(item, "/politica-editoriala"));
  const privacyItem = navigation.find((item) => isPath(item, "/legal/confidentialitate"));
  const discoveryItems = navigation.filter(
    (item) => item !== contactItem && item !== editorialPolicyItem && item !== privacyItem,
  );

  return (
    <footer className="overflow-hidden border-t border-white/5 bg-brand text-white">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-6 gap-y-7 px-5 py-8 sm:gap-x-10 sm:gap-y-8 sm:px-6 lg:grid-cols-[1.35fr_0.8fr_1fr_0.72fr] lg:px-8 lg:py-9">
        <div className="col-span-2 max-w-xs sm:col-span-1">
          <Wordmark compact onDark siteName={siteName} logoAssetId={logoAssetId} />
          <p className="mt-3 max-w-[17rem] text-xs leading-[1.55] text-white/70">{siteTagline}</p>
          <SocialLinks social={social} />
        </div>

        <nav aria-label="Descoperă">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.04em] text-white/85">Descoperă</h2>
          <div className="mt-2.5 grid gap-1.5">
            {discoveryItems.map((item) => (
              <FooterLink key={item.id ?? item.href} item={item} />
            ))}
          </div>
        </nav>

        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.04em] text-white/85">Contact &amp; suport</h2>
          <div className="mt-2.5 grid gap-1.5">
            <FooterLink item={contactItem ?? { href: "/contact", label: "Formular contact" }} />
            {contactEmail ? (
              <a className={footerLinkClass} href={`mailto:${contactEmail}`}>
                {contactEmail}
              </a>
            ) : null}
            {contactPhone ? (
              <a className={footerLinkClass} href={`tel:${contactPhone.replace(/\s+/g, "")}`}>
                {contactPhone}
              </a>
            ) : null}
          </div>
        </div>

        <div className="col-span-2 flex items-center justify-between gap-6 border-t border-white/10 pt-5 sm:col-span-1 sm:block sm:justify-self-start sm:border-0 sm:pt-0 lg:justify-self-end">
          <h2 className="text-sm font-bold text-white">Realizat de</h2>
          <Image
            src="/images/smdg-logo.png"
            alt="SMDG Servicii IT & C"
            width={500}
            height={300}
            className="h-auto w-28 object-contain object-left sm:mt-2"
          />
        </div>
      </div>

      <div className="border-t border-white/15 bg-black/20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-3.5 text-[11px] leading-4 text-white/55 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>{copyrightText || `© ${new Date().getFullYear()} ${siteName}. Toate drepturile rezervate.`}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={editorialPolicyItem?.href ?? "/politica-editoriala"}
              className="transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-accent"
            >
              Politica editorială
            </Link>
            <span aria-hidden="true" className="text-white/25">|</span>
            <Link
              href={privacyItem?.href ?? "/legal/confidentialitate"}
              className="transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-accent"
            >
              Confidențialitate
            </Link>
            <span aria-hidden="true" className="text-white/25">|</span>
            <Link
              href="/legal/confidentialitate"
              className="transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-accent"
            >
              Politica de cookie-uri
            </Link>
            <span aria-hidden="true" className="text-white/25">|</span>
            <CookieSettingsButton />
          </div>
        </div>
      </div>
    </footer>
  );
}
