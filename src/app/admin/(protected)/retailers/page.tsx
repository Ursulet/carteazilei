import type { Metadata } from "next";
import { AdminSectionPage } from "@/components/admin/admin-section-page";

export const metadata: Metadata = { title: "Retaileri" };
export default function Page() {
  return <AdminSectionPage sectionId="retailers" eyebrow="Monetizare" title="Retaileri" description="Administrează retailerii, ofertele și disclosure-ul de afiliere separat de recomandări." />;
}

