# Todo

A todo list in Specterm's sidebar, and the same list for Claude: any Claude
Code session can list, add, complete, edit, move and remove its tasks, and the
open panel redraws as it does.

- One list for the whole app, shared by every window.
- *Toggle todo list*: `⌘⇧O` on macOS, `Ctrl+Alt+O` on Linux and Windows
  (rebindable in *Settings → Keybindings*).
- In the panel: type and press Enter to add (to the top). Double-click a task
  to edit it. With a task focused (Tab, or Down from the add field): Space
  checks it, Enter edits it, Shift+Up and Shift+Down move it, Delete removes it.
  Done tasks collect under *Done*, which *Clear* empties.

## Letting Claude use it

The plugin ships an MCP server, `mcp.cjs`, with everything it needs bundled in.
Register it once, for every project:

```sh
# Linux
claude mcp add -s user specterm-todo -- node ~/.config/specterm/plugins/todo/mcp.cjs
# macOS
claude mcp add -s user specterm-todo -- node ~/Library/"Application Support"/specterm/plugins/todo/mcp.cjs
```

It updates with the plugin. Tools: `list_todos`, `add_todo`, `complete_todo`,
`reopen_todo`, `edit_todo`, `move_todo`, `remove_todo`, `clear_done_todos`.
Ids are 8 hex characters; any unique prefix of 3 or more works.

## Where the list lives

`<Specterm data folder>/plugin-data/todo/todos.json` (on Linux,
`~/.config/specterm/plugin-data/todo/todos.json`). Specterm's plugin host and
the MCP server both change it under a lock file and replace it in one rename,
so neither ever loses the other's change. `SPECTERM_TODO_FILE` points the MCP
server at another file.

## Cost

The host module starts only when the panel is first opened
(`"activation": "view"`), so a launch that never opens it runs no plugin code.
