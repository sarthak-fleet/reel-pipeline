import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

import { buildBrandScenes, captureBrandEvidence, renderBrandContentPackage } from '../src/adapters/brand-video.js';

const exec = promisify(execFile);

const contentPackage = JSON.parse(await readFile(new URL('./fixtures/approved-content-package.json', import.meta.url), 'utf8'));

test('brand video uses five source-backed teaching scenes', () => {
  const scenes = buildBrandScenes(contentPackage, contentPackage.variants[0]);
  assert.deepEqual(scenes.map((scene) => scene.kind), ['Hook', 'Context', 'Evidence', 'Takeaway', 'Next']);
  assert.match(scenes[2].caption, /highsignal\.app/);
  assert.equal(scenes[3].title, 'The practical next move: Read the evidence.');
});

test('short narration retains minimum reading time and receipt reports encoded duration', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'brand-duration-'));
  try {
    const frame = path.join(root, 'frame.png');
    const audio = path.join(root, 'short.wav');
    await exec('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'testsrc=size=1080x1920', '-frames:v', '1', frame]);
    await exec('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.25', audio]);
    const result = await renderBrandContentPackage(contentPackage, {
      artifactDir: root,
      captureSource: false,
      chromeRunner: (_html, image) => copyFile(frame, image),
      tts: { synthesizeScenes: async (scenes) => scenes.map(() => ({ path: audio })) },
    });
    const { stdout } = await exec('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,duration', '-of', 'json', result.outputPath]);
    const encoded = JSON.parse(stdout);
    const duration = Number(encoded.format.duration);
    assert.ok(duration >= 13.9 && duration < 14.2, `five 2.8-second scenes, got ${duration}`);
    for (const stream of encoded.streams) {
      assert.ok(Number(stream.duration) >= 13.9, `${stream.codec_type} ended at ${stream.duration}`);
    }
    assert.ok(Math.abs(result.receipt.durationSeconds - duration) < 0.001);
    await exec('ffmpeg', ['-v', 'error', '-i', result.outputPath, '-f', 'null', '-']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test('brand evidence waits for content and rejects empty, hidden and failed source pages', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'brand-evidence-'));
  const lesson = '<h1>Compare rates, not totals</h1><p>Group A: 8 of 10 completed the task. Group B: 12 of 20 completed it. Eighty percent exceeds sixty percent despite the smaller total.</p>';
  const server = createServer((request, response) => {
    response.writeHead(request.url === '/missing' ? 404 : 200, { 'Content-Type': 'text/html' });
    const style = '<style>main{padding:60px;font:48px system-ui;background:#102c30;color:white}</style>';
    if (request.url === '/delayed') response.end(`${style}<main></main><script>setTimeout(()=>document.querySelector('main').innerHTML=${JSON.stringify(lesson)},350)</script>`);
    else if (request.url === '/hidden') response.end(`${style}<main style="display:none">${lesson}</main>`);
    else if (request.url === '/missing') response.end(`${style}<main>${lesson}</main>`);
    else response.end(`${style}<nav>Home About Subscribe</nav><main></main>`);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browserLaunch = existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome') ? { channel: 'chrome' } : {};
  try {
    const receipt = await captureBrandEvidence(`${origin}/delayed`, path.join(root, 'source.png'), { browserLaunch, captureTimeoutMs: 5000 });
    assert.equal(receipt.status, 'captured');
    assert.equal(receipt.finalUrl, `${origin}/delayed`);
    assert.equal(receipt.claimReview, 'required');
    for (const route of ['blank', 'hidden', 'missing']) {
      await assert.rejects(captureBrandEvidence(`${origin}/${route}`, path.join(root, `${route}.png`), { browserLaunch, captureTimeoutMs: 700 }), /Cannot capture usable brand evidence/);
    }
    let synthesized = false;
    const input = structuredClone(contentPackage);
    input.topic.claims[0].evidenceUrls = [`${origin}/missing`];
    await assert.rejects(renderBrandContentPackage(input, {
      artifactDir: root, browserLaunch,
      tts: { synthesizeScenes() { synthesized = true; throw new Error('must not synthesize'); } },
    }), /source returned HTTP 404/);
    assert.equal(synthesized, false, 'capture failure stops before narration or encoding');
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  }
});
