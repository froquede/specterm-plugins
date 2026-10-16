// The host module, bundled into one CommonJS file at the plugin's root
// (host.cjs, loaded by Specterm's plugin host with require).
import { build } from "esbuild";
import path from "node:path";

const here = import.meta.dirname;
await build({
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  logLevel: "warning",
  entryPoints: [path.join(here, "src/host.ts")],
  outfile: path.join(here, "host.cjs"),
});
