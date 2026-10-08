// The wallpaper plugin end to end, in a real Specterm.
//
// Needs a Specterm checkout with its dependencies installed and `vite build`
// run, at SPECTERM_DIR (default: a `specterm` folder next to this repo). The
// plugin is symlinked into a throwaway profile's plugins folder and switched
// on.
//
// Run: npm run build:wallpaper && npm run e2e:wallpaper
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const pluginRoot = path.resolve(import.meta.dirname, "..");
const spectermDir = path.resolve(process.env.SPECTERM_DIR ?? path.join(pluginRoot, "../../specterm"));
if (!fs.existsSync(path.join(spectermDir, "dist", "index.html"))) {
  console.error(`No built Specterm at ${spectermDir}. Set SPECTERM_DIR and run \`npx vite build\` there.`);
  process.exit(2);
}
const { _electron: electron } = createRequire(path.join(spectermDir, "package.json"))("playwright");
const { launchOptions } = await import(pathToFileURL(path.join(spectermDir, "test", "launch.mjs")).href);

const TOGGLE_KEY = process.platform === "darwin" ? "Meta+Shift+J" : "Control+Alt+J";

const started = Date.now();
const log = (...a) => console.log(`[wallpaper ${((Date.now() - started) / 1000).toFixed(1).padStart(5)}s]`, ...a);
const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass });
  log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};
const hard = setTimeout(() => {
  console.error("[wallpaper] HARD TIMEOUT");
  process.exit(2);
}, Number(process.env.E2E_TIMEOUT_MS ?? 120000));
hard.unref();

async function until(what, predicate, { timeout = 10000, poll = 50 } = {}) {
  const deadline = Date.now() + timeout;
  for (;;) {
    let ok = false;
    try {
      ok = await predicate();
    } catch (_) {}
    if (ok) return true;
    if (Date.now() > deadline) {
      log(`timed out after ${timeout}ms waiting for: ${what}`);
      return false;
    }
    await new Promise((r) => setTimeout(r, poll));
  }
}

// --- fixture ---------------------------------------------------------------

const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), "specterm-wallpaper-home-"));
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "specterm-wallpaper-"));
fs.mkdirSync(path.join(userDataDir, "plugins"));
fs.symlinkSync(pluginRoot, path.join(userDataDir, "plugins", "wallpaper"), "dir");
fs.writeFileSync(path.join(userDataDir, "plugins.json"), JSON.stringify({ enabled: { wallpaper: true }, contributions: [] }));
const dataDir = path.join(userDataDir, "plugin-data", "wallpaper");
const stored = () => {
  try {
    return fs.readdirSync(dataDir);
  } catch {
    return [];
  }
};
const shotDir = process.env.E2E_SHOTS ?? fs.mkdtempSync(path.join(os.tmpdir(), "specterm-wallpaper-shots-"));

const layer = (win) =>
  win.evaluate(() => {
    const app = document.querySelector(".app");
    const before = getComputedStyle(app, "::before");
    const pane = document.querySelector(".pane");
    return {
      image: before.backgroundImage,
      filter: before.filter,
      pane: pane ? getComputedStyle(pane).backgroundColor : "",
      video: (() => {
        const v = document.querySelector(".specterm-wallpaper-video");
        return v ? { time: v.currentTime, paused: v.paused, fit: getComputedStyle(v).objectFit, z: getComputedStyle(v).zIndex } : null;
      })(),
    };
  });

// --- run -------------------------------------------------------------------

let app;
try {
  app = await electron.launch(launchOptions(spectermDir, userDataDir, { env: { HOME: fakeHome, USERPROFILE: fakeHome } }));
  const win = await app.firstWindow();
  win.on("pageerror", (e) => log("PAGEERROR:", e.message));
  await win.waitForSelector(".xterm", { timeout: 20000 });
  const button = win.locator('.tab-plugin[data-plugin="wallpaper"]');
  check("the wallpaper button is in the tab bar", await until("button", () => button.isVisible(), { timeout: 20000 }));
  check(
    "the renderer module is loaded, with nothing to draw yet",
    await until("style", () => win.evaluate(() => document.querySelector('style[data-specterm="wallpaper"]')?.textContent === ""))
  );
  check("no image, no layer", (await layer(win)).image === "none");

  // 1. The shortcut opens the panel.
  await win.keyboard.press(TOGGLE_KEY);
  const view = win.locator('.plugin-view[data-plugin="wallpaper"]');
  check("the shortcut opens the panel", await until("view", () => view.isVisible()));

  // 2. A picked file: copied by the host, drawn behind the window.
  const picked = path.join(shotDir, "picked.png");
  // A bright picture, so the screenshots show what comes through.
  const drawn = await win.evaluate(() => {
    const c = Object.assign(document.createElement("canvas"), { width: 1200, height: 800 });
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 1200, 800);
    grad.addColorStop(0, "#ff6b6b");
    grad.addColorStop(0.5, "#845ef7");
    grad.addColorStop(1, "#20c997");
    g.fillStyle = grad;
    g.fillRect(0, 0, 1200, 800);
    g.fillStyle = "rgba(255,255,255,0.35)";
    for (let i = 0; i < 12; i++) g.fillRect(100 * i, 60 * i, 140, 140);
    return c.toDataURL("image/png");
  });
  fs.writeFileSync(picked, Buffer.from(drawn.split(",")[1], "base64"));
  await view.locator('input[type="file"]').setInputFiles(picked);
  check("a picked file is drawn behind the window", await until("file", async () => /url\("file:\/\/.*wallpaper-\w+\.png"\)/.test((await layer(win)).image)), (await layer(win)).image);
  check(
    "and kept by the host in its data folder",
    stored().length === 1 && fs.readFileSync(path.join(dataDir, stored()[0])).equals(fs.readFileSync(picked)),
    stored().join(",")
  );
  check("the panel shows it", await until("preview", () => view.locator(".wp-preview img").isVisible()));
  const pane = (await layer(win)).pane;
  check("terminal panes let it through", /rgba?\(.*, 0\.8\)|color\(srgb .* \/ 0\.8\)/.test(pane), pane);
  await win.screenshot({ path: path.join(shotDir, "file.png") });

  // 3. The sliders and the size change the layer.
  const blur = view.locator(".wp-slider", { hasText: "Blur" }).locator("input");
  await blur.fill("8");
  check("blur reaches the layer", await until("blur", async () => (await layer(win)).filter === "blur(8px)"));
  const opacity = view.locator(".wp-slider", { hasText: "Terminal background" }).locator("input");
  await opacity.fill("40");
  check("terminal background reaches the panes", await until("0.4", async () => /0\.4\)/.test((await layer(win)).pane)), (await layer(win)).pane);
  await win.screenshot({ path: path.join(shotDir, "blur.png") });

  // 4. Reloading the window draws the same wallpaper from storage and disk.
  await win.reload();
  await win.waitForSelector(".xterm", { timeout: 20000 });
  check("a reload draws it again", await until("reload", async () => /url\("file:/.test((await layer(win)).image), { timeout: 15000 }));

  // 5. A video: recorded here from a canvas, played under the window.
  if (!(await view.isVisible())) await win.keyboard.press(TOGGLE_KEY);
  await until("view again", () => view.isVisible());
  const recorded = await win.evaluate(async () => {
    const c = Object.assign(document.createElement("canvas"), { width: 640, height: 360 });
    const g = c.getContext("2d");
    const rec = new MediaRecorder(c.captureStream(30), { mimeType: "video/webm" });
    const chunks = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    const done = new Promise((r) => (rec.onstop = r));
    rec.start();
    const t0 = performance.now();
    await new Promise((resolve) => {
      const draw = () => {
        const t = (performance.now() - t0) / 1000;
        g.fillStyle = `hsl(${(t * 240) % 360} 80% 55%)`;
        g.fillRect(0, 0, 640, 360);
        g.fillStyle = "#fff";
        g.fillRect(((t * 400) % 700) - 60, 140, 80, 80);
        if (t < 2) requestAnimationFrame(draw);
        else resolve();
      };
      draw();
    });
    rec.stop();
    await done;
    const buf = await new Blob(chunks, { type: "video/webm" }).arrayBuffer();
    let s = "";
    for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
    return btoa(s);
  });
  const clip = path.join(shotDir, "clip.webm");
  fs.writeFileSync(clip, Buffer.from(recorded, "base64"));
  await view.locator('input[type="file"]').setInputFiles(clip);
  check("a picked video plays under the window", await until("video", async () => {
    const v = (await layer(win)).video;
    return v && !v.paused && v.time > 0.2;
  }, { timeout: 15000 }), JSON.stringify((await layer(win)).video));
  const vl = await layer(win);
  check("under the dimming, filling the window", vl.video?.fit === "cover" && vl.video?.z === "-2" && vl.image.startsWith("linear-gradient") && !vl.image.includes("url("), JSON.stringify(vl));
  check("the old picture is gone from disk", stored().length === 1 && stored()[0].endsWith(".webm"), stored().join(","));
  check("the panel previews the video", await until("preview video", () => view.locator(".wp-preview video").isVisible()));
  await new Promise((r) => setTimeout(r, 700));
  await win.screenshot({ path: path.join(shotDir, "video.png") });

  // 6. A link: refused when not http(s), used as is otherwise.
  if (!(await view.isVisible())) await win.keyboard.press(TOGGLE_KEY);
  await until("view again", () => view.isVisible());
  const urlInput = view.locator(".wp-input");
  await urlInput.fill("file:///etc/hostname");
  await view.locator('button[type="submit"]').click();
  check("a file: link is refused", await until("error", () => view.locator(".wp-error").isVisible()));
  await urlInput.fill("https://example.com/wall.jpg");
  await view.locator('button[type="submit"]').click();
  check(
    "an https link is used",
    await until("url", async () => (await layer(win)).image.includes('url("https://example.com/wall.jpg")')),
    (await layer(win)).image
  );

  // 7. Remove takes it all away.
  await view.locator(".wp-btn", { hasText: "Remove" }).click();
  check("Remove clears the layer", await until("none", async () => (await layer(win)).image === "none"));
  const paneAfter = (await layer(win)).pane;
  check("and the panes are opaque again", !/0\.\d+\)/.test(paneAfter), paneAfter);
  check("no video left playing", (await layer(win)).video === null);
} catch (err) {
  check(`no exception (${err.message})`, false);
} finally {
  await app?.close().catch(() => {});
}

log(`screenshots in ${shotDir}`);
const failed = results.filter((r) => !r.pass).length;
console.log(`===== ${results.length - failed} passed, ${failed} failed =====`);
process.exit(failed ? 1 : 0);
