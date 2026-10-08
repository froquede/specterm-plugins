// The wallpaper's host side, run in Specterm's plugin host process: it keeps
// the picked image on disk, since plugin storage is too small to hold one.
// Started only when a window first asks for the image ("activation": "view"),
// so a launch with no picked file runs none of it.

import type { PluginHostContext } from "../../shared/specterm-plugin-api.ts";
import { readImage, removeImage, writeImage } from "./image.ts";

export function activate(ctx: PluginHostContext) {
  ctx.handle("get", () => readImage(ctx.storagePath));
  ctx.handle("set", (dataUrl: unknown) => writeImage(ctx.storagePath, dataUrl));
  ctx.handle("clear", () => removeImage(ctx.storagePath));
}
