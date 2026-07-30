import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { RoleForm } from "@/components/admin/role-form";
import { getRoleAdministration } from "@/domain/auth/role-service";
import { requirePermission } from "@/lib/auth/principal";
import { createRoleAction } from "../actions";
export default async function NewRolePage() { await requirePermission("roles.manage"); const data = await getRoleAdministration(); return <><AdminPageHeader eyebrow="Acces" title="Rol custom nou" description="Combină permisiunile granulare într-un rol adaptat echipei." /><RoleForm action={createRoleAction} permissions={data.permissions} /></>; }
