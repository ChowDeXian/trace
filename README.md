# FeelNote

A personal daily feelings journal — log what you feel, how strongly, and why, then look back to see what drove it. Offline-first PWA, installable on iPhone. All data stays on your device.

Built for identifying triggers, recognizing patterns over time, monitoring mental health, and making feelings easier to discuss in therapy.

## Features

- **Today** — pick a feeling (happy, calm, neutral, sad, anxious, frustrated), rate its intensity 1–10, write what happened, tag the reasons (work, sleep, gym, …, plus your own tags). Multiple entries per day.
- **History** — calendar color-coded by each day's dominant feeling (deeper = more intense), scrollable timeline, and full-text search across notes and tags.
- **Insights** — wellbeing-over-time chart (signed valence score, −10..+10) with 7-day average, per-feeling weekly trends, time-of-day patterns, logging streaks, best/worst days and weekdays, tags that lift or drag, and which feelings go with each tag.
- **Settings** — JSON export/import backup, tag manager, week-start preference, delete-all.

## Stack

Vite + React + TypeScript, `vite-plugin-pwa` (Workbox, auto-update service worker). No router, no chart library — hand-rolled SVG charts keep the bundle small. Data lives in `localStorage` under the key `feelnote.v2` as one schema-versioned JSON blob.

## Commands

```sh
npm run dev      # dev server (HTTPS on LAN for iPhone testing)
npm test         # vitest unit tests (dates, storage, backup, insights, feelings)
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build
```

App icons in `public/icons/` are cropped/resized from the artwork in `assets/app-icon.jpeg`.

## Notes

- Built for GitHub Pages compatibility (`base: './'`); deploy by publishing `dist/`.
- iOS: install via Share → Add to Home Screen. The app requests durable storage, but export a JSON backup now and then — your journal only lives on this device.
- Backup files are validated on import (app id, schema version, shape); import replaces all current data after a confirmation. Backups from the old Trace app (1–5 mood scale) are not importable.
