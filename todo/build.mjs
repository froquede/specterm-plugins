// The two Node entry points, each bundled into one CommonJS file at the
// plugin's root: host.cjs (loaded by Specterm's plugin host with require) and
// mcp.cjs (run by Claude Code as `node mcp.cjs`, with the MCP SDK inside, so
// the installed plugin needs no node_modules).
import { build } from "esbuild";
import path from "node:path";

const here = import.meta.dirname;
const common = { bundle: true, platform: "node", format: "cjs", target: "node20", logLevel: "warning" };

await build({ ...common, entryPoints: [path.join(here, "src/host.ts")], outfile: path.join(here, "host.cjs") });
await build({
  ...common,
  entryPoints: [path.join(here, "src/mcp.ts")],
  outfile: path.join(here, "mcp.cjs"),
  minify: true,
  legalComments: "eof",
});
