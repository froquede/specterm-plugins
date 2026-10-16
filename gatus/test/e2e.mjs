// The Gatus plugin end to end, in a real Specterm, against a fake Gatus server
// on localhost whose checks the test fails and recovers.
//
// Needs a Specterm checkout with its dependencies installed and `vite build`
// run, at SPECTERM_DIR (default: a `specterm` folder next to this repo). The
// plugin is symlinked into a throwaway profile's plugins folder and switched
// on.
//
// Run: npm run build:gatus && npm run e2e:gatus
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import http from "node:http";

const pluginRoot = path.resolve(import.meta.dirname, "..");
const spectermDir = path.resolve(process.env.SPECTERM_DIR ?? path.join(pluginRoot, "../../specterm"));
if (!fs.existsSync(path.join(spectermDir, "dist", "index.html"))) {
  console.error(`No built Specterm at ${spectermDir}. Set SPECTERM_DIR and run \`npx vite build\` there.`);
  process.exit(2);
}
const { _electron: electron } = createRequire(path.join(spectermDir, "package.json"))("playwright");
const { launchOptions } = await import(pathToFileURL(path.join(spectermDir, "test", "launch.mjs")).href);

const TOGGLE_KEY = process.platform === "darwin" ? "Meta+Shift+G" : "Control+Alt+G";

const started = Date.now();
const log = (...a) => console.log(`[gatus ${((Date.now() - started) / 1000).toFixed(1).padStart(5)}s]`, ...a);
const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass });
  log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};
const hard = setTimeout(() => {
  console.error("[gatus] HARD TIMEOUT");
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

// --- fake Gatus --------------------------------------------------------------

// Each check's results, oldest first: "x" failed, "." passed. The server
// answers with the last `pageSize` of them, as Gatus does.
const checks = {
  "shop/API": "....",
  "shop/web": "....",
  "blog/API": "....",
  "docs/API": "....",
  "infra/db": "....",
};
const seen = [];
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  seen.push({ path: u.pathname, auth: req.headers.authorization ?? null });
  if (u.pathname !== "/api/v1/endpoints/statuses") return res.writeHead(404).end();
  const n = Number(u.searchParams.get("pageSize") ?? 20);
  const body = Object.entries(checks).map(([id, pattern]) => {
    const [group, name] = id.split("/");
    return {
      key: `${group}_${name}`,
      name,
      group,
      results: [...pattern].slice(-n).map((c) => ({ success: c === ".", timestamp: new Date().toISOString() })),
    };
  });
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const gatusUrl = `http://127.0.0.1:${server.address().port}`;

// --- fixture -----------------------------------------------------------------

const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), "specterm-gatus-home-"));
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "specterm-gatus-"));
fs.mkdirSync(path.join(userDataDir, "plugins"));
fs.symlinkSync(pluginRoot, path.join(userDataDir, "plugins", "gatus"), "dir");
fs.writeFileSync(path.join(userDataDir, "plugins.json"), JSON.stringify({ enabled: { gatus: true }, contributions: [] }));
const dataDir = path.join(userDataDir, "plugin-data", "gatus");

// --- run ---------------------------------------------------------------------

let app;
try {
  app = await electron.launch(launchOptions(spectermDir, userDataDir, { env: { HOME: fakeHome, USERPROFILE: fakeHome } }));
  const win = await app.firstWindow();
  win.on("pageerror", (e) => log("PAGEERROR:", e.message));
  const invoke = (method, ...args) => win.evaluate(([m, a]) => window.specterm.pluginInvoke("gatus", m, a), [method, args]);
  const button = win.locator('.tab-plugin[data-plugin="gatus"]');
  // No badge is no element: read it without waiting for one to appear.
  const badge = async () => {
    const el = button.locator(".tab-icon-count");
    return (await el.count()) ? el.textContent() : null;
  };
  const toast = win.locator('.plugin-toast[data-plugin="gatus"]');
  const toastTitle = async () => {
    const el = toast.locator(".plugin-toast-title");
    return (await el.count()) ? el.textContent() : null;
  };
  const view = win.locator('.plugin-view[data-plugin="gatus"]');
  const closeView = async () => {
    if (await view.isVisible()) await win.keyboard.press(TOGGLE_KEY);
    await until("view closed", async () => (await view.count()) === 0);
  };

  check("the Gatus button is in the tab bar", await until("button", () => button.isVisible(), { timeout: 20000 }));
  await win.waitForSelector(".xterm", { timeout: 20000 });

  // 1. Not set up: the panel asks for an address.
  await win.keyboard.press(TOGGLE_KEY);
  check("the shortcut opens the panel", await until("view", () => view.isVisible()));
  check(
    "unconfigured, it shows the settings",
    await until("form", async () => (await view.locator('input[name="url"]').count()) === 1)
  );

  // 2. Saved from the panel: written for the host only, and polled at once.
  await view.locator('input[name="url"]').fill(gatusUrl);
  await view.locator('input[name="authHeader"]').fill("Bearer s3cret");
  await view.locator('input[name="threshold"]').fill("2");
  await view.locator('button[type="submit"]').click();
  check("saving polls the server", await until("polled", () => seen.length > 0));
  check("with the auth header", seen.at(-1)?.auth === "Bearer s3cret", JSON.stringify(seen.at(-1)));
  const cfgFile = path.join(dataDir, "config.json");
  check(
    "the settings file is readable only by the user",
    process.platform === "win32" || (fs.statSync(cfgFile).mode & 0o777) === 0o600,
    (fs.statSync(cfgFile).mode & 0o777).toString(8)
  );
  const cfg = await invoke("config");
  check("the panel never gets the header back", cfg.hasAuth === true && !("authHeader" in cfg), JSON.stringify(cfg));
  check(
    "all up: the panel says so",
    await until("nothing down", async () => /Nothing down/.test(await view.textContent())),
    await view.textContent()
  );
  await closeView();

  // 3. One failure: listed as failing, no alert.
  checks["shop/web"] = "...x";
  await invoke("poll");
  await new Promise((r) => setTimeout(r, 400));
  check("a single failure shows no toast", !(await toast.isVisible()));
  check("and no badge", (await badge()) === null);
  check("but is listed as failing", (await invoke("snapshot")).quiet.some((c) => c.key === "shop_web"));

  // 4. Failing `threshold` times in a row: a toast and a badge.
  checks["shop/web"] = "..xx";
  await invoke("poll");
  check("a sustained failure toasts", await until("toast", async () => (await toastTitle()) === "shop / web failing"), String(await toastTitle()));
  check("and badges the button", await until("badge", async () => (await badge()) === "1"));

  // 5. Clicking the toast opens the panel on that incident.
  await toast.click();
  // Off the toast's spot: a toast under the pointer stays until it leaves,
  // and the later ones appear right there.
  await win.mouse.move(400, 400);
  check("the toast opens the panel", await until("view", () => view.isVisible()));
  check(
    "with the incident's checks shown",
    await until("expanded", async () => /shop \/ web/.test(await view.locator('[data-incident="check:shop_web"] .gt-checks').textContent()))
  );
  await closeView();

  // 6. Back up: one recovery toast, badge cleared.
  checks["shop/web"] = "..x.";
  await invoke("poll");
  check("a recovery toasts", await until("recovered", async () => (await toastTitle()) === "shop / web recovered"), String(await toastTitle()));
  check("and clears the badge", await until("no badge", async () => (await badge()) === null));

  // 7. The same check down in three groups: one alert, not three.
  for (const g of ["shop", "blog", "docs"]) checks[`${g}/API`] = "..xx";
  await invoke("poll");
  check("one outage is one toast", await until("bundled", async () => (await toastTitle()) === "API failing in 3 groups"), String(await toastTitle()));
  check("with nothing else counted", (await toast.locator(".plugin-toast-more").count()) === 0);
  check("and a badge of 1", await until("badge 1", async () => (await badge()) === "1"));

  // 8. Polled again with nothing new: no toast.
  await until("toast gone", async () => !(await toast.isVisible()), { timeout: 8000 });
  await invoke("poll");
  await new Promise((r) => setTimeout(r, 400));
  check("an alert already shown is not shown again", !(await toast.isVisible()));

  // 9. A restart keeps it alerted, without a new toast.
  await app.close();
  app = await electron.launch(launchOptions(spectermDir, userDataDir, { env: { HOME: fakeHome, USERPROFILE: fakeHome } }));
  const win2 = await app.firstWindow();
  const button2 = win2.locator('.tab-plugin[data-plugin="gatus"]');
  await until("button again", () => button2.isVisible(), { timeout: 20000 });
  const polls = seen.length;
  check("after a restart it polls again", await until("polled", () => seen.length > polls, { timeout: 15000 }));
  check("the badge is back", await until("badge", async () => (await button2.locator(".tab-icon-count").textContent()) === "1"));
  await new Promise((r) => setTimeout(r, 400));
  check("with no repeat toast", !(await win2.locator('.plugin-toast[data-plugin="gatus"]').isVisible()));
} catch (err) {
  check(`no exception (${err.message})`, false);
} finally {
  await app?.close().catch(() => {});
  server.close();
}

const failed = results.filter((r) => !r.pass).length;
console.log(`===== ${results.length - failed} passed, ${failed} failed =====`);
process.exit(failed ? 1 : 0);
