// Source contract: conversation-start-stealth — startMeeting engages undetectable
// before the overlay is shown.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const mainSrc = fs.readFileSync(path.join(root, 'electron/main.ts'), 'utf8');

function extractMethodBody(src, methodSig) {
  const start = src.indexOf(methodSig);
  assert.ok(start >= 0, `method not found: ${methodSig}`);
  let i = src.indexOf('{', start);
  assert.ok(i >= 0, 'opening brace missing');
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  assert.fail('unclosed method body');
}

test('startMeeting calls setUndetectable(true) before setWindowMode(overlay)', () => {
  const body = extractMethodBody(mainSrc, 'public async startMeeting(');
  const stealthAt = body.indexOf('this.setUndetectable(true)');
  const overlayAt = body.indexOf("this.windowHelper.setWindowMode('overlay')");
  assert.ok(stealthAt >= 0, 'startMeeting must call this.setUndetectable(true)');
  assert.ok(overlayAt >= 0, 'startMeeting must switch to overlay');
  assert.ok(
    stealthAt < overlayAt,
    'conversation-start-stealth must engage before overlay show',
  );
});

test('setUndetectable coerces disguise via resolveDisguiseForStealth when enabling', () => {
  const body = extractMethodBody(mainSrc, 'public setUndetectable(');
  assert.match(body, /resolveDisguiseForStealth/);
  assert.match(body, /this\.setDisguise\(forced\)/);
});

test('setDisguise rejects none while undetectable', () => {
  const body = extractMethodBody(mainSrc, 'public setDisguise(');
  assert.match(body, /this\.isUndetectable && mode === 'none'/);
  assert.match(body, /resolveDisguiseForStealth\('none'\)/);
});
