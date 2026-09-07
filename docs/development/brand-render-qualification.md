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

## Follow-up: useful synthetic evidence

The original blank capture above remains a failed product-evidence example.
Capture now targets the first claim's evidence URL, rejects non-success HTTP
responses, and waits for visible main/article content with at least 80 text
characters. It captures that content region rather than the navigation shell.
This is a conservative readiness check, not semantic claim verification; pages
without substantive main/article content fail with an actionable error.
Failures stop before narration or encoding. Explicit text-only API renders
retain an `omitted` capture receipt and are not visually qualified.

The [rates lesson review](../../fixtures/brand-shareability/rates-lesson/review.html)
plays an actual local Kokoro/Chrome/FFmpeg export produced by `render:package`.
Its synthetic source table shows A = 8/10 = 80% and B = 12/20 = 60%, supporting
the narrated lesson about unequal denominators. This demonstrates a useful
teaching example; it does not replace owner approval of real product evidence.
The [receipt](../../fixtures/brand-shareability/rates-lesson/qualification.json)
records the encoded duration, hash, complete decode, and playback reaching
`ended` at both 390- and 1440-pixel browser widths. Five retained frames are
from the encoded MP4, not just HTML previews. No human listening or physical
phone review occurred.

To reproduce locally with existing Kokoro, FFmpeg and Chrome installed, serve
the fixture on loopback port 4179 in a separate terminal:

```bash
python3 -m http.server 4179 --bind 127.0.0.1 --directory fixtures/brand-shareability/rates-lesson
```

Then, from the repository root, run:

```bash
npm run render:package -- --file fixtures/brand-shareability/rates-lesson/package.json --out /tmp/reel-rates-review --browser-channel chrome
```

Stop the fixture server after review. Omit `--browser-channel chrome` to use
the installed Playwright Chromium. Neither command publishes media. The fixture
approval names local synthetic qualification only, and the source explicitly
states that it is not a real study.

Validation: 546 Node tests and 68 Rust tests pass. The new real-browser regression
covers delayed content, empty and hidden shells, HTTP errors, and prevention of
synthesis when evidence fails. CI installs its declared Playwright browser so
these checks execute rather than skip on hosted runners.

The generic render-mode smoke completed with five fixture modes passing, three
optional command checks passing, and brand-video skipped because the default
Playwright browser was not installed on this Mac. Its known skip behavior is
not counted as brand-render acceptance; the separate real CLI run above used
installed Chrome and passed. The focused agent/publisher checks also pass.
GitHub reconciliation still finds zero open issues and zero open PRs; no issue
was closed and README retains all actual release gates.
