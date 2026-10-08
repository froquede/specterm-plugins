// The todo list's host side, run in Specterm's plugin host process: it owns the
// panel's reads and writes of the file, and watches the file so a change made
// from Claude (the MCP server, mcp.cjs) shows in every open panel.

import fs from "node:fs";
import path from "node:path";
import type { PluginHostContext } from "../../shared/specterm-plugin-api.ts";
import type { TodoOp } from "./todos.ts";
import { FILE_NAME, readTodos, updateTodos } from "./store.ts";

export function activate(ctx: PluginHostContext) {
  const file = path.join(ctx.storagePath, FILE_NAME);

  ctx.handle("list", () => readTodos(file));
  ctx.handle("apply", (op: TodoOp) => updateTodos(file, op));
  ctx.handle("file", () => file);

  // The folder, not the file: a write is a rename over the file, which a watch
  // on the file itself stops seeing after the first time. Several events per
  // write (the temp file, the rename, the lock) collapse into one read.
  let timer: unknown = null;
  const changed = () => {
    if (timer !== null) ctx.clearTimer(timer);
    timer = ctx.setTimeout(() => {
      timer = null;
      readTodos(file).then(
        (items) => ctx.emit("changed", items),
        () => {} // a broken file: the next good write is reported
      );
    }, 30);
  };
  fs.mkdirSync(ctx.storagePath, { recursive: true });
  const watcher = fs.watch(ctx.storagePath, (_event, name) => {
    if (name === null || name === FILE_NAME) changed();
  });
  watcher.on("error", () => {});
  ctx.onDispose(() => watcher.close());
}
