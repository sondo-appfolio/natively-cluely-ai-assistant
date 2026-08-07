import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp,
  widthDerivedScrollMax,
  verticalScrollCap,
  computeScrollMaxHeight,
} from '../overlayScrollBudget.mjs';
import { SESSION_SHELL_HEIGHT_FRACTION } from '../sessionShellVerticalBudget.mjs';

describe('overlayScrollBudget', () => {
  test('clamp bounds a value into [lo, hi]', () => {
    assert.equal(clamp(5, 0, 10), 5);
    assert.equal(clamp(-1, 0, 10), 0);
    assert.equal(clamp(99, 0, 10), 10);
  });

  describe('widthDerivedScrollMax', () => {
    test('collapsed width → minHeight (320)', () => {
      assert.equal(widthDerivedScrollMax(600), 320);
    });
    test('expanded width → maxHeight (720)', () => {
      assert.equal(widthDerivedScrollMax(780), 720);
    });
    test('midpoint interpolates linearly', () => {
      assert.equal(widthDerivedScrollMax(690), 520);
    });
    test('clamps below collapsed and above expanded', () => {
      assert.equal(widthDerivedScrollMax(400), 320);
      assert.equal(widthDerivedScrollMax(900), 720);
    });
  });

  describe('verticalScrollCap', () => {
    test('returns Infinity when availHeight is unknown (SSR / not measured)', () => {
      assert.equal(verticalScrollCap({ availHeight: 0, chromeHeight: 200 }), Infinity);
      assert.equal(
        verticalScrollCap({ availHeight: NaN, chromeHeight: 200 }),
        Infinity,
      );
    });

    test('budget = floor(availHeight*0.98) - safetyMargin - chrome', () => {
      // 900*0.98 = 882; -8 margin = 874; -300 chrome = 574
      assert.equal(
        verticalScrollCap({ availHeight: 900, chromeHeight: 300 }),
        Math.floor(900 * SESSION_SHELL_HEIGHT_FRACTION) - 8 - 300,
      );
    });

    test('never collapses below minScroll on a very short display', () => {
      assert.equal(
        verticalScrollCap({ availHeight: 500, chromeHeight: 400, minScroll: 120 }),
        120,
      );
    });
  });

  describe('computeScrollMaxHeight (the regression guard)', () => {
    test('SHORT display: vertical cap wins, keeps footer visible', () => {
      const chrome = 360;
      const availHeight = 900;
      const got = computeScrollMaxHeight({
        width: 780,
        availHeight,
        chromeHeight: chrome,
      });
      const budget = Math.floor(availHeight * SESSION_SHELL_HEIGHT_FRACTION);
      const expected = budget - 8 - chrome;
      assert.equal(got, expected);
      assert.ok(
        chrome + got <= budget,
        `content ${chrome + got} must fit budget ${budget}`,
      );
    });

    test('TALL display: width bound wins, chat looks unchanged', () => {
      const got = computeScrollMaxHeight({
        width: 780,
        availHeight: 1400,
        chromeHeight: 360,
      });
      assert.equal(got, 720);
    });

    test('attaching a screenshot (chrome grows) shrinks the scroll, not the footer', () => {
      const availHeight = 880;
      const base = computeScrollMaxHeight({
        width: 780,
        availHeight,
        chromeHeight: 300,
      });
      const withShot = computeScrollMaxHeight({
        width: 780,
        availHeight,
        chromeHeight: 300 + 72,
      });
      assert.ok(
        withShot < base,
        `scroll should shrink when a screenshot is attached (${withShot} < ${base})`,
      );
      const budget = Math.floor(availHeight * SESSION_SHELL_HEIGHT_FRACTION);
      assert.ok((300 + 72) + withShot <= budget);
    });

    test('unmeasured viewport falls back to width bound (no clamp)', () => {
      const got = computeScrollMaxHeight({
        width: 780,
        availHeight: 0,
        chromeHeight: 300,
      });
      assert.equal(got, 720);
    });
  });
});
