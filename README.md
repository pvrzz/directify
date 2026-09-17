<p align="center">
  <img src="https://i.imgur.com/VQLj8Zw.png" alt="directify" width="180" />
</p>

<p align="center">
  A feature-rich, unofficial client for <a href="https://catboy.best">catboy.best</a>.<br />
  Seamlessly search, download, and manage your osu! beatmaps and beatpacks.
</p>

<p align="center">
  <a href="https://github.com/pvrzz/directify/releases/latest"><img src="https://img.shields.io/github/v/release/pvrzz/directify?style=flat-square&color=ff66ab&label=release" alt="Latest release" /></a>
  <a href="https://github.com/pvrzz/directify/releases"><img src="https://img.shields.io/github/downloads/pvrzz/directify/total?style=flat-square&color=66ccff&label=downloads" alt="Downloads" /></a>
  <a href="https://github.com/pvrzz/directify/blob/main/LICENSE"><img src="https://img.shields.io/github/license/pvrzz/directify?style=flat-square&color=b3ff66" alt="License" /></a>
  <img src="https://img.shields.io/badge/platform-Windows-0078D6?style=flat-square" alt="Platform: Windows" />
  <a href="https://github.com/pvrzz/directify/issues"><img src="https://img.shields.io/github/issues/pvrzz/directify?style=flat-square&color=orange" alt="Open issues" /></a>
  <a href="https://github.com/pvrzz/directify/stargazers"><img src="https://img.shields.io/github/stars/pvrzz/directify?style=flat-square&color=yellow" alt="Stars" /></a>
</p>

<p align="center">
  <a href="https://github.com/pvrzz/directify/releases"><b>Download the latest release</b></a>
  ·
  <a href="#features">Features</a>
  ·
  <a href="#installing">Installing</a>
  ·
  <a href="#development">Development</a>
</p>

---

directify is an osu!direct-style companion for **osu!stable/osu!classic**. Search and install
beatmaps straight into your `Songs` folder, back your library up into portable "beatpacks", and
manage collections, all from one desktop app. The actual beatmap search and download is handled by
[catboy.best](https://catboy.best) (or any other compatible mirror you point it at).

## Features

- **osu!lazer-style search**: filter by mode (Standard/Taiko/Catch/Mania), mania key count,
  genre, language, and a min/max star-rating range, on top of the usual title/artist/tag search.
- **Multiple beatmap sources with automatic fallback**: ships with catboy.best and osu.direct
  built in. Add your own compatible mirror, reorder the fallback chain, or disable one without
  removing it. If your first choice is down, directify quietly tries the next.
- **Library management**: scans your `Songs` folder directly (no dependency on osu!'s own
  `osu!.db`), shows what's actually installed, and lets you bulk-select maps to add to a
  collection or delete.
- **Offline cover art**: caches each map's cover image locally on install, and backfills it for
  maps you already had, so your library still looks right with no internet connection.
- **Collections editor**: reads and writes osu!stable's `collection.db` directly. Changes show
  up in-game the next time you restart osu!.
- **Beatpacks (backup/restore)**: zip your whole library or a hand-picked subset into a portable
  archive, and restore it on any machine.
- **Light/dark theme**, a reduce-motion toggle, keyboard shortcuts (press `?` in the app), and
  proxy support (HTTP/HTTPS/SOCKS4/SOCKS5) for restricted networks.
- **Localized**: English, Spanish, and Japanese ship today. More are welcome; see
  [Contributing](#contributing).

## Installing

1. Grab the latest portable `.exe` from **[Releases](https://github.com/pvrzz/directify/releases)**.
2. Run it. No installer, no admin rights needed.
3. That's it. Settings, cached cover art, and everything else directify needs live in your user
   `AppData` folder, not next to the `.exe`, so **updating is just replacing the `.exe`** with a
   newer one. directify checks GitHub Releases on launch and tells you in-app when a newer build
   is available.

## Project layout

This is a pnpm monorepo:

| Path | What it is |
| --- | --- |
| `apps/desktop` | The actual product: an Electron + React app. Beatmap source adapters live in `apps/desktop/src/main/sources` (a generic `MirrorSource` class works against any catboy.best-compatible API); `apps/desktop/src/main/source-registry.ts` handles the fallback chain and per-source rate limiting. |
| `apps/web` | The landing page (Next.js) at [directify.pvrz.lol](https://directify.pvrz.lol): hero, feature overview, and a download link to this repo's Releases. It doesn't do any beatmap searching itself. |
| `packages/shared` | Types shared across apps, plus the `collection.db` binary reader/writer. |
| `packages/ui` | The shared design system (theme tokens, `Button`, `Card`, `Icon`, `DualRangeSlider`, and more) used by both the desktop renderer and the website. |

## Development

```bash
pnpm install
pnpm dev:desktop   # Electron app
pnpm dev:web       # Landing page at http://localhost:3000
```

Build a real portable `.exe`, the same thing the Releases page ships:

```bash
pnpm --filter @directify/desktop package
```

Run the shared-package tests (covers the `collection.db` round-trip):

```bash
pnpm --filter @directify/shared test
```

## Contributing

Adding a language is just a new `apps/desktop/src/renderer/src/locales/<code>.json` (copy
`en.json` and translate the values) plus registering it in
`apps/desktop/src/renderer/src/i18n.ts`. Adding a beatmap source doesn't require any code at all:
add it from Settings, as long as it exposes the same `GET /api/search`, `GET /api/v2/s/:id`, and
`GET /d/:id` shape catboy.best does.

## Disclaimer

directify is a fan-made, unofficial project. It is not affiliated with or endorsed by catboy.best,
osu!, or ppy Pty Ltd.
