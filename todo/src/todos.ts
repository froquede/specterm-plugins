// The todo list itself: what is stored and every change made to it, as pure
// functions over an array. The panel (through the host) and the MCP server both
// change the list only through applyOp, so a task added from Claude and one
// typed in the panel follow the same rules.

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  /** When it was checked off; absent while open. */
  doneAt?: number;
}

export type TodoOp =
  | { op: "add"; text: string }
  | { op: "setDone"; id: string; done: boolean }
  | { op: "toggle"; id: string }
  | { op: "edit"; id: string; text: string }
  | { op: "remove"; id: string }
  | { op: "move"; id: string; delta: -1 | 1 }
  | { op: "clearDone" };

// A cap on each item keeps one pasted log from turning the file into one.
export const MAX_TEXT = 500;

/** What the file held, kept only where it is a well-formed item: it may come
 *  from an older or newer version, or from a hand edit. */
export function parseTodos(value: unknown): Todo[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: Todo[] = [];
  for (const v of value) {
    if (!v || typeof v !== "object") continue;
    const { id, text, done, createdAt, doneAt } = v as Record<string, unknown>;
    if (typeof id !== "string" || id === "" || seen.has(id)) continue;
    if (typeof text !== "string" || text.trim() === "") continue;
    seen.add(id);
    const todo: Todo = {
      id,
      text: text.slice(0, MAX_TEXT),
      done: done === true,
      createdAt: typeof createdAt === "number" ? createdAt : 0,
    };
    if (todo.done && typeof doneAt === "number") todo.doneAt = doneAt;
    out.push(todo);
  }
  return out;
}

/** Text as typed, ready to store, or null when there is nothing to store. */
function clean(text: string): string | null {
  const t = String(text).replace(/\s+/g, " ").trim().slice(0, MAX_TEXT);
  return t === "" ? null : t;
}

/** A new item goes to the top of the open ones: the newest thing is the one
 *  in mind. */
export function addTodo(list: Todo[], text: string, id: string, now: number): Todo[] {
  const t = clean(text);
  if (t === null) return list;
  return [{ id, text: t, done: false, createdAt: now }, ...list];
}

export function setDone(list: Todo[], id: string, done: boolean, now: number): Todo[] {
  return list.map((t) => {
    if (t.id !== id || t.done === done) return t;
    if (!done) return { id: t.id, text: t.text, done: false, createdAt: t.createdAt };
    return { ...t, done: true, doneAt: now };
  });
}

export function toggleTodo(list: Todo[], id: string, now: number): Todo[] {
  const t = list.find((x) => x.id === id);
  return t ? setDone(list, id, !t.done, now) : list;
}

/** Editing to an empty text removes the item, as clearing a line would. */
export function editTodo(list: Todo[], id: string, text: string): Todo[] {
  const t = clean(text);
  if (t === null) return removeTodo(list, id);
  return list.map((todo) => (todo.id === id ? { ...todo, text: t } : todo));
}

export function removeTodo(list: Todo[], id: string): Todo[] {
  return list.filter((t) => t.id !== id);
}

export function clearDone(list: Todo[]): Todo[] {
  return list.filter((t) => !t.done);
}

/** Move an open item one place up (-1) or down (+1) among the open items.
 *  Done items keep their place; the panel shows them apart anyway. */
export function moveTodo(list: Todo[], id: string, delta: -1 | 1): Todo[] {
  const open = list.filter((t) => !t.done);
  const i = open.findIndex((t) => t.id === id);
  const j = i + delta;
  if (i === -1 || j < 0 || j >= open.length) return list;
  [open[i], open[j]] = [open[j], open[i]];
  return [...open, ...list.filter((t) => t.done)];
}

/** Open items in the order they are kept, then the done ones, most recently
 *  checked first. */
export function splitTodos(list: Todo[]): { open: Todo[]; done: Todo[] } {
  const open = list.filter((t) => !t.done);
  const done = list.filter((t) => t.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
  return { open, done };
}

/** One change, as the panel and the MCP server send it. `newId` is used only
 *  by "add". An op on an id that is not there leaves the list as it was. */
export function applyOp(list: Todo[], op: TodoOp, now: number, newId: string): Todo[] {
  switch (op.op) {
    case "add":
      return addTodo(list, op.text, newId, now);
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

/** The item an id names: the id itself, or a prefix of exactly one id (so
 *  Claude can say "a3f9" for "a3f9c21e"). */
export function resolveId(list: Todo[], ref: string): Todo | "ambiguous" | null {
  const exact = list.find((t) => t.id === ref);
  if (exact) return exact;
  if (ref.length < 3) return null;
  const hits = list.filter((t) => t.id.startsWith(ref));
  if (hits.length === 1) return hits[0];
  return hits.length > 1 ? "ambiguous" : null;
}
