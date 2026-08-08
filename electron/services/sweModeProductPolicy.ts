/**
 * Pure product policy for always-stealth SWE interview coach (ADR 0019).
 * Templates remain in ModesManager for recoverability; chrome/routing use this.
 */

export const SWE_INTERVIEW_TEMPLATE = 'technical-interview' as const;

/** Hard out of product chrome + live sales/lecture priors (recoverable in code). */
export const HARD_OUT_MODE_TEMPLATES = [
  'sales',
  'lecture',
  'seminar',
  'recruiting',
] as const;

/** Active modes that must migrate to technical-interview. */
export const MIGRATE_ACTIVE_TO_SWE_TEMPLATES = [
  ...HARD_OUT_MODE_TEMPLATES,
  'looking-for-work',
] as const;

/** Only template offered in Modes create chrome for this product. */
export const PRODUCT_CREATE_MODE_TEMPLATES = [SWE_INTERVIEW_TEMPLATE] as const;

const HARD_OUT = new Set<string>(HARD_OUT_MODE_TEMPLATES);
const MIGRATE_ACTIVE = new Set<string>(MIGRATE_ACTIVE_TO_SWE_TEMPLATES);
const PRODUCT_CREATE = new Set<string>(PRODUCT_CREATE_MODE_TEMPLATES);

export function isHardOutModeTemplate(templateType: string): boolean {
  return HARD_OUT.has(templateType);
}

export function shouldMigrateActiveModeToSwe(templateType: string): boolean {
  return MIGRATE_ACTIVE.has(templateType);
}

export function isProductCreatableTemplate(templateType: string): boolean {
  return PRODUCT_CREATE.has(templateType);
}

/**
 * Template used for mode-prior lookup. Hard-out / looking-for-work act as
 * technical-interview (NEUTRAL) so sales_answer / lecture_answer floors cannot
 * apply on migrated leftovers.
 */
export function resolveModePriorTemplate(templateType: string): string {
  if (shouldMigrateActiveModeToSwe(templateType)) return SWE_INTERVIEW_TEMPLATE;
  return templateType;
}
