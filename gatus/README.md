# Gatus

Watches a [Gatus](https://github.com/TwiN/gatus) status page and tells you when
something important goes down, without getting in the way: a count on the
tab-bar button while anything is down, and a toast when an alert opens or
recovers. Everything else that is failing stays in the panel.

- *Toggle Gatus status*: `⌘⇧G` on macOS, `Ctrl+Alt+G` on Linux and Windows
  (rebindable in *Settings → Keybindings*), or the tab-bar button.
- Set the server's address in the panel (`https://status.example.com`), and an
  *Authorization header* if it needs one (`Bearer …`, `Basic …`).

## What alerts

A check alerts when its last **N** results all failed (*Alert after failures in
a row*, 3 by default), so a single blip doesn't. Failing checks are bundled, so
one outage is one alert:

1. the same check name failing in **G** groups or more (*Bundle from*, 3 by
   default) is one alert, e.g. "API failing in 12 groups";
2. of the rest, **G** or more failing checks in one group are one alert, e.g.
   "shop: 4 checks failing";
3. what is left alerts one check at a time.

A check moving from one bundle to another while it keeps failing is not news,
and doesn't alert again. An alert recovers when none of its checks fails.

Two lists change this, one pattern per line:

- **Alert on first failure**: these alert on their first failed result.
- **Never alert**: these are ignored, and not listed either.

A pattern is `group/name`, with `*` matching anything and case ignored:
`infra/*`, `*/API`, `shop/payments-*`. Without a `/` it matches the name in any
group.

The status page itself not answering 3 polls in a row is an alert too.

The count is over results, not polls, so how often a check runs matters. A
check Gatus runs once a day needs N days to alert, so put checks like that on
the first list.

## How it works

The host module (`host.cjs`) starts with Specterm (`"activation": "startup"`)
and polls `GET <address>/api/v1/endpoints/statuses?page=1&pageSize=<N>` every
60 s by default (*Poll every*, 30 s to 1 h). `pageSize` limits the results per
check, not the number of checks, so one request reads them all: about 300 KB
for 1,200 checks at N = 1.

It keeps two files in `<Specterm data folder>/plugin-data/gatus/` (on Linux,
`~/.config/specterm/plugin-data/gatus/`):

- `config.json`, the settings, readable only by you. The panel never reads the
  header back once it is saved.
- `state.json`, what is down. After a restart it doesn't alert again on what
  it already alerted on.

A toast shows in every window where the panel isn't open, one per poll: a new
alert wins over a recovery, and the rest are counted on it. Clicking it opens
the panel on that alert. Specterm doesn't let plugins show system notifications
or play sounds, and this plugin doesn't work around that.
