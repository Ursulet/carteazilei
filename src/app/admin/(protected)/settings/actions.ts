"use server";

import { revalidatePath } from "next/cache";

import { EditorialServiceError } from "@/domain/editorial/action-state";
import {
  parsePublicSettingsFormData,
  savePublicSiteSettings,
} from "@/domain/settings/public-settings-service";
import { requireMutationAccess } from "@/lib/auth/principal";

export type PublicSettingsActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updatePublicSettingsAction(
  _state: PublicSettingsActionState,
  formData: FormData,
): Promise<PublicSettingsActionState> {
  const principal = await requireMutationAccess("settings");
  try {
    await savePublicSiteSettings(parsePublicSettingsFormData(formData), principal.id);
  } catch (error) {
    if (error instanceof EditorialServiceError) {
      return { status: "error", message: error.message, fieldErrors: error.fieldErrors };
    }
    console.error(error);
    return { status: "error", message: "Setările nu au putut fi salvate." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { status: "success", message: "Setările publice au fost salvate." };
}
