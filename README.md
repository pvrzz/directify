# directify

A feature-rich, unofficial client for [catboy.best](https://catboy.best). Seamlessly search,
download, and manage your osu! beatmaps and beatpacks.

**[Download the latest release](https://github.com/pvrzz/directify/releases)** · Windows 10+,
portable `.exe`, no installer.

directify is an osu!direct-style companion for **osu!stable/osu!classic**: search and install
beatmaps straight into your `Songs` folder, back your library up into portable "beatpacks", and
manage collections — all from one desktop app, with the actual beatmap search/download handled by
[catboy.best](https://catboy.best) (or any other compatible mirror you point it at).

## Features

- **osu!lazer-style search** — filter by mode (Standard/Taiko/Catch/Mania), mania key count,
  genre, language, and a min/max star-rating range, on top of the usual title/artist/tag search.
- **Multiple beatmap sources with automatic fallback** — ships with catboy.best and osu.direct
  built in; add your own compatible mirror, reorder the fallback chain, or disable one without
  removing it. If your first choice is down, directify quietly tries the next.
- **Library management** — scans your `Songs` folder directly (no dependency on osu!'s own
  `osu!.db`), shows what's actually installed, and lets you bulk-select maps to add to a
  collection or delete.
- **Offline cover art** — caches each map's cover image locally on install (and backfills it for
  maps you already had), so your library still looks right with no internet connection.
- **Collections editor** — reads and writes osu!stable's `collection.db` directly; changes show
  up in-game the next time you restart osu!.
- **Beatpacks (backup/restore)** — zip your whole library or a hand-picked subset into a portable
  archive, and restore it on any machine.
- **Light/dark theme**, a reduce-motion toggle, keyboard shortcuts (press `?` in the app), and
  proxy support (HTTP/HTTPS/SOCKS4/SOCKS5) for restricted networks.
- **Localized** — English, Spanish, and Japanese ship today; more are welcome (see
  [Contributing](#contributing)).

## Installing

1. Grab the latest portable `.exe` from **[Releases](https://github.com/pvrzz/directify/releases)**.
2. Run it — no installer, no admin rights needed.
3. That's it. Settings, cached cover art, and everything else directify needs live in your user
   `AppData` folder, not next to the `.exe`, so **updating is just replacing the `.exe`** with a
   newer one. directify checks GitHub Releases on launch and tells you in-app when a newer build
   is available.

## Project layout

This is a pnpm monorepo:

- **`apps/desktop`** — the actual product: an Electron + React app. Beatmap source adapters live
  in `apps/desktop/src/main/sources` (a generic `MirrorSource` class works against any
  catboy.best-compatible API); `apps/desktop/src/main/source-registry.ts` handles the
  fallback chain and per-source rate-limiting.
- **`apps/web`** — the landing page (Next.js) at [directify.pvrz.lol](https://directify.pvrz.lol):
  hero, feature overview, and a download link to this repo's Releases — it doesn't do any beatmap
  searching itself.
- **`packages/shared`** — types shared across apps, plus the `collection.db` binary reader/writer.
- **`packages/ui`** — the shared design system (theme tokens, `Button`, `Card`, `Icon`,
  `DualRangeSlider`, ...) used by both the desktop renderer and the website.

## Development

```bash
pnpm install
pnpm dev:desktop   # Electron app
pnpm dev:web       # Landing page at http://localhost:3000
```

Build a real portable `.exe` (same thing the Releases page ships):

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
`apps/desktop/src/renderer/src/i18n.ts`. Adding a beatmap source doesn't require any code at all —
add it from Settings as long as it exposes the same `GET /api/search`, `GET /api/v2/s/:id`, and
`GET /d/:id` shape catboy.best does.

## Disclaimer

directify is a fan-made, unofficial project and is not affiliated with or endorsed by catboy.best,
osu!, or ppy Pty Ltd.
