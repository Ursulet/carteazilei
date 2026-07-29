"use client";

import { LoaderCircle, LogIn } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
        callbackUrl,
      });

      if (!response || response.error) {
        setError("Emailul sau parola nu sunt corecte.");
        setPending(false);
        return;
      }

      router.push(response.url ?? callbackUrl);
      router.refresh();
    } catch {
      setError("Emailul sau parola nu sunt corecte.");
      setPending(false);
    }
  }

  return (
    <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm font-semibold text-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          maxLength={254}
          required
          disabled={pending}
          className="min-h-12 rounded-xl border border-border bg-white px-4 text-base text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm font-semibold text-foreground">
          Parolă
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          maxLength={128}
          required
          disabled={pending}
          className="min-h-12 rounded-xl border border-border bg-white px-4 text-base text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60"
        />
      </div>

      <p className="min-h-6 text-sm text-danger" role="status" aria-live="polite">
        {error}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
        ) : (
          <LogIn aria-hidden="true" className="size-4" />
        )}
        {pending ? "Se verifică…" : "Intră în administrare"}
      </button>
    </form>
  );
}
