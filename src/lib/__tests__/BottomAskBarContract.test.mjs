import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

describe('bottom Ask bar same-slice UI contract', () => {
  test('NativelyInterface removes ask-submit-chip and mounts bottom-ask-bar', () => {
    const ni = fs.readFileSync(
      path.join(root, 'src/components/NativelyInterface.tsx'),
      'utf8',
    );
    assert.equal(
      ni.includes('ask-submit-chip'),
      false,
      'Cluely Ask/Submit chip must be removed in the same slice as the bottom Ask bar',
    );
    assert.ok(ni.includes('bottom-ask-bar') || ni.includes('BOTTOM_ASK_BAR_TESTID') || ni.includes('BottomAskBar'));
    assert.ok(ni.includes('bottom-ask-think') || ni.includes('BOTTOM_ASK_THINK_TESTID') || ni.includes('onThink'));
  });
});
