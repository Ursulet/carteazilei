import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { ConfirmDeleteForm } from "@/components/admin/confirm-delete-form";
import { RoleForm } from "@/components/admin/role-form";
import { getAdminRole, getRoleAdministration } from "@/domain/auth/role-service";
import { requirePermission } from "@/lib/auth/principal";
import { deleteRoleAction, updateRoleAction } from "../actions";
export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) { await requirePermission("roles.manage"); const { id } = await params; const [role, data] = await Promise.all([getAdminRole(id), getRoleAdministration()]); if (!role || role.isSuperAdmin) notFound(); return <><AdminPageHeader eyebrow="Acces" title={role.name} description="Modifică permisiunile efective ale rolului. Sesiunile citesc matricea actuală la fiecare solicitare." /><RoleForm editing action={updateRoleAction.bind(null, id)} permissions={data.permissions} values={role} />{!role.isSystem ? <div className="mt-8"><ConfirmDeleteForm action={deleteRoleAction.bind(null, id)} message="Ștergi definitiv rolul custom? Operația este permisă doar dacă nu este atribuit." /></div> : null}</>; }
