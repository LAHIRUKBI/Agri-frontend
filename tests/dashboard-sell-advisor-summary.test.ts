import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import type { SavedRecommendationSummary } from '../app/dashboard/farmer/recommendations/savedRecommendationsApi';

const { getSavedRecommendationsPreview } = await import(
  '../app/dashboard/farmer/home/components/savedRecommendationsPreview' + '.ts'
);

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), 'utf8');

const summarySource = await readSource(
  '../app/dashboard/farmer/home/components/SavedRecommendationsSummary.tsx'
);
const homeSource = await readSource('../app/dashboard/farmer/home/page.tsx');

const createRecommendation = (id: string): SavedRecommendationSummary => ({
  id,
  crop: 'beans',
  farmer_district: 'Colombo',
  recommended_market: 'Meegoda',
  current_price: 100,
  experimental_price: 110,
  quantity_kg: 10,
  market_outlook_status: 'UPWARD',
  market_outlook_strength: 'MODERATE',
  prediction_target_date: '2026-09-15T00:00:00.000Z',
  status: 'ACTIVE',
  created_at: '2026-08-30T00:00:00.000Z',
  reminder: null,
});

test('dashboard reuses the saved recommendations client and preserves API order', () => {
  assert.match(
    summarySource,
    /import \{[\s\S]*getSavedRecommendations,[\s\S]*type SavedRecommendationSummary,[\s\S]*\} from '\.\.\/\.\.\/recommendations\/savedRecommendationsApi'/
  );
  assert.match(
    summarySource,
    /getSavedRecommendations\(token, \{ signal: controller\.signal \}\)/
  );
  assert.match(summarySource, /getSavedRecommendationsPreview\(items\)/);
  assert.doesNotMatch(summarySource, /fetch\(|\.sort\(/);
});

test('preview handles zero, one, and more than two recommendations in API order', () => {
  const first = createRecommendation('first');
  const second = createRecommendation('second');
  const third = createRecommendation('third');

  assert.deepEqual(getSavedRecommendationsPreview([]), []);
  assert.deepEqual(getSavedRecommendationsPreview([first]), [first]);
  assert.deepEqual(
    getSavedRecommendationsPreview([first, second, third]),
    [first, second]
  );
});

test('compact cards expose the requested summary fields and detail route', () => {
  for (const field of [
    'recommendation.crop',
    'recommendation.farmer_district',
    'recommendation.recommended_market',
    'recommendation.current_price',
    'recommendation.experimental_price',
    'recommendation.prediction_target_date',
    'recommendation.status',
  ]) {
    assert.match(summarySource, new RegExp(field.replace('.', '\\.')));
  }
  assert.match(
    summarySource,
    /href=\{`\/dashboard\/farmer\/recommendations\/\$\{encodeURIComponent\(/
  );
  assert.match(summarySource, /formatSavedPrice/);
  assert.match(summarySource, /formatSavedDate/);
  assert.match(summarySource, /getLifecyclePresentation/);
});

test('summary provides view-all, empty-state, loading, and isolated error UI', () => {
  assert.match(summarySource, /Saved Recommendations/);
  assert.match(
    summarySource,
    /href="\/dashboard\/farmer\/recommendations"[\s\S]*Show More/
  );
  assert.match(summarySource, /Loading saved recommendations/);
  assert.match(summarySource, /No saved recommendations yet\./);
  assert.match(summarySource, /href="\/dashboard\/farmer\/prediction"/);
  assert.match(
    summarySource,
    /Saved recommendations are unavailable right now\./
  );
});

test('home adds the summary without removing existing dashboard sections', () => {
  assert.match(homeSource, /<SavedRecommendationsSummary \/>/);
  for (const existingSection of [
    'Soil Health Overview',
    'Crop Rotation',
    'Your Cultivation Journey',
    'Active Timers',
    'Quick Actions Enlarged',
  ]) {
    assert.match(homeSource, new RegExp(existingSection));
  }
  assert.match(homeSource, /<FarmerSidebar user=\{user\} \/>/);
  assert.match(homeSource, /overflow-y-auto/);
});
