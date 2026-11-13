# Zabbix

Watches a [Zabbix](https://www.zabbix.com) server and tells you when a problem
that matters opens, without getting in the way: a count on the tab-bar button
while anything alerts, and a toast when an alert opens or resolves. Everything
else that is active stays in the panel.

- *Toggle Zabbix problems*: `⌘⇧X` on macOS, `Ctrl+Alt+X` on Linux and Windows
  (rebindable in *Settings → Keybindings*), or the tab-bar button.
- Set the frontend's address in the panel (`https://zabbix.example.com`) and
  an **API token** (*Users → API tokens* in Zabbix). The plugin only reads, so
  a token for a user with read-only access to the hosts you care about is
  enough. Zabbix 5.4 or later.

## What alerts

Zabbix already decides when something is a problem: each trigger has its own
expression and timing. The plugin alerts on an active problem when:

- its severity is at least *Alert from severity* (High by default; the latest
  event's severity counts, so a severity changed in Zabbix is respected);
- its host is not in maintenance;
- it is not acknowledged (unless *Alert on acknowledged problems too* is on).

Active problems that miss one of these are listed under *Active, not
alerted*, tagged with the reason. Acknowledging a problem in Zabbix resolves
its alert here.

Problems are bundled, so one outage is one alert:

1. the same problem on **G** hosts or more (*Bundle from*, 3 by default) is
   one alert, e.g. "Zabbix agent is not available on 5 hosts";
2. of the rest, **G** or more problems on one host are one alert, e.g.
   "pve01: 4 problems";
3. what is left alerts one problem at a time.

A problem moving from one bundle to another while it stays active is not
news, and doesn't alert again.

**Never alert** takes one pattern per line, `host/problem`, with `*` matching
anything and case ignored: `Dev-*/*`, `*/High swap space usage`. Without a `/`
it matches the problem on any host. The first `/` splits host from problem, so
a problem that starts with one is written `*//data: Disk space*`.

Zabbix not answering 3 polls in a row is an alert too.

## The right-click menu

Right-click (or `Shift+F10`) an alert or a problem:

- **Ask Claude about it** opens a terminal tab running Claude Code, in the
  directory of the pane in use, asking it to look into those problems read
  only and wait. The prompt names them by trigger and event id and gives the
  API address; Claude reads the rest itself, so nothing from Zabbix ends up on
  a command line. Needs Specterm 1.4 or later.
- **Open in Zabbix** (the Problems page filtered to them) and **Open the
  event**. Double-clicking a problem opens it too.
- **Copy text** and **Copy link**.

## An expired certificate

*Accept an expired certificate* forgives only expiry: the plugin connects
first, checks that the chain reaches a trusted root and that the certificate
names the host, and only then sends the request with the token. A
self-signed certificate, an unknown root or another host's certificate are
still refused. Renewing the certificate is the real fix.

## How it works

The host module (`host.cjs`) starts with Specterm (`"activation": "startup"`)
and calls `trigger.get` on `<address>/api_jsonrpc.php` every 60 s by default
(*Poll every*, 30 s to 1 h): problem triggers on monitored hosts, dependents
skipped, with their host and latest event. That is one small request whatever
the number of hosts.

It keeps two files in `<Specterm data folder>/plugin-data/zabbix/` (on Linux,
`~/.config/specterm/plugin-data/zabbix/`):

- `config.json`, the settings, readable only by you. The panel never reads the
  token back once it is saved.
- `state.json`, what alerts. After a restart it doesn't alert again on what it
  already alerted on.

A toast shows in every window where the panel isn't open, one per poll: a new
alert wins over a resolution (the worst one first), and the rest are counted
on it. Clicking it opens the panel on that alert.
