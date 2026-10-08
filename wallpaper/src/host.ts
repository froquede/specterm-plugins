// The wallpaper's host side, run in Specterm's plugin host process: it copies
// a picked file into the plugin's data folder, since plugin storage is too
// small to hold one. Windows read the copy straight from disk, so this starts
// only when a file is picked or removed ("activation": "view").

import type { PluginHostContext } from "../../shared/specterm-plugin-api.ts";
import { removeWallpapers, writeWallpaper } from "./image.ts";

export function activate(ctx: PluginHostContext) {
  ctx.handle("set", (type: unknown, bytes: unknown) => writeWallpaper(ctx.storagePath, type, bytes));
  ctx.handle("clear", () => removeWallpapers(ctx.storagePath));
}
