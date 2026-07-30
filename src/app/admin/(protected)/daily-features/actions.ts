"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { toActionState } from "@/domain/editorial/action-state";
import { deleteDailyFeature, parseDailyFeatureFormData, saveDailyFeature } from "@/domain/editorial/daily-feature-service";
import { withAdminNotice } from "@/lib/admin/notice";
import { requireMutationAccess } from "@/lib/auth/principal";

export async function createDailyFeatureAction(_state: EditorialActionState, formData: FormData): Promise<EditorialActionState> { const principal = await requireMutationAccess("daily-features"); let id: string; try { id = await saveDailyFeature(parseDailyFeatureFormData(formData), principal.id); } catch (error) { return toActionState(error); } revalidatePath("/admin/daily-features"); redirect(withAdminNotice(`/admin/daily-features/${id}`, "Selecția Cartea Zilei a fost creată.")); }
export async function updateDailyFeatureAction(id: string, _state: EditorialActionState, formData: FormData): Promise<EditorialActionState> { const principal = await requireMutationAccess("daily-features"); try { await saveDailyFeature(parseDailyFeatureFormData(formData), principal.id, id); } catch (error) { return toActionState(error); } revalidatePath("/admin/daily-features"); revalidatePath(`/admin/daily-features/${id}`); redirect(withAdminNotice(`/admin/daily-features/${id}`, "Selecția Cartea Zilei a fost salvată.")); }
export async function deleteDailyFeatureAction(id: string) { const principal = await requireMutationAccess("daily-features"); await deleteDailyFeature(id, principal.id); revalidatePath("/admin/daily-features"); redirect(withAdminNotice("/admin/daily-features", "Selecția Cartea Zilei a fost arhivată.")); }
