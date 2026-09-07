# Brand-render qualification — 2026-09-07

The documented `npm run render:package` command previously failed during
module resolution: two imports still assumed a sibling `reel-pipeline/`
directory inside this checkout. `render:pro` had the same stale layout in two
imports. Both entrypoints now reach their existing input/credential guards.
The remote Foundry handoff was not exercised.

A real render then exposed a separate timing defect: FFmpeg's `-shortest`
ended scenes with their narration even when the adapter requested at least
2.8 seconds for reading. The first fixture output was 13.985 seconds while
the receipt claimed 16.693. A regression with five 0.25-second audio clips
encoded only 1.273 seconds instead of the intended 14 seconds before repair.
Padding short audio now preserves reading time; receipts probe the completed
MP4 instead of adding planned scene lengths.

The final approved synthetic fixture was rendered with the already installed
local Kokoro model, temporary Playwright Chromium, and FFmpeg. No paid
generation, account write, provider publication, release, or production
configuration change occurred. Chromium's temporary installation and both
temporary render directories were removed after retaining the evidence.

- [Draft MP4](../../fixtures/brand-shareability/brand-fixture.mp4): 434,585 bytes,
  1080×1920 H.264/AAC, 500 video frames, 16.727-second container duration.
- [Machine receipt](../../fixtures/brand-shareability/qualification.json):
  SHA-256, independent FFprobe output, successful full decode and advancing
  muted playback at 390/1440 viewport widths; no horizontal overflow.
- [Phone-width review](../../fixtures/brand-shareability/review-390.png) and
  [desktop review](../../fixtures/brand-shareability/review-1440.png): readable
  main copy and review metadata. These are headless browser viewports, not
  physical-device qualification.
- [Evidence scene](../../fixtures/brand-shareability/evidence-scene.png): the
  fixture URL yielded a mostly blank High Signal application shell. This is
  insufficient visible evidence for the narrated claim. The fixture is a
  technical input, not an approved finished product video.

Validation: 545 Node tests and 68 Rust tests pass. The new real-FFmpeg test
checks both streams retain minimum duration and the receipt matches the
encoded artifact. Two real subprocess tests verify both CLI import graphs
reach their guards without credentials or network operations.

Remaining tasks are in the owning [README](../../README.md#remaining-qualification-work).
Human listening, physical-phone review, useful approved source evidence,
other variants and policy-approved publication remain unqualified. In
particular, the optional command smoke still labels all nonzero exits as
`skip`; its status alone does not distinguish missing runtime from broken code.
