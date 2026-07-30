"use server";

import { revalidatePath } from "next/cache";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { toActionState } from "@/domain/editorial/action-state";
import { parseRecommendationConfigurationFormData, saveRecommendationConfiguration } from "@/domain/recommendation/configuration-service";
import { requireMutationAccess } from "@/lib/auth/principal";

export async function updateRecommendationConfigurationAction(_state: EditorialActionState, formData: FormData): Promise<EditorialActionState> {
  const principal = await requireMutationAccess("recommendations");
  try {
    await saveRecommendationConfiguration(parseRecommendationConfigurationFormData(formData), principal.id);
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath("/admin/recommendations");
  return { status: "idle", message: "Configurația recomandărilor a fost salvată." };
}
