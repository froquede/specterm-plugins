# Wallpaper

An image, a GIF or a video behind Specterm's terminals, in the spirit of
Wallpaper Engine: pick a file or paste a link, then choose how much of the
theme's background the terminals keep over it.

- *Toggle wallpaper settings*: `⌘⇧J` on macOS, `Ctrl+Alt+J` on Linux and
  Windows (rebindable in *Settings → Keybindings*), or the tab-bar button.
- **Choose file…** takes PNG, JPEG, WebP, GIF (animated), AVIF, SVG, MP4 or
  WebM, up to 300 MB. A video plays muted and looping at its own resolution
  (4K included, as far as the GPU goes), and pauses while the window is
  minimized or hidden. A link (`https://…`) to an image or to a `.mp4`/`.webm`
  is loaded from the web every time a window opens.
- **Terminal background**: how much of the theme's background stays over the
  wallpaper in a terminal pane (lower shows more of it). **Dim** darkens it
  everywhere, **Blur** softens it, and **Size** fills the window, fits inside
  it or tiles it (images only; a video fills).
- One wallpaper for the whole app: a change shows in every window at once.

## Where it lives

The settings are in the plugin's storage. A picked file is copied to
`<Specterm data folder>/plugin-data/wallpaper/` (on Linux,
`~/.config/specterm/plugin-data/wallpaper/`), under a new name each time, and
the previous one is deleted; *Remove* deletes it too.

## How it draws

The renderer module (`dist/renderer.js`) adds one `<style>` to each window, and
for a video one `<video>`: the wallpaper sits under the whole window (an image
on `.app::before`, a video below it), so the blur never touches the text, and
the terminal panes (`.pane`, whose xterm canvas is already transparent) keep
only part of the theme's background. Those are Specterm's own class names, not
part of the plugin API, so a Specterm release that renames them breaks the
wallpaper (the e2e test catches it). A picked file is loaded as `file://`,
which works in a built Specterm, not under its Vite dev server.

## Cost

The renderer module is a few KB and runs after the window's first terminal has
rendered. Windows read the picked file straight from disk, so the host module,
which only copies a picked file in, starts when a file is picked or removed
(`"activation": "view"`) and at no launch. A playing video costs what any
looping video does; it stops while the window is hidden.
