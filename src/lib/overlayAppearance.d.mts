import type { CSSProperties } from 'react';

export const OVERLAY_OPACITY_MIN: number;
export const OVERLAY_OPACITY_MAX: number;
export const OVERLAY_OPACITY_DEFAULT: number;
export const OVERLAY_OPACITY_DEFAULT_DARK: number;
export const OVERLAY_OPACITY_DEFAULT_LIGHT: number;
export const OVERLAY_OPACITY_LEGACY_DEFAULTS: readonly number[];

export function getDefaultOverlayOpacity(): number;
export function clampOverlayOpacity(opacity: number): number;
export function isStoredOverlayOpacityUserSet(parsed: number): boolean;
export function resolveStoredOverlayOpacity(stored: string | null | undefined): number;
export function migrateStoredOverlayOpacity(): number;

export type OverlayTheme = 'light' | 'dark';

export interface OverlayAppearance {
  shellStyle: CSSProperties;
  pillStyle: CSSProperties;
  transcriptStyle: CSSProperties;
  subtleStyle: CSSProperties;
  chipStyle: CSSProperties;
  inputStyle: CSSProperties;
  controlStyle: CSSProperties;
  iconStyle: CSSProperties;
  codeBlockStyle: CSSProperties;
  codeHeaderStyle: CSSProperties;
  dividerStyle: CSSProperties;
}

export function getOverlayAppearance(opacity: number, theme: OverlayTheme): OverlayAppearance;
export function getGlassOverlayAppearance(): OverlayAppearance;
