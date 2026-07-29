import type { Metadata } from "next";
import { AdminSectionPage } from "@/components/admin/admin-section-page";

export const metadata: Metadata = { title: "Setări" };
export default function Page() {
  return <AdminSectionPage sectionId="settings" eyebrow="Configurare" title="Setări" description="Configurarea operațională sensibilă este disponibilă exclusiv administratorilor." />;
}

