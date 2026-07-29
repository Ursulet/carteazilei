import Link from "next/link";

import { footerNavigation } from "@/components/layout/navigation";
import { Wordmark } from "@/components/layout/wordmark";

export function SiteFooter() {
  return (
    <footer className="bg-brand text-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="grid gap-10 border-b border-white/15 pb-10 md:grid-cols-[1fr_auto] md:items-start">
          <div className="max-w-md">
            <Wordmark onDark />
            <p className="mt-4 text-sm leading-6 text-white/70">
              Recomandări explicate. Mai puține titluri. Alegeri mai bune.
            </p>
          </div>
          <nav
            className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3"
            aria-label="Navigare secundară"
          >
            {footerNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-white/70 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="pt-6 text-xs text-white/55">
          © {new Date().getFullYear()} Cartea Zilei. Conținut editorial în limba română.
        </p>
      </div>
    </footer>
  );
}

