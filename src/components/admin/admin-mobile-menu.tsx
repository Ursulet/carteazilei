"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { AdminNavigation } from "@/components/admin/admin-navigation";
import { AdminSignOutButton } from "@/components/admin/admin-sign-out";
import { Wordmark } from "@/components/layout/wordmark";
import type { AdminSection } from "@/lib/auth/access";

export function AdminMobileMenu({
  sections,
  name,
  email,
  roleLabel,
}: {
  sections: readonly AdminSection[];
  name: string;
  email: string;
  roleLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-surface text-foreground lg:hidden"
          aria-label="Deschide meniul de administrare"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed inset-y-0 start-0 z-[90] flex w-[min(90vw,20rem)] flex-col border-e border-border bg-surface p-5 shadow-xl focus:outline-none">
          <Dialog.Title className="sr-only">Meniu administrare</Dialog.Title>
          <div className="flex items-center justify-between border-b border-border pb-5">
            <Wordmark onClick={() => setOpen(false)} />
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-xl text-muted hover:bg-paper hover:text-foreground"
                aria-label="Închide meniul de administrare"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto py-5">
            <AdminNavigation sections={sections} onNavigate={() => setOpen(false)} />
          </div>

          <div className="border-t border-border pt-4">
            <p className="truncate px-3 text-sm font-semibold text-foreground">{name}</p>
            <p className="mt-1 truncate px-3 text-xs text-muted">{email}</p>
            <p className="mt-1 px-3 text-xs font-medium text-accent-dark">{roleLabel}</p>
            <div className="mt-3">
              <AdminSignOutButton />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

