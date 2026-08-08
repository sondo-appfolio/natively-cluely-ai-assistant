/**
 * SWE-SPOKEN — WTA live path must always run humanizer + technical flatten +
 * speakability measure for spoken triad answers, not only when answerDiversityGuard
 * is ON (defaults OFF). Mirrors manual chat polish in ipcHandlers.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const src = fs.readFileSync(path.join(repoRoot, 'electron/IntelligenceEngine.ts'), 'utf8');

describe('WTA always-on spoken quality (SWE-SPOKEN)', () => {
  test('always-on block calls humanizeForAnswerType before the diversity flag gate', () => {
    const alwaysOn = src.indexOf('ALWAYS-ON minimal cleanup');
    const flagGate = src.indexOf("isIntelligenceFlagEnabled('answerDiversityGuard')");
    assert.ok(alwaysOn > 0 && flagGate > alwaysOn);
    const block = src.slice(alwaysOn, flagGate);
    assert.match(block, /humanizeForAnswerType\s*\(/);
  });

  test('always-on block compresses technical_concept_answer', () => {
    const alwaysOn = src.indexOf('ALWAYS-ON minimal cleanup');
    const flagGate = src.indexOf("isIntelligenceFlagEnabled('answerDiversityGuard')");
    const block = src.slice(alwaysOn, flagGate);
    assert.match(block, /technical_concept_answer/);
    assert.match(block, /compressTechnicalConcept\s*\(/);
  });

  test('always-on block measures speakability budget', () => {
    const alwaysOn = src.indexOf('ALWAYS-ON minimal cleanup');
    const flagGate = src.indexOf("isIntelligenceFlagEnabled('answerDiversityGuard')");
    const block = src.slice(alwaysOn, flagGate);
    assert.match(block, /applySpeakabilityBudget\s*\(/);
  });

  test('coding answers still skip the always-on spoken polish block', () => {
    assert.match(src, /if \(!isCoding && finalWtaAnswer\)/);
  });
});
