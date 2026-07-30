import Link from "next/link";

import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Wordmark } from "@/components/layout/wordmark";
import { SearchCommand } from "@/components/search/search-command";
import { ButtonLink } from "@/components/ui/button-link";

type NavigationItem = {
  label: string;
  href: string;
  external?: boolean;
  openInNewTab?: boolean;
};

export function SiteHeader({
  siteName,
  logoAssetId,
  navigation,
  recommendationEnabled,
}: {
  siteName: string;
  logoAssetId: string | null;
  navigation: NavigationItem[];
  recommendationEnabled: boolean;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-surface/95 shadow-[0_1px_0_rgba(23,21,18,0.03)] backdrop-blur-md">
      <div className="mx-auto flex min-h-18 w-full max-w-[1440px] items-center gap-7 px-5 sm:px-6 lg:min-h-20 lg:px-8">
        <Wordmark siteName={siteName} logoAssetId={logoAssetId} />

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Navigare principală">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              target={item.openInNewTab ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className="relative whitespace-nowrap py-2 text-sm font-medium text-muted transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-rust after:transition-transform hover:text-foreground hover:after:scale-x-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto hidden items-center gap-3 md:flex">
          <span className="hidden 2xl:block"><SearchCommand variant="field" /></span>
          <span className="2xl:hidden"><SearchCommand /></span>
          {recommendationEnabled ? (
            <ButtonLink href="/recomanda-mi" className="hidden px-5 xl:inline-flex">
              Recomandă-mi o carte
            </ButtonLink>
          ) : null}
        </div>

        <div className="ms-auto flex items-center gap-1 md:hidden">
          <SearchCommand />
          <MobileNavigation
            siteName={siteName}
            logoAssetId={logoAssetId}
            navigation={navigation}
            recommendationEnabled={recommendationEnabled}
          />
        </div>
      </div>
    </header>
  );
}
