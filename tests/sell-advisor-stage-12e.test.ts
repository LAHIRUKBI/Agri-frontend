import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const presentation = await import(
  '../app/dashboard/farmer/prediction/components/sell-advisor/detailsPagePresentation' +
    '.ts'
);

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), 'utf8');

const resultSource = await readSource(
  '../app/dashboard/farmer/prediction/components/RecommendationResult.tsx'
);
const resultScreenSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/SellAdvisorResultScreen.tsx'
);
const progressSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/ResultJourneyProgress.tsx'
);
const journeySource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/resultJourney.ts'
);
const detailsSource = resultSource.slice(
  resultSource.indexOf("activePage === 'details'")
);

test('canonical action owns the seller-facing Details decision', () => {
  assert.equal(
    presentation.getDetailsDecisionPresentation('SELL_NOW').label,
    'Sell Now'
  );
  assert.equal(
    presentation.getDetailsDecisionPresentation('WAIT').label,
    'Wait'
  );
  assert.equal(
    presentation.getDetailsDecisionPresentation('UNCERTAIN').label,
    'Check the market'
  );
  assert.match(
    resultSource,
    /selectedMarketObject\?\.action_decision \?\?[\s\S]*recommendation\.action_decision/
  );
  assert.match(resultSource, /getDetailsDecisionPresentation\(actionDecision\)/);
  assert.match(detailsSource, /data-action-decision=\{actionDecision\}/);
  assert.doesNotMatch(
    resultSource,
    /displayedDirectionSignal[\s\S]{0,120}getDetailsDecisionPresentation/
  );
});

test('changing direction evidence cannot change an unchanged canonical action', () => {
  const canonicalBefore = presentation.getDetailsDecisionPresentation('SELL_NOW');
  const directionBefore = presentation.formatDetailsSignalLabel('DOWN');
  const directionAfter = presentation.formatDetailsSignalLabel('UP');
  const canonicalAfter = presentation.getDetailsDecisionPresentation('SELL_NOW');

  assert.equal(directionBefore, 'Downward');
  assert.equal(directionAfter, 'Upward');
  assert.deepEqual(canonicalAfter, canonicalBefore);
  assert.equal(canonicalAfter.label, 'Sell Now');
});

test('price evidence formats current, expected, and difference values safely', () => {
  assert.equal(presentation.formatDetailsPrice(520), 'Rs. 520/kg');
  assert.equal(presentation.formatDetailsPrice(441), 'Rs. 441/kg');
  assert.equal(presentation.formatDetailsPriceDifference(441 - 520), '-Rs. 79/kg');
  assert.equal(presentation.formatDetailsPriceDifference(540 - 520), '+Rs. 20/kg');
  assert.equal(presentation.formatDetailsPriceDifference(0), 'Rs. 0/kg');
  assert.equal(presentation.formatDetailsPrice(null), 'Unavailable');
  assert.equal(presentation.formatDetailsPrice(Number.NaN), 'Unavailable');
  assert.equal(
    presentation.formatDetailsPriceDifference(Number.NaN),
    'Not available'
  );
  assert.doesNotMatch(
    [
      presentation.formatDetailsPrice(null),
      presentation.formatDetailsPriceDifference(null),
      presentation.formatDetailsPriceDifference(Number.NaN),
    ].join(' '),
    /NaN|undefined/
  );
});

test('default hierarchy is seller-first and keeps Price evidence visible', () => {
  const summaryIndex = detailsSource.indexOf('Decision summary');
  const priceIndex = detailsSource.indexOf('Price evidence');
  const practicalIndex = detailsSource.indexOf('Practical explanation');
  const supportingIndex = detailsSource.indexOf('Supporting evidence');
  const technicalIndex = detailsSource.indexOf('Technical trace');

  assert.match(detailsSource, /Why this recommendation/);
  assert.match(detailsSource, /How did the system decide\?/);
  assert.ok(summaryIndex > 0);
  assert.ok(priceIndex > summaryIndex);
  assert.ok(practicalIndex > priceIndex);
  assert.ok(supportingIndex > practicalIndex);
  assert.ok(technicalIndex > supportingIndex);
  assert.match(detailsSource, /data-testid="details-price-evidence"/);
  assert.match(detailsSource, /Current price/);
  assert.match(detailsSource, /Expected next-period price/);
  assert.match(detailsSource, /Difference per kg/);
  assert.match(detailsSource, /Reference baseline/);
});

test('all supporting and technical groups use closed native accordions', () => {
  const accordionIds = [
    'market-direction-signal-accordion',
    'market-outlook-accordion',
    'additional-context-accordion',
    'model-decision-accordion',
    'model-performance-accordion',
    'data-limitations-accordion',
  ];

  for (const id of accordionIds) {
    assert.match(detailsSource, new RegExp(`data-testid="${id}"`));
  }

  assert.equal((detailsSource.match(/<details/g) ?? []).length, 6);
  assert.equal((detailsSource.match(/<summary/g) ?? []).length, 6);
  assert.doesNotMatch(detailsSource, /<details[^>]*\sopen(?:\s|=|>)/);
  assert.match(detailsSource, /group-open:rotate-180/);
  assert.match(detailsSource, /details\[open\] \.details-accordion-content/);
});

test('classifier confidence and alignment remain supporting metadata only', () => {
  const directionStart = detailsSource.indexOf(
    'data-testid="market-direction-signal-accordion"'
  );
  const directionSummaryEnd = detailsSource.indexOf('</summary>', directionStart);
  const directionEnd = detailsSource.indexOf('</details>', directionSummaryEnd);
  const directionSummary = detailsSource.slice(directionStart, directionSummaryEnd);
  const expandedDirectionContent = detailsSource.slice(
    directionSummaryEnd,
    directionEnd
  );

  assert.doesNotMatch(directionSummary, /Confidence|Signal alignment|ALIGNED/);
  assert.match(expandedDirectionContent, /Confidence/);
  assert.match(expandedDirectionContent, /Signal alignment/);
  assert.match(
    expandedDirectionContent,
    /does[\s\S]*not determine the canonical Sell\/Wait action/
  );
  assert.doesNotMatch(detailsSource, /Action confidence/);
});

test('practical explanation is concise and long context is disclosed separately', () => {
  assert.match(detailsSource, /What this means/);
  assert.match(detailsSource, /What you can do/);
  assert.match(
    detailsSource,
    /Compare confirmed buyer offers and selling costs before[\s\S]*finalizing the sale\./
  );
  assert.match(resultSource, /marketOutlookExplanation/);
  assert.match(resultSource, /additionalContextItems/);
  assert.match(resultSource, /Expected market movement/);
  assert.match(resultSource, /Prediction strength/);
  assert.doesNotMatch(detailsSource, /why_this_matters|suggested_action/);
});

test('technical trace retains existing evidence without making it primary', () => {
  assert.match(detailsSource, /Model &amp; Decision/);
  assert.match(detailsSource, /<MLPredictionOutput/);
  assert.match(detailsSource, /Model Performance/);
  assert.match(detailsSource, /modelMetricPresentations\.map/);
  assert.match(detailsSource, /Data &amp; Limitations/);
  assert.match(detailsSource, /<TransparencyNote/);
  assert.match(detailsSource, /Optional model, performance, and data details\./);
});

test('Details navigation, active step, and shared result actions stay intact', () => {
  assert.match(journeySource, /id: 'details',[\s\S]*label: 'Details'/);
  assert.match(progressSource, /aria-current=\{isActive \? 'step'/);
  assert.match(resultScreenSource, /activePage=\{activePage\}/);
  assert.match(detailsSource, /Back to Market/);
  assert.match(detailsSource, /getPreviousResultPage\(activePage\)/);
  assert.match(resultScreenSource, /Start new recommendation/);
  assert.match(resultScreenSource, /View My Recommendations/);
  assert.match(resultScreenSource, /Back to Dashboard/);
});

test('compact grid, readable typography, and reduced-motion behavior are explicit', () => {
  assert.match(
    detailsSource,
    /lg:grid-cols-\[minmax\(0,1\.06fr\)_minmax\(320px,0\.94fr\)\]/
  );
  assert.match(
    detailsSource,
    /text-\[13px\] font-semibold uppercase tracking-\[0\.14em\]/
  );
  assert.match(detailsSource, /lg:grid-cols-3/);
  assert.match(detailsSource, /lg:open:col-span-3/);
  assert.match(detailsSource, /@keyframes details-page-enter/);
  assert.match(detailsSource, /prefers-reduced-motion: reduce/);
});
