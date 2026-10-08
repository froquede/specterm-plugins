// The todo plugin end to end, in a real Specterm, with Claude's side played by
// the built mcp.cjs over stdio.
//
// Needs a Specterm checkout with its dependencies installed and `vite build`
// run, at SPECTERM_DIR (default: a `specterm` folder next to this repo). The
// plugin is symlinked into a throwaway profile's plugins folder and switched
// on.
//
// Run: npm run build && npm run e2e:todo
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const pluginRoot = path.resolve(import.meta.dirname, "..");
const spectermDir = path.resolve(process.env.SPECTERM_DIR ?? path.join(pluginRoot, "../../specterm"));
if (!fs.existsSync(path.join(spectermDir, "dist", "index.html"))) {
  console.error(`No built Specterm at ${spectermDir}. Set SPECTERM_DIR and run \`npx vite build\` there.`);
  process.exit(2);
}
const { _electron: electron } = createRequire(path.join(spectermDir, "package.json"))("playwright");
const { launchOptions } = await import(pathToFileURL(path.join(spectermDir, "test", "launch.mjs")).href);

const TOGGLE_KEY = process.platform === "darwin" ? "Meta+Shift+O" : "Control+Alt+O";

const started = Date.now();
const log = (...a) => console.log(`[todo ${((Date.now() - started) / 1000).toFixed(1).padStart(5)}s]`, ...a);
const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass });
  log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};
const hard = setTimeout(() => {
  console.error("[todo] HARD TIMEOUT");
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

const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), "specterm-todo-home-"));
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "specterm-todo-"));
fs.mkdirSync(path.join(userDataDir, "plugins"));
fs.symlinkSync(pluginRoot, path.join(userDataDir, "plugins", "todo"), "dir");
fs.writeFileSync(path.join(userDataDir, "plugins.json"), JSON.stringify({ enabled: { todo: true }, contributions: [] }));
const todoFile = path.join(userDataDir, "plugin-data", "todo", "todos.json");
const onDisk = () => {
  try {
    return JSON.parse(fs.readFileSync(todoFile, "utf-8")).items;
  } catch {
    return [];
  }
};

// Claude's side: the MCP server as Claude Code runs it.
const claude = new Client({ name: "e2e", version: "0" });
await claude.connect(
  new StdioClientTransport({
    command: process.execPath,
    args: [path.join(pluginRoot, "mcp.cjs")],
    env: { PATH: process.env.PATH, SPECTERM_TODO_FILE: todoFile },
  })
);
const tool = (name, args = {}) => claude.callTool({ name, arguments: args });

// --- run -------------------------------------------------------------------

let app;
try {
  app = await electron.launch(launchOptions(spectermDir, userDataDir, { env: { HOME: fakeHome, USERPROFILE: fakeHome } }));
  const win = await app.firstWindow();
  win.on("pageerror", (e) => log("PAGEERROR:", e.message));
  const button = win.locator('.tab-plugin[data-plugin="todo"]');
  check("the todo button is in the tab bar", await until("button", () => button.isVisible(), { timeout: 20000 }));
  await win.waitForSelector(".xterm", { timeout: 20000 });

  // 1. The shortcut opens the panel, with the add field focused.
  await win.keyboard.press(TOGGLE_KEY);
  const view = win.locator('.plugin-view[data-plugin="todo"]');
  check("the shortcut opens the panel", await until("view", () => view.isVisible()));
  const input = view.locator(".todo-add input");
  check("the add field has focus", await until("focus", () => input.evaluate((el) => el === document.activeElement)));

  // 2. Typed in the panel, written to the file.
  const texts = () => view.locator(".todo-list").first().locator(".todo-text").allTextContents();
  await input.fill("write the release notes");
  await input.press("Enter");
  await input.fill("ship it");
  await input.press("Enter");
  check("typed tasks are listed, newest first", await until("two", async () => (await texts()).join("|") === "ship it|write the release notes"));
  check(
    "and written to the file",
    await until("on disk", () => onDisk().map((t) => t.text).join("|") === "ship it|write the release notes")
  );

  // 3. Added by Claude, shown without touching the panel.
  await tool("add_todo", { tasks: ["from claude"] });
  check(
    "a task Claude adds shows in the open panel",
    await until("from claude", async () => (await texts())[0] === "from claude"),
    (await texts()).join("|")
  );
  const listed = (await tool("list_todos")).content[0].text;
  check("Claude lists what the panel added", /ship it/.test(listed) && /write the release notes/.test(listed));
  const releaseId = onDisk().find((t) => t.text === "write the release notes").id;
  await tool("complete_todo", { id: releaseId.slice(0, 4) });
  check(
    "a task Claude completes moves under Done",
    await until("done", async () => /Done \(1\)/.test((await view.locator(".todo-done-toggle").textContent()) ?? ""))
  );

  // 4. Checked in the panel, seen by Claude.
  await view.locator(".todo-row", { hasText: "ship it" }).locator(".todo-check").click();
  check(
    "a task checked in the panel is done for Claude",
    await until("done for claude", async () =>
      /Done \(2\)/.test((await tool("list_todos", { include_done: true })).content[0].text)
    )
  );

  // 5. Moving keeps the row's focus (rows are kept by id across new lists).
  await tool("add_todo", { tasks: ["second open"] }); // open: second open, from claude
  await until("two open", async () => (await texts()).length === 2);
  const first = view.locator(".todo-list").first().locator(".todo-row").first();
  await first.focus();
  await win.keyboard.press("Shift+ArrowDown");
  check(
    "Shift+Down moves the task down",
    await until("moved", async () => (await texts()).join("|") === "from claude|second open"),
    (await texts()).join("|")
  );
  await new Promise((r) => setTimeout(r, 300)); // past the host's answer and the file watch
  check(
    "and the moved task keeps the focus",
    await win.evaluate(() => document.activeElement?.classList.contains("todo-row") && document.activeElement.textContent.includes("second open"))
  );

  // 6. Closing and reopening shows the same list; a change made while closed
  //    is there on reopen.
  await win.keyboard.press(TOGGLE_KEY);
  await until("closed", async () => (await view.count()) === 0);
  await tool("add_todo", { tasks: ["while closed"] });
  await win.keyboard.press(TOGGLE_KEY);
  check(
    "a task added while the panel was closed is there on reopen",
    await until("reopen", async () => (await texts())[0] === "while closed"),
    (await texts()).join("|")
  );

  // 7. Clear in the panel empties Done for Claude too.
  await view.locator(".todo-clear").click();
  check(
    "Clear removes the done tasks from the file",
    await until("cleared", () => onDisk().every((t) => !t.done) && onDisk().length === 3)
  );
} catch (err) {
  check(`no exception (${err.message})`, false);
} finally {
  await claude.close().catch(() => {});
  await app?.close().catch(() => {});
}

const failed = results.filter((r) => !r.pass).length;
console.log(`===== ${results.length - failed} passed, ${failed} failed =====`);
process.exit(failed ? 1 : 0);
