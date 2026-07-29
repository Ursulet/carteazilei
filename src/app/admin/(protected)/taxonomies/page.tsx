import type { Metadata } from "next";
import { AdminSectionPage } from "@/components/admin/admin-section-page";

export const metadata: Metadata = { title: "Taxonomii" };
export default function Page() {
  return <AdminSectionPage sectionId="taxonomies" eyebrow="Sistem editorial" title="Taxonomii" description="Controlează genurile, temele, nevoile, audiențele și trăsăturile de lectură." />;
}

