import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

// Start the real entrypoints, without credentials or inputs, so their entire
// import graph must resolve before the existing execution guards reject them.
for (const [script, rejection] of [
  ['render-content-package.js', /--file is required/],
  ['render-pro.js', /REEL_INTERNAL_TOKEN is required for the Foundry render handoff/],
]) {
  test(`${script} reaches its input guard in the standalone repository`, () => {
    const result = spawnSync(process.execPath, [
      fileURLToPath(new URL(`../content-factory/scripts/${script}`, import.meta.url)),
    ], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      env: {},
      encoding: 'utf8',
      timeout: 10_000,
    });
    assert.ifError(result.error);
    assert.equal(result.status, 1);
    assert.match(result.stderr, rejection);
    assert.doesNotMatch(result.stderr, /ERR_MODULE_NOT_FOUND/);
    assert.equal(result.stdout, '');
  });
}
