// Storage's onChange reports other windows' writes only. The panel and the
// renderer module are built together and share this module, so the panel's
// own writes reach the renderer through it.

const listeners = new Set<() => void>();

export function onLocalChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function notifyLocalChange() {
  for (const cb of [...listeners]) cb();
}
