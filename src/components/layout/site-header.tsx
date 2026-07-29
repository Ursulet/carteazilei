import Link from "next/link";

import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { primaryNavigation } from "@/components/layout/navigation";
import { Wordmark } from "@/components/layout/wordmark";
import { SearchCommand } from "@/components/search/search-command";
import { ButtonLink } from "@/components/ui/button-link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex min-h-18 w-full max-w-7xl items-center gap-8 px-5 sm:px-6 lg:px-8">
        <Wordmark />

        <nav className="hidden items-center gap-6 md:flex" aria-label="Navigare principală">
          {primaryNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto hidden items-center gap-3 md:flex">
          <SearchCommand />
          <ButtonLink href="/recomanda-mi" className="px-5">
            Recomandă-mi o carte
          </ButtonLink>
        </div>

        <div className="ms-auto flex items-center gap-1 md:hidden">
          <SearchCommand />
          <MobileNavigation />
        </div>
      </div>
    </header>
  );
}
