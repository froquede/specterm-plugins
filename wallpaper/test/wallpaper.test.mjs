// The settings (src/settings.ts) and the files the host keeps (src/image.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  DEFAULTS,
  MAX_BLUR,
  VIDEO_CLASS,
  buildCss,
  fileUrl,
  isVideoUrl,
  isWebUrl,
  parseSettings,
  wallpaperSource,
} from "../src/settings.ts";
import { removeWallpapers, writeWallpaper } from "../src/image.ts";

const bytes = new Uint8Array(Buffer.from("not really a picture"));
const tmpDir = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), "wallpaper-")), "data");

test("anything in storage reads as settings, clamped", () => {
  assert.deepEqual(parseSettings(undefined), DEFAULTS);
  assert.deepEqual(parseSettings("junk"), DEFAULTS);
  const s = parseSettings({ source: "file", filePath: "/x/w.mp4", fileMedia: "video", paneOpacity: 140, dim: -3, blur: 999, fit: "stretch" });
  assert.equal(s.source, "file");
  assert.equal(s.fileMedia, "video");
  assert.equal(s.paneOpacity, 100);
  assert.equal(s.dim, 0);
  assert.equal(s.blur, MAX_BLUR);
  assert.equal(s.fit, "cover");
  assert.equal(parseSettings({ source: "file" }).source, null, "a file source needs its path");
});

test("a link source needs an http(s) link; its kind comes from its extension", () => {
  assert.equal(parseSettings({ source: "url", url: " https://x.dev/a.jpg " }).source, "url");
  assert.equal(parseSettings({ source: "url", url: "file:///etc/passwd" }).source, null);
  assert.equal(parseSettings({ source: "url", url: "javascript:alert(1)" }).source, null);
  assert.equal(isWebUrl("data:image/png;base64,AA"), false);
  assert.equal(isVideoUrl("https://x.dev/loop.webm?t=1"), true);
  assert.equal(isVideoUrl("https://x.dev/still.png"), false);
  assert.deepEqual(wallpaperSource(parseSettings({ source: "url", url: "https://x.dev/v.MP4" })), {
    url: "https://x.dev/v.MP4",
    media: "video",
  });
});

test("file URLs for POSIX and Windows paths", () => {
  assert.equal(fileUrl("/home/me/my wall#1.mp4"), "file:///home/me/my%20wall%231.mp4");
  assert.equal(fileUrl("C:\\Users\\me\\wall.webm"), "file:///C:/Users/me/wall.webm");
});

test("an image: the layer under the window and translucent panes", () => {
  const s = parseSettings({ paneOpacity: 70, dim: 25, blur: 6, fit: "tile" });
  assert.equal(buildCss(s, null), "");
  const css = buildCss(s, { url: "https://x.dev/a.jpg", media: "image" });
  assert.match(css, /\.app::before/);
  assert.match(css, /url\("https:\/\/x\.dev\/a\.jpg"\)/);
  assert.match(css, /filter: blur\(6px\)/);
  assert.match(css, /inset: -12px/);
  assert.match(css, /overflow: hidden/);
  assert.match(css, /background-repeat: no-repeat, repeat/);
  assert.match(css, /rgba\(0, 0, 0, 0\.25\)/);
  assert.match(css, /\.pane:not\(\.pane-browser\) \{ background: color-mix\(in srgb, var\(--bg\) 70%, transparent\)/);
  assert.doesNotMatch(buildCss({ ...s, blur: 0 }, { url: "https://x.dev/a.jpg", media: "image" }), /filter|overflow/);
});

test("a video: the <video> under the dimming, never tiled", () => {
  const s = parseSettings({ dim: 40, blur: 5, fit: "tile" });
  const css = buildCss(s, { url: "file:///w.mp4", media: "video" });
  assert.match(css, new RegExp(`\\.${VIDEO_CLASS} \\{`));
  assert.match(css, /object-fit: cover/);
  assert.match(css, /width: calc\(100% \+ 20px\)/);
  assert.match(css, /z-index: -2/);
  assert.doesNotMatch(css, /url\(/, "the video is an element, not a background");
  const fitted = buildCss({ ...s, fit: "contain", blur: 0 }, { url: "file:///w.mp4", media: "video" });
  assert.match(fitted, /object-fit: contain/);
  assert.match(fitted, /width: 100%/);
});

test("a link can't close the url() and add rules", () => {
  const css = buildCss(parseSettings({}), { url: 'https://x.dev/a.jpg"); } body { display: none; } x { y: url("', media: "image" });
  assert.equal((css.match(/"/g) ?? []).length, 4, 'only the quotes buildCss writes (content: "" and url("…"))');
  assert.match(css, /a\.jpg\\22 \)/, "the link's quote is escaped");
});

test("files: only images and videos, never empty", async () => {
  const dir = tmpDir();
  await assert.rejects(writeWallpaper(dir, "text/html", bytes), /supported file/);
  await assert.rejects(writeWallpaper(dir, "video/mp4", new Uint8Array()), /empty/);
  await assert.rejects(writeWallpaper(dir, "video/mp4", "nope"), /bytes/);
});

test("a new file replaces the old one, under a new name, and remove clears it", async () => {
  const dir = tmpDir();
  const first = await writeWallpaper(dir, "image/gif", bytes);
  assert.equal(first.media, "image");
  assert.match(first.path, /wallpaper-\w+\.gif$/);
  assert.deepEqual(fs.readFileSync(first.path), Buffer.from(bytes));
  await new Promise((r) => setTimeout(r, 5));
  const second = await writeWallpaper(dir, "video/webm", bytes);
  assert.equal(second.media, "video");
  assert.notEqual(second.path, first.path);
  assert.deepEqual(fs.readdirSync(dir), [path.basename(second.path)], "the old file and no temp file left");
  await removeWallpapers(dir);
  assert.deepEqual(fs.readdirSync(dir), []);
  await removeWallpapers(path.join(dir, "missing"));
});
