import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { PublicSettingsForm } from "@/components/admin/public-settings-form";
import { getPublicSiteSettings } from "@/domain/settings/public-settings-service";
import { getAdminMedia } from "@/db/queries/admin-media";
import { requireSectionAccess } from "@/lib/auth/principal";
import { getServerEnv } from "@/lib/env/server";
import { getMediaStorageStatus } from "@/lib/storage/media-storage";

import { updatePublicSettingsAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Setări" };

function Setting({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-border bg-paper p-4">
      <dt className="text-xs font-bold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-2 break-words font-semibold">{value}</dd>
      {note ? <p className="mt-1 text-xs leading-5 text-muted">{note}</p> : null}
    </div>
  );
}

export default async function SettingsPage() {
  await requireSectionAccess("settings");
  const env = getServerEnv();
  const [storage, publicSettings, media] = await Promise.all([
    getMediaStorageStatus(),
    getPublicSiteSettings(),
    getAdminMedia(),
  ]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Configurare"
        title="Setări"
        description="Administrează informațiile publice și verifică valorile operaționale active."
      />

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-2xl font-semibold">Site public și GDPR</h2>
        <p className="mt-1 text-sm leading-6 text-muted">Textele și preferințele de mai jos se salvează imediat în baza de date; nu au nevoie de redeploy.</p>
        <PublicSettingsForm action={updatePublicSettingsAction} values={publicSettings} media={media.filter((asset) => asset.mimeType.startsWith("image/")).map((asset) => ({ id: asset.id, altText: asset.altText }))} />
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">Storage media</h2>
            <p className="mt-1 text-sm leading-6 text-muted">Locul în care sunt salvate coperțile, portretele și logo-urile.</p>
          </div>
          <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${storage.ready ? "bg-accent-soft text-brand" : "bg-red-50 text-danger"}`}>
            {storage.ready ? "Disponibil" : "Nu poate fi scris"}
          </span>
        </div>
        <dl className="mt-5 grid gap-4 md:grid-cols-2">
          <Setting label="Tip" value={storage.driver === "local" ? "Folder / volum local" : "S3 compatibil"} />
          <Setting label={storage.driver === "local" ? "Director container" : "Bucket"} value={storage.location} />
        </dl>
        {storage.driver === "local" ? (
          <div className={`mt-5 rounded-xl border px-4 py-3 text-sm leading-6 ${storage.ready ? "border-brand/20 bg-accent-soft text-brand" : "border-danger/25 bg-red-50 text-danger"}`}>
            {storage.ready ? <>Volumul este accesibil și permite scrierea la <strong>{storage.location}</strong>.</> : <>Volumul este configurat la <strong>{storage.location}</strong>, dar procesul nu poate scrie în el. Motiv: <code className="break-all">{storage.reason ?? "necunoscut"}</code>. După redeploy, entrypoint-ul Docker repară proprietarul directorului montat.</>}
          </div>
        ) : null}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-2xl font-semibold">Aplicație</h2>
        <dl className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Setting label="Adresă publică" value={env.NEXT_PUBLIC_SITE_URL} />
          <Setting label="Autentificare" value={env.NEXTAUTH_URL} />
          <Setting label="Bază de date" value="Conectată" note="Pagina este încărcată numai după validarea sesiunii în baza de date." />
          <Setting label="Contact public" value={env.PUBLIC_CONTACT_EMAIL ?? "Necompletat"} />
          <Setting label="Prag minim hub SEO" value={`${env.SEO_HUB_MINIMUM_BOOKS} cărți eligibile`} />
          <Setting label="Healthcheck bază de date" value={env.HEALTHCHECK_DATABASE ? "Activ" : "Inactiv"} />
        </dl>
      </section>
    </>
  );
}
