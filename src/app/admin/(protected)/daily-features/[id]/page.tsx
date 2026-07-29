import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DailyFeatureForm } from "@/components/admin/daily-feature-form";
import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { getAdminDailyFeature, getDailyFeatureOptions } from "@/db/queries/admin-editorial";
import { requireSectionAccess } from "@/lib/auth/principal";

import { updateDailyFeatureAction } from "../actions";

export const metadata: Metadata = { title: "Editează Cartea Zilei" };
export default async function EditDailyFeaturePage({ params }: { params: Promise<{ id: string }> }) { await requireSectionAccess("daily-features"); const { id } = await params; const [record, options] = await Promise.all([getAdminDailyFeature(id), getDailyFeatureOptions()]); if (!record) notFound(); return <><AdminPageHeader eyebrow="Calendar editorial" title={record.headline || record.featureDate} description="Editează selecția calendaristică și contextul ei editorial." /><DailyFeatureForm action={updateDailyFeatureAction.bind(null, id)} editing options={options} values={{ featureDate: record.featureDate, bookId: record.bookId, editorId: record.editorId, headline: record.headline, whyToday: record.whyToday, audienceNote: record.audienceNote, caveat: record.caveat, status: record.status }} /></>; }
