import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { EditorialServiceError } from "@/domain/editorial/action-state";
import { assignBookCoverByImportKey } from "@/domain/editorial/book-service";
import { findMediaByImportKey, normalizeMediaImportKey, uploadMedia } from "@/domain/editorial/media-service";
import { hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/principal";
import { readMediaObject } from "@/lib/storage/media-storage";

export async function POST(request: Request) {
  const principal = await requirePermission("media.manage");
  await requirePermission("books.create");
  const canUpdateBooks = hasPermission(
    principal.permissions,
    "books.update",
    principal.isSuperAdmin,
  );

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ message: "Fișierul lipsește." }, { status: 400 });
    }
    const identifier = normalizeMediaImportKey(String(formData.get("importKey") || file.name));
    if (!identifier) return NextResponse.json({ message: "Identificatorul imaginii nu este valid." }, { status: 400 });

    const existing = await findMediaByImportKey(identifier);
    if (existing) {
      const [incomingBytes, existingBytes] = await Promise.all([
        file.arrayBuffer().then((buffer) => new Uint8Array(buffer)),
        readMediaObject(existing.storageKey),
      ]);
      const incomingHash = createHash("sha256").update(incomingBytes).digest("hex");
      const existingHash = createHash("sha256").update(existingBytes).digest("hex");
      if (incomingHash !== existingHash) {
        return NextResponse.json({ message: `Identificatorul „${identifier}” aparține deja unei alte imagini.` }, { status: 409 });
      }
      const bookId = canUpdateBooks
        ? await assignBookCoverByImportKey(identifier, existing.id, principal.id)
        : null;
      return NextResponse.json({ id: existing.id, identifier, reused: true, bookId });
    }

    formData.set("importKey", identifier);
    if (!String(formData.get("title") || "").trim()) formData.set("title", `Copertă ${identifier}`);
    if (!String(formData.get("altText") || "").trim()) formData.set("altText", `Coperta cărții ${identifier}`);
    if (!String(formData.get("source") || "").trim()) formData.set("source", "Import bulk");
    const id = await uploadMedia(formData, principal.id);
    const bookId = canUpdateBooks
      ? await assignBookCoverByImportKey(identifier, id, principal.id)
      : null;
    return NextResponse.json({ id, identifier, reused: false, bookId });
  } catch (error) {
    const message = error instanceof EditorialServiceError
      ? error.message
      : "Imaginea nu a putut fi încărcată.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
