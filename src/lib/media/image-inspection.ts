import "server-only";

import sharp from "sharp";

export async function inspectImage(bytes: Uint8Array) {
  return sharp(bytes, {
    failOn: "warning",
    limitInputPixels: 40_000_000,
  }).metadata();
}
