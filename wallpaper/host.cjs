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
var MAX_BYTES = 25 * 1024 * 1024;

// wallpaper/src/image.ts
var FILE_NAME = "wallpaper";
var TYPES = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg"
};
function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== "string") throw new Error("expected a data: URL");
  const m = /^data:([^;,]+);base64,(.*)$/s.exec(dataUrl);
  if (!m || !TYPES[m[1]]) throw new Error("not a supported image (PNG, JPEG, WebP, GIF, AVIF or SVG)");
  const bytes = Buffer.from(m[2], "base64");
  if (bytes.length === 0) throw new Error("the image is empty");
  if (bytes.length > MAX_BYTES) throw new Error(`the image is over ${MAX_BYTES / 1024 / 1024} MB`);
  return { type: m[1], bytes };
}
async function writeImage(dir, dataUrl) {
  const { type, bytes } = parseDataUrl(dataUrl);
  await import_node_fs.default.promises.mkdir(dir, { recursive: true });
  const file = import_node_path.default.join(dir, FILE_NAME);
  const tmp = `${file}.${process.pid}.tmp`;
  await import_node_fs.default.promises.writeFile(tmp, bytes);
  await import_node_fs.default.promises.writeFile(`${file}.type`, type);
  await import_node_fs.default.promises.rename(tmp, file);
}
async function readImage(dir) {
  const file = import_node_path.default.join(dir, FILE_NAME);
  try {
    const [bytes, type] = await Promise.all([
      import_node_fs.default.promises.readFile(file),
      import_node_fs.default.promises.readFile(`${file}.type`, "utf8")
    ]);
    if (!TYPES[type.trim()]) return null;
    return `data:${type.trim()};base64,${bytes.toString("base64")}`;
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}
async function removeImage(dir) {
  const file = import_node_path.default.join(dir, FILE_NAME);
  await Promise.all([import_node_fs.default.promises.rm(file, { force: true }), import_node_fs.default.promises.rm(`${file}.type`, { force: true })]);
}

// wallpaper/src/host.ts
function activate(ctx) {
  ctx.handle("get", () => readImage(ctx.storagePath));
  ctx.handle("set", (dataUrl) => writeImage(ctx.storagePath, dataUrl));
  ctx.handle("clear", () => removeImage(ctx.storagePath));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate
});
