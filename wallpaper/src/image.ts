// The picked image on disk: one file in the plugin's data folder, replaced in
// one rename so a window reading it never sees half of it. The panel sends it
// as a data: URL (what FileReader gives) and every window reads it back the
// same way.

import fs from "node:fs";
import path from "node:path";
import { MAX_BYTES } from "./settings.ts";

export const FILE_NAME = "wallpaper";

const TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

export function parseDataUrl(dataUrl: unknown): { type: string; bytes: Buffer } {
  if (typeof dataUrl !== "string") throw new Error("expected a data: URL");
  const m = /^data:([^;,]+);base64,(.*)$/s.exec(dataUrl);
  if (!m || !TYPES[m[1]]) throw new Error("not a supported image (PNG, JPEG, WebP, GIF, AVIF or SVG)");
  const bytes = Buffer.from(m[2], "base64");
  if (bytes.length === 0) throw new Error("the image is empty");
  if (bytes.length > MAX_BYTES) throw new Error(`the image is over ${MAX_BYTES / 1024 / 1024} MB`);
  return { type: m[1], bytes };
}

// The type rides in a sidecar so the read needs no sniffing.
export async function writeImage(dir: string, dataUrl: unknown): Promise<void> {
  const { type, bytes } = parseDataUrl(dataUrl);
  await fs.promises.mkdir(dir, { recursive: true });
  const file = path.join(dir, FILE_NAME);
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.promises.writeFile(tmp, bytes);
  await fs.promises.writeFile(`${file}.type`, type);
  await fs.promises.rename(tmp, file);
}

export async function readImage(dir: string): Promise<string | null> {
  const file = path.join(dir, FILE_NAME);
  try {
    const [bytes, type] = await Promise.all([
      fs.promises.readFile(file),
      fs.promises.readFile(`${file}.type`, "utf8"),
    ]);
    if (!TYPES[type.trim()]) return null;
    return `data:${type.trim()};base64,${bytes.toString("base64")}`;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function removeImage(dir: string): Promise<void> {
  const file = path.join(dir, FILE_NAME);
  await Promise.all([fs.promises.rm(file, { force: true }), fs.promises.rm(`${file}.type`, { force: true })]);
}
