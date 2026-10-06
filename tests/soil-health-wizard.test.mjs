import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pageSource = await readFile(
  new URL('../app/dashboard/farmer/soil-health/page.tsx', import.meta.url),
  'utf8'
);

test('soil health page exposes a four-step guided wizard', () => {
  assert.match(pageSource, /const \[wizardStep, setWizardStep\]/);
  assert.match(pageSource, /Farm details/);
  assert.match(pageSource, /Crop and season/);
  assert.match(pageSource, /Soil photo/);
  assert.match(pageSource, /Review and submit/);
  assert.match(pageSource, /Continue/);
  assert.match(pageSource, /Back/);
});

test('wizard keeps the existing quick-check and sensor-request submit flow', () => {
  assert.match(pageSource, /const handleSubmit = async/);
  assert.match(pageSource, /mode === 'quick' \? 'analyze-image' : 'requests'/);
  assert.match(pageSource, /t\.quickSubmit/);
  assert.match(pageSource, /t\.requestSubmit/);
});

test('wizard shows validation feedback on the active step', () => {
  assert.match(pageSource, /\{error && \(/);
});
