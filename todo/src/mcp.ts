// The todo list as an MCP server, so any Claude session can read and change it.
// Shipped inside the plugin as mcp.cjs and registered once with
//
//   claude mcp add -s user specterm-todo -- node <plugin folder>/mcp.cjs
//
// It changes the same file the panel shows, through the same store, and the
// panel's host sees the change and redraws.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { splitTodos, resolveId, type Todo, type TodoOp } from "./todos.ts";
import { FILE_NAME, readTodos, updateTodos } from "./store.ts";

/** Specterm's data folder (Electron's userData) on this OS. */
function defaultUserData(): string {
  const home = os.homedir();
  if (process.platform === "darwin") return path.join(home, "Library", "Application Support", "specterm");
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA ?? path.join(home, "AppData", "Roaming"), "specterm");
  }
  return path.join(process.env.XDG_CONFIG_HOME ?? path.join(home, ".config"), "specterm");
}

/** The file the panel uses. Installed, this script sits in
 *  <userData>/plugins/todo/, and the plugin's data is in
 *  <userData>/plugin-data/todo/. Run from anywhere else (a checkout of this
 *  repo), it uses the OS's default data folder. SPECTERM_TODO_FILE wins over
 *  both. */
export function todoFile(scriptDir: string): string {
  if (process.env.SPECTERM_TODO_FILE) return process.env.SPECTERM_TODO_FILE;
  const pluginsDir = path.dirname(scriptDir);
  const userData = path.dirname(pluginsDir);
  const installed =
    path.basename(pluginsDir) === "plugins" && fs.existsSync(path.join(userData, "plugins.json"));
  return path.join(installed ? userData : defaultUserData(), "plugin-data", "todo", FILE_NAME);
}

const line = (t: Todo) => `${t.done ? "[x]" : "[ ]"} ${t.id}  ${t.text}`;

function render(list: Todo[], includeDone: boolean): string {
  const { open, done } = splitTodos(list);
  const out: string[] = [];
  out.push(open.length ? `Open (${open.length}):` : "No open tasks.");
  out.push(...open.map(line));
  if (includeDone && done.length) out.push("", `Done (${done.length}):`, ...done.map(line));
  else if (done.length) out.push("", `${done.length} done (list with include_done to see them).`);
  return out.join("\n");
}

const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] });
const fail = (s: string) => ({ content: [{ type: "text" as const, text: s }], isError: true });

export function createServer(file: string): McpServer {
  const server = new McpServer({ name: "specterm-todo", version: "1.0.0" });

  /** Find the item `ref` names, then apply the op built from its full id. */
  async function onItem(ref: string, build: (id: string) => TodoOp, verb: string) {
    const list = await readTodos(file);
    const hit = resolveId(list, ref);
    if (hit === null) return fail(`No task with id "${ref}". Call list_todos for the ids.`);
    if (hit === "ambiguous") return fail(`"${ref}" matches more than one task; give more of the id.`);
    const next = await updateTodos(file, build(hit.id));
    const after = next.find((t) => t.id === hit.id);
    return text(after ? `${verb}: ${line(after)}` : `${verb}: ${hit.text}`);
  }

  server.registerTool(
    "list_todos",
    {
      description:
        "List the user's todo list (the one in Specterm's Todo panel). Open tasks in the user's order, each with its id.",
      inputSchema: { include_done: z.boolean().optional().describe("Also list the done tasks.") },
      annotations: { readOnlyHint: true },
    },
    async ({ include_done }) => text(render(await readTodos(file), include_done === true))
  );

  server.registerTool(
    "add_todo",
    {
      description: "Add tasks to the top of the user's todo list. One task per entry.",
      inputSchema: { tasks: z.array(z.string().min(1)).min(1).describe("The tasks' text.") },
    },
    async ({ tasks }) => {
      const added: Todo[] = [];
      // Last first, so the list reads in the order given. A blank entry adds
      // nothing, so it is dropped here rather than misreported.
      for (const t of tasks.filter((t) => t.trim() !== "").reverse()) {
        added.unshift((await updateTodos(file, { op: "add", text: t }))[0]);
      }
      if (added.length === 0) return fail("Nothing to add: every task was blank.");
      return text(`Added ${added.length}:\n${added.map(line).join("\n")}`);
    }
  );

  server.registerTool(
    "complete_todo",
    {
      description: "Mark a task as done.",
      inputSchema: { id: z.string().describe("The task's id, or a unique prefix of it.") },
    },
    ({ id }) => onItem(id, (full) => ({ op: "setDone", id: full, done: true }), "Done")
  );

  server.registerTool(
    "reopen_todo",
    {
      description: "Mark a done task as open again.",
      inputSchema: { id: z.string().describe("The task's id, or a unique prefix of it.") },
    },
    ({ id }) => onItem(id, (full) => ({ op: "setDone", id: full, done: false }), "Reopened")
  );

  server.registerTool(
    "edit_todo",
    {
      description: "Change a task's text.",
      inputSchema: {
        id: z.string().describe("The task's id, or a unique prefix of it."),
        text: z.string().min(1).describe("The new text."),
      },
    },
    ({ id, text: t }) => onItem(id, (full) => ({ op: "edit", id: full, text: t }), "Edited")
  );

  server.registerTool(
    "remove_todo",
    {
      description: "Delete a task from the list. There is no undo.",
      inputSchema: { id: z.string().describe("The task's id, or a unique prefix of it.") },
      annotations: { destructiveHint: true },
    },
    ({ id }) => onItem(id, (full) => ({ op: "remove", id: full }), "Removed")
  );

  server.registerTool(
    "move_todo",
    {
      description: "Move an open task one place up or down in the list.",
      inputSchema: {
        id: z.string().describe("The task's id, or a unique prefix of it."),
        direction: z.enum(["up", "down"]),
      },
    },
    ({ id, direction }) =>
      onItem(id, (full) => ({ op: "move", id: full, delta: direction === "up" ? -1 : 1 }), "Moved")
  );

  server.registerTool(
    "clear_done_todos",
    {
      description: "Delete every done task. There is no undo.",
      inputSchema: {},
      annotations: { destructiveHint: true },
    },
    async () => {
      const before = (await readTodos(file)).filter((t) => t.done).length;
      await updateTodos(file, { op: "clearDone" });
      return text(`Cleared ${before} done task${before === 1 ? "" : "s"}.`);
    }
  );

  return server;
}

// Run when started as a program (not when a test imports it).
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  createServer(todoFile(__dirname))
    .connect(new StdioServerTransport())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
