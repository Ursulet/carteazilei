"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ButtonLink } from "@/components/ui/button-link";
import { Wordmark } from "@/components/layout/wordmark";

type NavigationItem = { label: string; href: string; external?: boolean; openInNewTab?: boolean };
export function MobileNavigation({ siteName, logoAssetId, navigation, recommendationEnabled }: { siteName: string; logoAssetId: string | null; navigation: NavigationItem[]; recommendationEnabled: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-surface text-foreground md:hidden"
          aria-label="Deschide meniul principal"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px] data-[state=closed]:animate-none" />
        <Dialog.Content className="fixed inset-y-0 end-0 z-[70] flex w-[min(90vw,24rem)] flex-col border-s border-border bg-surface p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="sr-only">Meniu principal</Dialog.Title>
          <div className="flex items-center justify-between border-b border-border pb-5">
            <Wordmark siteName={siteName} logoAssetId={logoAssetId} onClick={() => setOpen(false)} />
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-full text-foreground hover:bg-paper"
                aria-label="Închide meniul principal"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <nav className="flex flex-col gap-1 py-7" aria-label="Navigare mobilă">
            {navigation.map((item) => (
              <Dialog.Close asChild key={item.href}>
                <Link
                  href={item.href}
                  target={item.openInNewTab ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  className="rounded-xl px-4 py-3 text-lg font-medium text-foreground hover:bg-paper"
                >
                  {item.label}
                </Link>
              </Dialog.Close>
            ))}
          </nav>

          <div className="mt-auto grid gap-3 border-t border-border pt-6">
            <Dialog.Close asChild>
              <Link
                href="/cauta"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-semibold text-foreground"
              >
                <Search aria-hidden="true" className="size-4" />
                Caută
              </Link>
            </Dialog.Close>
            {recommendationEnabled ? <Dialog.Close asChild>
              <ButtonLink href="/recomanda-mi">Recomandă-mi o carte</ButtonLink>
            </Dialog.Close> : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
