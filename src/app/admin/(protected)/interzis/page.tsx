import type { Metadata } from "next";
import { ShieldX } from "lucide-react";
import Link from "next/link";

import { requireInternalPrincipal } from "@/lib/auth/principal";

export const metadata: Metadata = { title: "Acces interzis" };

export default async function ForbiddenPage() {
  await requireInternalPrincipal();

  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-paper text-danger">
        <ShieldX aria-hidden="true" className="size-6" />
      </span>
      <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em]">Nu ai acces la acest modul</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Rolurile active ale contului tău nu permit deschiderea acestei secțiuni.
      </p>
      <Link href="/admin" className="mt-7 inline-flex min-h-11 items-center rounded-full bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-hover">
        Înapoi la dashboard
      </Link>
    </div>
  );
}

