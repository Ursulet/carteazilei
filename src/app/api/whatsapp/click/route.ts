import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { whatsappClicks } from "@/db/schema";
import { getPublicSiteSettings } from "@/domain/settings/public-settings-service";
import { cookieConsentName, hasAnalyticsConsent } from "@/lib/privacy/consent";
const schema = z.object({ sourcePath: z.string().startsWith("/").max(500) });
export async function POST(request: Request) { const [cookieStore, settings] = await Promise.all([cookies(), getPublicSiteSettings()]); if (!settings.featureWhatsApp || !settings.whatsappTrackingEnabled || !hasAnalyticsConsent(cookieStore.get(cookieConsentName)?.value)) return NextResponse.json({ ok: true }); const body = await request.json().catch(() => null); const parsed = schema.safeParse(body); if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 }); const headerList = await headers(); const device = /mobile|android|iphone/i.test(headerList.get("user-agent") ?? "") ? "mobile" : "desktop"; await getDb().insert(whatsappClicks).values({ sourcePath: parsed.data.sourcePath, device }); return NextResponse.json({ ok: true }); }
