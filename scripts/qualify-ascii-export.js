#!/usr/bin/env node
// Local synthetic render qualification. No provider or publishing calls.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { AsciiAnimationAdapter } from '../src/adapters/ascii-animation.js';
import { evaluate, navigateAndWait, withChrome } from './cdp-capture.js';

const brief = JSON.parse(await readFile(new URL('../fixtures/ascii-shareability/brief.json', import.meta.url), 'utf8'));
const render = await new AsciiAnimationAdapter({ renderer: 'raster', artifactDir: 'artifacts/shareability', fps: 24 }).createVideo(brief);
const video = render.videos[0];
const dir = path.dirname(video);
const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', video]));
execFileSync('ffmpeg', ['-v', 'error', '-i', video, '-f', 'null', '-']);
const frames = [2, 6, 10].map((time) => {
  const file = `frame-${time}s.png`;
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(time), '-i', video, '-frames:v', '1', path.join(dir, file)]);
  return { time, file };
});
const player = path.join(dir, 'playback.html');
await writeFile(player, `<!doctype html><meta charset="utf-8"><title>Matter in motion</title><video controls muted playsinline style="height:90vh" src="${path.basename(video)}"></video>`);
const playback = await withChrome({ width: 420, height: 840 }, async (cdp) => {
  await navigateAndWait(cdp, pathToFileURL(player).href);
  return evaluate(cdp, `(async () => {
    const video = document.querySelector('video');
    await video.play();
    await new Promise(resolve => setTimeout(resolve, 1500));
    const result = { currentTime: video.currentTime, duration: video.duration, readyState: video.readyState, width: video.videoWidth, height: video.videoHeight, decodedFrames: video.getVideoPlaybackQuality().totalVideoFrames, error: video.error?.message ?? null };
    video.pause();
    return result;
  })()`);
});
if (playback.error || playback.currentTime < 1 || playback.decodedFrames < 20 || playback.width !== 1080 || playback.height !== 1920) throw new Error(`Playback failed: ${JSON.stringify(playback)}`);
const bytes = await readFile(video);
const receipt = {
  schema: 'reel-pipeline.ascii-shareability.v1',
  verifiedAt: new Date().toISOString(),
  input: 'fixtures/ascii-shareability/brief.json',
  rendererSourceSha256: createHash('sha256').update(await readFile(new URL('../src/adapters/ascii-animation.js', import.meta.url))).digest('hex'),
  rights: 'Original synthetic educational copy, repository procedural graphics, local synthesized tone; no third-party media.',
  renderer: 'raster',
  artifact: path.basename(video),
  bytes: bytes.length,
  sha256: createHash('sha256').update(bytes).digest('hex'),
  video: probe.streams.filter(stream => stream.codec_type === 'video').map(({ codec_name, width, height, nb_frames, duration, pix_fmt }) => ({ codec_name, width, height, nb_frames, duration, pix_fmt })),
  audio: probe.streams.filter(stream => stream.codec_type === 'audio').map(({ codec_name, duration }) => ({ codec_name, duration })),
  fullDecode: 'passed',
  browserPlayback: playback,
  frames,
  visualReview: 'pending; inspect extracted frames before qualifying presentation',
  limitations: ['No narration or listening review', 'Schematic art is not a scientific simulation', 'Local file playback only; no provider publication or mobile-device verification'],
};
await writeFile(path.join(dir, 'qualification.json'), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ directory: dir, receipt }, null, 2));
