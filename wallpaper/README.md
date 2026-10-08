# Wallpaper

An image behind Specterm's terminals: pick a file or paste a link, then choose
how much of the theme's background the terminals keep over it.

- *Toggle wallpaper settings*: `⌘⇧J` on macOS, `Ctrl+Alt+J` on Linux and
  Windows (rebindable in *Settings → Keybindings*), or the tab-bar button.
- **Choose image…** takes a PNG, JPEG, WebP, GIF, AVIF or SVG of up to 25 MB.
  A link (`https://…`) is loaded from the web every time a window opens.
- **Terminal background**: how much of the theme's background stays over the
  image in a terminal pane (lower shows more of the image). **Dim image**
  darkens it everywhere, **Blur** softens it, and **Size** fills the window,
  fits inside it or tiles it.
- One wallpaper for the whole app: a change shows in every window at once.

## Where it lives

The settings are in the plugin's storage. A picked file is copied to
`<Specterm data folder>/plugin-data/wallpaper/wallpaper` (on Linux,
`~/.config/specterm/plugin-data/wallpaper/`), since plugin storage is too small
for an image; *Remove* deletes it.

## How it draws

The renderer module (`dist/renderer.js`) adds one `<style>` to each window: the
image on a layer under the whole window (`.app::before`, so the blur never
touches the text), and the terminal panes (`.pane`, whose xterm canvas is
already transparent) keep only part of the theme's background. Those are
Specterm's own class names, not part of the plugin API, so a Specterm release
that renames them breaks the wallpaper (the e2e test catches it).

## Cost

The renderer module is about 2 KB and runs after the window's first terminal
has rendered. The host module, which reads the picked file, starts only when a
window needs that file (`"activation": "view"`): with no wallpaper, or with a
link, no plugin process runs.
