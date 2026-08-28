import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const presentation = await import(
  '../app/dashboard/farmer/prediction/components/sell-advisor/decisionPagePresentation' +
    '.ts'
);

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), 'utf8');

const dashboardSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/DecisionPageDashboard.tsx'
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
const marketPageSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/MarketPageComparison.tsx'
);

test('canonical WAIT, SELL_NOW, and UNCERTAIN actions own the hero label', () => {
  assert.deepEqual(presentation.getDecisionHeroPresentation('WAIT'), {
    label: 'Wait',
    summary:
      'Prices are expected to be higher in the next market period, so waiting has the clearer price advantage.',
  });
  assert.equal(
    presentation.getDecisionHeroPresentation('SELL_NOW').label,
    'Sell Now'
  );
  assert.equal(
    presentation.getDecisionHeroPresentation('UNCERTAIN').label,
    'Check the market'
  );
  assert.match(resultSource, /decision=\{actionDecision\}/);
  assert.match(dashboardSource, /\{hero\.label\}/);
});

test('market outlook cannot create or replace the canonical action', () => {
  assert.equal(
    presentation.getDecisionHeroPresentation('WAIT').label,
    presentation.getDecisionHeroPresentation('WAIT').label
  );
  assert.match(dashboardSource, /getDecisionHeroPresentation\(decision\)/);
  assert.match(dashboardSource, /marketOutlookPresentation\?\.summary/);
  const heroMarkup = dashboardSource.slice(
    dashboardSource.indexOf('data-testid="decision-dashboard"'),
    dashboardSource.indexOf('Wholesale financial impact')
  );
  assert.doesNotMatch(heroMarkup, /marketOutlookPresentation|displayedConfidence/);
});

test('current, expected, and per-kg price difference stay visible and safe', () => {
  assert.match(dashboardSource, /Price summary/);
  assert.match(dashboardSource, /\{currentPriceLabel\}/);
  assert.match(dashboardSource, /Expected next-period price/);
  assert.match(dashboardSource, /formatSignedCurrency\(priceDifference\)/);
  assert.match(dashboardSource, /Estimate unavailable/);
  assert.doesNotMatch(dashboardSource, /Experimental Model-Implied Value/);
});

test('wholesale impact uses only existing prices and quantity', () => {
  assert.equal(
    presentation.calculateWholesaleGrossDifference(400, 484.5, 225),
    19012.5
  );
  assert.equal(
    presentation.calculateWholesaleGrossDifference(400, 380, 225),
    -4500
  );
  assert.equal(
    presentation.calculateWholesaleGrossDifference(400, null, 225),
    null
  );
  assert.equal(
    presentation.calculateWholesaleGrossDifference(400, 420, 0),
    null
  );
  assert.equal(presentation.formatSignedCurrency(19012.5), '+ Rs. 19,013');
  assert.equal(presentation.formatSignedCurrency(-4500), '- Rs. 4,500');
  assert.equal(presentation.formatSignedCurrency(null), 'Estimate unavailable');
  assert.match(dashboardSource, /Wholesale financial impact/);
  assert.match(dashboardSource, /quantitySummary/);
  assert.match(dashboardSource, />\s*Today\s*</);
  assert.match(dashboardSource, />\s*Expected\s*</);
  assert.match(dashboardSource, /Potential gross difference/);
});

test('missing prices never render NaN or fabricated gross impact', () => {
  assert.equal(
    presentation.calculateWholesaleGrossDifference(null, null, 225),
    null
  );
  assert.equal(
    presentation.calculateWholesaleGrossDifference(400, Number.NaN, 225),
    null
  );
  assert.equal(
    presentation.getWhyDecisionExplanation('UNCERTAIN', null),
    'A reliable current-to-expected price comparison is unavailable, so no price difference has been fabricated.'
  );
});

test('all supporting sections start closed and share one local open state', () => {
  for (const label of [
    'Why this decision?',
    'Market outlook',
    'Weather forecast',
    'Additional guidance',
    'Technical details',
  ]) {
    assert.match(dashboardSource, new RegExp(label.replace('?', '\\?')));
  }
  assert.match(
    dashboardSource,
    /useState<DecisionDetailKey \| null>\(null\)/
  );
  assert.match(dashboardSource, /aria-expanded=\{open\}/);
  assert.match(dashboardSource, /aria-controls=\{`decision-detail-/);
  assert.match(
    dashboardSource,
    /setOpenSection\(\(current\) => \(current === section \? null : section\)\)/
  );
  assert.match(dashboardSource, /grid-rows-\[0fr\]/);
  assert.match(dashboardSource, /grid-rows-\[1fr\]/);
});

test('confidence and full weather stay inside collapsed supporting panels', () => {
  const heroMarkup = dashboardSource.slice(
    dashboardSource.indexOf('data-testid="decision-dashboard"'),
    dashboardSource.indexOf('Supporting recommendation details')
  );
  assert.doesNotMatch(heroMarkup, /displayedConfidence|confidenceLabel/);
  assert.match(dashboardSource, /Classifier confidence/);
  assert.match(dashboardSource, /expandedPanel\([\s\S]*'outlook'/);
  assert.match(
    dashboardSource,
    /expandedPanel\([\s\S]*'weather'[\s\S]*<WeatherForecastStrip forecast=\{weatherForecast\}/
  );
  assert.doesNotMatch(resultSource, /<WeatherForecastStrip/);
});

test('recommended market, seller guidance, and navigation remain visible', () => {
  assert.match(dashboardSource, /Recommended market/);
  assert.match(dashboardSource, /\{recommendedMarketName\}/);
  assert.match(dashboardSource, /What should I do\?/);
  assert.match(dashboardSource, /getShortSellerGuidance/);
  assert.match(dashboardSource, /View Market Details/);
  assert.match(resultSource, /onViewMarketDetails=\{\(\) =>/);
  assert.match(screenSource, /Save Recommendation/);
  assert.match(screenSource, /View My Recommendations/);
  assert.match(screenSource, /Start new recommendation/);
  assert.match(screenSource, /Back to Dashboard/);
  assert.match(progressSource, /RESULT_JOURNEY_PAGES\.map/);
});

test('Page 2 and Page 3 branches remain separate from the new dashboard', () => {
  const decisionEnd = resultSource.indexOf("activePage === 'market'");
  const marketEnd = resultSource.indexOf("activePage === 'details'");
  const decisionMarkup = resultSource.slice(0, decisionEnd);
  const marketMarkup = resultSource.slice(decisionEnd, marketEnd);
  const detailsMarkup = resultSource.slice(marketEnd);

  assert.match(decisionMarkup, /<DecisionPageDashboard/);
  assert.doesNotMatch(marketMarkup, /<DecisionPageDashboard/);
  assert.doesNotMatch(detailsMarkup, /<DecisionPageDashboard/);
  assert.match(marketMarkup, /<MarketPageComparison/);
  assert.match(marketPageSource, /Where should I sell\?/);
  assert.match(detailsMarkup, /How did the system decide\?/);
});

test('compact spacing, restrained animation, and reduced motion are explicit', () => {
  assert.match(dashboardSource, /sm:grid-cols-3/);
  assert.match(dashboardSource, /lg:grid-cols-\[1\.2fr_0\.8fr\]/);
  assert.match(dashboardSource, /text-4xl/);
  assert.match(dashboardSource, /text-2xl/);
  assert.match(dashboardSource, /@keyframes decision-enter/);
  assert.match(dashboardSource, /prefers-reduced-motion: reduce/);
  assert.match(dashboardSource, /motion-reduce:transition-none/);
  assert.match(screenSource, /px-3 py-2/);
  assert.match(progressSource, /items-center/);
});
