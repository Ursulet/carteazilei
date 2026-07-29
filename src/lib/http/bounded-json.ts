const defaultMaximumBytes = 32 * 1_024;

export type BoundedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413 };

/**
 * Citește JSON din endpointurile publice fără a accepta payloaduri nelimitate.
 * Verificarea fluxului rămâne activă și când proxy-ul nu trimite Content-Length.
 */
export async function readBoundedJson(
  request: Request,
  maximumBytes = defaultMaximumBytes,
): Promise<BoundedJsonResult> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const length = Number(declaredLength);
    if (!Number.isSafeInteger(length) || length < 0) {
      return { ok: false, status: 400 };
    }
    if (length > maximumBytes) return { ok: false, status: 413 };
  }

  if (!request.body) return { ok: false, status: 400 };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maximumBytes) {
        await reader.cancel();
        return { ok: false, status: 413 };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400 };
  }

  if (totalBytes === 0) return { ok: false, status: 400 };

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(body)) };
  } catch {
    return { ok: false, status: 400 };
  }
}
