// The Zabbix plugin end to end, in a real Specterm, against a fake Zabbix API
// on localhost whose problems the test opens and resolves.
//
// Needs a Specterm checkout with its dependencies installed and `vite build`
// run, at SPECTERM_DIR (default: a `specterm` folder next to this repo). The
// plugin is symlinked into a throwaway profile's plugins folder and switched
// on.
//
// Run: npm run build:zabbix && xvfb-run -a npm run e2e:zabbix
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

const TOGGLE_KEY = process.platform === "darwin" ? "Meta+Shift+X" : "Control+Alt+X";

const started = Date.now();
const log = (...a) => console.log(`[zabbix ${((Date.now() - started) / 1000).toFixed(1).padStart(5)}s]`, ...a);
const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass });
  log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};
const hard = setTimeout(() => {
  console.error("[zabbix] HARD TIMEOUT");
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

// --- fake Zabbix -------------------------------------------------------------

// The active problem triggers, as trigger.get returns them.
let triggers = [];
const trig = (id, host, description, severity, over = {}) => ({
  triggerid: id,
  description,
  priority: String(severity),
  lastchange: "1794577201",
  hosts: [{ hostid: `h${host}`, name: host, maintenance_status: "0" }],
  lastEvent: { eventid: `e${id}`, clock: "1794577201", acknowledged: "0", severity: String(severity) },
  ...over,
});
const seen = [];
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const rpc = JSON.parse(body || "{}");
    seen.push({ path: req.url, auth: req.headers.authorization ?? null, method: rpc.method });
    if (req.url !== "/api_jsonrpc.php") return res.writeHead(404).end();
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ jsonrpc: "2.0", result: triggers, id: rpc.id }));
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const zabbixUrl = `http://127.0.0.1:${server.address().port}`;

// --- fixture -----------------------------------------------------------------

const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), "specterm-zabbix-home-"));
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "specterm-zabbix-"));
fs.mkdirSync(path.join(userDataDir, "plugins"));
fs.symlinkSync(pluginRoot, path.join(userDataDir, "plugins", "zabbix"), "dir");
fs.writeFileSync(path.join(userDataDir, "plugins.json"), JSON.stringify({ enabled: { zabbix: true }, contributions: [] }));
const dataDir = path.join(userDataDir, "plugin-data", "zabbix");

// --- run ---------------------------------------------------------------------

let app;
try {
  app = await electron.launch(launchOptions(spectermDir, userDataDir, { env: { HOME: fakeHome, USERPROFILE: fakeHome } }));
  const win = await app.firstWindow();
  win.on("pageerror", (e) => log("PAGEERROR:", e.message));
  const invoke = (method, ...args) => win.evaluate(([m, a]) => window.specterm.pluginInvoke("zabbix", m, a), [method, args]);
  const button = win.locator('.tab-plugin[data-plugin="zabbix"]');
  const badge = async () => {
    const el = button.locator(".tab-icon-count");
    return (await el.count()) ? el.textContent() : null;
  };
  const toast = win.locator('.plugin-toast[data-plugin="zabbix"]');
  const toastTitle = async () => {
    const el = toast.locator(".plugin-toast-title");
    return (await el.count()) ? el.textContent() : null;
  };
  const view = win.locator('.plugin-view[data-plugin="zabbix"]');
  const closeView = async () => {
    if (await view.isVisible()) await win.keyboard.press(TOGGLE_KEY);
    await until("view closed", async () => (await view.count()) === 0);
  };

  check("the Zabbix button is in the tab bar", await until("button", () => button.isVisible(), { timeout: 20000 }));
  await win.waitForSelector(".xterm", { timeout: 20000 });

  // 1. Not set up: the panel asks for an address.
  await win.keyboard.press(TOGGLE_KEY);
  check("the shortcut opens the panel", await until("view", () => view.isVisible()));
  check("unconfigured, it shows the settings", await until("form", async () => (await view.locator('input[name="url"]').count()) === 1));

  // 2. Saved from the panel: written for the host only, and polled at once.
  await view.locator('input[name="url"]').fill(zabbixUrl);
  await view.locator('input[name="token"]').fill("t0ken");
  await view.locator('button[type="submit"]').click();
  check("saving polls the server", await until("polled", () => seen.length > 0));
  check("with trigger.get and the token", seen.at(-1)?.method === "trigger.get" && seen.at(-1)?.auth === "Bearer t0ken", JSON.stringify(seen.at(-1)));
  const cfgFile = path.join(dataDir, "config.json");
  check(
    "the settings file is readable only by the user",
    process.platform === "win32" || (fs.statSync(cfgFile).mode & 0o777) === 0o600,
    (fs.statSync(cfgFile).mode & 0o777).toString(8)
  );
  const cfg = await invoke("config");
  check("the panel never gets the token back", cfg.hasToken === true && !("token" in cfg), JSON.stringify(cfg));
  check("nothing active: the panel says so", await until("nothing", async () => /Nothing alerting/.test(await view.textContent())));
  await closeView();

  // 3. A Warning (below High, the default): listed, no alert.
  triggers = [trig("1", "Prod-Db", "/: Disk space is low", 2)];
  await invoke("poll");
  await new Promise((r) => setTimeout(r, 400));
  check("a Warning shows no toast", !(await toast.isVisible()));
  check("and no badge", (await badge()) === null);
  check("but is listed", (await invoke("snapshot")).quiet.some((p) => p.key === "1"));

  // 4. A Disaster: a toast and a badge.
  triggers.push(trig("2", "Prod-Api", "Zabbix agent is not available", 5));
  await invoke("poll");
  check("a Disaster toasts", await until("toast", async () => (await toastTitle()) === "Prod-Api: Zabbix agent is not available"), String(await toastTitle()));
  check("and badges the button", await until("badge", async () => (await badge()) === "1"));

  // 5. The toast opens the panel; a right click offers Claude and Zabbix.
  await toast.click();
  await win.mouse.move(400, 400);
  check("the toast opens the panel", await until("view", () => view.isVisible()));
  const head = view.locator('[data-incident="problem:2"] .zb-incident-head');
  check("on that incident", await until("incident", () => head.isVisible()));
  await head.click({ button: "right" });
  const menu = win.locator(".sp-menu");
  check("a right click opens the menu", await until("menu", () => menu.isVisible()));
  const items = await menu.locator(".sp-menu-item").allTextContents();
  check(
    "with Ask Claude, Open in Zabbix and Copy",
    ["Ask Claude about it", "Open in Zabbix", "Open the event", "Copy text"].every((t) => items.includes(t)),
    JSON.stringify(items)
  );
  await win.keyboard.press("Escape");
  check("Escape closes it", await until("menu gone", async () => (await menu.count()) === 0));
  await closeView();

  // 6. Acknowledged: no longer alerting, so it resolves.
  triggers[1] = trig("2", "Prod-Api", "Zabbix agent is not available", 5, {
    lastEvent: { eventid: "e2", clock: "1794577201", acknowledged: "1", severity: "5" },
  });
  await invoke("poll");
  check("acknowledging resolves it", await until("resolved", async () => / resolved$/.test(String(await toastTitle()))), String(await toastTitle()));
  check("and clears the badge", await until("no badge", async () => (await badge()) === null));

  // 7. The same problem on three hosts: one alert.
  triggers = ["a", "b", "c"].map((h, i) => trig(String(10 + i), `Prod-${h}`, "High swap space usage", 4));
  await invoke("poll");
  check("one outage is one toast", await until("bundled", async () => (await toastTitle()) === "High swap space usage on 3 hosts"), String(await toastTitle()));
  check("and a badge of 1", await until("badge 1", async () => (await badge()) === "1"));

  // 8. A restart keeps it alerted, without a new toast.
  await until("toast gone", async () => !(await toast.isVisible()), { timeout: 8000 });
  await app.close();
  app = await electron.launch(launchOptions(spectermDir, userDataDir, { env: { HOME: fakeHome, USERPROFILE: fakeHome } }));
  const win2 = await app.firstWindow();
  const button2 = win2.locator('.tab-plugin[data-plugin="zabbix"]');
  await until("button again", () => button2.isVisible(), { timeout: 20000 });
  const polls = seen.length;
  check("after a restart it polls again", await until("polled", () => seen.length > polls, { timeout: 15000 }));
  check("the badge is back", await until("badge", async () => (await button2.locator(".tab-icon-count").textContent()) === "1"));
  await new Promise((r) => setTimeout(r, 400));
  check("with no repeat toast", !(await win2.locator('.plugin-toast[data-plugin="zabbix"]').isVisible()));
} catch (err) {
  check(`no exception (${err.message})`, false);
} finally {
  await app?.close().catch(() => {});
  server.close();
}

const failed = results.filter((r) => !r.pass).length;
console.log(`===== ${results.length - failed} passed, ${failed} failed =====`);
process.exit(failed ? 1 : 0);
