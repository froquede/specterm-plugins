// The MCP server as Claude Code runs it: the built mcp.cjs over stdio, driven
// by the SDK's own client. Run `npm run build` first.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const built = path.resolve(import.meta.dirname, "..", "mcp.cjs");

async function connect(script, env) {
  const client = new Client({ name: "test", version: "0" });
  await client.connect(
    new StdioClientTransport({ command: process.execPath, args: [script], env: { PATH: process.env.PATH, ...env } })
  );
  return client;
}
const call = async (client, name, args = {}) => {
  const r = await client.callTool({ name, arguments: args });
  return { text: r.content.map((c) => c.text).join("\n"), isError: r.isError === true };
};

test("every tool, against the file", async () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "todo-mcp-")), "todos.json");
  const client = await connect(built, { SPECTERM_TODO_FILE: file });
  try {
    const names = (await client.listTools()).tools.map((t) => t.name).sort();
    assert.deepEqual(names, [
      "add_todo", "clear_done_todos", "complete_todo", "edit_todo", "list_todos", "move_todo", "remove_todo", "reopen_todo",
    ]);
    assert.match((await call(client, "list_todos")).text, /No open tasks/);

    const added = await call(client, "add_todo", { tasks: ["write notes", "  ", "ship it"] });
    assert.match(added.text, /Added 2/);
    const items = () => JSON.parse(fs.readFileSync(file, "utf-8")).items;
    assert.deepEqual(items().map((t) => t.text), ["write notes", "ship it"], "in the order given, blank dropped");
    assert.ok((await call(client, "add_todo", { tasks: [" "] })).isError);

    const [a, b] = items().map((t) => t.id);
    assert.match((await call(client, "complete_todo", { id: a.slice(0, 4) })).text, /^Done: \[x\]/);
    let listed = (await call(client, "list_todos")).text;
    assert.match(listed, /Open \(1\):\n\[ \] \w+  ship it/);
    assert.match(listed, /1 done/);
    assert.match((await call(client, "list_todos", { include_done: true })).text, /Done \(1\):\n\[x\] \w+  write notes/);

    assert.match((await call(client, "reopen_todo", { id: a })).text, /^Reopened: \[ \]/);
    assert.match((await call(client, "edit_todo", { id: b, text: "ship v1" })).text, /ship v1/);
    await call(client, "move_todo", { id: b, direction: "up" });
    assert.deepEqual(items().map((t) => t.text), ["ship v1", "write notes"]);

    const missing = await call(client, "complete_todo", { id: "zzzz" });
    assert.ok(missing.isError && /No task with id/.test(missing.text));

    await call(client, "complete_todo", { id: b });
    assert.match((await call(client, "clear_done_todos")).text, /Cleared 1 done task\./);
    assert.match((await call(client, "remove_todo", { id: a })).text, /^Removed/);
    assert.deepEqual(items(), []);
  } finally {
    await client.close();
  }
});

test("installed in Specterm's plugins folder, it finds the plugin's data", async () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), "todo-ud-"));
  fs.mkdirSync(path.join(userData, "plugins", "todo"), { recursive: true });
  fs.writeFileSync(path.join(userData, "plugins.json"), "{}");
  const script = path.join(userData, "plugins", "todo", "mcp.cjs");
  fs.copyFileSync(built, script);
  const client = await connect(script, {});
  try {
    await call(client, "add_todo", { tasks: ["here"] });
  } finally {
    await client.close();
  }
  const file = path.join(userData, "plugin-data", "todo", "todos.json");
  assert.equal(JSON.parse(fs.readFileSync(file, "utf-8")).items[0].text, "here");
});
