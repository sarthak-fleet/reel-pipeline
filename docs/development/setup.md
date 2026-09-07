# Development Setup

## Install

```bash
git clone https://github.com/sass-maker/reel-pipeline.git
cd reel-pipeline
pnpm install --frozen-lockfile
npm test
```

Requirements: Node.js 22.16+ (CI tests Node 22), pnpm 10.33.2, and Rust stable.
The test command uses Node’s experimental type stripping; Node 20 is unsupported.
The tracked lockfile is `pnpm-lock.yaml`; `npm ci` cannot install this checkout.

Browser-backed tests and renders also require FFmpeg/ffprobe and Chromium:

```bash
pnpm exec playwright install chromium
```

For the synthetic narrated video, install public local Kokoro prerequisites with
`npm run setup:kokoro`, then follow the
[rates lesson example](brand-render-qualification.md#follow-up-useful-synthetic-evidence).
That example uses installed Google Chrome (`--browser-channel chrome`) and
requires no owner credentials. Optional local applications have their own
prerequisites. Repository licensing remains pending owner choice; successful
setup does not establish redistribution rights.

## Environment

Never commit `.env` files or credentials.

- `REEL_INTERNAL_TOKEN` protects internal Worker routes.
- `GROK_VIDEO_ASSET_DIR` points to approved local MP4 assets.
- `POSTIZ_BASE_URL` points to the self-hosted Postiz instance.
- `POSTIZ_API_KEY` authorizes Postiz API requests.
- `POSTIZ_INTEGRATIONS_CONFIG` optionally selects the project/channel mapping.

Real Postiz integration IDs belong in the ignored
`config/postiz-integrations.json`, copied from the committed example.

## Run

```bash
npm run dev
curl -sS http://127.0.0.1:4317/health
```

Use `/`, `/review`, and `/studio` for the local browser surfaces. The hosted
Worker also exposes the authenticated Local Video Forge operator console at
`/forge`. See
[`commands.md`](./commands.md) and [`testing.md`](./testing.md).
