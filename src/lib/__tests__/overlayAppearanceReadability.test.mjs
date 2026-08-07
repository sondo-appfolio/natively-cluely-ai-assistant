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
} from '../overlayAppearance.mjs';

function rgbaAlpha(css) {
  const m = String(css).match(/rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/i);
  assert.ok(m, `expected rgba background, got ${css}`);
  return Number(m[1]);
}

describe('overlay readability (InterviewMan-dark session shell)', () => {
  test('legacy factory defaults are not treated as a user choice', () => {
    assert.equal(isStoredOverlayOpacityUserSet(0.65), false);
    assert.equal(isStoredOverlayOpacityUserSet(0.85), false);
    assert.equal(resolveStoredOverlayOpacity('0.65'), OVERLAY_OPACITY_DEFAULT_DARK);
    assert.equal(resolveStoredOverlayOpacity('0.85'), OVERLAY_OPACITY_DEFAULT_DARK);
    assert.equal(resolveStoredOverlayOpacity(null), OVERLAY_OPACITY_DEFAULT_DARK);
  });

  test('dark factory default is near-opaque InterviewMan charcoal', () => {
    assert.equal(OVERLAY_OPACITY_DEFAULT, 0.95);
    assert.equal(OVERLAY_OPACITY_DEFAULT_DARK, 0.95);
  });

  test('explicit user opacity is preserved', () => {
    assert.equal(isStoredOverlayOpacityUserSet(0.5), true);
    assert.equal(resolveStoredOverlayOpacity('0.5'), 0.5);
  });

  test('dark shell/chip/transcript at default opacity are mostly opaque', () => {
    const appearance = getOverlayAppearance(OVERLAY_OPACITY_DEFAULT, 'dark');
    const shell = rgbaAlpha(appearance.shellStyle.backgroundColor);
    const chip = rgbaAlpha(appearance.chipStyle.backgroundColor);
    const transcript = rgbaAlpha(appearance.transcriptStyle.backgroundColor);
    assert.ok(shell >= 0.9, `dark shell alpha ${shell} too transparent`);
    assert.ok(chip >= 0.9, `dark chip alpha ${chip} too transparent`);
    assert.ok(transcript >= 0.9, `dark transcript alpha ${transcript} too transparent`);
    assert.notEqual(
      String(appearance.transcriptStyle.backgroundColor),
      'transparent',
      'transcriptStyle must paint a real charcoal fill',
    );
  });

  test('clamp still respects min/max', () => {
    assert.equal(clampOverlayOpacity(0), 0.35);
    assert.equal(clampOverlayOpacity(2), 1);
  });

  test('migrate persists theme default over legacy 0.65 and 0.85', () => {
    const mem = new Map();
    globalThis.localStorage = {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => { mem.set(k, String(v)); },
      removeItem: (k) => { mem.delete(k); },
    };
    mem.set('natively_overlay_opacity', '0.85');
    const resolved = migrateStoredOverlayOpacity();
    assert.equal(resolved, OVERLAY_OPACITY_DEFAULT_DARK);
    assert.equal(mem.get('natively_overlay_opacity'), String(OVERLAY_OPACITY_DEFAULT_DARK));
  });
});
