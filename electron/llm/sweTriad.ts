// electron/llm/sweTriad.ts
//
// Pure helpers for swe-triad-answer-types under swe-interview-session
// (ModeTemplateType technical-interview). See docs/always-stealth-swe-coach/
// CONTEXT.md + docs/adr/0019-swe-interview-session-only.md.
//
// Product “Coding / Technical / Behavioral” are AnswerPlanner answer-type legs,
// not Modes Manager templates. sales_answer / lecture_answer are product-retired
// out-of-triad floors (code kept for recoverability).

import type { AnswerType } from './AnswerPlanner';
import type { ActiveModeInfo } from './modeProfiles';
import {
  resolveModePriorTemplate,
  SWE_INTERVIEW_TEMPLATE,
} from '../services/sweModeProductPolicy';

export type SweTriadLeg = 'coding' | 'technical' | 'behavioral' | 'other';

/** Map an AnswerType onto the SWE interview triad leg (or other). */
export function triadLegForAnswerType(answerType: AnswerType): SweTriadLeg {
  switch (answerType) {
    case 'coding_question_answer':
    case 'dsa_question_answer':
    case 'debugging_question_answer':
      return 'coding';
    case 'technical_concept_answer':
    case 'system_design_answer':
      return 'technical';
    case 'behavioral_interview_answer':
      return 'behavioral';
    default:
      return 'other';
  }
}

/** Product-retired answer types that must not floor SWE interview turns. */
export function isRetiredOutOfTriadAnswerType(answerType: AnswerType): boolean {
  return answerType === 'sales_answer' || answerType === 'lecture_answer';
}

/**
 * True when the active mode’s routing prior is the SWE interview session
 * (technical-interview), including hard-out / looking-for-work leftovers that
 * collapse via resolveModePriorTemplate (ADR 0019).
 */
export function isSweInterviewActiveMode(
  activeMode: ActiveModeInfo | null | undefined,
): boolean {
  if (!activeMode) return false;
  return resolveModePriorTemplate(activeMode.templateType) === SWE_INTERVIEW_TEMPLATE;
}
