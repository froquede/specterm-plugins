// The settings (src/settings.ts) and the file the host keeps (src/image.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DEFAULTS, MAX_BLUR, buildCss, isImageUrl, parseSettings } from "../src/settings.ts";
import { parseDataUrl, readImage, removeImage, writeImage } from "../src/image.ts";

const PNG = "data:image/png;base64," + Buffer.from("not really a png").toString("base64");

test("anything in storage reads as settings, clamped", () => {
  assert.deepEqual(parseSettings(undefined), DEFAULTS);
  assert.deepEqual(parseSettings("junk"), DEFAULTS);
  const s = parseSettings({ source: "file", paneOpacity: 140, dim: -3, blur: 999, fit: "stretch", revision: 2.4 });
  assert.equal(s.source, "file");
  assert.equal(s.paneOpacity, 100);
  assert.equal(s.dim, 0);
  assert.equal(s.blur, MAX_BLUR);
  assert.equal(s.fit, "cover");
  assert.equal(s.revision, 2);
});

test("a link source needs an http(s) link", () => {
  assert.equal(parseSettings({ source: "url", url: " https://x.dev/a.jpg " }).source, "url");
  assert.equal(parseSettings({ source: "url", url: "file:///etc/passwd" }).source, null);
  assert.equal(parseSettings({ source: "url", url: "javascript:alert(1)" }).source, null);
  assert.equal(isImageUrl("http://x/y.png"), true);
  assert.equal(isImageUrl("data:image/png;base64,AA"), false);
});

test("the stylesheet: nothing without an image, the layer and translucent panes with one", () => {
  const s = parseSettings({ source: "url", url: "https://x.dev/a.jpg", paneOpacity: 70, dim: 25, blur: 6, fit: "tile" });
  assert.equal(buildCss(s, null), "");
  const css = buildCss(s, s.url);
  assert.match(css, /\.app::before/);
  assert.match(css, /url\("https:\/\/x\.dev\/a\.jpg"\)/);
  assert.match(css, /filter: blur\(6px\)/);
  assert.match(css, /inset: -12px/);
  assert.match(css, /overflow: hidden/);
  assert.match(css, /background-repeat: no-repeat, repeat/);
  assert.match(css, /rgba\(0, 0, 0, 0\.25\)/);
  assert.match(css, /color-mix\(in srgb, var\(--bg\) 70%, transparent\)/);
  assert.doesNotMatch(buildCss({ ...s, blur: 0 }, s.url), /filter|overflow/);
});

test("a link can't close the url() and add rules", () => {
  const css = buildCss(parseSettings({}), 'https://x.dev/a.jpg"); } body { display: none; } x { y: url("');
  assert.equal((css.match(/"/g) ?? []).length, 4, 'only the quotes buildCss writes (content: "" and url("…"))');
  assert.match(css, /a\.jpg\\22 \)/, "the link's quote is escaped");
});

test("data: URLs: only images, never empty", () => {
  assert.equal(parseDataUrl(PNG).type, "image/png");
  assert.throws(() => parseDataUrl("data:text/html;base64,PGI+"), /supported image/);
  assert.throws(() => parseDataUrl("data:image/png;base64,"), /empty/);
  assert.throws(() => parseDataUrl(42), /data: URL/);
});

test("the image round-trips through the folder and is removed cleanly", async () => {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "wallpaper-")), "data");
  assert.equal(await readImage(dir), null);
  await writeImage(dir, PNG);
  assert.equal(await readImage(dir), PNG);
  assert.deepEqual(fs.readdirSync(dir).sort(), ["wallpaper", "wallpaper.type"], "no temp file left");
  await removeImage(dir);
  assert.equal(await readImage(dir), null);
  assert.deepEqual(fs.readdirSync(dir), []);
});
