// SWE-SPOKEN — Behavioral + Technical spoken answer quality.
//
// Under swe-interview-session, Behavioral (behavioral_interview_answer) and
// Technical (technical_concept_answer) answers are spoken aloud. They must get
// the deterministic humanizer (corporate filler + em-dash strip). Coding types
// must stay byte-for-byte (code fences / precision). system_design_answer keeps
// the speakable-sd contract (not this suite's rewriter).

import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
// Import leaf modules (not the llm barrel) so node --test does not pull Electron.
import {
  shouldHumanizeOutput,
  humanizeForAnswerType,
} from '../../../dist-electron/electron/llm/humanLikeness.js';
import {
  applySpeakabilityBudget,
  compressTechnicalConcept,
} from '../../../dist-electron/electron/llm/speakability.js';

const FILLER =
  'I bring a unique blend of skills — leveraging my technical rigor to drive business objectives.';

describe('SWE-SPOKEN — shouldHumanizeOutput for triad spoken legs', () => {
  test('behavioral_interview_answer is humanized (output pass)', () => {
    assert.equal(shouldHumanizeOutput('behavioral_interview_answer'), true);
  });
  test('technical_concept_answer is humanized (output pass)', () => {
    assert.equal(shouldHumanizeOutput('technical_concept_answer'), true);
  });
  test('coding / DSA stay structure-preserved (no humanize)', () => {
    assert.equal(shouldHumanizeOutput('coding_question_answer'), false);
    assert.equal(shouldHumanizeOutput('dsa_question_answer'), false);
  });
  test('system_design_answer stays structure-preserved (speakable-sd owns polish)', () => {
    assert.equal(shouldHumanizeOutput('system_design_answer'), false);
  });
});

describe('SWE-SPOKEN — humanizeForAnswerType strips filler + em dash', () => {
  for (const answerType of ['behavioral_interview_answer', 'technical_concept_answer']) {
    test(`${answerType}: strips corporate filler and em dashes`, () => {
      const r = humanizeForAnswerType(answerType, FILLER);
      assert.equal(r.changed, true);
      assert.doesNotMatch(r.text, /unique blend/i);
      assert.doesNotMatch(r.text, /technical rigor/i);
      assert.doesNotMatch(r.text, /business objectives/i);
      assert.doesNotMatch(r.text, /[—–]/);
      assert.match(r.text, /,/); // em dash → comma
    });
  }

  test('coding_question_answer: untouched (byte-for-byte)', () => {
    const code = '```js\nconst unique_blend = 1; // a — b\n```';
    const r = humanizeForAnswerType('coding_question_answer', code);
    assert.equal(r.changed, false);
    assert.equal(r.text, code);
  });

  test('dsa_question_answer: untouched even with filler prose around fences', () => {
    const r = humanizeForAnswerType('dsa_question_answer', FILLER);
    assert.equal(r.changed, false);
    assert.equal(r.text, FILLER);
  });
});

describe('SWE-SPOKEN — speakability / tech flatten still apply for Technical', () => {
  test('applySpeakabilityBudget runs for behavioral + technical (measure-only)', () => {
    for (const answerType of ['behavioral_interview_answer', 'technical_concept_answer']) {
      const r = applySpeakabilityBudget(
        'Caching stores hot results so the next read is cheap.',
        answerType,
        'default',
        answerType === 'behavioral_interview_answer'
          ? 'Tell me about a time you improved latency'
          : 'What is caching?',
        false,
      );
      assert.equal(typeof r.spoken_word_count, 'number');
      assert.ok(r.spoken_word_count > 0);
      assert.equal(r.speakability_budget_applied, false); // measure-only since 2026-06-16
      assert.ok(r.speakability_class);
    }
  });

  test('compressTechnicalConcept flattens tutorial-shaped Technical answers', () => {
    const tutorial = [
      '## What is CORS?',
      'CORS lets browsers call other origins.',
      '- Use cases: APIs',
      '- Headers: Origin',
      '```js',
      'fetch(url)',
      '```',
    ].join('\n');
    const r = compressTechnicalConcept(tutorial, false);
    assert.equal(r.changed, true);
    assert.doesNotMatch(r.text, /^##/m);
    assert.doesNotMatch(r.text, /```/);
    assert.match(r.text, /CORS/i);
  });
});
