# Project Status

Last updated: 2026-06-20

## Current Scope

Reel Pipeline turns approved reel drafts into rendered MP4s via the worker review
flow. The **production render path** is:

`Worker (R2) → Rust watcher → node scripts/render-pro.js → R2 upload → worker patch`

Marketing autopilot and posting run entirely in Rust (`reel` CLI). Node remains for
`render-pro.js`, OAuth bootstrap scripts, and the local dev server.

## Done

- VideoBrief contract, mock/MoneyPrinterTurbo/reel-maker adapters, SaaS Maker sync.
- **Rust orchestrator (`reel/` crate):** 75 tests, all entrypoints on Rust CLI.
- **Production watcher:** `npm run watch:render` → `reel watch --execute`.
- **Marketing autopilot:** intake → render → post in Rust (`npm run autopilot`).
- **Native social posting:** YouTube resumable upload + Instagram Graph reels in
  `reel/src/publishers/`; `--posting-provider auto` routes by channel + account config.
- **OpenShorts removed from pipeline:** was never a real renderer (job-spec stub only).
  Submodule under `engines/openshorts` remains parked; adapter deleted.
- **JS glue retired:** `auto-render-watcher.js`, `marketing-autopilot.js`,
  `render-accepted-marketing-posts.js`, `post-ready-marketing-videos.js` deleted.
- **Watcher parity:** `npm run validate:watcher`.

## Planned Next

- Staging sign-off on live render asset URLs after Rust watcher runs.
- Remove `engines/openshorts` git submodule (explicit approval; submodule only).
- Wire draft bundle output into review UI without paid engines.

## Deferred / Parked

- Cloudflare Worker rewrite (stay on JS).
- reel-maker / Remotion path (keep for product-proof experiments; render-pro is canonical).
