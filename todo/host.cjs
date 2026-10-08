"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// todo/src/host.ts
var host_exports = {};
__export(host_exports, {
  activate: () => activate
});
module.exports = __toCommonJS(host_exports);
var import_node_fs2 = __toESM(require("node:fs"), 1);
var import_node_path2 = __toESM(require("node:path"), 1);

// todo/src/store.ts
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var import_node_crypto = __toESM(require("node:crypto"), 1);

// todo/src/todos.ts
var MAX_TEXT = 500;
function parseTodos(value) {
  if (!Array.isArray(value)) return [];
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const v of value) {
    if (!v || typeof v !== "object") continue;
    const { id, text, done, createdAt, doneAt } = v;
    if (typeof id !== "string" || id === "" || seen.has(id)) continue;
    if (typeof text !== "string" || text.trim() === "") continue;
    seen.add(id);
    const todo = {
      id,
      text: text.slice(0, MAX_TEXT),
      done: done === true,
      createdAt: typeof createdAt === "number" ? createdAt : 0
    };
    if (todo.done && typeof doneAt === "number") todo.doneAt = doneAt;
    out.push(todo);
  }
  return out;
}
function clean(text) {
  const t = String(text).replace(/\s+/g, " ").trim().slice(0, MAX_TEXT);
  return t === "" ? null : t;
}
function addTodo(list, text, id, now) {
  const t = clean(text);
  if (t === null) return list;
  return [{ id, text: t, done: false, createdAt: now }, ...list];
}
function setDone(list, id, done, now) {
  return list.map((t) => {
    if (t.id !== id || t.done === done) return t;
    if (!done) return { id: t.id, text: t.text, done: false, createdAt: t.createdAt };
    return { ...t, done: true, doneAt: now };
  });
}
function toggleTodo(list, id, now) {
  const t = list.find((x) => x.id === id);
  return t ? setDone(list, id, !t.done, now) : list;
}
function editTodo(list, id, text) {
  const t = clean(text);
  if (t === null) return removeTodo(list, id);
  return list.map((todo) => todo.id === id ? { ...todo, text: t } : todo);
}
function removeTodo(list, id) {
  return list.filter((t) => t.id !== id);
}
function clearDone(list) {
  return list.filter((t) => !t.done);
}
function moveTodo(list, id, delta) {
  const open = list.filter((t) => !t.done);
  const i = open.findIndex((t) => t.id === id);
  const j = i + delta;
  if (i === -1 || j < 0 || j >= open.length) return list;
  [open[i], open[j]] = [open[j], open[i]];
  return [...open, ...list.filter((t) => t.done)];
}
function applyOp(list, op, now, newId2) {
  switch (op.op) {
    case "add":
      return addTodo(list, op.text, newId2, now);
    case "setDone":
      return setDone(list, op.id, op.done, now);
    case "toggle":
      return toggleTodo(list, op.id, now);
    case "edit":
      return editTodo(list, op.id, op.text);
    case "remove":
      return removeTodo(list, op.id);
    case "move":
      return moveTodo(list, op.id, op.delta);
    case "clearDone":
      return clearDone(list);
  }
}

// todo/src/store.ts
var FILE_NAME = "todos.json";
var LOCK_WAIT_MS = 2e3;
var LOCK_STALE_MS = 5e3;
async function readTodos(file) {
  let raw;
  try {
    raw = await import_node_fs.default.promises.readFile(file, "utf-8");
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
  try {
    return parseTodos(JSON.parse(raw)?.items);
  } catch {
    throw new Error(`${file} is not valid JSON; fix or delete it`);
  }
}
async function writeTodos(file, items) {
  const tmp = `${file}.${process.pid}.${import_node_crypto.default.randomBytes(4).toString("hex")}.tmp`;
  await import_node_fs.default.promises.writeFile(tmp, JSON.stringify({ version: 1, items }, null, 2) + "\n");
  try {
    await import_node_fs.default.promises.rename(tmp, file);
  } catch (err) {
    await import_node_fs.default.promises.rm(tmp, { force: true });
    throw err;
  }
}
async function withLock(file, fn) {
  const lock = `${file}.lock`;
  const started = Date.now();
  for (; ; ) {
    try {
      await (await import_node_fs.default.promises.open(lock, "wx")).close();
      break;
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
      const age = await import_node_fs.default.promises.stat(lock).then((s) => Date.now() - s.mtimeMs, () => 0);
      if (age > LOCK_STALE_MS) {
        await import_node_fs.default.promises.rm(lock, { force: true });
        continue;
      }
      if (Date.now() - started > LOCK_WAIT_MS) throw new Error(`the todo list is locked (${lock})`);
      await new Promise((r) => setTimeout(r, 10));
    }
  }
  try {
    return await fn();
  } finally {
    await import_node_fs.default.promises.rm(lock, { force: true });
  }
}
function newId(list) {
  for (; ; ) {
    const id = import_node_crypto.default.randomBytes(4).toString("hex");
    if (!list.some((t) => t.id === id)) return id;
  }
}
async function updateTodos(file, op) {
  await import_node_fs.default.promises.mkdir(import_node_path.default.dirname(file), { recursive: true });
  return withLock(file, async () => {
    const list = await readTodos(file);
    const next = applyOp(list, op, Date.now(), newId(list));
    if (next !== list) await writeTodos(file, next);
    return next;
  });
}

// todo/src/host.ts
function activate(ctx) {
  const file = import_node_path2.default.join(ctx.storagePath, FILE_NAME);
  ctx.handle("list", () => readTodos(file));
  ctx.handle("apply", (op) => updateTodos(file, op));
  ctx.handle("file", () => file);
  let timer = null;
  const changed = () => {
    if (timer !== null) ctx.clearTimer(timer);
    timer = ctx.setTimeout(() => {
      timer = null;
      readTodos(file).then(
        (items) => ctx.emit("changed", items),
        () => {
        }
        // a broken file: the next good write is reported
      );
    }, 30);
  };
  import_node_fs2.default.mkdirSync(ctx.storagePath, { recursive: true });
  const watcher = import_node_fs2.default.watch(ctx.storagePath, (_event, name) => {
    if (name === null || name === FILE_NAME) changed();
  });
  watcher.on("error", () => {
  });
  ctx.onDispose(() => watcher.close());
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate
});
