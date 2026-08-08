// Source contract: Detectable/Undetectable toggles removed from product chrome
// (no-user-detectable-switch). Internal setUndetectable IPC may remain.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('Launcher has no Detectable toggle pill / toggleDetectable', () => {
  const src = read('src/components/Launcher.tsx');
  assert.doesNotMatch(src, /toggleDetectable/, 'Launcher must not expose toggleDetectable');
  assert.doesNotMatch(src, /Detectable Toggle Pill/, 'Launcher must not render Detectable Toggle Pill');
  assert.doesNotMatch(src, /onClick=\{toggleDetectable\}/);
});

test('SettingsPopup has no setUndetectable toggle click handler', () => {
  const src = read('src/components/SettingsPopup.tsx');
  assert.doesNotMatch(
    src,
    /onClick=\{\(\)\s*=>\s*\{[\s\S]*setUndetectable/,
    'SettingsPopup must not toggle setUndetectable from UI',
  );
  assert.doesNotMatch(src, /window\.electronAPI\?\.setUndetectable\(/);
});

test('SettingsOverlay General has no Detectable/Undetectable switch calling setUndetectable', () => {
  const src = read('src/components/SettingsOverlay.tsx');
  assert.doesNotMatch(src, /\{\/\* Detectable \/ Undetectable \*\/\}/);
  assert.doesNotMatch(src, /window\.electronAPI\?\.setUndetectable\(/);
  // Disguise must remain choosable while stealth is on (not gated off).
  assert.doesNotMatch(src, /Disable Undetectable mode first to change disguise/);
  assert.doesNotMatch(src, /isUndetectable \? 'opacity-50 pointer-events-none'/);
});

test('Launcher never calls setUndetectable from UI', () => {
  const src = read('src/components/Launcher.tsx');
  assert.doesNotMatch(src, /window\.electronAPI\?\.setUndetectable\(/);
});

