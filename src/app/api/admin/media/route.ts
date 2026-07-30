import { NextResponse } from "next/server";
import { uploadMedia } from "@/domain/editorial/media-service";
import { getAdminMedia } from "@/db/queries/admin-media";
import { getInternalPrincipal } from "@/lib/auth/principal";
import { hasPermission } from "@/lib/auth/permissions";
export async function POST(request: Request) { const principal = await getInternalPrincipal(); if (!principal || !hasPermission(principal.permissions, "media.manage", principal.isSuperAdmin)) return NextResponse.json({ ok: false, message: "Acces interzis." }, { status: 403 }); try { const id = await uploadMedia(await request.formData(), principal.id); const asset = (await getAdminMedia()).find((item) => item.id === id); return NextResponse.json({ ok: true, asset: asset ? { id: asset.id, altText: asset.altText } : { id, altText: "Imagine nouă" } }); } catch (error) { return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Încărcarea a eșuat." }, { status: 400 }); } }
