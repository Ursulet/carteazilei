"use server";
import { headers } from "next/headers";
import type { EditorialActionState } from "@/domain/editorial/action-state";
import { toActionState } from "@/domain/editorial/action-state";
import { parseContactFormData, submitContactMessage } from "@/domain/communication/contact-service";
function clientIp(headersList: Headers) { const value = headersList.get("cf-connecting-ip") ?? headersList.get("x-real-ip") ?? headersList.get("x-forwarded-for")?.split(",")[0]?.trim(); return value && /^[0-9a-f.:]+$/i.test(value) ? value : null; }
export async function submitContactAction(_state: EditorialActionState, formData: FormData): Promise<EditorialActionState> { try { const headerList = await headers(); await submitContactMessage(parseContactFormData(formData), { ip: clientIp(headerList), userAgent: headerList.get("user-agent") }); return { status: "idle", message: "Mesajul a fost trimis. Îți mulțumim!" }; } catch (error) { return toActionState(error); } }
