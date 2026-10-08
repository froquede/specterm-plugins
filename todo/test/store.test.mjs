// The file (src/store.ts): concurrent writers from separate processes never
// lose each other's changes, and a broken file is never written over.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { readTodos, updateTodos } from "../src/store.ts";

const tmpFile = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), "todo-store-")), "data", "todos.json");

test("a missing file is an empty list, and the first write makes the folder", async () => {
  const file = tmpFile();
  assert.deepEqual(await readTodos(file), []);
  const l = await updateTodos(file, { op: "add", text: "hello" });
  assert.equal(l[0].text, "hello");
  assert.match(l[0].id, /^[0-9a-f]{8}$/);
  assert.deepEqual(JSON.parse(fs.readFileSync(file, "utf-8")).items, l);
  assert.deepEqual(fs.readdirSync(path.dirname(file)), ["todos.json"], "no temp or lock file left");
});

test("four processes adding at once lose nothing", async () => {
  const file = tmpFile();
  const store = new URL("../src/store.ts", import.meta.url).href;
  const script = `
    const { updateTodos } = await import(${JSON.stringify(store)});
    for (let i = 0; i < 25; i++) await updateTodos(process.argv[1], { op: "add", text: process.argv[2] + "-" + i });
  `;
  await Promise.all(
    ["a", "b", "c", "d"].map(
      (who) =>
        new Promise((resolve, reject) => {
          const p = spawn(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", script, file, who], { stdio: "inherit" });
          p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`writer ${who} exited ${code}`))));
        })
    )
  );
  const l = await readTodos(file);
  assert.equal(l.length, 100);
  assert.equal(new Set(l.map((t) => t.id)).size, 100);
});

test("a file that is not JSON is refused, not overwritten", async () => {
  const file = tmpFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, "{ oops");
  await assert.rejects(updateTodos(file, { op: "add", text: "x" }), /not valid JSON/);
  assert.equal(fs.readFileSync(file, "utf-8"), "{ oops");
});

test("a lock left by a dead process is taken over", async () => {
  const file = tmpFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(`${file}.lock`, "");
  const old = new Date(Date.now() - 60_000);
  fs.utimesSync(`${file}.lock`, old, old);
  const l = await updateTodos(file, { op: "add", text: "after a crash" });
  assert.equal(l.length, 1);
});
