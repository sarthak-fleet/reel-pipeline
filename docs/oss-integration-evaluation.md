# OSS Integration Evaluation

Last updated: 2026-06-09

## Scope

Evaluate OSS integrations that improve the text/context-to-short-video workflow:
script structure, caption alignment, audio/media processing, render QA, asset
handoff, and deterministic local previews.

## Shortlist

| Candidate | Source | Fit | Cost | Decision |
| --- | --- | --- | --- | --- |
| WhisperX | https://github.com/m-bain/whisperX | Strong word-level timestamps and diarization for caption alignment QA. | Medium/high: Python/GPU path and model assets; keep behind optional adapter. | Best future caption-alignment adapter. |
| stable-ts | https://github.com/jianfch/stable-ts | Whisper-based transcription, forced alignment, and audio indexing. | Medium: Python dependency but simpler than broader video engines. | Good lightweight alternative to WhisperX. |
| whisper.cpp | https://github.com/ggml-org/whisper.cpp | Local CPU-friendly Whisper inference for cheap transcript/caption checks. | Medium: native binary/model management. | Watchlist for local-first caption QA. |
| OpenAI Whisper | https://github.com/openai/whisper | Reference transcription model and ecosystem anchor. | Medium/high: Python runtime and model downloads. | Reference only; prefer WhisperX/stable-ts for alignment. |
| FFmpeg.wasm | https://github.com/ffmpegwasm/ffmpeg.wasm | Browser/portable ffmpeg operations. | Medium: current pipeline already has Node/CLI render paths; WASM cost may be unnecessary. | Park unless browser-side preview editing becomes required. |
| fluent-ffmpeg | https://github.com/fluent-ffmpeg/node-fluent-ffmpeg | Node wrapper around ffmpeg for deterministic local media operations. | Low/medium, but project maintenance is slower and direct ffmpeg calls are already simple. | Avoid dependency; use direct ffmpeg commands when needed. |
| Subtitle Edit | https://github.com/SubtitleEdit/subtitleedit | Mature subtitle tooling and format reference. | High: desktop/.NET app, not a library fit. | Reference for subtitle formats only. |
| Remotion | https://github.com/remotion-dev/remotion | Already in use for programmatic video rendering. | None for current path. | Do not add more Remotion packages unless upgrading/adapting existing usage. |
| Aeneas | https://github.com/readbeyond/aeneas | Forced alignment. | High and AGPL license makes product integration risky. | Reject. |

## Decision

Do not add a new media dependency in this pass. The highest-ROI next slice is a
fixture-backed caption QA adapter that can optionally run WhisperX or stable-ts
against an already-rendered mock reel and compare generated timestamps/captions
to the draft bundle. This improves reviewable reels without touching real
credentials, posting state, or production config.

## Suggested Implementation Slice

1. Keep the existing mock render fixture as the input.
2. Add an optional caption-alignment command adapter behind a capability check.
3. Emit JSON with word/segment timestamps, missing-caption warnings, and drift
   against expected script lines.
4. Attach that JSON to the draft/review bundle before any real render queue or
   autopost work.

## Verification

Docs-only evaluation in this pass. Run:

```bash
npm test
```
