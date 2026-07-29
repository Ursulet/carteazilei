import type { Metadata } from "next";
import { AdminSectionPage } from "@/components/admin/admin-section-page";

export const metadata: Metadata = { title: "Audit log" };
export default function Page() {
  return <AdminSectionPage sectionId="audit" eyebrow="Trasabilitate" title="Audit log" description="Consultă operațiile editoriale și de securitate fără parole, token-uri sau secrete." />;
}

