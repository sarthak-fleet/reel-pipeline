#!/usr/bin/env node
// SaaS-Maker-driven marketing autopilot. Polls SaaS Maker on an interval, auto-
// accepts ideas that have aged past the hold window, renders accepted posts,
// and publishes ready videos to the right YouTube/Instagram account.
//
// For the worker-driven *reel* flow (Cloudflare worker → reel store →
// render-pro.js) see scripts/auto-render-watcher.js instead. The two scripts
// do not overlap.
//
// Usage:
//   node scripts/marketing-autopilot.js           # daemon
//   node scripts/marketing-autopilot.js --once    # one tick then exit
//
// Env:
//   AUTOPILOT_INTERVAL_MS         default 60000
//   AUTOPILOT_HOLD_WINDOW_MS      default 1800000 (30m)
//   AUTOPILOT_INTAKE_STATUS       default 'pending'
//   AUTOPILOT_CREATED_AT_FIELD    default 'created_at'
//   AUTOPILOT_LIMIT               default 10
//   PIPELINE_RENDER_CONCURRENCY   default 1
//   REEL_RENDER_MODE              default 'mock'
//   SOCIAL_ACCOUNTS_CONFIG        default 'config/social-accounts.json'

import { runAutopilotTick, loadAutopilotAccounts, loadFixtureClient } from '../src/autopilot.js';

const args = parseArgs(process.argv.slice(2));
const INTERVAL_MS = Math.max(15_000, Number(process.env.AUTOPILOT_INTERVAL_MS ?? 60_000));
const ONCE = args.once;
const RENDER_MODE = args.mode ?? process.env.REEL_RENDER_MODE ?? 'mock';
const FIXTURE = args.fixture ?? null;

let stopRequested = false;
process.on('SIGINT', () => { console.log('\n▸ SIGINT — finishing current tick then exiting'); stopRequested = true; });
process.on('SIGTERM', () => { stopRequested = true; });

const accounts = await loadAutopilotAccounts();
const fixtureClient = FIXTURE ? await loadFixtureClient(FIXTURE) : null;
console.log(`▸ marketing-autopilot started · interval=${INTERVAL_MS}ms${ONCE ? ' · once' : ''} · render=${RENDER_MODE}${FIXTURE ? ` · fixture=${FIXTURE}` : ''}`);
console.log(`▸ accounts: yt=${Object.keys(accounts.youtube).join(',') || '(none)'} ig=${Object.keys(accounts.instagram).join(',') || '(none)'}`);
if (fixtureClient) {
  console.log(`▸ fixture seeded with ${fixtureClient.posts.length} post(s) (live SaaS Maker NOT touched)`);
}

while (!stopRequested) {
  try {
    const result = await runAutopilotTick({
      accounts,
      saasMakerClient: fixtureClient ?? undefined,
      render: { mode: RENDER_MODE },
      log: (message) => console.log(`[${new Date().toISOString()}] ${message}`),
    });
    if (FIXTURE) {
      console.log(`▸ fixture state: ${fixtureClient.posts.map((p) => `${p.id}=${p.status}`).join(', ')}`);
      console.log(`▸ tick summary: accepted=${result.accepted.length} rendered=${result.rendered.results.length} posted=${result.posted.results.filter((r) => !r.skipped).length}`);
    }
  } catch (error) {
    console.warn(`! tick error: ${error.message}`);
  }
  if (ONCE) break;
  await sleep(INTERVAL_MS);
}
console.log('▸ marketing-autopilot stopped');

function parseArgs(argv) {
  const parsed = { once: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--once') { parsed.once = true; continue; }
    if (arg === '--fixture') { parsed.fixture = argv[++i]; continue; }
    if (arg === '--mode') { parsed.mode = argv[++i]; continue; }
  }
  return parsed;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
