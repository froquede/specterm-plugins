// The picked file on disk: one file in the plugin's data folder, named fresh
// for every pick so no window ever shows a cached copy of the one before, and
// written under a temporary name then renamed, so a window never reads half
// of it. The panel sends the bytes; every window then loads the file by its
// path (see settings.ts, fileUrl).

import fs from "node:fs";
import path from "node:path";
import { MAX_BYTES, TYPES, type Media } from "./settings.ts";

const PREFIX = "wallpaper-";

export interface Stored {
  path: string;
  media: Media;
}

function toBytes(data: unknown): Buffer {
  if (data instanceof Uint8Array) return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  throw new Error("expected the file's bytes");
}

export async function writeWallpaper(dir: string, type: unknown, data: unknown): Promise<Stored> {
  const kind = typeof type === "string" ? TYPES[type] : undefined;
  if (!kind) throw new Error("not a supported file (PNG, JPEG, WebP, GIF, AVIF, SVG, MP4 or WebM)");
  const bytes = toBytes(data);
  if (bytes.length === 0) throw new Error("the file is empty");
  if (bytes.length > MAX_BYTES) throw new Error(`the file is over ${MAX_BYTES / 1024 / 1024} MB`);
  await fs.promises.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${PREFIX}${Date.now().toString(36)}.${kind.ext}`);
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.promises.writeFile(tmp, bytes);
  await fs.promises.rename(tmp, file);
  await removeWallpapers(dir, file);
  return { path: file, media: kind.media };
}

/** Every stored file but `keep`. */
export async function removeWallpapers(dir: string, keep?: string): Promise<void> {
  let names: string[];
  try {
    names = await fs.promises.readdir(dir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return;
    throw err;
  }
  await Promise.all(
    names
      .filter((n) => n.startsWith(PREFIX) && path.join(dir, n) !== keep)
      .map((n) => fs.promises.rm(path.join(dir, n), { force: true }))
  );
}
