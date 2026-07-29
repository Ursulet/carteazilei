import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { requireSectionAccess } from "@/lib/auth/principal";
import { getServerEnv } from "@/lib/env/server";
import { getMediaStorageStatus } from "@/lib/storage/media-storage";

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
  const storage = await getMediaStorageStatus();

  return (
    <>
      <AdminPageHeader
        eyebrow="Configurare"
        title="Setări"
        description="Valorile active ale aplicației. Se modifică din Environment Variables în Coolify și intră în vigoare după redeploy."
      />

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
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
          <div className="mt-5 rounded-xl border border-brand/20 bg-accent-soft px-4 py-3 text-sm leading-6 text-brand">
            În Coolify, volumul persistent trebuie montat exact la <strong>{storage.location}</strong>. Altfel imaginile dispar la următorul redeploy.
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
