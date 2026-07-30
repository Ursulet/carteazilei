import "server-only";

export class ImageInspectionUnavailableError extends Error {
  constructor(cause: unknown) {
    super("Image inspection runtime is unavailable.", { cause });
    this.name = "ImageInspectionUnavailableError";
  }
}

export async function inspectImage(bytes: Uint8Array) {
  let sharp: typeof import("sharp").default;
  try {
    ({ default: sharp } = await import("sharp"));
  } catch (error) {
    throw new ImageInspectionUnavailableError(error);
  }

  return sharp(bytes, {
    failOn: "warning",
    limitInputPixels: 40_000_000,
  }).metadata();
}
