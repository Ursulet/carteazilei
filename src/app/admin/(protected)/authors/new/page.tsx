import type { Metadata } from "next";

import { AuthorForm } from "@/components/admin/author-form";
import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { requireSectionAccess } from "@/lib/auth/principal";

import { createAuthorAction } from "../actions";

export const metadata: Metadata = { title: "Autor nou" };
export default async function NewAuthorPage() { await requireSectionAccess("authors"); return <><AdminPageHeader eyebrow="Catalog" title="Autor nou" description="Creează profilul public și păstrează separat dovezile editoriale." /><AuthorForm action={createAuthorAction} /></>; }
