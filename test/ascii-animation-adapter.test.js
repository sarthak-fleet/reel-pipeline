import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import test from 'node:test';

import { AsciiAnimationAdapter, buildAsciiTheme, wrapAsciiCopy } from '../src/adapters/ascii-animation.js';
import { createDraftVideo, createRenderer } from '../src/pipeline.js';
import { normalizeVideoBrief } from '../src/video-brief.js';

const reelBody = [
  'Script: explain the scale shift.',
  'Shot list: atom pattern, bond structure, orbital motion.',
  'Captions: "same laws" and "different scale".',
  'Asset prompts: ASCII fable interlude with warm pixel motion.',
].join('\n');

test('ascii render modes map to AsciiAnimationAdapter', () => {
  assert.equal(createRenderer('ascii').constructor.name, 'AsciiAnimationAdapter');
  assert.equal(createRenderer('ascii-animation').constructor.name, 'AsciiAnimationAdapter');
  assert.equal(createRenderer('ascii-fable').constructor.name, 'AsciiAnimationAdapter');
  assert.equal(createRenderer('askai').constructor.name, 'AsciiAnimationAdapter');
});

test('video brief accepts ascii render modes', () => {
  const brief = normalizeVideoBrief({
    id: 'brief-ascii',
    projectSlug: 'science',
    channel: 'youtube_shorts',
    title: 'Scale interlude',
    hook: 'The same laws behave differently at every scale.',
    body: reelBody,
    renderMode: 'ascii-fable',
  });

  assert.equal(brief.renderMode, 'ascii-fable');
});

test('ASCII palettes change both browser and raster color themes', () => {
  const base = {
    title: 'ASCII scale',
    hook: 'A small signal becomes a moving story.',
    body: reelBody,
  };
  const amber = buildAsciiTheme({ ...base, renderOptions: { palette: 'amber' } });
  const cobalt = buildAsciiTheme({ ...base, renderOptions: { palette: 'cobalt' } });
  assert.equal(cobalt.palette.id, 'cobalt');
  assert.notEqual(cobalt.palette.bg, amber.palette.bg);
  assert.notDeepEqual(cobalt.colors.bg, amber.colors.bg);
  assert.notDeepEqual(cobalt.colors.blue, amber.colors.blue);
});

test('AsciiAnimationAdapter smoke proves request to status to artifact metadata', async () => {
  const root = path.resolve('./tmp/ascii-animation-test');
  const artifactDir = path.join(root, 'artifacts');
  await rm(root, { recursive: true, force: true });
  const commands = [];

  const adapter = new AsciiAnimationAdapter({
    artifactDir,
    renderer: 'raster',
    now: () => new Date('2026-07-03T00:00:00.000Z'),
    commandRunner: async (command, args) => {
      commands.push({ command, args });
      await mkdir(path.dirname(args.at(-1)), { recursive: true });
      await writeFile(args.at(-1), Buffer.from('fake ascii mp4'));
      return { stdout: '', stderr: '' };
    },
  });
  const brief = normalizeVideoBrief({
    id: 'brief-scale',
    projectSlug: 'science',
    channel: 'tiktok',
    title: 'Scale interlude',
    hook: 'The same laws behave differently at every scale.',
    body: reelBody,
    renderMode: 'ascii',
    durationSeconds: 6,
  });

  const render = await adapter.createVideo(brief);
  assert.equal(render.provider, 'ascii-animation');
  assert.equal(render.status, 'completed');
  assert.equal(render.externalTaskId, 'ascii_brief-scale_1783036800000');
  assert.equal(render.durationSeconds, 6);
  assert.match(render.videos[0], /science-brief-scale\.mp4$/);
  assert.ok(render.renderLog.includes('style=ascii-fable'));
  assert.equal(commands.length, 1);
  assert.equal(commands[0].command, 'ffmpeg');
  assert.ok(commands[0].args.includes('-framerate'));

  const status = await adapter.getStatus(render.externalTaskId);
  assert.equal(status.provider, 'ascii-animation');
  assert.deepEqual(status.videos, render.videos);
});

test('createDraftVideo can publish an ascii render result', async () => {
  const root = path.resolve('./tmp/ascii-animation-draft-test');
  const artifactDir = path.join(root, 'artifacts');
  const publicDir = path.join(root, 'public');
  await rm(root, { recursive: true, force: true });

  const job = await createDraftVideo({
    id: 'brief-ascii-publish',
    projectSlug: 'science',
    channel: 'instagram_reels',
    title: 'ASCII scale',
    hook: 'A tiny ASCII cutaway makes the science feel deliberate.',
    body: reelBody,
    renderMode: 'ascii',
  }, {
    asciiAnimation: {
      artifactDir,
      renderer: 'raster',
      now: () => new Date('2026-07-03T00:00:00.000Z'),
      commandRunner: async (_command, args) => {
        await mkdir(path.dirname(args.at(-1)), { recursive: true });
        await writeFile(args.at(-1), Buffer.from('fake ascii mp4'));
        return { stdout: '', stderr: '' };
      },
    },
    artifacts: {
      baseUrl: 'https://assets.example.test/reels',
      publicDir,
    },
  });

  assert.equal(job.status, 'video_ready');
  assert.equal(job.render.provider, 'ascii-animation');
  assert.equal(job.render.videos[0], 'https://assets.example.test/reels/ascii_brief-ascii-publish_1783036800000-science-brief-ascii-publish.mp4');
});


test('ASCII scenes preserve three authored captions and wrap within their reserved area', () => {
  const captions = ['Atoms contain a nucleus and electrons.', 'Chemical bonds connect atoms into molecules.', 'Gravity keeps planets moving around stars.'];
  const theme = buildAsciiTheme({ title: 'Matter in motion', hook: 'Three patterns of motion.', body: `Captions: ${captions.map((text) => JSON.stringify(text)).join(' / ')}` });
  assert.equal(theme.title, 'Matter in motion');
  assert.deepEqual([theme.atomCaption, theme.bondCaption, theme.orbitCaption], captions);
  for (const caption of captions) {
    const lines = wrapAsciiCopy(caption, 22, 4);
    assert.equal(lines.join(' '), caption);
    assert.ok(lines.every((line) => line.length <= 22));
  }
  assert.throws(() => wrapAsciiCopy('word '.repeat(100), 30, 4), /readable frame area/);
});

test('ASCII copy uses brief content when no three-caption script is provided', () => {
  const theme = buildAsciiTheme({ title: 'A local story', hook: 'Start with one idea.', body: 'Script: Show one concrete example.', cta: 'Try the example.' });
  assert.deepEqual([theme.atomCaption, theme.bondCaption, theme.orbitCaption], ['Start with one idea.', 'Show one concrete example.', 'Try the example.']);
});


test('retained ASCII export matches its reviewed playback receipt', async () => {
  const root = new URL('../fixtures/ascii-shareability/', import.meta.url);
  const receipt = JSON.parse(await readFile(new URL('qualification.json', root), 'utf8'));
  const video = await readFile(new URL(receipt.artifact, root));
  assert.equal(createHash('sha256').update(video).digest('hex'), receipt.sha256);
  assert.equal(video.length, receipt.bytes);
  assert.equal(receipt.fullDecode, 'passed');
  assert.equal(receipt.visualReview.status, 'passed');
  assert.ok(receipt.browserPlayback.currentTime >= 1);
  assert.ok(receipt.browserPlayback.decodedFrames >= 20);
});
