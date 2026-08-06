// Source contract for human-observer-suggestion (grill glossary).
// Product typed observer + REPL live SUT must reach runWhatShouldISay with
// triggerSource: 'human-observer-suggestion' — not gemini-chat-stream.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const engineSrc = readFileSync(
  path.resolve(__dirname, '../../IntelligenceEngine.ts'),
  'utf-8',
);
const ipcSrc = readFileSync(
  path.resolve(__dirname, '../../ipcHandlers.ts'),
  'utf-8',
);
const mgrSrc = readFileSync(
  path.resolve(__dirname, '../../IntelligenceManager.ts'),
  'utf-8',
);
const uiSrc = readFileSync(
  path.resolve(__dirname, '../../../src/components/NativelyInterface.tsx'),
  'utf-8',
);
const preloadSrc = readFileSync(
  path.resolve(__dirname, '../../preload.ts'),
  'utf-8',
);

function optionsTypeNear(src, methodName) {
  const sigMatch = src.match(new RegExp(`${methodName}\\s*\\(`));
  assert.ok(sigMatch, `${methodName} must be locatable`);
  const optsStart = src.indexOf('options?:', sigMatch.index);
  assert.ok(optsStart >= 0, `options?: must appear after ${methodName}`);
  const openBrace = src.indexOf('{', optsStart);
  let depth = 1;
  let i = openBrace + 1;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  return src.slice(openBrace, i);
}

describe('source: WTA options accept human-observer-suggestion triggerSource', () => {
  test('IntelligenceEngine.runWhatShouldISay options include triggerSource', () => {
    const optsType = optionsTypeNear(engineSrc, 'runWhatShouldISay');
    assert.match(
      optsType,
      /triggerSource\??:\s*'human-observer-suggestion'/,
      'engine options must accept triggerSource: human-observer-suggestion',
    );
  });

  test('IntelligenceManager forwards triggerSource in options type', () => {
    const optsType = optionsTypeNear(mgrSrc, 'runWhatShouldISay');
    assert.match(
      optsType,
      /triggerSource\??:\s*'human-observer-suggestion'/,
      'manager options must forward triggerSource',
    );
  });

  test('engine records lastWtaTriggerSource from options', () => {
    assert.match(
      engineSrc,
      /lastWtaTriggerSource/,
      'engine must expose lastWtaTriggerSource for provenance',
    );
    assert.match(
      engineSrc,
      /human-observer-suggestion/,
      'engine must recognize human-observer-suggestion',
    );
    assert.match(
      engineSrc,
      /wtaTriggerSourceByGeneration/,
      'engine must scope triggerSource by generationId so code-hint/brainstorm emits are not mis-tagged',
    );
  });
});

describe('source: IPC generate-what-to-say forwards triggerSource', () => {
  test('generate-what-to-say passes triggerSource into runWhatShouldISay options', () => {
    const idx = ipcSrc.indexOf("'generate-what-to-say'");
    assert.ok(idx >= 0, 'generate-what-to-say handler must exist');
    const slice = ipcSrc.slice(idx, idx + 8000);
    assert.match(
      slice,
      /triggerSource/,
      'generate-what-to-say must forward triggerSource to WTA',
    );
  });

  test('preload generateWhatToSay options include triggerSource', () => {
    assert.match(
      preloadSrc,
      /triggerSource\??:\s*'human-observer-suggestion'/,
      'preload generateWhatToSay options must include triggerSource',
    );
  });
});

describe('source: product typed chat uses WTA for observer suggestions', () => {
  test('handleManualSubmit routes through generateWhatToSay with triggerSource', () => {
    const idx = uiSrc.indexOf('const handleManualSubmit');
    assert.ok(idx >= 0, 'handleManualSubmit must exist');
    // Bound the method roughly until the next top-level const after it.
    const next = uiSrc.indexOf('\n  const clearChat', idx);
    const body = uiSrc.slice(idx, next > idx ? next : idx + 12000);
    assert.match(
      body,
      /generateWhatToSay/,
      'typed submit must call generateWhatToSay (WTA), not only streamGeminiChat',
    );
    assert.match(
      body,
      /human-observer-suggestion/,
      'typed observer path must set triggerSource human-observer-suggestion',
    );
    assert.match(
      body,
      /\/nudge/,
      'typed path must support /nudge → promptInstruction',
    );
  });
});
