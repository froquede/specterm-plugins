import { createRoot, createSignal, createMemo, For, Show } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { render } from "solid-js/web";
import IconSquare from "lucide-solid/icons/square";
import IconSquareCheck from "lucide-solid/icons/square-check";
import IconX from "lucide-solid/icons/x";
import IconChevronRight from "lucide-solid/icons/chevron-right";
import type { PluginPanelApi } from "../../shared/specterm-plugin-api.ts";
import { type Todo, type TodoOp, MAX_TEXT, parseTodos, applyOp, splitTodos } from "./todos.ts";
import "./panel.css";

// The todo panel: one list for the whole app, in a file the host module owns
// (host.cjs) and Claude can change too (mcp.cjs). The panel applies each
// change to what it shows at once, then sends it to the host; the host's answer,
// and its "changed" event when the file moves under it, are the truth.

// The check's drawn square matches the text's cap height (13px text), not
// the chrome icons' 15px; the stroke is raised to keep the same weight.
const ICON_SIZE = 12;
const ICON_STROKE = 2.2;

// Module-level on purpose: Specterm keeps this module loaded after the view
// closes, so a reopen paints the list it already has.
const state = createRoot(() => {
  // A store reconciled by id: an item keeps its object (and so its row, and
  // the row's focus) across every new copy of the list.
  const [list, setList] = createStore<{ items: Todo[] }>({ items: [] });
  const [error, setError] = createSignal<string | null>(null);
  const [showDone, setShowDone] = createSignal(false);
  return {
    items: () => list.items,
    setItems: (items: Todo[]) => setList("items", reconcile(items, { key: "id" })),
    error,
    setError,
    showDone,
    setShowDone,
  };
});

// The panel that is mounted now; changes go through its host.
let api: PluginPanelApi | null = null;
// Changes go to the host one after another, so an older answer never lands
// after a newer one.
let queue: Promise<unknown> = Promise.resolve();

function showError(err: unknown) {
  state.setError(err instanceof Error ? err.message : String(err));
}

function update(op: TodoOp) {
  const panelApi = api;
  if (!panelApi) return;
  state.setItems(applyOp(state.items(), op, Date.now(), `pending-${Date.now()}`));
  queue = queue.then(() =>
    panelApi.invoke("apply", op).then(
      (items) => {
        state.setError(null);
        state.setItems(parseTodos(items));
      },
      (err) => {
        showError(err);
        return refresh(panelApi);
      }
    )
  );
}

function refresh(panelApi: PluginPanelApi) {
  return panelApi.invoke("list").then((items) => state.setItems(parseTodos(items)), showError);
}

function TodoRow(props: { todo: Todo }) {
  const [editing, setEditing] = createSignal(false);
  let row!: HTMLDivElement;

  const commit = (input: HTMLInputElement) => {
    if (!editing()) return;
    setEditing(false);
    update({ op: "edit", id: props.todo.id, text: input.value });
  };

  const onRowKey = (e: KeyboardEvent) => {
    if (e.target !== row) return;
    if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      setEditing(true);
    } else if (e.key === " ") {
      e.preventDefault();
      update({ op: "toggle", id: props.todo.id });
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      const next = (row.nextElementSibling ?? row.previousElementSibling) as HTMLElement | null;
      update({ op: "remove", id: props.todo.id });
      next?.focus();
    } else if (e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      // Shift, not Alt: Alt+arrow is Specterm's move-between-panes, which runs first.
      e.preventDefault();
      update({ op: "move", id: props.todo.id, delta: e.key === "ArrowUp" ? -1 : 1 });
      // <For> keeps the row's element when it moves, so focus stays with it.
      row.focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const to = e.key === "ArrowUp" ? row.previousElementSibling : row.nextElementSibling;
      (to as HTMLElement | null)?.focus();
    }
  };

  return (
    <div
      ref={row}
      class="todo-row"
      classList={{ done: props.todo.done }}
      tabIndex={0}
      onKeyDown={onRowKey}
    >
      <button
        class="todo-icon-button todo-check"
        title={props.todo.done ? "Mark as open" : "Mark as done"}
        tabIndex={-1}
        onClick={() => update({ op: "toggle", id: props.todo.id })}
      >
        <Show
          when={props.todo.done}
          fallback={<IconSquare size={ICON_SIZE} stroke-width={ICON_STROKE} />}
        >
          <IconSquareCheck size={ICON_SIZE} stroke-width={ICON_STROKE} />
        </Show>
      </button>
      <Show
        when={editing()}
        fallback={
          <span class="todo-text" onDblClick={() => setEditing(true)}>
            {props.todo.text}
          </span>
        }
      >
        <input
          ref={(el) => queueMicrotask(() => el.select())}
          class="todo-edit"
          value={props.todo.text}
          maxLength={MAX_TEXT}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(e.currentTarget);
              row.focus();
            } else if (e.key === "Escape") {
              e.preventDefault();
              setEditing(false);
              row.focus();
            }
          }}
          onBlur={(e) => commit(e.currentTarget)}
        />
      </Show>
      <button
        class="todo-icon-button todo-remove"
        title="Remove"
        tabIndex={-1}
        onClick={() => update({ op: "remove", id: props.todo.id })}
      >
        <IconX size={ICON_SIZE} stroke-width={ICON_STROKE} />
      </button>
    </div>
  );
}

function TodoPanel() {
  const split = createMemo(() => splitTodos(state.items()));
  let input!: HTMLInputElement;
  let openList!: HTMLDivElement;

  const submit = (e: SubmitEvent) => {
    e.preventDefault();
    if (input.value.trim() !== "") update({ op: "add", text: input.value });
    input.value = "";
  };

  return (
    <div class="todo-panel">
      <div class="todo-panel-header">
        <span class="todo-panel-title">Todo</span>
        <Show when={split().open.length > 0}>
          <span class="todo-count">{split().open.length}</span>
        </Show>
      </div>

      <form class="todo-add" onSubmit={submit}>
        <input
          ref={(el) => {
            input = el;
            queueMicrotask(() => el.focus());
          }}
          type="text"
          placeholder="Add a task"
          maxLength={MAX_TEXT}
          onKeyDown={(e) => {
            if (e.key === "Escape") e.currentTarget.blur();
            else if (e.key === "ArrowDown") {
              e.preventDefault();
              (openList.firstElementChild as HTMLElement | null)?.focus();
            }
          }}
        />
      </form>

      <Show when={state.error()}>
        <div class="todo-error">{state.error()}</div>
      </Show>

      <div class="todo-scroll">
        <div class="todo-list" ref={openList}>
          <For each={split().open}>{(t) => <TodoRow todo={t} />}</For>
        </div>
        <Show when={state.items().length === 0}>
          <div class="todo-empty">
            Nothing to do. Type above and press Enter. Double-click a task to edit it; with a
            task focused, Space checks it, Shift+Up and Shift+Down move it, Delete removes it.
          </div>
        </Show>

        <Show when={split().done.length > 0}>
          <div class="todo-done-header">
            <button
              class="todo-done-toggle"
              classList={{ expanded: state.showDone() }}
              onClick={() => state.setShowDone((v) => !v)}
            >
              <IconChevronRight size={ICON_SIZE} stroke-width={ICON_STROKE} />
              Done ({split().done.length})
            </button>
            <button class="todo-clear" onClick={() => update({ op: "clearDone" })}>
              Clear
            </button>
          </div>
          <Show when={state.showDone()}>
            <div class="todo-list">
              <For each={split().done}>{(t) => <TodoRow todo={t} />}</For>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  );
}

/** Specterm's entry point: render into the element it gives us; the returned
 *  function is called when the view closes. */
export function mount(el: HTMLElement, panelApi: PluginPanelApi): () => void {
  api = panelApi;
  // The file changed: Claude, another window, or this panel's own write.
  const offChanged = panelApi.on("changed", (items) => state.setItems(parseTodos(items)));
  void refresh(panelApi);
  const dispose = render(() => <TodoPanel />, el);
  return () => {
    dispose();
    offChanged();
    if (api === panelApi) api = null;
  };
}
