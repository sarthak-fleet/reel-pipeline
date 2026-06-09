# Project Status

Last updated: 2026-06-09

## Current Scope

Reel Pipeline is an AI reel generation product that turns input text and project context into reviewable short-form video drafts, render jobs, artifacts, and posting handoff. Its current internal inputs are SaaS Maker marketing ideas and High Signal reel briefs, with SaaS Maker remaining the source of truth for approvals and task linkage.

## Done

- VideoBrief contract, mock/MoneyPrinterTurbo/OpenShorts/reel-maker adapters, SaaS Maker sync.
- Signal intake from High Signal reel briefs and SaaS Maker improvement fixtures (`src/signal-intake.js`).
- **Prototype signal-to-reel draft generator** (`src/signal-draft-generator.js`): fixture brief → 2+ variant bundles (storyboard, script, shot list, captions) with claim/evidence review and unsupported-claim rejection.
- CLI: `npm run draft:signal -- --fixture test/fixtures/high-signal-reel-brief.json`
- Tests: `test/signal-draft-generator.test.js` (run via `npm test`).
- OSS media-pipeline integrations were evaluated in
  `docs/oss-integration-evaluation.md`; the current decision is no new
  dependency yet, with optional WhisperX/stable-ts caption-alignment QA as the
  first low-risk adapter.

## Planned Next

- Wire draft bundle output into review UI and optional render queue without paid engines.
- SaaS Maker task linkage for generated draft bundles.
- Add fixture-backed caption QA for rendered drafts before real posting or paid
  UGC engines.

## Deferred / Parked

- Real UGC actor pipeline (OpenShorts paid deps).
- Autopost provider wiring.
- Custom artifact domain.
