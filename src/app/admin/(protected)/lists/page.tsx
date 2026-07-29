import type { Metadata } from "next";
import { AdminSectionPage } from "@/components/admin/admin-section-page";

export const metadata: Metadata = { title: "Liste editoriale" };
export default function Page() {
  return <AdminSectionPage sectionId="lists" eyebrow="Conținut" title="Liste editoriale" description="Construiește liste, hub-uri și ghiduri cu metodologie și motiv pentru fiecare selecție." />;
}

