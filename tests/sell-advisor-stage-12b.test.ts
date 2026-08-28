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

test('financial story keeps current, expected, quantity, and gross difference visible', () => {
  assert.match(dashboardSource, /\{currentPriceLabel\}/);
  assert.match(dashboardSource, /Expected next-period price/);
  assert.match(dashboardSource, />\s*Today\s*</);
  assert.match(dashboardSource, />\s*Expected\s*</);
  assert.match(dashboardSource, /quantitySummary/);
  assert.match(dashboardSource, /Potential gross difference/);
  assert.match(dashboardSource, /Presentation estimate, not guaranteed earnings/);
});

test('gross difference signs and missing estimates remain safe', () => {
  assert.equal(
    presentation.calculateWholesaleGrossDifference(100, 247, 112.5),
    16537.5
  );
  assert.equal(
    presentation.calculateWholesaleGrossDifference(247, 100, 112.5),
    -16537.5
  );
  assert.equal(
    presentation.calculateWholesaleGrossDifference(100, null, 112.5),
    null
  );
  assert.equal(presentation.formatSignedCurrency(16537.5), '+ Rs. 16,538');
  assert.equal(presentation.formatSignedCurrency(-16537.5), '- Rs. 16,538');
  assert.equal(presentation.formatSignedCurrency(null), 'Estimate unavailable');
  assert.match(dashboardSource, /const hasQuantity = Number\.isFinite\(quantity\) && quantity > 0/);
  assert.match(dashboardSource, /: 'Quantity unavailable'/);
});

test('weather impact is derived from existing forecast data and visible by default', () => {
  const forecast = {
    location: 'Kandy',
    period: 'next_7_days' as const,
    source: 'open_meteo' as const,
    days: [
      {
        date: '2026-08-27',
        weather_code: 61,
        temperature_max_c: 28,
        temperature_min_c: 21,
        rain_probability: 75,
        rainfall_mm: 8,
      },
      {
        date: '2026-08-28',
        weather_code: 3,
        temperature_max_c: 29,
        temperature_min_c: 21,
        rain_probability: 35,
        rainfall_mm: 1,
      },
      {
        date: '2026-08-29',
        weather_code: 80,
        temperature_max_c: 27,
        temperature_min_c: 20,
        rain_probability: 60,
        rainfall_mm: 5,
      },
    ],
  };

  assert.deepEqual(presentation.getWeatherImpactPresentation(forecast), {
    headline: 'High rain chance over the next 3 days',
    guidance:
      'Allow extra time for transport and protect produce from wet conditions.',
    rainLabel: 'Peak rain chance 75%',
  });
  assert.match(dashboardSource, /data-testid="weather-impact-summary"/);
  assert.match(dashboardSource, /Weather impact/);
  assert.match(dashboardSource, /View 7-day forecast/);
});

test('full forecast stays collapsed initially and opens through the shared detail state', () => {
  assert.match(
    dashboardSource,
    /useState<DecisionDetailKey \| null>\(null\)/
  );
  assert.match(
    dashboardSource,
    /expandedPanel\([\s\S]*'weather'[\s\S]*<WeatherForecastStrip forecast=\{weatherForecast\}/
  );
  assert.match(dashboardSource, /onClick=\{\(\) => toggleSection\('weather'\)\}/);
  assert.match(dashboardSource, /grid-rows-\[0fr\]/);
  assert.match(dashboardSource, /grid-rows-\[1fr\]/);
});

test('weather and supporting evidence cannot replace the canonical backend action', () => {
  assert.equal(presentation.getDecisionHeroPresentation('WAIT').label, 'Wait');
  assert.equal(
    presentation.getDecisionHeroPresentation('SELL_NOW').label,
    'Sell Now'
  );
  assert.match(dashboardSource, /getDecisionHeroPresentation\(decision\)/);
  assert.match(dashboardSource, /data-action-decision=\{decision\}/);
  assert.match(resultSource, /decision=\{actionDecision\}/);
  assert.doesNotMatch(
    presentation.getDecisionHeroPresentation.toString(),
    /weather|outlook|confidence|gross/i
  );
});

test('default hero excludes classifier confidence and policy trace values', () => {
  const defaultSummary = dashboardSource.slice(
    dashboardSource.indexOf('data-testid="decision-dashboard"'),
    dashboardSource.indexOf('Supporting recommendation details')
  );

  assert.doesNotMatch(defaultSummary, /displayedConfidence/);
  assert.doesNotMatch(defaultSummary, /Action policy/);
  assert.doesNotMatch(defaultSummary, /Reason codes/);
  assert.match(defaultSummary, /Recommended market/);
  assert.match(defaultSummary, /data-testid="canonical-decision"/);
});

test('market card is softened and practical guidance is concise', () => {
  const marketStart = dashboardSource.indexOf('Recommended market');
  const weatherStart = dashboardSource.indexOf('weather-impact-heading');
  const marketMarkup = dashboardSource.slice(marketStart - 700, weatherStart);

  assert.match(marketMarkup, /bg-emerald-50\/60/);
  assert.doesNotMatch(marketMarkup, /bg-emerald-800/);
  assert.match(dashboardSource, /guidanceItems\.map/);
  assert.match(dashboardSource, /What should I do\?/);
  assert.match(dashboardSource, /getShortSellerGuidance/);
});

test('primary and secondary detail controls have a calmer explicit priority', () => {
  const detailsStart = dashboardSource.indexOf(
    '<section aria-label="Supporting recommendation details">'
  );
  const panelsStart = dashboardSource.indexOf("expandedPanel(\n          'why'");
  const controls = dashboardSource.slice(detailsStart, panelsStart);

  const whyIndex = controls.indexOf('label="Why this decision?"');
  const weatherIndex = controls.indexOf('label="Weather forecast"');
  const outlookIndex = controls.indexOf('label="Market outlook"');

  assert.ok(whyIndex >= 0 && whyIndex < weatherIndex);
  assert.ok(weatherIndex < outlookIndex);
  assert.match(controls, /<SecondaryDetailControl[\s\S]*label="Additional guidance"/);
  assert.match(controls, /<SecondaryDetailControl[\s\S]*label="Technical details"/);
  assert.match(controls, /sm:grid-cols-3/);
});

test('typography reserves heavy emphasis for the canonical decision', () => {
  assert.match(dashboardSource, /data-testid="canonical-decision"/);
  assert.match(dashboardSource, /text-4xl font-bold/);
  assert.doesNotMatch(dashboardSource, /font-black|font-extrabold/);
  assert.match(dashboardSource, /text-2xl font-semibold/);
  assert.match(dashboardSource, /text-lg font-semibold/);
});
