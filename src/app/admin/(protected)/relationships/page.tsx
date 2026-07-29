import type { Metadata } from "next";
import { AdminSectionPage } from "@/components/admin/admin-section-page";

export const metadata: Metadata = { title: "Relații între cărți" };
export default function Page() {
  return <AdminSectionPage sectionId="relationships" eyebrow="Book intelligence" title="Relații între cărți" description="Aprobă similarități și continuări numai când există o explicație editorială publică." />;
}

