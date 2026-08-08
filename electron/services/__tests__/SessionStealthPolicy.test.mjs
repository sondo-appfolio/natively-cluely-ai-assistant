// sessionStealthPolicy — always-stealth disguise + sticky undetectable rules.

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const policyPath = path.resolve(
  here,
  '../../../dist-electron/electron/services/sessionStealthPolicy.js',
);

async function loadPolicy() {
  return import(pathToFileURL(policyPath).href);
}

test('resolveDisguiseForStealth maps none → terminal', async () => {
  const { resolveDisguiseForStealth } = await loadPolicy();
  assert.equal(resolveDisguiseForStealth('none'), 'terminal');
});

test('resolveDisguiseForStealth keeps terminal/settings/activity', async () => {
  const { resolveDisguiseForStealth } = await loadPolicy();
  assert.equal(resolveDisguiseForStealth('terminal'), 'terminal');
  assert.equal(resolveDisguiseForStealth('settings'), 'settings');
  assert.equal(resolveDisguiseForStealth('activity'), 'activity');
});

test('undetectableAfterTwoDeviceExit is always true', async () => {
  const { undetectableAfterTwoDeviceExit } = await loadPolicy();
  assert.equal(undetectableAfterTwoDeviceExit(), true);
});
