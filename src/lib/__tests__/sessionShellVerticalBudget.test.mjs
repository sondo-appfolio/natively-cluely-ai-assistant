import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SESSION_SHELL_HEIGHT_FRACTION,
  sessionShellVerticalBudget,
  sessionShellFlexBudgets,
} from '../sessionShellVerticalBudget.mjs';

describe('sessionShellVerticalBudget — InterviewMan tall shell', () => {
  test('height fraction is near-full work area (not legacy 0.9)', () => {
    assert.ok(SESSION_SHELL_HEIGHT_FRACTION >= 0.98);
  });

  test('grows from window top down to work-area bottom', () => {
    const { maxHeight, targetHeight, workAreaBottom } = sessionShellVerticalBudget({
      workAreaY: 25,
      workAreaHeight: 1000,
      windowTopY: 80,
      bottomMargin: 8,
    });
    assert.equal(maxHeight, Math.floor(1000 * SESSION_SHELL_HEIGHT_FRACTION));
    assert.equal(workAreaBottom, 25 + 1000 - 8);
    assert.equal(targetHeight, Math.min(maxHeight, workAreaBottom - 80));
    assert.ok(targetHeight >= 900, `expected tall shell, got ${targetHeight}`);
  });

  test('clamps to maxHeight when top is near work-area top', () => {
    const { maxHeight, targetHeight } = sessionShellVerticalBudget({
      workAreaY: 0,
      workAreaHeight: 1080,
      windowTopY: 0,
      bottomMargin: 0,
    });
    assert.equal(targetHeight, maxHeight);
  });

  test('flex budgets give Transcription and chat room to grow', () => {
    const { flexBudget, transcriptMax, chatMax } = sessionShellFlexBudgets({
      targetHeight: 900,
      chromeHeight: 280,
    });
    assert.equal(flexBudget, 620);
    assert.ok(transcriptMax >= 120);
    assert.ok(transcriptMax <= Math.floor(620 * 0.38) + 1);
    assert.ok(chatMax >= 160);
    assert.ok(transcriptMax + 160 <= flexBudget + 1);
  });
});
