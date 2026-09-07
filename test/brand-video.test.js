import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

import { buildBrandScenes, renderBrandContentPackage } from '../src/adapters/brand-video.js';

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
