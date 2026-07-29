import type { Metadata } from "next";

import { DailyFeatureViews } from "@/components/admin/daily-feature-views";
import { AdminPageHeader, EmptyState } from "@/components/admin/editorial-ui";
import { getAdminDailyFeatures } from "@/db/queries/admin-editorial";
import { requireSectionAccess } from "@/lib/auth/principal";

import { deleteDailyFeatureAction } from "./actions";

export const metadata: Metadata = { title: "Cartea Zilei" };
export default async function DailyFeaturesPage() { await requireSectionAccess("daily-features"); const rows = await getAdminDailyFeatures(); const serialized = rows.map((row) => ({ ...row, updatedAt: row.updatedAt.toISOString() })); return <><AdminPageHeader eyebrow="Calendar editorial" title="Cartea Zilei" description="O selecție explicită pentru fiecare dată, interpretată în fusul Europe/Bucharest." action={{ href: "/admin/daily-features/new", label: "Programează selecție" }} />{rows.length === 0 ? <EmptyState>Calendarul este gol. Programează prima selecție editorială.</EmptyState> : <DailyFeatureViews rows={serialized} deleteAction={deleteDailyFeatureAction} />}</>; }
