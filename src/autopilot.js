import { readFile } from 'node:fs/promises';
import { SaaSMakerClient } from './saas-maker-client.js';
import {
  postReadyMarketingVideos,
  createPostingProvider,
} from './posting.js';
import { renderAcceptedMarketingPosts } from './pipeline.js';
import { loadSocialAccountsConfig } from './config/social-accounts.js';

export function createFixtureClient(initialPosts = []) {
  const posts = initialPosts.map((post) => ({ ...post }));
  const updates = [];
  return {
    posts,
    updates,
    listMarketingPosts: async (filters = {}) => {
      return posts.filter((post) => {
        if (filters.status && post.status !== filters.status) return false;
        if (filters.project_slug && post.project_slug !== filters.project_slug) return false;
        if (filters.channel && post.channel !== filters.channel) return false;
        return true;
      });
    },
    updateMarketingPost: async (id, patch) => {
      const target = posts.find((post) => post.id === id);
      if (target) Object.assign(target, patch);
      updates.push({ id, patch });
      return { skipped: false, data: target ?? { id, ...patch } };
    },
  };
}

export async function loadFixtureClient(path) {
  const raw = JSON.parse(await readFile(path, 'utf8'));
  const posts = Array.isArray(raw) ? raw : (raw.data ?? raw.posts ?? []);
  return createFixtureClient(posts);
}

const DEFAULT_HOLD_WINDOW_MS = 30 * 60_000;
const DEFAULT_INTAKE_STATUS = 'pending';
const DEFAULT_CREATED_AT_FIELD = 'created_at';

export async function runAutopilotTick(options = {}) {
  const client = options.saasMakerClient ?? new SaaSMakerClient(options.saasMaker);
  const now = options.now ?? new Date();
  const log = options.log ?? (() => {});
  const holdWindowMs = Number(options.holdWindowMs ?? process.env.AUTOPILOT_HOLD_WINDOW_MS ?? DEFAULT_HOLD_WINDOW_MS);
  const intakeStatus = options.intakeStatus ?? process.env.AUTOPILOT_INTAKE_STATUS ?? DEFAULT_INTAKE_STATUS;
  const createdAtField = options.createdAtField ?? process.env.AUTOPILOT_CREATED_AT_FIELD ?? DEFAULT_CREATED_AT_FIELD;
  const limit = Number(options.limit ?? process.env.AUTOPILOT_LIMIT ?? 10);

  const accepted = await autoAcceptIntake({
    client,
    now,
    holdWindowMs,
    intakeStatus,
    createdAtField,
    limit,
    log,
  });

  log(`▸ render: scanning accepted marketing posts`);
  const rendered = await renderAcceptedMarketingPosts({
    ...options.render,
    saasMakerClient: client,
    limit,
  });
  log(`✓ render: scanned=${rendered.scanned} eligible=${rendered.eligible} results=${rendered.results.length}`);

  const provider = options.postingProvider ?? buildDefaultPostingProvider(options);
  log(`▸ post: posting ready marketing videos`);
  const posted = await postReadyMarketingVideos({
    ...options.posting,
    saasMakerClient: client,
    provider,
    confirmPost: true,
    includeUnscheduled: true,
    limit,
  });
  log(`✓ post: scanned=${posted.scanned} results=${posted.results.length}`);

  return { accepted, rendered, posted };
}

export async function autoAcceptIntake(options) {
  const { client, now, holdWindowMs, intakeStatus, createdAtField, limit, log } = options;
  const posts = await client.listMarketingPosts({ status: intakeStatus, limit });
  const cutoff = now.getTime() - holdWindowMs;
  const ready = posts.filter((post) => {
    const createdAtRaw = post[createdAtField];
    if (!createdAtRaw) return false;
    const createdAt = new Date(createdAtRaw).getTime();
    if (Number.isNaN(createdAt)) return false;
    return createdAt <= cutoff;
  });
  log(`▸ intake: ${ready.length}/${posts.length} past hold window (${Math.round(holdWindowMs / 60000)}m)`);
  const accepted = [];
  for (const post of ready) {
    const sync = await client.updateMarketingPost(post.id, {
      status: 'accepted',
      notes: appendIntakeNote(post.notes, holdWindowMs),
    });
    accepted.push({ postId: post.id, sync });
  }
  return accepted;
}

function appendIntakeNote(existingNotes, holdWindowMs) {
  const lines = [
    existingNotes,
    `Auto-accepted by autopilot after ${Math.round(holdWindowMs / 60000)}m hold window.`,
  ].filter(Boolean);
  return lines.join('\n');
}

function buildDefaultPostingProvider(options) {
  const accounts = options.accounts;
  if (!accounts) throw new Error('runAutopilotTick requires options.accounts (resolved social-accounts config)');
  return createPostingProvider('auto', {
    youtube: { accounts: accounts.youtube ?? {} },
    instagram: { accounts: accounts.instagram ?? {} },
  });
}

export async function loadAutopilotAccounts() {
  return loadSocialAccountsConfig();
}
