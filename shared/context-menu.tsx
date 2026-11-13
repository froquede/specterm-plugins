import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { Portal } from "solid-js/web";

// A right-click menu for plugin panels, shared by the plugins in this repo
// (copied from the Sprint Platform plugin's). It looks like Specterm's own (the file tree's): portalled to <body> so the sidebar's
// overflow can't clip it, kept inside the window, closed by a click anywhere
// else, Escape, or a pick. The arrow keys move between the items.

export type MenuItem = { label: string; run: () => void } | "separator";

export interface MenuRequest {
  x: number;
  y: number;
  items: MenuItem[];
}

// Where a menu opened from the keyboard (Shift+F10, the context-menu key)
// goes: under the element, as the mouse would have put it.
export function menuAt(e: MouseEvent | KeyboardEvent): { x: number; y: number } {
  if (e instanceof MouseEvent && (e.clientX || e.clientY)) return { x: e.clientX, y: e.clientY };
  const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
  return { x: box.left + 12, y: box.top + Math.min(box.height, 24) };
}

export const opensMenu = (e: KeyboardEvent) => e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey);

const EDGE = 8;

export function ContextMenu(props: { menu: MenuRequest; onClose: () => void }) {
  let box: HTMLDivElement | undefined;
  const [pos, setPos] = createSignal({ x: props.menu.x, y: props.menu.y });
  // Whatever had focus gets it back, so the keyboard stays where it was.
  const opener = document.activeElement as HTMLElement | null;

  const buttons = () => [...(box?.querySelectorAll<HTMLButtonElement>(".sp-menu-item") ?? [])];

  onMount(() => {
    if (!box) return;
    const { width, height } = box.getBoundingClientRect();
    setPos({
      x: Math.max(EDGE, Math.min(props.menu.x, window.innerWidth - width - EDGE)),
      y: Math.max(EDGE, Math.min(props.menu.y, window.innerHeight - height - EDGE)),
    });
    buttons()[0]?.focus();
  });
  onCleanup(() => opener?.focus?.());

  function pick(item: Exclude<MenuItem, "separator">) {
    props.onClose();
    item.run();
  }

  function onKeyDown(e: KeyboardEvent) {
    e.stopPropagation();
    const list = buttons();
    const at = list.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Escape") {
      e.preventDefault();
      props.onClose();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      list[(at + step + list.length) % list.length]?.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      (e.key === "Home" ? list[0] : list[list.length - 1])?.focus();
    } else if (e.key === "Tab") {
      e.preventDefault();
      props.onClose();
    }
  }

  return (
    <Portal>
      <div
        class="sp-menu-backdrop"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) props.onClose();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          props.onClose();
        }}
      >
        <div
          class="sp-menu"
          role="menu"
          ref={box}
          style={{ left: `${pos().x}px`, top: `${pos().y}px` }}
          onKeyDown={onKeyDown}
          onContextMenu={(e) => e.preventDefault()}
        >
          <For each={props.menu.items}>
            {(item) => (
              <Show when={item !== "separator" && item} fallback={<div class="sp-menu-sep" role="separator" />}>
                {(it) => (
                  <button type="button" class="sp-menu-item" role="menuitem" onClick={() => pick(it())}>
                    {it().label}
                  </button>
                )}
              </Show>
            )}
          </For>
        </div>
      </div>
    </Portal>
  );
}
