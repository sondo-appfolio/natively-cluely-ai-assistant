// electron/llm/sdSessionAuthority.ts
//
// Per-turn SD session authority: arm Requirements gate prepare / phase stamp
// from durable artifact stickiness + Technical Interview mode — not answerType.

import {
  type RequirementsArtifact,
  type SdPhase,
  deriveSdPhase,
} from './sdRequirementsGate';

export interface SdSessionAuthority {
  sessionOpen: boolean;
  shouldArmGate: boolean;
  sdPhase: SdPhase | undefined;
  problemKey: string | null;
}

export interface DeriveSdSessionAuthorityInput {
  artifact: RequirementsArtifact | null | undefined;
  /** ModesManager templateType id (e.g. 'technical-interview'). */
  modeId: string | null | undefined;
}

/**
 * Derive session-scoped gate arming for this turn.
 * sessionOpen = sticky problemKey already established by a prior SD prepare.
 * shouldArmGate = Technical Interview AND session open.
 */
export function deriveSdSessionAuthority(
  input: DeriveSdSessionAuthorityInput,
): SdSessionAuthority {
  const rawKey = input.artifact?.problemKey ?? null;
  const problemKey =
    typeof rawKey === 'string' && rawKey.trim().length > 0 ? rawKey : null;
  const sessionOpen = problemKey != null;
  const shouldArmGate =
    sessionOpen && input.modeId === 'technical-interview';
  const sdPhase =
    sessionOpen && input.artifact ? deriveSdPhase(input.artifact) : undefined;
  return { sessionOpen, shouldArmGate, sdPhase, problemKey };
}
