// The list's rules (src/todos.ts): what the file hands back and every change.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_TEXT, parseTodos, addTodo, setDone, toggleTodo, editTodo, removeTodo,
  clearDone, moveTodo, splitTodos, applyOp, resolveId,
} from "../src/todos.ts";

const texts = (list) => list.map((t) => t.text).join(",");

test("parse drops what is not a well-formed item", () => {
  assert.deepEqual(parseTodos(undefined), []);
  assert.deepEqual(parseTodos({}), []);
  const parsed = parseTodos([
    { id: "a", text: "one", done: false, createdAt: 1 },
    { id: "a", text: "dup id", done: false, createdAt: 2 },
    { id: "b", text: "  ", done: false, createdAt: 3 },
    { id: 3, text: "bad id" },
    { id: "", text: "empty id" },
    null,
    { id: "c", text: "x".repeat(MAX_TEXT + 50), done: true, doneAt: 9 },
    { id: "d", text: "open with stray doneAt", done: false, doneAt: 9 },
  ]);
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].text, "one");
  assert.equal(parsed[1].text.length, MAX_TEXT);
  assert.equal(parsed[1].createdAt, 0);
  assert.equal(parsed[1].doneAt, 9);
  assert.ok(!("doneAt" in parsed[2]));
});

test("add, done, edit, move, split, clear", () => {
  let l = addTodo([], "first", "1", 10);
  l = addTodo(l, "  second   task ", "2", 20);
  assert.equal(texts(l), "second task,first");
  assert.equal(addTodo(l, "   ", "x", 30), l, "blank adds nothing");

  l = toggleTodo(l, "2", 40);
  assert.ok(l[0].done && l[0].doneAt === 40);
  l = toggleTodo(l, "2", 50);
  assert.ok(!l[0].done && !("doneAt" in l[0]));
  assert.equal(setDone(l, "2", false, 60)[0], l[0], "setDone to the same state keeps the item");
  assert.equal(toggleTodo(l, "nope", 1), l);

  l = editTodo(l, "1", "first, edited");
  assert.equal(l.find((t) => t.id === "1").text, "first, edited");
  assert.equal(editTodo(l, "1", " ").length, 1, "edit to blank removes");

  l = addTodo(l, "third", "3", 60); // 3,2,1
  l = moveTodo(l, "3", 1);
  assert.equal(texts(l), "second task,third,first, edited");
  assert.equal(moveTodo(l, "1", 1), l, "past the end");
  assert.equal(moveTodo(l, "zzz", -1), l, "unknown id");

  l = setDone(l, "2", true, 70);
  l = setDone(l, "1", true, 80);
  const { open, done } = splitTodos(l);
  assert.equal(texts(open), "third");
  assert.equal(texts(done), "first, edited,second task", "most recently done first");
  assert.equal(texts(moveTodo(addTodo(l, "fourth", "4", 90), "3", -1).filter((t) => !t.done)), "third,fourth");
  assert.equal(texts(clearDone(l)), "third");
  assert.equal(removeTodo(l, "3").length, 2);
});

test("applyOp routes every op", () => {
  let l = applyOp([], { op: "add", text: "a" }, 1, "id1");
  l = applyOp(l, { op: "add", text: "b" }, 2, "id2");
  assert.equal(texts(l), "b,a");
  l = applyOp(l, { op: "move", id: "id2", delta: 1 }, 3, "x");
  assert.equal(texts(l), "a,b");
  l = applyOp(l, { op: "setDone", id: "id1", done: true }, 4, "x");
  l = applyOp(l, { op: "toggle", id: "id2" }, 5, "x");
  assert.equal(l.filter((t) => t.done).length, 2);
  l = applyOp(l, { op: "edit", id: "id1", text: "A" }, 6, "x");
  assert.equal(l.find((t) => t.id === "id1").text, "A");
  l = applyOp(l, { op: "remove", id: "id2" }, 7, "x");
  l = applyOp(l, { op: "clearDone" }, 8, "x");
  assert.deepEqual(l, []);
});

test("resolveId takes a unique prefix", () => {
  const l = [{ id: "a3f9c21e" }, { id: "a3f0aaaa" }, { id: "bbbbbbbb" }];
  assert.equal(resolveId(l, "a3f9c21e").id, "a3f9c21e");
  assert.equal(resolveId(l, "a3f9").id, "a3f9c21e");
  assert.equal(resolveId(l, "a3f"), "ambiguous");
  assert.equal(resolveId(l, "bb"), null, "under 3 characters is never a prefix");
  assert.equal(resolveId(l, "zzz"), null);
});
