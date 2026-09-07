# ASCII export qualification

The 2026-09-07 local qualification repairs the audited `scale` raster output:
scene labels now sit below the code rail, glyph advance respects bitmap width,
and captions are drawn in an opaque reserved area after moving particles.
The supplied title and three quoted `Captions:` entries are rendered verbatim
(apart from the existing ASCII uppercase treatment). Without three explicit
captions, the renderer uses the hook, first script line, and CTA/hook. Oversized
copy fails before rendering instead of silently clipping. Titles allow two
20-character lines; captions allow four 22-character lines.

## Retained example

[Play or download Matter in motion](../../fixtures/ascii-shareability/synthetic-science-matter-in-motion.mp4)
uses original synthetic educational copy, procedural repository graphics, and
a locally synthesized quiet tone. No third-party media, provider generation,
credentials, upload, or paid service was used. It is a schematic introduction
to atoms, chemical bonds, and gravitational orbits, not a scientific simulation.

The [receipt](../../fixtures/ascii-shareability/qualification.json) binds the
MP4 bytes to full FFmpeg decoding, stream probing, and advancing muted browser
playback. Extracted frames at [2 seconds](../../fixtures/ascii-shareability/frame-2s.png),
[6 seconds](../../fixtures/ascii-shareability/frame-6s.png), and
[10 seconds](../../fixtures/ascii-shareability/frame-10s.png) were inspected for
readability, authored content, and separation of the terminal, label, and caption.

## Reproduce

```bash
rtk node scripts/qualify-ascii-export.js
```

Requires the existing FFmpeg and a working local Chrome executable. This Mac's
regular Chrome did not expose its DevTools endpoint, so qualification used its
already-installed Chrome for Testing (`chromium-1234`) by setting
`REEL_RENDER_CHROME` to that executable for this command. No browser was installed.
The command writes a new run under ignored `artifacts/shareability/`, extracts
three frames, checks full decoding, and plays the video in an isolated temporary
headless browser. Its visual-review field intentionally stays pending until a
person or agent inspects the frames; automated encoding is not visual approval.

## Scope and remaining gates

This qualifies one local 12-second H.264/AAC 1080×1920 export at 24 fps. It does
not qualify every ASCII variant, the browser-rendered composition, provider
publication, phone-device playback, or the wider product as publicly ready.
No narration or human listening review is claimed. The other raster styles
retain their existing motion-study treatments.

Validation: focused ASCII tests, the full Node/Rust suite, and documentation
validation pass. The render-mode smoke passed five fixture renders and three
prerequisite checks; brand-video was skipped because its optional smoke command
failed. Fixture/service checks do not imply provider or target-host readiness.
