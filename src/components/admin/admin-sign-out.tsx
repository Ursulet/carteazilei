"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

export function AdminSignOutButton() {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void signOut({ callbackUrl: "/" });
      }}
      className="inline-flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted transition-colors hover:bg-paper hover:text-foreground disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
      ) : (
        <LogOut aria-hidden="true" className="size-4" />
      )}
      {pending ? "Se închide…" : "Ieși din cont"}
    </button>
  );
}

