import type { Metadata } from "next";
import { AdminSectionPage } from "@/components/admin/admin-section-page";

export const metadata: Metadata = { title: "Recomandări" };
export default function Page() {
  return <AdminSectionPage sectionId="recommendations" eyebrow="Recommendation intelligence" title="Recomandări" description="Urmărește distribuția rezultatelor, alternativele și feedback-ul de potrivire." />;
}

