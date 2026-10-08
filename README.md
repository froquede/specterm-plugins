# specterm-plugins

Plugins for [Specterm](https://github.com/froquede/specterm), one folder each.

| Plugin | What it does |
|---|---|
| [todo](todo/) | A todo list in the sidebar that any Claude Code session can read and change. |
| [wallpaper](wallpaper/) | An image behind the terminals, picked from a file or a link. |

## Installing one

In Specterm, *Settings → Plugins*, paste the plugin folder's link:

```
https://github.com/froquede/specterm-plugins#:todo
```

With no tag, Specterm takes the newest release of that plugin (`todo-v*`) and
from then on updates it on its own. A link to a folder at a tag
(`…/tree/todo-v1.0.0/todo`) pins that release.

## How the repo is laid out

Specterm installs a plugin from a subfolder by cloning the repo and keeping that
folder. The rules that come from this (see Specterm's
`docs/plugin-architecture.md`, Distribution and Updates):

- **One folder per plugin, at the root, with a unique name.** A plugin's release
  tags are `<folder>-v<semver>`, and only the last part of the path names them,
  so `a/todo` and `b/todo` would share tags.
- **Built files are committed.** Installing is a clone with no build step, so
  `dist/` and any bundled Node entry points (`host.cjs`, `mcp.cjs`) are in git,
  rebuilt before every release.
- **Code shared between plugins** goes in `shared/`. The build bundles it into
  each plugin, so an installed plugin never reaches outside its folder.

## Releasing a plugin

```sh
npm install
npm run build:todo          # rebuilds dist/, host.cjs and mcp.cjs
npm test && npm run e2e:todo
# bump "version" in todo/specterm-plugin.json, then:
git commit -am "todo: release v1.1.0"
git tag todo-v1.1.0
git push origin main todo-v1.1.0
```

A minor or patch release reaches everyone with automatic updates on. A new
major waits for each user to accept it.

`npm run e2e:todo` needs a built Specterm checkout next to this repo (or at
`SPECTERM_DIR`).
