import { Check, CircleAlert } from "lucide-react";

import type { PublishingGateItem } from "@/domain/editorial/action-state";

export function PublishingChecklist({ items }: { items: readonly PublishingGateItem[] }) {
  return (
    <div className="rounded-2xl border border-border bg-paper p-4">
      <h3 className="text-sm font-bold">Checklist de publicare</h3>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.key} className={`flex items-start gap-2 text-sm ${item.passed ? "text-brand" : "text-danger"}`}>
            {item.passed ? <Check className="mt-0.5 size-4 shrink-0" aria-hidden /> : <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
