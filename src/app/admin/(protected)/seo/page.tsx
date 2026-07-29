import type { Metadata } from "next";
import { AdminSectionPage } from "@/components/admin/admin-section-page";

export const metadata: Metadata = { title: "SEO" };
export default function Page() {
  return <AdminSectionPage sectionId="seo" eyebrow="Vizibilitate organică" title="SEO" description="Revizuiește indexarea, metadata și pragurile editoriale înainte de publicare." />;
}

