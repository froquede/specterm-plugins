"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// wallpaper/src/host.ts
var host_exports = {};
__export(host_exports, {
  activate: () => activate
});
module.exports = __toCommonJS(host_exports);

// wallpaper/src/image.ts
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);

// wallpaper/src/settings.ts
var MAX_BYTES = 300 * 1024 * 1024;
var TYPES = {
  "image/png": { ext: "png", media: "image" },
  "image/jpeg": { ext: "jpg", media: "image" },
  "image/webp": { ext: "webp", media: "image" },
  "image/gif": { ext: "gif", media: "image" },
  "image/avif": { ext: "avif", media: "image" },
  "image/svg+xml": { ext: "svg", media: "image" },
  "video/mp4": { ext: "mp4", media: "video" },
  "video/webm": { ext: "webm", media: "video" }
};

// wallpaper/src/image.ts
var PREFIX = "wallpaper-";
function toBytes(data) {
  if (data instanceof Uint8Array) return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  throw new Error("expected the file's bytes");
}
async function writeWallpaper(dir, type, data) {
  const kind = typeof type === "string" ? TYPES[type] : void 0;
  if (!kind) throw new Error("not a supported file (PNG, JPEG, WebP, GIF, AVIF, SVG, MP4 or WebM)");
  const bytes = toBytes(data);
  if (bytes.length === 0) throw new Error("the file is empty");
  if (bytes.length > MAX_BYTES) throw new Error(`the file is over ${MAX_BYTES / 1024 / 1024} MB`);
  await import_node_fs.default.promises.mkdir(dir, { recursive: true });
  const file = import_node_path.default.join(dir, `${PREFIX}${Date.now().toString(36)}.${kind.ext}`);
  const tmp = `${file}.${process.pid}.tmp`;
  await import_node_fs.default.promises.writeFile(tmp, bytes);
  await import_node_fs.default.promises.rename(tmp, file);
  await removeWallpapers(dir, file);
  return { path: file, media: kind.media };
}
async function removeWallpapers(dir, keep) {
  let names;
  try {
    names = await import_node_fs.default.promises.readdir(dir);
  } catch (err) {
    if (err.code === "ENOENT") return;
    throw err;
  }
  await Promise.all(
    names.filter((n) => n.startsWith(PREFIX) && import_node_path.default.join(dir, n) !== keep).map((n) => import_node_fs.default.promises.rm(import_node_path.default.join(dir, n), { force: true }))
  );
}

// wallpaper/src/host.ts
function activate(ctx) {
  ctx.handle("set", (type, bytes) => writeWallpaper(ctx.storagePath, type, bytes));
  ctx.handle("clear", () => removeWallpapers(ctx.storagePath));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate
});
