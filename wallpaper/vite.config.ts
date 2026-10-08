import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

// Two entries, the panel module and the renderer module, built together so
// what they share (settings.ts, bus.ts) is one chunk and one copy in the
// window: the panel's own writes reach the renderer through it. dist/ is
// committed, because installing a plugin is a clone with no build step.
// host.cjs is built by build.mjs.
export default defineConfig({
  root: __dirname,
  plugins: [solidPlugin()],
  logLevel: "warn",
  build: {
    lib: {
      entry: { panel: "src/panel.tsx", renderer: "src/renderer.ts" },
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
      cssFileName: "panel",
    },
    outDir: "dist",
    emptyOutDir: true,
    // Electron 33, the Chromium Specterm ships.
    target: "chrome130",
  },
});
