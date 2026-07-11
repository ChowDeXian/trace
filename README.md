# Trace

A personal daily mood journal — log how you feel and why, then trace back to see what drove it. Offline-first PWA, installable on iPhone. All data stays on your device.

## Features

- **Today** — pick a mood (1–5, emoji), write what happened, tag the reasons (work, sleep, gym, …, plus your own tags). Multiple entries per day.
- **History** — calendar color-coded by each day's average mood, scrollable timeline, and full-text search across notes and tags.
- **Insights** — mood-over-time chart with 7-day average, logging streaks, best/worst days and weekdays, and which tags lift or drag your mood.
- **Settings** — JSON export/import backup, tag manager, week-start preference, delete-all.

## Stack

Vite + React + TypeScript, `vite-plugin-pwa` (Workbox, auto-update service worker). No router, no chart library — hand-rolled SVG charts keep the bundle at ~55 KB gzipped. Data lives in `localStorage` under the key `trace.v1` as one schema-versioned JSON blob.

## Commands

```sh
npm run dev      # dev server (HTTPS on LAN for iPhone testing)
npm test         # vitest unit tests (dates, storage, backup, insights)
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build
npm run icons    # regenerate public/icons/ PNGs
```

## Notes

- Built for GitHub Pages compatibility (`base: './'`); deploy by publishing `dist/`.
- iOS: install via Share → Add to Home Screen. The app requests durable storage, but export a JSON backup now and then — your journal only lives on this device.
- Backup files are validated on import (app id, schema version, shape); import replaces all current data after a confirmation.
