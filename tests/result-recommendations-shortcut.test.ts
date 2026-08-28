import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), 'utf8');

const resultScreenSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/SellAdvisorResultScreen.tsx'
);
const resultJourneySource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/resultJourney.ts'
);
const saveSource = await readSource(
  '../app/dashboard/farmer/prediction/saveRecommendation.ts'
);
const savedListSource = await readSource(
  '../app/dashboard/farmer/recommendations/page.tsx'
);
const savedDetailSource = await readSource(
  '../app/dashboard/farmer/recommendations/[id]/page.tsx'
);
const farmerNavigationSource = await readSource(
  '../app/navigation/farmer/page.tsx'
);
const notificationBellSource = await readSource(
  '../app/dashboard/farmer/components/notifications/FarmerNotificationBell.tsx'
);

const shortcutStart = resultScreenSource.indexOf(
  'href="/dashboard/farmer/recommendations"'
);
const shortcutEnd = resultScreenSource.indexOf('</Link>', shortcutStart);
const shortcutMarkup = resultScreenSource.slice(shortcutStart, shortcutEnd);

const sharedHeaderPattern =
  /{activePage === 'decision' && \([\s\S]*?onClick={handleSaveRecommendation}[\s\S]*?\n            \)}\n            <Link\n              href="\/dashboard\/farmer\/recommendations"/;

test('Page 1 shows View My Recommendations and keeps Save Recommendation', () => {
  assert.match(resultJourneySource, /{ id: 'decision', label: 'Decision' }/);
  assert.match(resultScreenSource, sharedHeaderPattern);
  assert.match(resultScreenSource, /'Save Recommendation'/);
  assert.match(resultScreenSource, />\s*View My Recommendations\s*</);
});

test('Page 2 shows the shared shortcut outside the Page 1 save guard', () => {
  assert.match(resultJourneySource, /{ id: 'market', label: 'Market' }/);
  assert.match(resultScreenSource, sharedHeaderPattern);
  assert.ok(shortcutStart > resultScreenSource.indexOf("activePage === 'decision'"));
});

test('Page 3 shows the shared shortcut outside the Page 1 save guard', () => {
  assert.match(resultJourneySource, /{ id: 'details', label: 'Details' }/);
  assert.match(resultScreenSource, sharedHeaderPattern);
  assert.equal(
    resultScreenSource.match(/>\s*View My Recommendations\s*</g)?.length,
    1
  );
});

test('Save Recommendation remains Page 1 only', () => {
  assert.match(
    resultScreenSource,
    /{activePage === 'decision' && \([\s\S]*?onClick={handleSaveRecommendation}/
  );
  assert.equal(
    resultScreenSource.match(/onClick={handleSaveRecommendation}/g)?.length,
    1
  );
  assert.equal(
    resultScreenSource.match(/data-saved-recommendation-id=/g)?.length,
    1
  );
});

test('shortcut uses client-side Link navigation to the existing list route', () => {
  assert.ok(shortcutStart >= 0 && shortcutEnd > shortcutStart);
  assert.match(resultScreenSource, /import Link from 'next\/link'/);
  assert.match(shortcutMarkup, /^href="\/dashboard\/farmer\/recommendations"/);
  assert.doesNotMatch(shortcutMarkup, /window\.location|router\.push|\?/);
  assert.match(savedListSource, /My Recommendations/);
  assert.match(savedDetailSource, /Saved Recommendation/);
});

test('shortcut is navigation-only with no API, persistence, or current-result data', () => {
  assert.doesNotMatch(
    shortcutMarkup,
    /onClick|fetch\(|saveRecommendation|handleSaveRecommendation|localStorage|result|submittedInput|recommendationTimestamp|notifications/i
  );
  assert.doesNotMatch(
    shortcutMarkup,
    /POST|GET|PATCH|recommend-market|notificationApi/
  );
});

test('shortcut visibility is independent of every save state', () => {
  assert.doesNotMatch(
    shortcutMarkup,
    /saveStatus|savedRecommendationId|saveMessage|saving|saved|error/i
  );
  for (const state of ['idle', 'saving', 'saved', 'error']) {
    assert.match(resultScreenSource, new RegExp(`'${state}'`));
  }
});

test('Decision, Market, Details, and previous/next result navigation stay intact', () => {
  assert.match(
    resultJourneySource,
    /{ id: 'decision', label: 'Decision' }[\s\S]*?{ id: 'market', label: 'Market' }[\s\S]*?{ id: 'details', label: 'Details' }/
  );
  assert.match(resultJourneySource, /getNextResultPage/);
  assert.match(resultJourneySource, /getPreviousResultPage/);
  assert.match(resultScreenSource, /onPageChange={setActivePage}/);
});

test('Stage 6 through Stage 8 routes and behavior remain present', () => {
  assert.match(resultScreenSource, /saveInFlight\.current/);
  assert.match(resultScreenSource, /recommendationTimestamp/);
  assert.match(saveSource, /method: 'POST'/);
  assert.match(saveSource, /prediction_target_date/);
  assert.match(
    farmerNavigationSource,
    /name: 'My Recommendations'[\s\S]*?path: '\/dashboard\/farmer\/recommendations'/
  );
  assert.match(notificationBellSource, /markNotificationRead\(/);
  assert.match(
    notificationBellSource,
    /getSavedRecommendationPath\(notification\.recommendation_id\)/
  );
});
