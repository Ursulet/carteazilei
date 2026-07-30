"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EditorialActionState } from "@/domain/editorial/action-state";
import { toActionState } from "@/domain/editorial/action-state";
import { deleteRole, parseRoleFormData, saveRole } from "@/domain/auth/role-service";
import { requirePermission } from "@/lib/auth/principal";

export async function createRoleAction(_state: EditorialActionState, formData: FormData): Promise<EditorialActionState> { const principal = await requirePermission("roles.manage"); let id: string; try { id = await saveRole(parseRoleFormData(formData), principal.id); } catch (error) { return toActionState(error); } revalidatePath("/admin/roles"); redirect(`/admin/roles/${id}`); }
export async function updateRoleAction(id: string, _state: EditorialActionState, formData: FormData): Promise<EditorialActionState> { const principal = await requirePermission("roles.manage"); try { await saveRole(parseRoleFormData(formData), principal.id, id); } catch (error) { return toActionState(error); } revalidatePath("/admin/roles"); redirect(`/admin/roles/${id}`); }
export async function deleteRoleAction(id: string) { const principal = await requirePermission("roles.manage"); await deleteRole(id, principal.id); revalidatePath("/admin/roles"); redirect("/admin/roles"); }
