export const SESSION_SHELL_HEIGHT_FRACTION: number;

export interface SessionShellVerticalBudgetParams {
  workAreaY: number;
  workAreaHeight: number;
  windowTopY: number;
  bottomMargin?: number;
  heightFraction?: number;
}

export interface SessionShellVerticalBudgetResult {
  maxHeight: number;
  targetHeight: number;
  workAreaBottom: number;
}

export function sessionShellVerticalBudget(
  params: SessionShellVerticalBudgetParams,
): SessionShellVerticalBudgetResult;

export interface SessionShellFlexBudgetsParams {
  targetHeight: number;
  chromeHeight: number;
  transcriptMin?: number;
  transcriptMaxShare?: number;
  chatMin?: number;
}

export interface SessionShellFlexBudgetsResult {
  flexBudget: number;
  transcriptMax: number;
  chatMax: number;
}

export function sessionShellFlexBudgets(
  params: SessionShellFlexBudgetsParams,
): SessionShellFlexBudgetsResult;
