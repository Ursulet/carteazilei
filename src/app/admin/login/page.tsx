import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { Wordmark } from "@/components/layout/wordmark";
import { getInternalPrincipal } from "@/lib/auth/principal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Autentificare editorială",
  robots: { index: false, follow: false },
};

function safeCallbackUrl(value: string | undefined) {
  if (!value || !value.startsWith("/admin") || value.startsWith("//")) {
    return "/admin";
  }

  return value;
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const principal = await getInternalPrincipal();

  if (principal) {
    redirect("/admin");
  }

  const query = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Wordmark />
        </div>
        <section className="rounded-3xl border border-border bg-surface p-6 shadow-[0_20px_60px_rgba(23,21,18,0.08)] sm:p-8">
          <p className="text-xs font-bold tracking-[0.16em] text-accent-dark uppercase">
            Acces intern
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-foreground">
            Administrare editorială
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Această zonă este rezervată echipei Cartea Zilei.
          </p>
          <LoginForm callbackUrl={safeCallbackUrl(query.callbackUrl)} />
        </section>
        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/" className="underline decoration-border underline-offset-4 hover:text-foreground">
            Înapoi la site
          </Link>
        </p>
      </div>
    </main>
  );
}

