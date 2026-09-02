/**
 * Renders the PWA icons from assets/icon.svg.
 *
 * These PNGs are the only binaries in the repo — everything else, sound
 * included, is synthesized at runtime. Android won't offer to install a site
 * whose manifest points at an SVG, so they have to exist; this script keeps
 * them regenerable from the vector source rather than opaque blobs.
 *
 *   npm run icons
 */

import { readFile } from "node:fs/promises";
import sharp from "sharp";

const SRC = "assets/icon.svg";
const source = await readFile(SRC, "utf8");

await sharp(SRC).resize(192, 192).png().toFile("public/icon-192.png");
await sharp(SRC).resize(512, 512).png().toFile("public/icon-512.png");
await sharp(SRC).resize(180, 180).png().toFile("public/apple-touch-icon.png");

/**
 * Android crops the icon to whatever shape the launcher uses, so the maskable
 * variant keeps the figure inside the central safe zone. We scale the figure
 * alone and leave the background painting the full square — compositing a
 * shrunken copy of the whole icon instead would leave a visible seam where its
 * gradient met the backing.
 */
const SAFE_SCALE = 0.640625; // 328 / 512
const SAFE_INSET = (512 - 512 * SAFE_SCALE) / 2;

const maskable = source.replace(
  /(<rect width="512" height="512" fill="url\(#bg\)"\/>)([\s\S]*?)(<\/svg>)/,
  (_match, background, figure, close) =>
    `${background}<g transform="translate(${SAFE_INSET} ${SAFE_INSET}) scale(${SAFE_SCALE})">${figure}</g>${close}`,
);

if (maskable === source) {
  throw new Error("Could not isolate the figure — has the background rect in icon.svg changed?");
}

await sharp(Buffer.from(maskable)).resize(512, 512).png().toFile("public/icon-maskable-512.png");

console.log("Icons regenerated from", SRC);
