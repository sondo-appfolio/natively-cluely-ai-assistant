import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  OVERLAY_OPACITY_DEFAULT,
  OVERLAY_OPACITY_DEFAULT_DARK,
  clampOverlayOpacity,
  getOverlayAppearance,
  resolveStoredOverlayOpacity,
  isStoredOverlayOpacityUserSet,
  migrateStoredOverlayOpacity,
} from '../overlayAppearance.ts';

describe('overlay readability (InterviewMan-dark session shell)', () => {
  test('legacy 0.65 factory default is not treated as a user choice', () => {
    assert.equal(isStoredOverlayOpacityUserSet(0.65), false);
    assert.equal(resolveStoredOverlayOpacity('0.65'), OVERLAY_OPACITY_DEFAULT_DARK);
    assert.equal(resolveStoredOverlayOpacity(null), OVERLAY_OPACITY_DEFAULT_DARK);
  });

  test('explicit user opacity is preserved', () => {
    assert.equal(isStoredOverlayOpacityUserSet(0.5), true);
    assert.equal(resolveStoredOverlayOpacity('0.5'), 0.5);
  });

  test('dark shell at default opacity is mostly opaque for contrast', () => {
    const appearance = getOverlayAppearance(OVERLAY_OPACITY_DEFAULT, 'dark');
    const bg = String(appearance.shellStyle.backgroundColor);
    const m = bg.match(/rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/i);
    assert.ok(m, `expected rgba background, got ${bg}`);
    const alpha = Number(m[1]);
    assert.ok(
      alpha >= 0.78,
      `dark shell alpha ${alpha} too transparent for InterviewMan-like readability`,
    );
  });

  test('clamp still respects min/max', () => {
    assert.equal(clampOverlayOpacity(0), 0.35);
    assert.equal(clampOverlayOpacity(2), 1);
  });

  test('migrate persists theme default over legacy 0.65', () => {
    const mem = new Map();
    globalThis.localStorage = {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => { mem.set(k, String(v)); },
      removeItem: (k) => { mem.delete(k); },
    };
    mem.set('natively_overlay_opacity', '0.65');
    const resolved = migrateStoredOverlayOpacity();
    assert.equal(resolved, OVERLAY_OPACITY_DEFAULT_DARK);
    assert.equal(mem.get('natively_overlay_opacity'), String(OVERLAY_OPACITY_DEFAULT_DARK));
  });
});
