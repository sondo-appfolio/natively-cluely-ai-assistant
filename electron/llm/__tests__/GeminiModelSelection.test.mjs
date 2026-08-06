// Source contracts for gemini-selection-sticky / gemini-app-default / gemini-setmodel-sync

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const helperSrc = readFileSync(path.resolve(__dirname, '../../LLMHelper.ts'), 'utf-8');
const credSrc = readFileSync(
  path.resolve(__dirname, '../../services/CredentialsManager.ts'),
  'utf-8',
);
const ipcSrc = readFileSync(path.resolve(__dirname, '../../ipcHandlers.ts'), 'utf-8');
const overlaySrc = readFileSync(
  path.resolve(__dirname, '../../../src/components/ModelSelectorWindow.tsx'),
  'utf-8',
);

describe('gemini-setmodel-sync', () => {
  test('setModel syncs geminiModel for flash-lite as well as flash and pro', () => {
    const idx = helperSrc.indexOf('public setModel(');
    assert.ok(idx >= 0);
    // Method is long — take enough to cover the geminiModel sync block near the end.
    const body = helperSrc.slice(idx, idx + 8000);
    assert.match(
      body,
      /this\.geminiModel\s*=\s*GEMINI_FLASH_LITE_MODEL/,
      'selecting flash-lite must set this.geminiModel = GEMINI_FLASH_LITE_MODEL',
    );
    assert.match(body, /this\.geminiModel\s*=\s*GEMINI_FLASH_MODEL/);
    assert.match(body, /this\.geminiModel\s*=\s*GEMINI_PRO_MODEL/);
  });
});

describe('gemini-app-default', () => {
  test('getDefaultModel unset fallback is gemini-3.6-flash', () => {
    const idx = credSrc.indexOf('getDefaultModel(');
    assert.ok(idx >= 0);
    const body = credSrc.slice(idx, idx + 800);
    assert.match(
      body,
      /defaultModel\s*\|\|\s*['"]gemini-3\.6-flash['"]/,
      'unset default must fall back to gemini-3.6-flash',
    );
    assert.doesNotMatch(
      body,
      /defaultModel\s*\|\|\s*['"]gemini-3\.1-flash-lite['"]/,
      'unset default must not fall back to flash-lite',
    );
  });
});

describe('gemini-selection-sticky', () => {
  test('set-model IPC persists defaultModel', () => {
    const idx = ipcSrc.indexOf("safeHandle('set-model'");
    assert.ok(idx >= 0);
    const body = ipcSrc.slice(idx, idx + 1200);
    assert.match(
      body,
      /setDefaultModel/,
      'set-model must persist via CredentialsManager.setDefaultModel for sticky selection',
    );
  });

  test('overlay catalog fetches Gemini list-models for fuller catalog', () => {
    assert.match(
      overlaySrc,
      /fetchProviderModels/,
      'ModelSelectorWindow must call fetchProviderModels so overlay matches Settings catalog',
    );
  });
});
