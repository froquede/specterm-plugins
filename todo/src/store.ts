// The list on disk: one JSON file, written by two processes that do not know
// about each other, Specterm's plugin host (for the panel) and the MCP server
// (for Claude). Every change is a read-modify-write under a lock file, and the
// write goes to a temporary file renamed over the old one, so neither process
// ever reads half a file or loses the other's change.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { parseTodos, applyOp, type Todo, type TodoOp } from "./todos.ts";

export const FILE_NAME = "todos.json";

const LOCK_WAIT_MS = 2000;
// A lock older than this was left by a process that died holding it.
const LOCK_STALE_MS = 5000;

export async function readTodos(file: string): Promise<Todo[]> {
  let raw: string;
  try {
    raw = await fs.promises.readFile(file, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  try {
    return parseTodos(JSON.parse(raw)?.items);
  } catch {
    // Not JSON (a hand edit gone wrong): refuse to write over it.
    throw new Error(`${file} is not valid JSON; fix or delete it`);
  }
}

async function writeTodos(file: string, items: Todo[]): Promise<void> {
  const tmp = `${file}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  await fs.promises.writeFile(tmp, JSON.stringify({ version: 1, items }, null, 2) + "\n");
  try {
    await fs.promises.rename(tmp, file);
  } catch (err) {
    await fs.promises.rm(tmp, { force: true });
    throw err;
  }
}

async function withLock<T>(file: string, fn: () => Promise<T>): Promise<T> {
  const lock = `${file}.lock`;
  const started = Date.now();
  for (;;) {
    try {
      await (await fs.promises.open(lock, "wx")).close();
      break;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
      const age = await fs.promises.stat(lock).then((s) => Date.now() - s.mtimeMs, () => 0);
      if (age > LOCK_STALE_MS) {
        await fs.promises.rm(lock, { force: true });
        continue;
      }
      if (Date.now() - started > LOCK_WAIT_MS) throw new Error(`the todo list is locked (${lock})`);
      await new Promise((r) => setTimeout(r, 10));
    }
  }
  try {
    return await fn();
  } finally {
    await fs.promises.rm(lock, { force: true });
  }
}

function newId(list: Todo[]): string {
  for (;;) {
    const id = crypto.randomBytes(4).toString("hex");
    if (!list.some((t) => t.id === id)) return id;
  }
}

/** Apply one change and return the list as written. The item an "add" made is
 *  the first of the list. */
export async function updateTodos(file: string, op: TodoOp): Promise<Todo[]> {
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  return withLock(file, async () => {
    const list = await readTodos(file);
    const next = applyOp(list, op, Date.now(), newId(list));
    if (next !== list) await writeTodos(file, next);
    return next;
  });
}
