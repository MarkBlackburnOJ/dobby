/**
 * Stamps a per-build id into public/sw.js so every deploy ships a
 * byte-different service worker. Without this the browser never notices a
 * new version from a backgrounded, installed PWA — there is no reload button
 * in standalone mode to force one.
 *
 * On Vercel the commit SHA is the id; locally it's a timestamp. Runs from the
 * "prebuild" npm script.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const swPath = fileURLToPath(new URL("../public/sw.js", import.meta.url));
const id =
  (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 12) ||
  process.env.BUILD_ID ||
  String(Date.now());

const src = readFileSync(swPath, "utf8");
const next = src.replace(/const BUILD_ID = "[^"]*";/, `const BUILD_ID = "${id}";`);

if (next === src) {
  console.warn("stamp-sw: BUILD_ID line not found in public/sw.js — nothing stamped");
} else {
  writeFileSync(swPath, next);
  console.log(`stamp-sw: sw.js build id -> ${id}`);
}
