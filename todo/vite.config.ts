import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

// The panel module and its stylesheet, the two files specterm-plugin.json
// points at. Solid and the icons are bundled in: a plugin brings its own, it
// never shares Specterm's. dist/ is committed, because installing a plugin is a
// clone with no build step. host.cjs and mcp.cjs are built by build.mjs.
export default defineConfig({
  root: __dirname,
  plugins: [solidPlugin()],
  logLevel: "warn",
  build: {
    lib: {
      entry: "src/panel.tsx",
      formats: ["es"],
      fileName: () => "panel.js",
      cssFileName: "panel",
    },
    outDir: "dist",
    emptyOutDir: true,
    // Electron 33, the Chromium Specterm ships.
    target: "chrome130",
  },
});
