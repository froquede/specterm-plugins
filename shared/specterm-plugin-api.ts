// The parts of Specterm's plugin API (1.3) these plugins use, copied from
// specterm (src/components/PluginView.tsx, electron/plugin-host.cjs). Types
// only: nothing here ends up in a build. See specterm's
// docs/plugin-architecture.md for the full reference.

export interface PluginStorage {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  onChange(cb: (key: string, value: unknown) => void): () => void;
}

/** What a panel module's `mount(element, api)` is given. */
export interface PluginPanelApi {
  apiVersion: string;
  pluginId: string;
  viewId: string;
  invoke(method: string, ...args: unknown[]): Promise<unknown>;
  on(event: string, cb: (payload: unknown) => void): () => void;
  close(): void;
  onReveal(cb: (payload: unknown) => void): () => void;
  renderMarkdown(source: string): string;
  platform: "darwin" | "win32" | "linux";
  openExternal(url: string): void;
  onActiveCwd(cb: (cwd: string | null) => void): () => void;
  openFile(path: string, mode?: "tab" | "split"): void;
  storage: PluginStorage;
  onActiveFile(cb: (path: string | null) => void): () => void;
  showView(viewId: string): void;
}

/** What a host module's `activate(ctx)` is given. */
export interface PluginHostContext {
  id: string;
  storagePath: string;
  handle(method: string, fn: (...args: any[]) => unknown): { dispose(): void };
  emit(event: string, payload?: unknown): void;
  setBadge(value: number | "dot" | null): void;
  openExternal(url: string): void;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimer(handle: unknown): void;
  onDispose(fn: () => void): void;
}
