// electron/llm/__tests__/SweTriadRouting.test.mjs
//
// SWE-TRIAD (ADR 0019 / always-stealth-swe-coach): under swe-interview-session
// (ModeTemplateType technical-interview), AnswerPlanner must route the Coding /
// Technical / Behavioral triad and must NOT floor to product-retired
// sales_answer / lecture_answer.
//
// Runs against compiled dist-electron (same pattern as ModeProfiles.test.mjs).

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const { planAnswer } = await import('../../../dist-electron/electron/llm/AnswerPlanner.js');
const {
  triadLegForAnswerType,
  isSweInterviewActiveMode,
  isRetiredOutOfTriadAnswerType,
} = await import('../../../dist-electron/electron/llm/sweTriad.js');

const tiMode = {
  id: 'mode_technical-interview',
  templateType: 'technical-interview',
  name: 'Technical Interview',
  isCustom: false,
};

const planTi = (question) => planAnswer({
  question,
  source: 'what_to_answer',
  speakerPerspective: 'interviewer',
  activeMode: tiMode,
});

describe('sweTriad helper: AnswerType → triad leg', () => {
  test('Coding leg includes coding, DSA, and debugging contract types', () => {
    assert.equal(triadLegForAnswerType('coding_question_answer'), 'coding');
    assert.equal(triadLegForAnswerType('dsa_question_answer'), 'coding');
    assert.equal(triadLegForAnswerType('debugging_question_answer'), 'coding');
  });

  test('Technical leg is concept + speakable system design', () => {
    assert.equal(triadLegForAnswerType('technical_concept_answer'), 'technical');
    assert.equal(triadLegForAnswerType('system_design_answer'), 'technical');
  });

  test('Behavioral leg is behavioral_interview_answer only', () => {
    assert.equal(triadLegForAnswerType('behavioral_interview_answer'), 'behavioral');
    // Special-case: project_about is NOT Behavioral.
    assert.equal(triadLegForAnswerType('project_about_answer'), 'other');
  });

  test('sales_answer / lecture_answer are retired out-of-triad', () => {
    assert.equal(triadLegForAnswerType('sales_answer'), 'other');
    assert.equal(triadLegForAnswerType('lecture_answer'), 'other');
    assert.equal(isRetiredOutOfTriadAnswerType('sales_answer'), true);
    assert.equal(isRetiredOutOfTriadAnswerType('lecture_answer'), true);
    assert.equal(isRetiredOutOfTriadAnswerType('general_meeting_answer'), false);
  });

  test('isSweInterviewActiveMode recognizes TI and migrated hard-out priors', () => {
    assert.equal(isSweInterviewActiveMode(tiMode), true);
    assert.equal(isSweInterviewActiveMode({ ...tiMode, templateType: 'looking-for-work' }), true);
    assert.equal(isSweInterviewActiveMode({ ...tiMode, templateType: 'sales' }), true);
    assert.equal(isSweInterviewActiveMode({ ...tiMode, templateType: 'team-meet' }), false);
    assert.equal(isSweInterviewActiveMode(null), false);
  });
});

describe('planAnswer under technical-interview: triad routing', () => {
  test('coding / DSA questions → coding or dsa answer types', () => {
    for (const q of [
      'solve two sum in python',
      'write a function to reverse a linked list',
      'write a SQL query to find duplicate emails',
      'implement binary search',
    ]) {
      const plan = planTi(q);
      assert.ok(
        ['coding_question_answer', 'dsa_question_answer'].includes(plan.answerType),
        `"${q}" → ${plan.answerType}`,
      );
      assert.equal(triadLegForAnswerType(plan.answerType), 'coding');
    }
  });

  test('live debug tasks → debugging_question_answer (coding leg)', () => {
    const plan = planTi('debug this null pointer exception in my loop');
    assert.equal(plan.answerType, 'debugging_question_answer');
    assert.equal(triadLegForAnswerType(plan.answerType), 'coding');
  });

  test('concept / explain asks → technical_concept_answer', () => {
    for (const q of [
      'explain BFS',
      'what is a deadlock',
      'how would you use GraphQL?',
      'difference between TCP and UDP',
    ]) {
      const plan = planTi(q);
      assert.equal(plan.answerType, 'technical_concept_answer', `"${q}" → ${plan.answerType}`);
      assert.equal(triadLegForAnswerType(plan.answerType), 'technical');
    }
  });

  test('system design asks → system_design_answer (speakable SD)', () => {
    for (const q of [
      'design a URL shortener',
      'how would you design a rate limiter',
      'Design Twitter',
      'Designing a Scalable Ticketing Platform',
    ]) {
      const plan = planTi(q);
      assert.equal(plan.answerType, 'system_design_answer', `"${q}" → ${plan.answerType}`);
      assert.equal(triadLegForAnswerType(plan.answerType), 'technical');
    }
  });

  test('behavioral / experience STAR asks → behavioral_interview_answer', () => {
    for (const q of [
      'tell me about a time you had conflict',
      'what is your biggest weakness',
      'describe a situation where you failed',
      'Give me an example of teamwork',
    ]) {
      const plan = planTi(q);
      assert.equal(plan.answerType, 'behavioral_interview_answer', `"${q}" → ${plan.answerType}`);
      assert.equal(triadLegForAnswerType(plan.answerType), 'behavioral');
    }
  });

  test('project_about is not remapped to Behavioral', () => {
    const plan = planTi('what kind of app is Natively?');
    assert.equal(plan.answerType, 'project_about_answer');
    assert.notEqual(triadLegForAnswerType(plan.answerType), 'behavioral');
  });

  test('TI never floors to sales_answer / lecture_answer', () => {
    for (const q of [
      'what is the pricing for our product',
      'what is the ROI of this solution',
      'why should we buy this',
      'how do you handle this objection',
      'summarize this lecture slide',
      'give me a 6 marks answer on CAP theorem',
      'make me notes on this concept',
      'what should I revise for the exam',
      'so, hmm, what do you think about all of this then?',
    ]) {
      const plan = planTi(q);
      assert.notEqual(plan.answerType, 'sales_answer', `"${q}"`);
      assert.notEqual(plan.answerType, 'lecture_answer', `"${q}"`);
    }
  });

  test('TI lecture-phrasing wrapping a CS concept → technical_concept_answer', () => {
    const plan = planTi('give me a 6 marks answer on CAP theorem');
    assert.equal(plan.answerType, 'technical_concept_answer');
    assert.equal(triadLegForAnswerType(plan.answerType), 'technical');
  });
});
