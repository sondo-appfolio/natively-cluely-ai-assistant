/**
 * Overlay surface paint + opacity migration (InterviewMan-dark charcoal).
 * Plain ESM so node:test can import without a TypeScript loader.
 */

const VIVID_DARK_CODE_BG_RGB = '10, 10, 13';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mix = (min, max, value) => min + ((max - min) * value);

export const OVERLAY_OPACITY_MIN = 0.35;
export const OVERLAY_OPACITY_MAX = 1;
/** @deprecated Prefer getDefaultOverlayOpacity() / resolveStoredOverlayOpacity(). */
export const OVERLAY_OPACITY_DEFAULT = 0.95;
export const OVERLAY_OPACITY_DEFAULT_DARK = 0.95;
export const OVERLAY_OPACITY_DEFAULT_LIGHT = 0.75;
/** Prior factory defaults — migrate to theme-aware default, not treat as user-set. */
export const OVERLAY_OPACITY_LEGACY_DEFAULTS = Object.freeze([0.65, 0.8, 0.80, 0.85]);

export const getDefaultOverlayOpacity = () => {
  try {
    if (typeof document !== 'undefined' &&
        document.documentElement.getAttribute('data-theme') === 'light') {
      return OVERLAY_OPACITY_DEFAULT_LIGHT;
    }
  } catch {
    /* node tests / no DOM */
  }
  return OVERLAY_OPACITY_DEFAULT_DARK;
};

export const clampOverlayOpacity = (opacity) => clamp(opacity, OVERLAY_OPACITY_MIN, OVERLAY_OPACITY_MAX);

export const isStoredOverlayOpacityUserSet = (parsed) => {
  if (!Number.isFinite(parsed)) return false;
  const eps = 1e-6;
  if (OVERLAY_OPACITY_LEGACY_DEFAULTS.some((v) => Math.abs(parsed - v) < eps)) return false;
  if (Math.abs(parsed - OVERLAY_OPACITY_DEFAULT) < eps) return false;
  if (Math.abs(parsed - OVERLAY_OPACITY_DEFAULT_DARK) < eps) return false;
  if (Math.abs(parsed - OVERLAY_OPACITY_DEFAULT_LIGHT) < eps) return false;
  return true;
};

export const resolveStoredOverlayOpacity = (stored) => {
  const parsed = stored != null && stored !== '' ? parseFloat(stored) : NaN;
  return isStoredOverlayOpacityUserSet(parsed)
    ? clampOverlayOpacity(parsed)
    : getDefaultOverlayOpacity();
};

export const migrateStoredOverlayOpacity = () => {
  const stored =
    typeof localStorage !== 'undefined' ? localStorage.getItem('natively_overlay_opacity') : null;
  const parsed = stored != null && stored !== '' ? parseFloat(stored) : NaN;
  const resolved = resolveStoredOverlayOpacity(stored);
  if (typeof localStorage !== 'undefined' && !isStoredOverlayOpacityUserSet(parsed)) {
    localStorage.setItem('natively_overlay_opacity', String(resolved));
  }
  return resolved;
};

const normalizeOpacity = (opacity) =>
  (clampOverlayOpacity(opacity) - OVERLAY_OPACITY_MIN) / (OVERLAY_OPACITY_MAX - OVERLAY_OPACITY_MIN);
const scale = (min, max, strength, ease = 1) =>
  mix(min, max, Math.pow(clamp(strength, 0, 1), ease));

/**
 * @param {number} opacity
 * @param {'light' | 'dark'} theme
 */
export const getOverlayAppearance = (opacity, theme) => {
  const strength = normalizeOpacity(opacity);
  const surfaceStrength = Math.pow(strength, 1.02);
  const blurStrength = Math.pow(strength, 0.94);

  if (theme === 'light') {
    return {
      shellStyle: {
        backgroundColor: `rgba(214, 228, 247, ${scale(0.085, 1, surfaceStrength)})`,
        borderColor: `rgba(37, 99, 235, ${scale(0.08, 0.16, surfaceStrength)})`,
        boxShadow: 'none',
        backdropFilter: `blur(${scale(4, 18, blurStrength)}px) saturate(145%)`,
        WebkitBackdropFilter: `blur(${scale(4, 18, blurStrength)}px) saturate(145%)`,
      },
      pillStyle: {
        backgroundColor: `rgba(221, 234, 250, ${scale(0.075, 0.98, surfaceStrength)})`,
        borderColor: `rgba(37, 99, 235, ${scale(0.08, 0.16, surfaceStrength)})`,
        boxShadow: 'none',
        backdropFilter: `blur(${scale(3, 11, blurStrength)}px) saturate(140%)`,
        WebkitBackdropFilter: `blur(${scale(3, 11, blurStrength)}px) saturate(140%)`,
      },
      transcriptStyle: {
        backgroundColor: `rgba(245, 249, 255, ${scale(0.05, 0.92, surfaceStrength)})`,
        borderBottomColor: 'transparent',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
      },
      subtleStyle: {
        backgroundColor: `rgba(245, 249, 255, ${scale(0.05, 0.92, surfaceStrength)})`,
        borderColor: `rgba(30, 64, 175, ${scale(0.06, 0.13, surfaceStrength)})`,
      },
      chipStyle: {
        backgroundColor: `rgba(248, 251, 255, ${scale(0.055, 0.9, surfaceStrength)})`,
        borderColor: `rgba(30, 64, 175, ${scale(0.06, 0.13, surfaceStrength)})`,
      },
      inputStyle: {
        backgroundColor: `rgba(248, 251, 255, ${scale(0.065, 0.94, surfaceStrength)})`,
        borderColor: `rgba(30, 64, 175, ${scale(0.07, 0.14, surfaceStrength)})`,
      },
      controlStyle: {
        backgroundColor: `rgba(248, 251, 255, ${scale(0.06, 0.92, surfaceStrength)})`,
        borderColor: `rgba(30, 64, 175, ${scale(0.07, 0.14, surfaceStrength)})`,
      },
      iconStyle: {
        backgroundColor: `rgba(248, 251, 255, ${scale(0.055, 0.88, surfaceStrength)})`,
      },
      codeBlockStyle: {
        backgroundColor: `rgba(249, 250, 251, ${scale(0.06, 0.94, surfaceStrength)})`,
        borderColor: `rgba(0, 0, 0, ${scale(0.07, 0.15, surfaceStrength)})`,
      },
      codeHeaderStyle: {
        backgroundColor: `rgba(243, 244, 246, ${scale(0.08, 0.96, surfaceStrength)})`,
        borderBottomColor: `rgba(0, 0, 0, ${scale(0.08, 0.16, surfaceStrength)})`,
      },
      dividerStyle: {
        backgroundColor: `rgba(30, 64, 175, ${scale(0.08, 0.16, surfaceStrength)})`,
      },
    };
  }

  // InterviewMan-like charcoal: Ask-bar baseline (~0.88+) so bright meeting
  // UIs cannot wash the shell to light gray (readability > glass see-through).
  return {
    shellStyle: {
      backgroundColor: `rgba(18, 18, 22, ${scale(0.88, 0.98, surfaceStrength)})`,
      borderColor: `rgba(255, 255, 255, ${scale(0.1, 0.16, surfaceStrength)})`,
      boxShadow: 'none',
      backdropFilter: `blur(${scale(8, 22, blurStrength)}px) saturate(140%)`,
      WebkitBackdropFilter: `blur(${scale(8, 22, blurStrength)}px) saturate(140%)`,
    },
    pillStyle: {
      backgroundColor: `rgba(18, 18, 22, ${scale(0.86, 0.97, surfaceStrength)})`,
      borderColor: `rgba(255, 255, 255, ${scale(0.1, 0.16, surfaceStrength)})`,
      boxShadow: 'none',
      backdropFilter: `blur(${scale(6, 16, blurStrength)}px) saturate(136%)`,
      WebkitBackdropFilter: `blur(${scale(6, 16, blurStrength)}px) saturate(136%)`,
    },
    transcriptStyle: {
      backgroundColor: `rgba(12, 12, 16, ${scale(0.90, 0.97, surfaceStrength)})`,
      borderColor: `rgba(255, 255, 255, ${scale(0.08, 0.14, surfaceStrength)})`,
      borderBottomColor: 'transparent',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
    },
    subtleStyle: {
      backgroundColor: `rgba(28, 30, 36, ${scale(0.86, 0.96, surfaceStrength)})`,
      borderColor: `rgba(255, 255, 255, ${scale(0.06, 0.1, surfaceStrength)})`,
    },
    chipStyle: {
      backgroundColor: `rgba(36, 38, 46, ${scale(0.88, 0.96, surfaceStrength)})`,
      borderColor: `rgba(255, 255, 255, ${scale(0.06, 0.1, surfaceStrength)})`,
    },
    inputStyle: {
      backgroundColor: `rgba(28, 30, 36, ${scale(0.88, 0.96, surfaceStrength)})`,
      borderColor: `rgba(255, 255, 255, ${scale(0.07, 0.12, surfaceStrength)})`,
    },
    controlStyle: {
      backgroundColor: `rgba(34, 36, 44, ${scale(0.86, 0.95, surfaceStrength)})`,
      borderColor: `rgba(255, 255, 255, ${scale(0.07, 0.12, surfaceStrength)})`,
    },
    iconStyle: {
      backgroundColor: `rgba(36, 38, 46, ${scale(0.86, 0.95, surfaceStrength)})`,
    },
    codeBlockStyle: {
      backgroundColor: `rgba(${VIVID_DARK_CODE_BG_RGB}, ${scale(0.88, 0.98, surfaceStrength)})`,
      borderColor: `rgba(255, 255, 255, ${scale(0.07, 0.12, surfaceStrength)})`,
    },
    codeHeaderStyle: {
      backgroundColor: `rgba(28, 28, 32, ${scale(0.86, 0.96, surfaceStrength)})`,
      borderBottomColor: `rgba(255, 255, 255, ${scale(0.07, 0.12, surfaceStrength)})`,
    },
    dividerStyle: {
      backgroundColor: `rgba(255, 255, 255, ${scale(0.08, 0.14, surfaceStrength)})`,
    },
  };
};

export const getGlassOverlayAppearance = () => ({
  shellStyle: {},
  pillStyle: {},
  transcriptStyle: {},
  subtleStyle: {},
  chipStyle: {},
  inputStyle: {},
  controlStyle: {},
  iconStyle: {},
  codeBlockStyle: {},
  codeHeaderStyle: {},
  dividerStyle: {},
});
