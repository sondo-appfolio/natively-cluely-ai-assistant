/**
 * Source contract: listen e2e selectors + arm seam stay wired.
 * Run: node --test src/lib/__tests__/InterviewmanListenE2eContract.test.mjs
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');

describe('interviewman-listen e2e contract', () => {
  test('product exposes listen / Ask testids used by the suite', () => {
    const ni = readFileSync(resolve(root, 'src/components/NativelyInterface.tsx'), 'utf8');
    const top = readFileSync(resolve(root, 'src/components/ui/TopPill.tsx'), 'utf8');
    const ask = readFileSync(resolve(root, 'src/components/ui/BottomAskBar.tsx'), 'utf8');
    const panel = readFileSync(resolve(root, 'src/components/ui/LiveTranscriptPanel.tsx'), 'utf8');

    assert.match(top, /listen-transport-toggle/);
    assert.match(top, /end-meeting/);
    assert.match(ask, /bottom-ask-bar/);
    assert.match(ask, /bottom-ask-think/);
    assert.match(panel, /live-transcript-panel/);
    assert.match(ni, /listen-transport-unready/);
    assert.equal(ni.includes('ask-submit-chip'), false);
  });

  test('main exposes arm-listen seam distinct from SD no-audio via', () => {
    const main = readFileSync(resolve(root, 'electron/main.ts'), 'utf8');
    const ipc = readFileSync(resolve(root, 'electron/ipcHandlers.ts'), 'utf8');
    assert.match(main, /startListenMeetingForE2e/);
    assert.match(main, /e2e-arm-listen/);
    assert.match(main, /feedOverlayLiveTranscriptForE2e/);
    assert.match(ipc, /__e2e__:arm-listen-meeting/);
    assert.match(ipc, /__e2e__:inject-live-transcript/);
    assert.match(ipc, /__e2e__:arm-sd-overlay-gate/);
  });
});
