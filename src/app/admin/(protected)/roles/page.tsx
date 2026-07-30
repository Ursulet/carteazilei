import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader, EmptyState } from "@/components/admin/editorial-ui";
import { getRoleAdministration } from "@/domain/auth/role-service";
import { hasPermission } from "@/lib/auth/permissions";
import { requireSectionAccess } from "@/lib/auth/principal";

export const metadata: Metadata = { title: "Roluri și permisiuni" };

export default async function RolesPage() {
  const principal = await requireSectionAccess("roles");
  const data = await getRoleAdministration();
  const canViewPermissionCatalog = hasPermission(principal.permissions, "permissions.view", principal.isSuperAdmin);
  const permissionGroups = [...new Set(data.permissions.map((permission) => permission.group))];

  return (
    <>
      <AdminPageHeader
        eyebrow="Utilizatori și acces"
        title="Roluri și permisiuni"
        description="Configurează rolurile și consultă drepturile sistemului dintr-un singur loc."
        action={principal.isSuperAdmin ? { href: "/admin/roles/new", label: "Rol nou" } : undefined}
      />

      {data.roles.length ? (
        <section className="grid gap-4 lg:grid-cols-2" aria-label="Roluri disponibile">
          {data.roles.map((role) => (
            <article key={role.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-semibold">{role.name}</h2>
                  <p className="mt-1 text-xs text-muted">{role.code} · {role.users} utilizatori</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${role.active ? "bg-accent-soft text-brand" : "bg-paper text-muted"}`}>{role.active ? "Activ" : "Inactiv"}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">{role.description || "Fără descriere."}</p>
              <p className="mt-4 text-sm font-semibold">{role.isSuperAdmin ? "Toate permisiunile, rol protejat" : `${role.permissionIds.length} permisiuni`}</p>
              {principal.isSuperAdmin && !role.isSuperAdmin ? <Link href={`/admin/roles/${role.id}`} className="mt-4 inline-block text-sm font-semibold text-brand underline underline-offset-4">Editează rolul</Link> : null}
            </article>
          ))}
        </section>
      ) : <EmptyState>Nu există roluri configurate.</EmptyState>}

      {canViewPermissionCatalog ? (
        <section id="catalog-permisiuni" className="mt-10 scroll-mt-8 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-accent-dark">Catalog intern</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">Permisiuni disponibile</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Drepturile sunt verificate server-side și se atribuie prin editarea unui rol.</p>
          </div>
          <div className="mt-6 grid gap-4">
            {permissionGroups.map((group) => (
              <details key={group} className="rounded-xl border border-border bg-paper p-4">
                <summary className="cursor-pointer font-semibold">{group} <span className="ms-2 text-xs font-normal text-muted">{data.permissions.filter((permission) => permission.group === group).length} permisiuni</span></summary>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {data.permissions.filter((permission) => permission.group === group).map((permission) => (
                    <article key={permission.id} className="rounded-xl border border-border bg-surface p-4">
                      <div className="flex items-start justify-between gap-3"><code className="text-xs font-semibold text-brand">{permission.code}</code>{permission.dangerous ? <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-semibold text-red-800">Sensibilă</span> : null}</div>
                      <h3 className="mt-3 font-semibold">{permission.name}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted">{permission.description ?? "Fără descriere."}</p>
                    </article>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
