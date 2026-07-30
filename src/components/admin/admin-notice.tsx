"use client";

import { CheckCircle2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function AdminNotice() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const notice = searchParams.get("notice");

  if (!notice) return null;

  return <AdminNoticeToast message={notice} pathname={pathname} searchParams={searchParams} replace={router.replace} />;
}

function AdminNoticeToast({ message, pathname, searchParams, replace }: {
  message: string;
  pathname: string;
  searchParams: ReturnType<typeof useSearchParams>;
  replace: ReturnType<typeof useRouter>["replace"];
}) {
  const [visible, setVisible] = useState(true);

  const dismiss = useCallback(() => {
    setVisible(false);
    const cleanParams = new URLSearchParams(searchParams.toString());
    cleanParams.delete("notice");
    replace(`${pathname}${cleanParams.size ? `?${cleanParams.toString()}` : ""}`, { scroll: false });
  }, [pathname, replace, searchParams]);

  useEffect(() => {
    const timeout = window.setTimeout(dismiss, 5_000);
    return () => window.clearTimeout(timeout);
  }, [dismiss]);

  if (!visible) return null;

  return (
    <div className="fixed end-4 top-4 z-[80] flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-2xl border border-brand/20 bg-surface px-4 py-3 text-sm shadow-[0_18px_55px_rgba(23,21,18,0.18)] sm:end-6 sm:top-6 sm:max-w-md" role="status" aria-live="polite">
      <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand" />
      <p className="min-w-0 flex-1 font-semibold leading-6 text-foreground">{message}</p>
      <button type="button" onClick={dismiss} className="rounded-lg p-1 text-muted hover:bg-paper hover:text-foreground" aria-label="Închide notificarea">
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
