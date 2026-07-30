import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireSectionAccess } from "@/lib/auth/principal";

export const metadata: Metadata = { title: "Permisiuni" };

export default async function PermissionsPage() {
  await requireSectionAccess("permissions");
  redirect("/admin/roles#catalog-permisiuni");
}
