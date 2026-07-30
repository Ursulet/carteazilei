import type { Metadata } from "next";

import { AdminPageHeader, EmptyState } from "@/components/admin/editorial-ui";
import { getRoleAdministration } from "@/domain/auth/role-service";
import { requireSectionAccess } from "@/lib/auth/principal";

export const metadata: Metadata = { title: "Permisiuni" };

export default async function PermissionsPage() {
  await requireSectionAccess("permissions");
  const { permissions } = await getRoleAdministration();
  const groups = [...new Set(permissions.map((permission) => permission.group))];

  return (
    <>
      <AdminPageHeader
        eyebrow="Control acces"
        title="Permisiuni"
        description="Catalogul drepturilor verificate pe server. Atribuirea lor se face din matricea fiecărui rol."
      />
      {permissions.length === 0 ? <EmptyState>Nu există încă permisiuni definite.</EmptyState> : (
        <div className="grid gap-5">
          {groups.map((group) => (
            <section key={group} className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-lg font-semibold">{group}</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {permissions.filter((permission) => permission.group === group).map((permission) => (
                  <article key={permission.id} className="rounded-xl border border-border bg-paper p-4">
                    <div className="flex items-start justify-between gap-3">
                      <code className="text-xs font-semibold text-brand">{permission.code}</code>
                      {permission.dangerous ? <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-semibold text-red-800">Sensibilă</span> : null}
                    </div>
                    <h3 className="mt-3 font-semibold">{permission.name}</h3>
                    <p className="mt-1 text-sm text-muted">{permission.description ?? "Fără descriere."}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
