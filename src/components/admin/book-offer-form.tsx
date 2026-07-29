"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { initialEditorialActionState } from "@/domain/editorial/action-state";

import { FieldError, FormSection, fieldClass, labelClass } from "./editorial-ui";
import { SubmitButton } from "./submit-button";

type Values = {
  retailerId?: string;
  purchaseUrl?: string;
  price?: string | null;
  currency?: string | null;
  availability?: string | null;
  affiliate?: boolean;
  isPrimary?: boolean;
  displayOrder?: number;
  ctaLabel?: string | null;
  commercialPlacement?: string;
  active?: boolean;
};

type Partner = { id: string; name: string; affiliate: boolean; defaultCta: string | null };

export function BookOfferForm({
  action,
  bookId,
  partners,
  values = {},
  editing = false,
}: {
  action: (
    state: EditorialActionState,
    formData: FormData,
  ) => Promise<EditorialActionState>;
  bookId: string;
  partners: Partner[];
  values?: Values;
  editing?: boolean;
}) {
  const [state, formAction] = useActionState(action, initialEditorialActionState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-5">
      {state.status === "error" ? (
        <div
          role="alert"
          className="rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-medium text-danger"
        >
          {state.message}
        </div>
      ) : null}

      <FormSection
        title={editing ? "Editează oferta" : "Adaugă rapid o ofertă"}
        description="Fluxul obișnuit este Partener → URL → Preț → Salvează. Restul setărilor sunt opționale."
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_2fr_0.8fr]">
          <label className={labelClass}>
            Partener *
            <select
              name="retailerId"
              required
              defaultValue={values.retailerId ?? ""}
              className={fieldClass}
            >
              <option value="">Alege partenerul</option>
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.name}{partner.affiliate ? " · afiliat implicit" : ""}
                </option>
              ))}
            </select>
            <FieldError errors={errors.retailerId} />
          </label>
          <label className={labelClass}>
            URL-ul exact al cărții *
            <input
              name="purchaseUrl"
              type="url"
              required
              placeholder="https://partener.ro/carte/..."
              defaultValue={values.purchaseUrl ?? ""}
              className={fieldClass}
            />
            <FieldError errors={errors.purchaseUrl} />
          </label>
          <label className={labelClass}>
            Preț
            <input
              name="price"
              inputMode="decimal"
              placeholder="59,90"
              defaultValue={values.price ?? ""}
              className={fieldClass}
            />
            <FieldError errors={errors.price} />
          </label>
        </div>

        <details className="mt-5 rounded-xl border border-border bg-paper p-4">
          <summary className="cursor-pointer text-sm font-bold">Setări avansate</summary>
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <label className={labelClass}>
              Monedă
              <input
                name="currency"
                maxLength={3}
                defaultValue={values.currency ?? "RON"}
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              Disponibilitate
              <select
                name="availability"
                defaultValue={values.availability ?? "unknown"}
                className={fieldClass}
              >
                <option value="unknown">Necunoscută</option>
                <option value="in_stock">În stoc</option>
                <option value="out_of_stock">Stoc epuizat</option>
                <option value="preorder">Precomandă</option>
              </select>
            </label>
            <label className={labelClass}>
              Afiliere
              <select
                name="affiliateMode"
                defaultValue={editing ? (values.affiliate ? "yes" : "no") : "inherit"}
                className={fieldClass}
              >
                <option value="inherit">Moștenește de la partener</option>
                <option value="yes">Da, link afiliat</option>
                <option value="no">Nu este afiliat</option>
              </select>
            </label>
            <label className={labelClass}>
              Ordine
              <input
                name="displayOrder"
                type="number"
                min={0}
                defaultValue={values.displayOrder ?? 100}
                className={fieldClass}
              />
            </label>
            <label className={`${labelClass} lg:col-span-2`}>
              CTA personalizat
              <input
                name="ctaLabel"
                maxLength={120}
                placeholder="Vezi cartea la Libris"
                defaultValue={values.ctaLabel ?? ""}
                className={fieldClass}
              />
            </label>
            <label className={`${labelClass} lg:col-span-2`}>
              Plasare comercială
              <select
                name="commercialPlacement"
                defaultValue={values.commercialPlacement ?? "none"}
                className={fieldClass}
              >
                <option value="none">Fără sponsorizare</option>
                <option value="promoted">Promovat</option>
                <option value="commercial_partnership">Parteneriat comercial</option>
              </select>
              <span className="mt-1.5 block text-xs font-normal leading-5 text-muted">
                Folosește marcajul doar când plasarea concretă este plătită sau sponsorizată.
              </span>
            </label>
            <div className="grid gap-3">
              <label className="flex items-center gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  name="isPrimary"
                  defaultChecked={values.isPrimary ?? false}
                  className="size-4 accent-[var(--brand)]"
                />
                Ofertă principală
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={values.active ?? true}
                  className="size-4 accent-[var(--brand)]"
                />
                Ofertă activă
              </label>
            </div>
          </div>
        </details>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <SubmitButton>{editing ? "Salvează oferta" : "Adaugă oferta"}</SubmitButton>
          {editing ? (
            <Link
              href={`/admin/books/${bookId}/offers`}
              className="text-sm font-semibold text-muted hover:text-foreground"
            >
              Renunță
            </Link>
          ) : null}
        </div>
      </FormSection>
    </form>
  );
}
