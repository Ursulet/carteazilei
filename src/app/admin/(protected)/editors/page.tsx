import type { Metadata } from "next";
import { AdminSectionPage } from "@/components/admin/admin-section-page";

export const metadata: Metadata = { title: "Utilizatori și editori" };
export default function Page() {
  return <AdminSectionPage sectionId="editors" eyebrow="Acces intern" title="Utilizatori și editori" description="Administrează rolurile, accesul și profilele publice ale echipei editoriale." />;
}

