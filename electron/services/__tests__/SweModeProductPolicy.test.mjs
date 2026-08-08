import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const policyPath = path.resolve(here, '../../../dist-electron/electron/services/sweModeProductPolicy.js');

async function loadPolicy() {
  return import(pathToFileURL(policyPath).href);
}

test('hard-out templates are sales/lecture/seminar/recruiting', async () => {
  const { HARD_OUT_MODE_TEMPLATES, isHardOutModeTemplate } = await loadPolicy();
  assert.deepEqual([...HARD_OUT_MODE_TEMPLATES].sort(), [
    'lecture',
    'recruiting',
    'sales',
    'seminar',
  ]);
  assert.equal(isHardOutModeTemplate('sales'), true);
  assert.equal(isHardOutModeTemplate('technical-interview'), false);
});

test('looking-for-work migrates to SWE session; product create is TI only', async () => {
  const {
    shouldMigrateActiveModeToSwe,
    isProductCreatableTemplate,
    SWE_INTERVIEW_TEMPLATE,
    PRODUCT_CREATE_MODE_TEMPLATES,
  } = await loadPolicy();
  assert.equal(shouldMigrateActiveModeToSwe('looking-for-work'), true);
  assert.equal(shouldMigrateActiveModeToSwe('team-meet'), false);
  assert.equal(isProductCreatableTemplate('technical-interview'), true);
  assert.equal(isProductCreatableTemplate('general'), false);
  assert.equal(isProductCreatableTemplate('sales'), false);
  assert.deepEqual([...PRODUCT_CREATE_MODE_TEMPLATES], [SWE_INTERVIEW_TEMPLATE]);
});

test('resolveModePriorTemplate maps hard-out and LFW to technical-interview', async () => {
  const { resolveModePriorTemplate } = await loadPolicy();
  assert.equal(resolveModePriorTemplate('sales'), 'technical-interview');
  assert.equal(resolveModePriorTemplate('lecture'), 'technical-interview');
  assert.equal(resolveModePriorTemplate('seminar'), 'technical-interview');
  assert.equal(resolveModePriorTemplate('recruiting'), 'technical-interview');
  assert.equal(resolveModePriorTemplate('looking-for-work'), 'technical-interview');
  assert.equal(resolveModePriorTemplate('team-meet'), 'team-meet');
  assert.equal(resolveModePriorTemplate('technical-interview'), 'technical-interview');
});

test('ModesSettings create picker only offers technical-interview', () => {
  const src = fs.readFileSync(path.join(root, 'src/components/settings/ModesSettings.tsx'), 'utf8');
  assert.match(src, /value:\s*'technical-interview'/);
  assert.doesNotMatch(src, /value:\s*'sales'/);
  assert.doesNotMatch(src, /value:\s*'lecture'/);
  assert.doesNotMatch(src, /value:\s*'seminar'/);
  assert.doesNotMatch(src, /value:\s*'recruiting'/);
  assert.doesNotMatch(src, /value:\s*'general'/);
  assert.doesNotMatch(src, /value:\s*'team-meet'/);
  assert.doesNotMatch(src, /value:\s*'looking-for-work'/);
  assert.doesNotMatch(src, /sales calls, interviews, lectures/);
});

test('AboutSection does not market Sales/Lecture Intelligence OS priors', () => {
  const src = fs.readFileSync(path.join(root, 'src/components/AboutSection.tsx'), 'utf8');
  assert.doesNotMatch(src, /Sales, Technical, Lecture/);
  assert.doesNotMatch(src, /mode-aware priors \(Sales/);
});

test('ensureSeeded prefers technical-interview seed (source contract)', () => {
  const src = fs.readFileSync(path.join(root, 'electron/services/ModesManager.ts'), 'utf8');
  const ensure = src.slice(src.indexOf('public ensureSeeded()'));
  const body = ensure.slice(0, ensure.indexOf('\n    public getActiveMode'));
  assert.match(body, /SWE_INTERVIEW_TEMPLATE/);
  assert.doesNotMatch(body, /templateType: 'general'/);
  assert.match(body, /shouldMigrateActiveModeToSwe/);
  assert.match(body, /Technical Interview/);
});
