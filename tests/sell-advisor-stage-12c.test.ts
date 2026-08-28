import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const presentation = await import(
  '../app/dashboard/farmer/prediction/components/sell-advisor/marketPagePresentation' +
    '.ts'
);

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), 'utf8');

const marketPageSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/MarketPageComparison.tsx'
);
const resultSource = await readSource(
  '../app/dashboard/farmer/prediction/components/RecommendationResult.tsx'
);
const screenSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/SellAdvisorResultScreen.tsx'
);
const progressSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/ResultJourneyProgress.tsx'
);

const market = (
  id: string,
  isRecommended = false,
  expectedPrice: number | null = 400
) => ({
  id,
  name: id.toUpperCase(),
  currentPrice: 380,
  expectedPrice,
  harvestValue: 45_000,
  direction: 'UP',
  isRecommended,
});

type MarketIdItem = { id: string };

test('Market page renders its seller-facing hierarchy and context', () => {
  assert.match(marketPageSource, /Where should I sell\?/);
  assert.match(
    marketPageSource,
    /Compare the available markets for your recommendation\./
  );
  assert.match(marketPageSource, /Recommended market/);
  assert.match(marketPageSource, /Quick comparison/);
  assert.match(marketPageSource, /Alternative markets/);
  assert.match(marketPageSource, /Why this market\?/);
  assert.match(marketPageSource, /\{cropName\}/);
  assert.match(marketPageSource, /Selling from \{districtName\}/);
});

test('exact backend-selected market remains the primary recommended market', () => {
  const layout = presentation.getMarketPageLayout([
    market('kandy'),
    market('dambulla', true),
    market('meegoda'),
  ]);

  assert.equal(layout.primaryMarket?.id, 'dambulla');
  assert.equal(layout.primaryMarket?.isRecommended, true);
  assert.deepEqual(
    layout.alternativeMarkets.map((item: MarketIdItem) => item.id),
    ['kandy', 'meegoda']
  );
  assert.match(resultSource, /recommendation\.recommended_market/);
  assert.match(
    resultSource,
    /createMarketPageMarket\(recommendedMarketForPage, true\)/
  );
  assert.match(marketPageSource, /primaryMarket\.isRecommended/);
});

test('one-market response renders safely without fake alternatives', () => {
  const layout = presentation.getMarketPageLayout([market('kandy', true)]);

  assert.equal(layout.primaryMarket?.id, 'kandy');
  assert.deepEqual(layout.alternativeMarkets, []);
  assert.match(
    marketPageSource,
    /No alternative market comparison is available in this response\./
  );
});

test('one available but unrecommended market receives no recommended claim', () => {
  const layout = presentation.getMarketPageLayout([market('kandy')]);

  assert.equal(layout.primaryMarket?.id, 'kandy');
  assert.equal(layout.primaryMarket?.isRecommended, false);
  assert.deepEqual(layout.alternativeMarkets, []);
  assert.match(marketPageSource, /Shown as an available market without a recommendation claim\./);
});

test('two-market response produces one primary and one alternative', () => {
  const layout = presentation.getMarketPageLayout([
    market('dambulla', true),
    market('kandy'),
  ]);

  assert.equal(layout.primaryMarket?.id, 'dambulla');
  assert.deepEqual(
    layout.alternativeMarkets.map((item: MarketIdItem) => item.id),
    ['kandy']
  );
});

test('three-plus response preserves returned alternative order', () => {
  const layout = presentation.getMarketPageLayout([
    market('dambulla', true),
    market('kandy'),
    market('meegoda'),
    market('puttalam'),
  ]);

  assert.deepEqual(
    layout.comparisonMarkets.map((item: MarketIdItem) => item.id),
    ['dambulla', 'kandy', 'meegoda', 'puttalam']
  );
  assert.deepEqual(
    layout.alternativeMarkets.map((item: MarketIdItem) => item.id),
    ['kandy', 'meegoda', 'puttalam']
  );
  assert.doesNotMatch(resultSource, /marketPageMarkets[\s\S]*\.sort\(/);
});

test('duplicate or unusable entries do not fabricate additional cards', () => {
  const layout = presentation.getMarketPageLayout([
    market('dambulla', true),
    market('dambulla'),
    { ...market(''), name: '' },
    market('kandy'),
  ]);

  assert.deepEqual(
    layout.comparisonMarkets.map((item: MarketIdItem) => item.id),
    ['dambulla', 'kandy']
  );
});

test('price presentation uses finite existing values only', () => {
  assert.equal(presentation.formatMarketPagePrice(420), 'Rs. 420/kg');
  assert.equal(presentation.formatMarketPagePrice(438.4), 'Rs. 438/kg');
  assert.equal(presentation.formatMarketPageCurrency(47_250), 'Rs. 47,250');
  assert.equal(presentation.formatMarketPagePrice(null), null);
  assert.equal(presentation.formatMarketPagePrice(Number.NaN), null);
  assert.equal(presentation.formatMarketPageCurrency(Number.NaN), null);
  assert.match(resultSource, /currentPrice: getMarketCurrentPrice\(market\)/);
  assert.match(resultSource, /expectedPrice/);
  assert.match(marketPageSource, /\{expectedPrice && \(/);
  assert.doesNotMatch(marketPageSource, /NaN|undefined|Rs\. 0/);
});

test('primary, alternatives, and local SVG clipart are structurally distinct', () => {
  assert.match(marketPageSource, /data-testid="primary-market-card"/);
  assert.match(marketPageSource, /data-testid="alternative-market-card"/);
  assert.match(marketPageSource, /<svg/);
  assert.match(marketPageSource, /aria-hidden="true"/);
  assert.match(marketPageSource, /focusable="false"/);
  assert.doesNotMatch(marketPageSource, /https?:\/\/|<img|backgroundImage/);
});

test('Why this market uses policy and response-order evidence only', () => {
  assert.match(
    marketPageSource,
    /selected by the backend[\s\S]*recommendation policy/
  );
  assert.match(marketPageSource, /does not rerank/);
  assert.doesNotMatch(
    marketPageSource,
    /highest price|distance advantage|buyer demand|stock level|guaranteed best/i
  );
});

test('market cards use restrained hover, staggered entry, and reduced motion', () => {
  assert.match(marketPageSource, /hover:-translate-y-0\.5/);
  assert.match(marketPageSource, /animationDelay/);
  assert.match(marketPageSource, /@keyframes market-card-enter/);
  assert.match(marketPageSource, /prefers-reduced-motion: reduce/);
  assert.match(marketPageSource, /motion-reduce:transition-none/);
});

test('Market page navigation and shared result actions remain intact', () => {
  assert.match(resultSource, /<MarketPageComparison/);
  assert.match(
    resultSource,
    /onBack=\{\(\) => onPageChange\(getPreviousResultPage\(activePage\)\)\}/
  );
  assert.match(
    resultSource,
    /onViewDetails=\{\(\) => onPageChange\(getNextResultPage\(activePage\)\)\}/
  );
  assert.match(marketPageSource, /View Details/);
  assert.match(progressSource, /RESULT_JOURNEY_PAGES\.map/);
  assert.match(screenSource, /Save Recommendation/);
  assert.match(screenSource, /View My Recommendations/);
  assert.match(screenSource, /Start new recommendation/);
  assert.match(screenSource, /Back to Dashboard/);
});
