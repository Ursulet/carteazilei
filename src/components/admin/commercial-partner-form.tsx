"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { initialEditorialActionState } from "@/domain/editorial/action-state";

import { FieldError, FormSection, fieldClass, labelClass } from "./editorial-ui";
import { SubmitButton } from "./submit-button";
import { InlineMediaPicker } from "./inline-media-picker";

type Values = {
  name?: string | null;
  slug?: string | null;
  partnerType?: string;
  logoAssetId?: string | null;
  baseUrl?: string | null;
  defaultCta?: string | null;
  affiliateDisclosure?: string | null;
  affiliate?: boolean;
  commercialPartner?: boolean;
  active?: boolean;
};

type Options = {
  media: Array<{ id: string; altText: string; storageKey: string }>;
};

export function CommercialPartnerForm({
  action,
  values = {},
  options,
  editing = false,
}: {
  action: (
    state: EditorialActionState,
    formData: FormData,
  ) => Promise<EditorialActionState>;
  values?: Values;
  options: Options;
  editing?: boolean;
}) {
  const [state, formAction] = useActionState(action, initialEditorialActionState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-6">
      {state.status === "error" ? (
        <div
          role="alert"
          className="rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-medium text-danger"
        >
          {state.message}
        </div>
      ) : null}

      <FormSection
        title="Identitatea partenerului"
        description="Partenerul este administrat separat de catalogul editorial și de scorul recomandărilor."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className={labelClass}>
            Nume *
            <input name="name" required defaultValue={values.name ?? ""} className={fieldClass} />
            <FieldError errors={errors.name} />
          </label>
          <label className={labelClass}>
            Slug *
            <input
              name="slug"
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              defaultValue={values.slug ?? ""}
              className={fieldClass}
            />
            <FieldError errors={errors.slug} />
          </label>
          <label className={labelClass}>
            Tip *
            <select
              name="partnerType"
              required
              defaultValue={values.partnerType ?? "bookstore"}
              className={fieldClass}
            >
              <option value="publisher">Editură</option>
              <option value="bookstore">Librărie</option>
              <option value="marketplace">Marketplace</option>
              <option value="distributor">Distribuitor</option>
            </select>
          </label>
          <label className={labelClass}>
            Website HTTPS *
            <input
              name="baseUrl"
              type="url"
              required
              placeholder="https://exemplu.ro"
              defaultValue={values.baseUrl ?? ""}
              className={fieldClass}
            />
            <FieldError errors={errors.baseUrl} />
          </label>
          <label className={`${labelClass} md:col-span-2`}>
            Logo
            <InlineMediaPicker name="logoAssetId" value={values.logoAssetId} media={options.media} empty="Fără logo" />
            <span className="mt-1.5 block text-xs font-normal text-muted">
              Logo-urile se încarcă din secțiunea Media.
            </span>
          </label>
          <label className={`${labelClass} md:col-span-2`}>
            CTA implicit
            <input
              name="defaultCta"
              maxLength={120}
              placeholder="Vezi cartea la {partener}"
              defaultValue={values.defaultCta ?? ""}
              className={fieldClass}
            />
          </label>
        </div>
      </FormSection>

      <FormSection
        title="Relație comercială și transparență"
        description="Afilierea și parteneriatul comercial sunt stări distincte și vor fi comunicate distinct publicului."
      >
        <div className="grid gap-4">
          <label className="flex items-start gap-3 rounded-xl border border-border bg-paper p-4 text-sm font-semibold">
            <input
              type="checkbox"
              name="affiliate"
              defaultChecked={values.affiliate ?? false}
              className="mt-0.5 size-4 accent-[var(--brand)]"
            />
            <span>
              Partener afiliat
              <span className="mt-1 block text-xs font-normal leading-5 text-muted">
                Ofertele noi pot moșteni implicit această setare.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-xl border border-border bg-paper p-4 text-sm font-semibold">
            <input
              type="checkbox"
              name="commercialPartner"
              defaultChecked={values.commercialPartner ?? false}
              className="mt-0.5 size-4 accent-[var(--brand)]"
            />
            <span>
              Există un parteneriat comercial
              <span className="mt-1 block text-xs font-normal leading-5 text-muted">
                Aceasta nu marchează automat fiecare ofertă ca sponsorizată; marcajul se stabilește pe ofertă.
              </span>
            </span>
          </label>
          <label className={labelClass}>
            Disclosure specific partenerului
            <textarea
              name="affiliateDisclosure"
              rows={4}
              defaultValue={values.affiliateDisclosure ?? ""}
              className={fieldClass}
            />
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              name="active"
              defaultChecked={values.active ?? true}
              className="size-4 accent-[var(--brand)]"
            />
            Partener activ
          </label>
        </div>
      </FormSection>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{editing ? "Salvează partenerul" : "Adaugă partenerul"}</SubmitButton>
        <Link href="/admin/retailers" className="text-sm font-semibold text-muted hover:text-foreground">
          Renunță
        </Link>
      </div>
    </form>
  );
}
