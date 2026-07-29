import type { Metadata } from "next";

import { DailyFeatureForm } from "@/components/admin/daily-feature-form";
import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { getDailyFeatureOptions } from "@/db/queries/admin-editorial";
import { requireSectionAccess } from "@/lib/auth/principal";

import { createDailyFeatureAction } from "../actions";

export const metadata: Metadata = { title: "Programează Cartea Zilei" };
export default async function NewDailyFeaturePage() { await requireSectionAccess("daily-features"); const options = await getDailyFeatureOptions(); return <><AdminPageHeader eyebrow="Calendar editorial" title="Selecție nouă" description="Alege deliberat cartea și data; aplicația respinge automat o dată deja ocupată." /><DailyFeatureForm action={createDailyFeatureAction} options={options} /></>; }
