import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const stateModule = await import(
  '../app/dashboard/farmer/prediction/sellAdvisorState' + '.ts'
);
const optionsModule = await import('../utils/prediction-options' + '.ts');
const requestModule = await import(
  '../app/dashboard/farmer/prediction/sellAdvisorRequest' + '.ts'
);

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), 'utf8');

const manualPriceSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/ManualPriceStep.tsx'
);
const quantitySource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/QuantitySelectionStep.tsx'
);
const reviewSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/MarketAnalysisPlaceholder.tsx'
);
const pageSource = await readSource(
  '../app/dashboard/farmer/prediction/page.tsx'
);
const requestSource = await readSource(
  '../app/dashboard/farmer/prediction/sellAdvisorRequest.ts'
);

test('manual price begins empty and uses only a non-submitted example placeholder', () => {
  const draft = stateModule.createSellAdvisorDraft();

  assert.equal(draft.currentPrice, '');
  assert.equal(stateModule.isValidCurrentPrice(draft.currentPrice), false);
  assert.match(manualPriceSource, /Today&apos;s selling price/);
  assert.match(manualPriceSource, /Enter the price you can sell for today\./);
  assert.match(manualPriceSource, /placeholder="300"/);
  assert.doesNotMatch(manualPriceSource, /placeholder="(?:400|0|1|NaN)"/);
  assert.match(manualPriceSource, /value=\{value\}/);
  assert.doesNotMatch(manualPriceSource, /defaultValue=/);
});

test('manual request uses the entered price and never falls back to 400', () => {
  const ranges = optionsModule.getQuantityRangesForCrop('tomatoes');
  const enteredDraft = {
    ...stateModule.createSellAdvisorDraft(),
    crop: 'tomatoes',
    farmerDistrict: 'matara',
    currentPriceSource: 'manual',
    currentPrice: '300',
    quantityMode: 'range',
    harvestRange: ranges[1].label,
  };
  const emptyDraft = { ...enteredDraft, currentPrice: '' };

  assert.equal(
    requestModule.buildSellAdvisorSubmission(enteredDraft, ranges).request
      .price_rs_kg,
    300
  );
  assert.throws(() =>
    requestModule.buildSellAdvisorSubmission(emptyDraft, ranges)
  );
  assert.doesNotMatch(requestSource, /(?:\|\||\?\?)\s*400/);
  assert.doesNotMatch(reviewSource, /Rs\.\s*400/);
});

test('the legitimate system-price path remains available without a fabricated price', () => {
  const ranges = optionsModule.getQuantityRangesForCrop('tomatoes');
  const draft = {
    ...stateModule.createSellAdvisorDraft(),
    crop: 'tomatoes',
    farmerDistrict: 'matara',
    currentPriceSource: 'system',
    currentPrice: '',
    quantityMode: 'range',
    harvestRange: ranges[1].label,
  };
  const submission = requestModule.buildSellAdvisorSubmission(draft, ranges);

  assert.equal('price_rs_kg' in submission.request, false);
  assert.match(reviewSource, /Available during analysis/);
  assert.match(reviewSource, /Current market price/);
});

test('quantity mode is a keyboard-accessible compact exact-or-range control', () => {
  assert.match(quantitySource, /How much are you expecting to harvest\?/);
  assert.match(quantitySource, /Exact quantity/);
  assert.match(quantitySource, /Choose a range/);
  assert.match(quantitySource, /type="radio"/);
  assert.match(quantitySource, /checked=\{selected\}/);
  assert.match(quantitySource, /name="quantity-mode"/);
  assert.match(quantitySource, /has-\[:focus-visible\]:ring-2/);
  assert.doesNotMatch(quantitySource, />\s*(?:Selected|Not selected|svg)\s*</i);
});

test('five responsive range cards keep their production labels and gain local vectors', () => {
  assert.deepEqual(optionsModule.QUANTITY_RANGES.tomatoes, [
    { label: 'Small Harvest (50–150 kg)', value: 100, min: 50, max: 150 },
    { label: 'Medium Harvest (150–300 kg)', value: 225, min: 150, max: 300 },
    { label: 'Large Harvest (300–600 kg)', value: 450, min: 300, max: 600 },
    {
      label: 'Very Large Harvest (600–1000 kg)',
      value: 800,
      min: 600,
      max: 1000,
    },
    { label: 'Bulk Harvest (1000+ kg)', value: 1200, min: 1000 },
  ]);
  assert.match(quantitySource, /replace\(\/\\s\+Harvest\$\/, ''\)/);
  assert.match(quantitySource, /<HarvestRangeVisual index=\{rangeIndex\}/);
  assert.match(quantitySource, /<svg/);
  assert.match(quantitySource, /grid-cols-2[\s\S]*lg:grid-cols-5/);
  assert.match(quantitySource, /col-span-2 lg:col-span-1/);
});

test('quantity selection preserves midpoint and exact-value submission semantics', () => {
  const ranges = optionsModule.getQuantityRangesForCrop('tomatoes');
  const mediumRange = ranges[1];
  const rangeDraft = {
    ...stateModule.createSellAdvisorDraft(),
    crop: 'tomatoes',
    farmerDistrict: 'matara',
    currentPriceSource: 'manual',
    currentPrice: '300',
    quantityMode: 'range',
    harvestRange: mediumRange.label,
  };
  const exactDraft = {
    ...rangeDraft,
    quantityMode: 'exact',
    exactQuantity: '225',
  };

  assert.equal(optionsModule.getRangeEarningsQuantity(mediumRange), 225);
  assert.equal(
    requestModule.buildSellAdvisorSubmission(rangeDraft, ranges).submittedInput
      .quantity_kg,
    225
  );
  assert.equal(
    requestModule.buildSellAdvisorSubmission(exactDraft, ranges).submittedInput
      .quantity_kg,
    225
  );
  assert.match(quantitySource, /Expected harvest/);
  assert.match(
    quantitySource,
    /Use this if you already know your expected harvest\./
  );
});

test('review is a compact farmer-facing 2x2 summary with local artwork', () => {
  assert.match(reviewSource, /Ready to check the market/);
  assert.match(
    reviewSource,
    /Review your details before generating the recommendation\./
  );
  assert.match(reviewSource, /sm:grid-cols-2/);
  assert.match(reviewSource, /Crop/);
  assert.match(reviewSource, /District/);
  assert.match(reviewSource, /Quantity/);
  assert.match(reviewSource, /Today&apos;s price/);
  assert.match(reviewSource, /`~\$\{getRangeEarningsQuantity/);
  assert.match(reviewSource, /getCompactRangeLabel\(selectedRange\.label\)/);
  assert.match(reviewSource, /Entered by you/);
  assert.match(reviewSource, /<ProduceCrateIllustration \/>/);
  assert.match(reviewSource, /lg:grid-cols-\[minmax\(0,1\.55fr\)/);
  assert.match(reviewSource, /aria-hidden="true"/);
});

test('review CTA still invokes the existing recommendation flow without payload changes', () => {
  assert.match(reviewSource, /onClick=\{onCheckMarket\}/);
  assert.match(reviewSource, /disabled=\{!canSubmit\}/);
  assert.match(reviewSource, /Check Market Recommendation/);
  assert.match(reviewSource, /onClick=\{onBack\}/);
  assert.match(reviewSource, /Edit details/);
  assert.match(pageSource, /onCheckMarket=\{handleCheckMarket\}/);
  assert.match(pageSource, /buildSellAdvisorSubmission\(draft, quantityRanges\)/);
  assert.doesNotMatch(reviewSource, /\bfetch\s*\(|axios|saveRecommendation|notification/i);
});
