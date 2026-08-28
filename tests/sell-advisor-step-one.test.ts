import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const stateModule = await import(
  '../app/dashboard/farmer/prediction/sellAdvisorState' + '.ts'
);
const optionsModule = await import('../utils/prediction-options' + '.ts');
const marketOptionsModule = await import(
  '../app/dashboard/farmer/prediction/marketOptions' + '.ts'
);
const requestModule = await import(
  '../app/dashboard/farmer/prediction/sellAdvisorRequest' + '.ts'
);
const resultJourneyModule = await import(
  '../app/dashboard/farmer/prediction/components/sell-advisor/resultJourney' +
    '.ts'
);
const modelPerformanceModule = await import(
  '../app/dashboard/farmer/prediction/components/sell-advisor/modelPerformance' +
    '.ts'
);

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), 'utf8');

const pageSource = await readSource(
  '../app/dashboard/farmer/prediction/page.tsx'
);
const cropSelectionSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/CropSelectionStep.tsx'
);
const priceSourceStepSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/PriceSourceStep.tsx'
);
const manualPriceSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/ManualPriceStep.tsx'
);
const locationSelectionSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/LocationSelectionStep.tsx'
);
const marketOptionsSource = await readSource(
  '../app/dashboard/farmer/prediction/marketOptions.ts'
);
const quantitySelectionSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/QuantitySelectionStep.tsx'
);
const analysisPlaceholderSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/MarketAnalysisPlaceholder.tsx'
);
const analysisLoadingSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/MarketAnalysisLoading.tsx'
);
const analysisErrorSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/MarketAnalysisError.tsx'
);
const resultScreenSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/SellAdvisorResultScreen.tsx'
);
const resultJourneyProgressSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/ResultJourneyProgress.tsx'
);
const resultJourneySource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/resultJourney.ts'
);
const sellAdvisorRequestSource = await readSource(
  '../app/dashboard/farmer/prediction/sellAdvisorRequest.ts'
);
const recommendationResultSource = await readSource(
  '../app/dashboard/farmer/prediction/components/RecommendationResult.tsx'
);
const decisionDashboardSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/DecisionPageDashboard.tsx'
);
const marketPageComparisonSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/MarketPageComparison.tsx'
);
const earningsSummarySource = await readSource(
  '../app/dashboard/farmer/prediction/components/EarningsSummaryCards.tsx'
);
const mlPredictionSource = await readSource(
  '../app/dashboard/farmer/prediction/components/MLPredictionOutput.tsx'
);
const aiInsightsPanelSource = await readSource(
  '../app/dashboard/farmer/prediction/components/AiInsightsPanel.tsx'
);
const transparencyNoteSource = await readSource(
  '../app/dashboard/farmer/prediction/components/TransparencyNote.tsx'
);
const modelPerformanceSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/modelPerformance.ts'
);
const weatherForecastStripSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/WeatherForecastStrip.tsx'
);
const weatherForecastPresentationSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/weatherForecastPresentation.ts'
);
const recommendationFormSource = await readSource(
  '../app/dashboard/farmer/prediction/components/RecommendationForm.tsx'
);

const reachPriceSource = () => {
  let state = stateModule.createSellAdvisorWizardState();
  state = stateModule.selectCrop(state, 'beans');
  return stateModule.advanceFromCrop(state);
};

const reachManualPrice = () =>
  stateModule.chooseCurrentPriceSource(reachPriceSource(), 'manual');

const reachSystemLocation = () =>
  stateModule.chooseCurrentPriceSource(reachPriceSource(), 'system');

const reachManualLocation = () => {
  let state = reachManualPrice();
  state = stateModule.updateCurrentPrice(state, '400');
  return stateModule.advanceFromManualPrice(state);
};

const reachSystemQuantity = () => {
  let state = reachSystemLocation();
  state = stateModule.selectFarmerDistrict(state, 'colombo');
  return stateModule.advanceFromLocation(state);
};

const reachManualQuantity = () => {
  let state = reachManualLocation();
  state = stateModule.selectFarmerDistrict(state, 'colombo');
  return stateModule.advanceFromLocation(state);
};

const supportedRangesForState = (state: {
  draft: { crop: string };
}): string[] =>
  optionsModule
    .getQuantityRangesForCrop(state.draft.crop)
    .map((range: { label: string }) => range.label);

const selectSupportedRange = (
  state: { draft: { crop: string } },
  harvestRange: string
) =>
  stateModule.selectHarvestRange(
    state,
    harvestRange,
    supportedRangesForState(state)
  );

const isQuantityValid = (state: { draft: { crop: string } }) =>
  stateModule.isValidSellAdvisorQuantity(
    state.draft,
    supportedRangesForState(state)
  );

const advanceQuantity = (state: { draft: { crop: string } }) =>
  stateModule.advanceFromQuantity(state, supportedRangesForState(state));

test('wizard opens on Crop with no preselected crop', () => {
  const state = stateModule.createSellAdvisorWizardState();

  assert.equal(state.currentStep, 'crop');
  assert.equal(state.draft.crop, '');
  assert.notEqual(state.currentStep, 'price-source');
  assert.match(cropSelectionSource, /What are you selling\?/);
  assert.doesNotMatch(cropSelectionSource, /Do you know today/);
});

test('crop step keeps all exact supported labels and backend values', () => {
  const cropMapping = optionsModule.CROP_OPTIONS.map(
    (crop: { label: string; value: string }) => ({
      label: crop.label,
      value: crop.value,
    })
  );

  assert.deepEqual(cropMapping, [
    { label: 'Tomatoes', value: 'tomatoes' },
    { label: 'Beans', value: 'beans' },
    { label: 'Cabbage', value: 'cabbage' },
    { label: 'Carrots', value: 'carrots' },
    { label: 'Chili', value: 'chili' },
    { label: 'Eggplants', value: 'eggplants' },
    { label: 'Pumpkin', value: 'pumpkin' },
    { label: 'Snake Gourd', value: 'snake gourd' },
  ]);
  assert.deepEqual(
    optionsModule.CROPS,
    cropMapping.map((crop: { value: string }) => crop.value)
  );
  assert.match(cropSelectionSource, /type="radio"/);
  assert.match(cropSelectionSource, /checked=\{selected\}/);
  assert.match(cropSelectionSource, /disabled=\{!value\}/);
});

test('every supported crop maps to one unique local clip-art asset', async () => {
  const cropAssetMapping = optionsModule.CROP_OPTIONS.map(
    (crop: { label: string; value: string; imageSrc: string }) => ({
      label: crop.label,
      value: crop.value,
      imageSrc: crop.imageSrc,
    })
  );

  assert.deepEqual(cropAssetMapping, [
    {
      label: 'Tomatoes',
      value: 'tomatoes',
      imageSrc: '/images/vegetables/tomatoes.png',
    },
    {
      label: 'Beans',
      value: 'beans',
      imageSrc: '/images/vegetables/beans.png',
    },
    {
      label: 'Cabbage',
      value: 'cabbage',
      imageSrc: '/images/vegetables/cabbage.png',
    },
    {
      label: 'Carrots',
      value: 'carrots',
      imageSrc: '/images/vegetables/carrots.png',
    },
    {
      label: 'Chili',
      value: 'chili',
      imageSrc: '/images/vegetables/chili.png',
    },
    {
      label: 'Eggplants',
      value: 'eggplants',
      imageSrc: '/images/vegetables/eggplants.png',
    },
    {
      label: 'Pumpkin',
      value: 'pumpkin',
      imageSrc: '/images/vegetables/pumpkin.png',
    },
    {
      label: 'Snake Gourd',
      value: 'snake gourd',
      imageSrc: '/images/vegetables/snake-gourd.png',
    },
  ]);

  assert.equal(
    new Set(cropAssetMapping.map((crop: { imageSrc: string }) => crop.imageSrc))
      .size,
    cropAssetMapping.length
  );

  for (const crop of cropAssetMapping) {
    const image = await readFile(
      new URL(`../public${crop.imageSrc}`, import.meta.url)
    );

    assert.ok(image.byteLength > 0, `${crop.label} asset is empty`);
    assert.equal(
      image.subarray(1, 4).toString('ascii'),
      'PNG',
      `${crop.label} asset is not a PNG`
    );
    assert.equal(
      image[25],
      6,
      `${crop.label} asset does not use PNG RGBA color`
    );
  }
});

test('crop cards render responsive decorative images without emoji text', () => {
  const cropOptionText = JSON.stringify(optionsModule.CROP_OPTIONS);

  assert.match(cropSelectionSource, /import Image from 'next\/image'/);
  assert.match(cropSelectionSource, /src=\{crop\.imageSrc\}/);
  assert.match(cropSelectionSource, /alt=""/);
  assert.match(cropSelectionSource, /width=\{64\}/);
  assert.match(cropSelectionSource, /height=\{64\}/);
  assert.match(cropSelectionSource, /size-14 object-contain sm:size-16/);
  assert.match(cropSelectionSource, /grid-cols-2[\s\S]*sm:grid-cols-4/);
  assert.doesNotMatch(cropSelectionSource, /crop\.visual/);
  assert.doesNotMatch(cropOptionText, /\p{Extended_Pictographic}/u);
});

test('clip-art remains presentation-only and preserves crop selection behavior', () => {
  assert.match(cropSelectionSource, /type="radio"/);
  assert.match(cropSelectionSource, /value=\{crop\.value\}/);
  assert.match(cropSelectionSource, /checked=\{selected\}/);
  assert.match(cropSelectionSource, /onChange=\{\(\) => onChange\(crop\.value\)\}/);
  assert.match(cropSelectionSource, /has-\[:focus-visible\]:ring-2/);
  assert.match(cropSelectionSource, /disabled=\{!value\}/);
  assert.doesNotMatch(cropSelectionSource, /\bfetch\s*\(|axios|\/api\//i);
  assert.match(quantitySelectionSource, /src=\{crop\.imageSrc\}/);
  assert.doesNotMatch(quantitySelectionSource, /crop\?\.visual/);
});

test('Crop has no wizard Back action when used as the first step', () => {
  const pageCropUsage = pageSource.match(
    /crop:\s*\(\s*<CropSelectionStep[\s\S]*?\/>\s*\)/
  )?.[0];

  assert.ok(pageCropUsage);
  assert.doesNotMatch(pageCropUsage, /onBack=/);
  assert.match(cropSelectionSource, /onBack\?:/);
  assert.match(cropSelectionSource, /\{onBack && \(/);
});

test('crop selection and Continue advance to Price Source', () => {
  let state = stateModule.createSellAdvisorWizardState();

  assert.equal(stateModule.advanceFromCrop(state).currentStep, 'crop');
  state = stateModule.selectCrop(state, 'beans');
  state = stateModule.advanceFromCrop(state);

  assert.equal(state.currentStep, 'price-source');
  assert.equal(state.draft.crop, 'beans');
  assert.match(
    priceSourceStepSource,
    /Do you know today&apos;s selling price\?/
  );
});

test('Price Source Back returns to Crop and preserves the crop', () => {
  const state = stateModule.goBackInSellAdvisor(reachPriceSource());

  assert.equal(state.currentStep, 'crop');
  assert.equal(state.draft.crop, 'beans');
});

test('manual price-source selection advances to Current Price', () => {
  const state = stateModule.chooseCurrentPriceSource(
    reachPriceSource(),
    'manual'
  );

  assert.equal(state.currentStep, 'manual-price');
  assert.equal(state.draft.currentPriceSource, 'manual');
});

test('system price-source selection skips Current Price and reaches Location', () => {
  const state = stateModule.chooseCurrentPriceSource(
    reachPriceSource(),
    'system'
  );

  assert.equal(state.currentStep, 'location');
  assert.equal(state.draft.currentPriceSource, 'system');
  assert.match(locationSelectionSource, /Where are you selling from\?/);
});

test('price-source cards can be selected again after Back navigation', () => {
  assert.match(priceSourceStepSource, /if \(selected\) onChange\(option\.value\)/);
  assert.match(
    priceSourceStepSource,
    /onChange=\{\(\) => onChange\(option\.value\)\}/
  );
  assert.match(priceSourceStepSource, /type="radio"/);
});

test('invalid, empty, zero, and negative prices cannot advance', () => {
  for (const price of ['', '0', '-1', 'not-a-price']) {
    let state = reachManualPrice();
    state = stateModule.updateCurrentPrice(state, price);

    assert.equal(stateModule.isValidCurrentPrice(price), false);
    assert.equal(
      stateModule.advanceFromManualPrice(state).currentStep,
      'manual-price'
    );
  }
});

test('valid positive decimal manual price advances to Location', () => {
  let state = reachManualPrice();
  state = stateModule.updateCurrentPrice(state, '400.50');
  state = stateModule.advanceFromManualPrice(state);

  assert.equal(state.currentStep, 'location');
  assert.equal(state.draft.currentPrice, '400.50');
});

test('Manual Location Back returns to Current Price', () => {
  let state = reachManualPrice();
  state = stateModule.updateCurrentPrice(state, '400');
  state = stateModule.advanceFromManualPrice(state);
  state = stateModule.goBackInSellAdvisor(state);

  assert.equal(state.currentStep, 'manual-price');
});

test('System Location Back returns to Price Source', () => {
  let state = stateModule.chooseCurrentPriceSource(
    reachPriceSource(),
    'system'
  );
  state = stateModule.goBackInSellAdvisor(state);

  assert.equal(state.currentStep, 'price-source');
});

test('Manual Price Back returns to Price Source and preserves its value', () => {
  let state = reachManualPrice();
  state = stateModule.updateCurrentPrice(state, '325.75');
  state = stateModule.goBackInSellAdvisor(state);

  assert.equal(state.currentStep, 'price-source');
  assert.equal(state.draft.currentPrice, '325.75');

  state = stateModule.chooseCurrentPriceSource(state, 'manual');
  assert.equal(state.currentStep, 'manual-price');
  assert.equal(state.draft.currentPrice, '325.75');
});

test('switching from manual to system clears stale manual price', () => {
  let state = reachManualPrice();
  state = stateModule.updateCurrentPrice(state, '125');
  state = stateModule.goBackInSellAdvisor(state);
  state = stateModule.chooseCurrentPriceSource(state, 'system');

  assert.equal(state.currentStep, 'location');
  assert.equal(state.draft.currentPriceSource, 'system');
  assert.equal(state.draft.currentPrice, '');
});

test('reorder does not modify existing farmer-location draft state', () => {
  let state = stateModule.createSellAdvisorWizardState();
  state = stateModule.selectFarmerDistrict(state, 'colombo');
  state = stateModule.selectCrop(state, 'beans');
  state = stateModule.advanceFromCrop(state);
  state = stateModule.chooseCurrentPriceSource(state, 'system');

  assert.equal(state.draft.farmerDistrict, 'colombo');
});

test('manual path progress has the requested six-step order', () => {
  const state = reachManualPrice();
  const progress = stateModule.getSellAdvisorProgress(
    state.draft,
    state.currentStep
  );

  assert.deepEqual(
    progress.availableSteps.map((step: { id: string }) => step.id),
    [
      'crop',
      'price-source',
      'manual-price',
      'location',
      'quantity',
      'review',
    ]
  );
  assert.equal(progress.currentStepNumber, 3);
  assert.equal(progress.totalSteps, 6);

  const locationState = reachManualLocation();
  const locationProgress = stateModule.getSellAdvisorProgress(
    locationState.draft,
    locationState.currentStep
  );
  assert.equal(locationProgress.currentStepNumber, 4);
  assert.equal(locationProgress.totalSteps, 6);
});

test('system path progress has five contiguous steps with no skipped gap', () => {
  const state = stateModule.chooseCurrentPriceSource(
    reachPriceSource(),
    'system'
  );
  const progress = stateModule.getSellAdvisorProgress(
    state.draft,
    state.currentStep
  );

  assert.deepEqual(
    progress.availableSteps.map((step: { id: string }) => step.id),
    ['crop', 'price-source', 'location', 'quantity', 'review']
  );
  assert.equal(progress.currentStepNumber, 3);
  assert.equal(progress.totalSteps, 5);
  assert.equal(
    progress.availableSteps.some(
      (step: { id: string }) => step.id === 'manual-price'
    ),
    false
  );
});

test('initial and Price Source progress show the shared beginning cleanly', () => {
  const initial = stateModule.createSellAdvisorWizardState();
  const cropProgress = stateModule.getSellAdvisorProgress(
    initial.draft,
    initial.currentStep
  );
  const priceSourceState = reachPriceSource();
  const priceSourceProgress = stateModule.getSellAdvisorProgress(
    priceSourceState.draft,
    priceSourceState.currentStep
  );

  assert.equal(cropProgress.currentStepNumber, 1);
  assert.equal(priceSourceProgress.currentStepNumber, 2);
});

test('Price Source and Manual Price show the selected crop display context', () => {
  for (const source of [priceSourceStepSource, manualPriceSource]) {
    assert.match(source, /CROP_OPTIONS\.find/);
    assert.match(source, /Selected crop/);
    assert.match(source, /selectedCrop\.label/);
    assert.doesNotMatch(source, /\{crop\}/);
  }
});

test('manual price keeps its accessible numeric input behavior', () => {
  assert.match(manualPriceSource, /Today&apos;s selling price/);
  assert.match(manualPriceSource, /type="number"/);
  assert.match(manualPriceSource, /inputMode="decimal"/);
  assert.match(manualPriceSource, /placeholder="300"/);
  assert.match(manualPriceSource, /BLOCKED_NUMBER_KEYS/);
  assert.match(manualPriceSource, /onWheel=/);
  assert.match(manualPriceSource, /inputRef\.current\?\.focus\(\)/);
});

test('Location uses only the 13 administrative farmer districts', () => {
  const districts = optionsModule.FARMER_DISTRICT_OPTIONS.map(
    (district: { label: string; value: string }) => ({
      label: district.label,
      value: district.value,
    })
  );

  assert.deepEqual(districts, [
    { label: 'Colombo', value: 'colombo' },
    { label: 'Gampaha', value: 'gampaha' },
    { label: 'Kalutara', value: 'kalutara' },
    { label: 'Kandy', value: 'kandy' },
    { label: 'Matale', value: 'matale' },
    { label: 'Nuwara Eliya', value: 'nuwara eliya' },
    { label: 'Galle', value: 'galle' },
    { label: 'Matara', value: 'matara' },
    { label: 'Kurunegala', value: 'kurunegala' },
    { label: 'Puttalam', value: 'puttalam' },
    { label: 'Badulla', value: 'badulla' },
    { label: 'Kegalle', value: 'kegalle' },
    { label: 'Ratnapura', value: 'ratnapura' },
  ]);
  assert.equal(districts.length, 13);
  assert.equal(
    districts.some(({ value }: { value: string }) => value === 'meegoda'),
    false
  );
  assert.equal(
    districts.some(({ value }: { value: string }) => value === 'dambulla'),
    false
  );
  assert.match(locationSelectionSource, /FARMER_DISTRICT_OPTIONS\.map/);
});

test('Location shows crop context and accessible map and quick-select controls', () => {
  assert.match(
    locationSelectionSource,
    /Select the district where your crop is currently located\./
  );
  assert.match(locationSelectionSource, /Selected crop/);
  assert.match(locationSelectionSource, /selectedCrop\.label/);
  assert.match(locationSelectionSource, /<SriLankaDistrictMap/);
  assert.match(locationSelectionSource, /Quick select/);
  assert.match(locationSelectionSource, /aria-pressed=\{selected\}/);
  assert.match(locationSelectionSource, /aria-describedby=/);
  assert.match(locationSelectionSource, /focus-visible:ring-2/);
});

test('selecting Colombo stores the farmer district without changing prior inputs', () => {
  let state = reachManualLocation();
  state = stateModule.selectFarmerDistrict(state, 'colombo');

  assert.equal(state.draft.farmerDistrict, 'colombo');
  assert.equal(state.draft.crop, 'beans');
  assert.equal(state.draft.currentPriceSource, 'manual');
  assert.equal(state.draft.currentPrice, '400');
});

test('Colombo loads candidate markets through the GET-only options endpoint', async () => {
  let requestedUrl = '';
  let requestedMethod = '';
  let requestedBody: BodyInit | null | undefined;
  const fetcher: typeof fetch = async (input, init) => {
    requestedUrl = String(input);
    requestedMethod = init?.method ?? '';
    requestedBody = init?.body;

    return new Response(
      JSON.stringify({
        success: true,
        farmer_district: 'colombo',
        available_markets: [
          { value: 'meegoda', label: 'Meegoda' },
          { value: 'kandy', label: 'Kandy' },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  const markets = await marketOptionsModule.fetchAvailableMarkets('colombo', {
    apiBaseUrl: 'http://localhost:5000/api',
    fetcher,
  });

  assert.equal(
    requestedUrl,
    'http://localhost:5000/api/recommend-market/options?farmer_district=colombo'
  );
  assert.equal(requestedMethod, 'GET');
  assert.equal(requestedBody, undefined);
  assert.deepEqual(markets, [
    { value: 'meegoda', label: 'Meegoda' },
    { value: 'kandy', label: 'Kandy' },
  ]);
});

test('returned markets render as informational, non-selectable candidates', () => {
  assert.match(locationSelectionSource, /Available markets/);
  assert.match(locationSelectionSource, /availableMarkets\.map/);
  assert.match(locationSelectionSource, /market\.label/);
  assert.match(locationSelectionSource, /Available for comparison/);
  assert.match(locationSelectionSource, /<li/);
  assert.doesNotMatch(
    locationSelectionSource,
    /Best match|Good price|Higher price|transport risk|transport cost|Predicted price|Nearest|Recommended/i
  );
});

test('Continue is disabled before selection and while markets load', () => {
  const loadingState =
    marketOptionsModule.createLoadingMarketOptionsState('colombo');

  assert.equal(
    marketOptionsModule.hasAvailableMarketOptions(
      marketOptionsModule.INITIAL_MARKET_OPTIONS_STATE,
      ''
    ),
    false
  );
  assert.deepEqual(loadingState.availableMarkets, []);
  assert.equal(loadingState.marketsLoading, true);
  assert.equal(
    marketOptionsModule.hasAvailableMarketOptions(loadingState, 'colombo'),
    false
  );
  assert.match(locationSelectionSource, /disabled=\{!canContinue\}/);
  assert.match(
    locationSelectionSource,
    /Finding markets available for your district\.\.\./
  );
});

test('successful non-empty markets enable Continue while empty markets do not', () => {
  const availableState =
    marketOptionsModule.createSuccessfulMarketOptionsState('colombo', [
      { value: 'meegoda', label: 'Meegoda' },
    ]);
  const emptyState =
    marketOptionsModule.createSuccessfulMarketOptionsState('colombo', []);

  assert.equal(
    marketOptionsModule.hasAvailableMarketOptions(availableState, 'colombo'),
    true
  );
  assert.equal(
    marketOptionsModule.hasAvailableMarketOptions(emptyState, 'colombo'),
    false
  );
  assert.match(
    locationSelectionSource,
    /No markets are currently available for comparison for this/
  );
});

test('failed market request exposes retry and retry can succeed', async () => {
  let attempt = 0;
  const fetcher: typeof fetch = async () => {
    attempt += 1;
    if (attempt === 1) return new Response('{}', { status: 503 });

    return new Response(
      JSON.stringify({
        success: true,
        farmer_district: 'colombo',
        available_markets: [{ value: 'kandy', label: 'Kandy' }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  await assert.rejects(
    marketOptionsModule.fetchAvailableMarkets('colombo', { fetcher })
  );
  const markets = await marketOptionsModule.fetchAvailableMarkets('colombo', {
    fetcher,
  });

  assert.equal(attempt, 2);
  assert.deepEqual(markets, [{ value: 'kandy', label: 'Kandy' }]);
  assert.match(
    locationSelectionSource,
    /We couldn&apos;t load the available markets right now\./
  );
  assert.match(locationSelectionSource, /onClick=\{onRetry\}/);
  assert.match(locationSelectionSource, /Try again/);
});

test('changing district clears old markets and stale responses are rejected', () => {
  const oldState =
    marketOptionsModule.createSuccessfulMarketOptionsState('colombo', [
      { value: 'meegoda', label: 'Meegoda' },
    ]);
  const newState =
    marketOptionsModule.createLoadingMarketOptionsState('kandy');

  assert.equal(oldState.availableMarkets.length, 1);
  assert.deepEqual(newState.availableMarkets, []);
  assert.equal(newState.loadedForFarmerDistrict, 'kandy');
  assert.equal(marketOptionsModule.isLatestMarketOptionsRequest(1, 2), false);
  assert.equal(marketOptionsModule.isLatestMarketOptionsRequest(2, 2), true);
  assert.match(pageSource, /marketOptionsRequest\.current\?\.abort\(\)/);
  assert.match(pageSource, /isLatestMarketOptionsRequest/);
});

test('Location Continue advances to Quantity only after guarded UI readiness', () => {
  let state = reachSystemLocation();

  assert.equal(stateModule.advanceFromLocation(state).currentStep, 'location');
  state = stateModule.selectFarmerDistrict(state, 'colombo');
  state = stateModule.advanceFromLocation(state);

  assert.equal(state.currentStep, 'quantity');
  assert.match(pageSource, /hasAvailableMarketOptions/);
  assert.match(
    quantitySelectionSource,
    /How much are you expecting to harvest\?/
  );
});

test('Quantity offers the existing exact and range modes', () => {
  const state = reachSystemQuantity();

  assert.equal(state.draft.quantityMode, 'range');
  assert.match(quantitySelectionSource, /Exact quantity/);
  assert.match(quantitySelectionSource, /Choose a range/);
  assert.match(quantitySelectionSource, /value: 'exact' as const/);
  assert.match(quantitySelectionSource, /value: 'range' as const/);
  assert.match(quantitySelectionSource, /name="quantity-mode"/);
  assert.match(quantitySelectionSource, /checked=\{selected\}/);
});

test('exact quantity validation preserves production decimal behavior', () => {
  for (const quantity of ['', '0', '-1', 'not-a-number', 'Infinity']) {
    let state = reachSystemQuantity();
    state = stateModule.selectQuantityMode(state, 'exact');
    state = stateModule.updateExactQuantity(state, quantity);

    assert.equal(stateModule.isValidExactQuantity(quantity), false);
    assert.equal(stateModule.advanceFromQuantity(state).currentStep, 'quantity');
  }

  let validState = reachSystemQuantity();
  validState = stateModule.selectQuantityMode(validState, 'exact');
  validState = stateModule.updateExactQuantity(validState, '200.5');

  assert.equal(stateModule.isValidExactQuantity('200.5'), true);
  assert.equal(validState.draft.exactQuantity, '200.5');
  assert.equal(stateModule.advanceFromQuantity(validState).currentStep, 'review');
  assert.match(quantitySelectionSource, /step="0\.1"/);
  assert.match(quantitySelectionSource, /BLOCKED_NUMBER_KEYS/);
  assert.match(quantitySelectionSource, /inputMode="decimal"/);
});

test('authoritative crop range labels and request quantities are unchanged', () => {
  const lightRanges = [
    { label: 'Small Harvest (25–75 kg)', value: 50, min: 25, max: 75 },
    { label: 'Medium Harvest (75–150 kg)', value: 112.5, min: 75, max: 150 },
    { label: 'Large Harvest (150–300 kg)', value: 225, min: 150, max: 300 },
    {
      label: 'Very Large Harvest (300–500 kg)',
      value: 400,
      min: 300,
      max: 500,
    },
    { label: 'Bulk Harvest (500+ kg)', value: 600, min: 500 },
  ];
  const standardRanges = [
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
  ];
  const bulkyRanges = [
    { label: 'Small Harvest (100–300 kg)', value: 200, min: 100, max: 300 },
    { label: 'Medium Harvest (300–700 kg)', value: 500, min: 300, max: 700 },
    { label: 'Large Harvest (700–1200 kg)', value: 950, min: 700, max: 1200 },
    {
      label: 'Very Large Harvest (1200–2000 kg)',
      value: 1600,
      min: 1200,
      max: 2000,
    },
    { label: 'Bulk Harvest (2000+ kg)', value: 2200, min: 2000 },
  ];

  assert.deepEqual(optionsModule.QUANTITY_RANGES.beans, lightRanges);
  assert.deepEqual(optionsModule.QUANTITY_RANGES.chili, lightRanges);
  for (const crop of [
    'eggplants',
    'snake gourd',
    'tomatoes',
    'cabbage',
    'carrots',
  ]) {
    assert.deepEqual(optionsModule.QUANTITY_RANGES[crop], standardRanges);
  }
  assert.deepEqual(optionsModule.QUANTITY_RANGES.pumpkin, bulkyRanges);
  assert.match(recommendationFormSource, /getQuantityRangesForCrop/);
  assert.doesNotMatch(recommendationFormSource, /const QUANTITY_RANGES/);
  assert.match(quantitySelectionSource, /quantityRanges\.map/);
});

test('existing earnings approximation remains unchanged for bounded and Bulk ranges', () => {
  const beans = optionsModule.QUANTITY_RANGES.beans;
  const tomatoes = optionsModule.QUANTITY_RANGES.tomatoes;
  const pumpkin = optionsModule.QUANTITY_RANGES.pumpkin;

  assert.equal(optionsModule.getRangeEarningsQuantity(beans[0]), 50);
  assert.equal(optionsModule.getRangeEarningsQuantity(beans[4]), 550);
  assert.equal(optionsModule.getRangeEarningsQuantity(tomatoes[4]), 1100);
  assert.equal(optionsModule.getRangeEarningsQuantity(pumpkin[4]), 2100);
  assert.match(quantitySelectionSource, /getRangeEarningsQuantity/);
});

test('selecting a supported range stores its exact production label', () => {
  let state = reachSystemQuantity();
  state = selectSupportedRange(state, 'Small Harvest (25–75 kg)');

  assert.equal(state.draft.harvestRange, 'Small Harvest (25–75 kg)');
  assert.equal(isQuantityValid(state), true);
  assert.equal(advanceQuantity(state).currentStep, 'review');
});

test('active quantity mode never validates using inactive stale data', () => {
  let state = reachSystemQuantity();
  state = stateModule.selectQuantityMode(state, 'exact');
  state = stateModule.updateExactQuantity(state, '200');
  assert.equal(isQuantityValid(state), true);

  state = stateModule.selectQuantityMode(state, 'range');
  assert.equal(state.draft.exactQuantity, '200');
  assert.equal(isQuantityValid(state), false);

  state = selectSupportedRange(state, 'Small Harvest (25–75 kg)');
  assert.equal(isQuantityValid(state), true);

  state = stateModule.selectQuantityMode(state, 'exact');
  assert.equal(state.draft.harvestRange, 'Small Harvest (25–75 kg)');
  assert.equal(isQuantityValid(state), true);

  state = stateModule.updateExactQuantity(state, '0');
  assert.equal(isQuantityValid(state), false);
});

test('Quantity Back returns to Location with all prior and quantity state preserved', () => {
  let state = reachManualQuantity();
  state = stateModule.selectQuantityMode(state, 'exact');
  state = stateModule.updateExactQuantity(state, '275.5');
  state = stateModule.goBackInSellAdvisor(state);

  assert.equal(state.currentStep, 'location');
  assert.equal(state.draft.crop, 'beans');
  assert.equal(state.draft.currentPriceSource, 'manual');
  assert.equal(state.draft.currentPrice, '400');
  assert.equal(state.draft.farmerDistrict, 'colombo');
  assert.equal(state.draft.quantityMode, 'exact');
  assert.equal(state.draft.exactQuantity, '275.5');
});

test('valid Quantity Continue reaches the final-step Analysis placeholder', () => {
  let state = reachSystemQuantity();
  state = selectSupportedRange(state, 'Small Harvest (25–75 kg)');
  state = advanceQuantity(state);

  assert.equal(state.currentStep, 'review');
  assert.match(analysisPlaceholderSource, /Ready to check the market/);
  assert.match(
    analysisPlaceholderSource,
    /Review your details before generating the recommendation\./
  );
  assert.match(
    analysisPlaceholderSource,
    />\s*Check Market Recommendation\s*</
  );
  assert.match(analysisPlaceholderSource, /disabled/);

  state = stateModule.goBackInSellAdvisor(state);
  assert.equal(state.currentStep, 'quantity');
});

test('Quantity and Analysis progress stay conditional without adding a step', () => {
  let manualState = reachManualQuantity();
  let systemState = reachSystemQuantity();

  let manualProgress = stateModule.getSellAdvisorProgress(
    manualState.draft,
    manualState.currentStep
  );
  let systemProgress = stateModule.getSellAdvisorProgress(
    systemState.draft,
    systemState.currentStep
  );
  assert.equal(manualProgress.currentStepNumber, 5);
  assert.equal(manualProgress.totalSteps, 6);
  assert.equal(systemProgress.currentStepNumber, 4);
  assert.equal(systemProgress.totalSteps, 5);

  manualState = selectSupportedRange(
    manualState,
    'Small Harvest (25–75 kg)'
  );
  systemState = selectSupportedRange(
    systemState,
    'Small Harvest (25–75 kg)'
  );
  manualState = advanceQuantity(manualState);
  systemState = advanceQuantity(systemState);
  manualProgress = stateModule.getSellAdvisorProgress(
    manualState.draft,
    manualState.currentStep
  );
  systemProgress = stateModule.getSellAdvisorProgress(
    systemState.draft,
    systemState.currentStep
  );
  assert.equal(manualProgress.currentStepNumber, 6);
  assert.equal(manualProgress.totalSteps, 6);
  assert.equal(systemProgress.currentStepNumber, 5);
  assert.equal(systemProgress.totalSteps, 5);
});

test('wizard submission adds no frontend selling decision logic', () => {
  const wizardSource = [
    pageSource,
    marketOptionsSource,
    sellAdvisorRequestSource,
    cropSelectionSource,
    priceSourceStepSource,
    manualPriceSource,
    locationSelectionSource,
    quantitySelectionSource,
    analysisPlaceholderSource,
  ].join('\n');

  assert.doesNotMatch(wizardSource, /axios/i);
  assert.doesNotMatch(wizardSource, /SELL_NOW|\bWAIT\b/);
  assert.doesNotMatch(wizardSource, /buildPriceRecommendationRequest/);
  assert.match(marketOptionsSource, /method: 'GET'/);
  assert.match(sellAdvisorRequestSource, /method: 'POST'/);
});

test('complete manual wizard builds the exact farmer-district request', () => {
  const draft = {
    ...stateModule.createSellAdvisorDraft(),
    crop: 'beans',
    currentPriceSource: 'manual',
    currentPrice: '400',
    farmerDistrict: 'colombo',
    quantityMode: 'exact',
    exactQuantity: '200',
  };
  const submission = requestModule.buildSellAdvisorSubmission(
    draft,
    optionsModule.getQuantityRangesForCrop(draft.crop)
  );

  assert.deepEqual(submission.request, {
    crop: 'beans',
    farmer_district: 'colombo',
    current_price_source: 'manual',
    price_rs_kg: 400,
    horizon: 1,
  });
  assert.equal('district' in submission.request, false);
  assert.equal('quantity_kg' in submission.request, false);
  assert.equal(submission.submittedInput.quantity_kg, 200);
  assert.equal(submission.submittedInput.exact_quantity_kg, 200);
});

test('system request uses farmer_district and omits price and quantity', () => {
  const range = optionsModule.getQuantityRangesForCrop('beans')[0];
  const draft = {
    ...stateModule.createSellAdvisorDraft(),
    crop: 'beans',
    currentPriceSource: 'system',
    currentPrice: '',
    farmerDistrict: 'colombo',
    quantityMode: 'range',
    harvestRange: range.label,
  };
  const submission = requestModule.buildSellAdvisorSubmission(
    draft,
    optionsModule.getQuantityRangesForCrop(draft.crop)
  );

  assert.deepEqual(submission.request, {
    crop: 'beans',
    farmer_district: 'colombo',
    current_price_source: 'system',
    horizon: 1,
  });
  assert.equal('price_rs_kg' in submission.request, false);
  assert.equal('quantity_kg' in submission.request, false);
});

test('quantity handoff matches exact and authoritative range earnings semantics', () => {
  const ranges = optionsModule.getQuantityRangesForCrop('beans');
  const exactDraft = {
    ...stateModule.createSellAdvisorDraft(),
    crop: 'beans',
    currentPriceSource: 'system',
    farmerDistrict: 'colombo',
    quantityMode: 'exact',
    exactQuantity: '200.5',
  };
  const rangeDraft = {
    ...exactDraft,
    quantityMode: 'range',
    harvestRange: ranges[4].label,
  };

  const exact = requestModule.resolveSellAdvisorQuantity(exactDraft, ranges);
  const range = requestModule.resolveSellAdvisorQuantity(rangeDraft, ranges);

  assert.deepEqual(exact, {
    harvest_input_mode: 'exact',
    quantity_kg: 200.5,
    exact_quantity_kg: 200.5,
  });
  assert.equal(range.quantity_kg, ranges[4].value);
  assert.equal(range.quantity_min_kg, ranges[4].min);
  assert.equal(range.quantity_max_kg, ranges[4].max);
  assert.equal(
    (range.quantity_min_kg + (range.quantity_max_kg ?? range.quantity_kg)) / 2,
    optionsModule.getRangeEarningsQuantity(ranges[4])
  );
});

test('Check market helper triggers exactly one JSON POST with no extra fields', async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    requests.push({ url: String(input), init });
    return new Response(JSON.stringify({ success: true, action_decision: 'WAIT' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  const request = {
    crop: 'beans',
    farmer_district: 'colombo',
    current_price_source: 'manual',
    price_rs_kg: 400,
    horizon: 1,
  } as const;

  await requestModule.submitSellAdvisorRecommendation(request, {
    fetcher,
    apiBaseUrl: 'http://localhost:5000/api',
  });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'http://localhost:5000/api/recommend-market');
  assert.equal(requests[0].init?.method, 'POST');
  assert.deepEqual(JSON.parse(String(requests[0].init?.body)), request);
});

test('real request loading has no fake timer and success reuses RecommendationResult', () => {
  assert.match(pageSource, /setRecommendationStatus\('loading'\)/);
  assert.match(pageSource, /recommendationInFlight\.current/);
  assert.match(analysisLoadingSource, /role="status"/);
  assert.match(analysisLoadingSource, /aria-busy="true"/);
  assert.match(analysisLoadingSource, /Checking the market\.\.\./);
  assert.match(analysisLoadingSource, /Available markets/);
  assert.match(analysisLoadingSource, /Weather context/);
  assert.doesNotMatch(
    [pageSource, analysisLoadingSource, sellAdvisorRequestSource].join('\n'),
    /setTimeout|setInterval|progressPercent|countdown/i
  );
  assert.match(resultScreenSource, /import RecommendationResult/);
  assert.match(resultScreenSource, /<RecommendationResult/);
});

test('failed POST preserves review data and retry uses the same validated draft', async () => {
  let attempts = 0;
  const fetcher: typeof fetch = async () => {
    attempts += 1;
    if (attempts === 1) {
      return new Response(JSON.stringify({ success: false }), { status: 503 });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  const request = {
    crop: 'beans',
    farmer_district: 'colombo',
    current_price_source: 'system',
    horizon: 1,
  } as const;

  await assert.rejects(
    requestModule.submitSellAdvisorRecommendation(request, { fetcher })
  );
  await requestModule.submitSellAdvisorRecommendation(request, { fetcher });

  assert.equal(attempts, 2);
  assert.match(analysisErrorSource, /Your information is still saved/);
  assert.match(analysisErrorSource, /onClick=\{onRetry\}/);
  assert.match(analysisErrorSource, /Back to review/);
  assert.match(pageSource, /onRetry=\{handleCheckMarket\}/);
});

test('result handoff preserves backend price and canonical decision ownership', () => {
  assert.match(recommendationResultSource, /submittedInput\?\.price_rs_kg/);
  assert.match(recommendationResultSource, /getMarketCurrentPrice/);
  assert.match(recommendationResultSource, /resolved_current_price_rs_kg/);
  assert.match(recommendationResultSource, /selectedMarketObject\?\.action_decision/);
  assert.match(recommendationResultSource, /recommendation\.action_decision/);
  assert.match(
    recommendationResultSource,
    /const aiInsights = recommendation\.ai_insights/
  );
  assert.match(recommendationResultSource, /additionalContextItems/);
  assert.match(recommendationResultSource, /<MLPredictionOutput/);
});

test('new recommendation resets wizard, markets, result, and errors to Crop', () => {
  assert.match(pageSource, /setWizardState\(createSellAdvisorWizardState\(\)\)/);
  assert.match(pageSource, /setMarketOptionsState\(INITIAL_MARKET_OPTIONS_STATE\)/);
  assert.match(pageSource, /setRecommendationStatus\('idle'\)/);
  assert.match(pageSource, /setRecommendationResult\(null\)/);
  assert.match(pageSource, /setSubmittedInput\(null\)/);
  assert.match(resultScreenSource, /Start new recommendation/);
  assert.match(resultScreenSource, /Back to Dashboard/);
});

test('result journey starts on Decision and follows Decision, Market, Details', () => {
  assert.deepEqual(
    resultJourneyModule.RESULT_JOURNEY_PAGES.map(
      (page: { id: string }) => page.id
    ),
    ['decision', 'market', 'details']
  );
  assert.equal(resultJourneyModule.getNextResultPage('decision'), 'market');
  assert.equal(resultJourneyModule.getNextResultPage('market'), 'details');
  assert.equal(resultJourneyModule.getNextResultPage('details'), 'details');
  assert.equal(resultJourneyModule.getPreviousResultPage('details'), 'market');
  assert.equal(resultJourneyModule.getPreviousResultPage('market'), 'decision');
  assert.equal(resultJourneyModule.getPreviousResultPage('decision'), 'decision');
  assert.match(resultScreenSource, /useState<ResultJourneyPage>\('decision'\)/);
});

test('result journey progress is accessible and separate from the input wizard', () => {
  assert.match(resultScreenSource, /<ResultJourneyProgress/);
  assert.match(resultJourneyProgressSource, /Recommendation result journey/);
  assert.match(resultJourneyProgressSource, /aria-current=\{isActive \? 'step'/);
  assert.match(resultJourneyProgressSource, /aria-controls=/);
  assert.match(resultJourneyProgressSource, /RESULT_JOURNEY_PAGES\.map/);
  assert.match(resultScreenSource, /onPageChange=\{setActivePage\}/);
});

test('Page 2 maps authoritative comparisons without selecting a market', () => {
  const marketBranch = recommendationResultSource.slice(
    recommendationResultSource.indexOf("activePage === 'market'"),
    recommendationResultSource.indexOf("activePage === 'details'")
  );
  const marketMarkup = `${marketBranch}\n${marketPageComparisonSource}`;

  assert.match(marketMarkup, /Where should I sell\?/);
  assert.match(marketMarkup, /available markets for your recommendation/);
  assert.match(recommendationResultSource, /recommendation\.comparisons/);
  assert.match(recommendationResultSource, /candidateMarkets/);
  assert.match(marketMarkup, /Expected next-period/);
  assert.match(marketMarkup, /Model-implied harvest value/);
  assert.match(recommendationResultSource, /calculateModelImpliedHarvestValue/);
  assert.match(marketMarkup, /Market signal/);
  assert.match(marketMarkup, /<article/);
  assert.doesNotMatch(marketMarkup, /selectMarket|onClick=.*market/i);
  assert.match(marketBranch, /getPreviousResultPage\(activePage\)/);
  assert.match(marketBranch, /getNextResultPage\(activePage\)/);
});

test('only the backend recommended market receives the Recommended badge', () => {
  const marketBranch = recommendationResultSource.slice(
    recommendationResultSource.indexOf("activePage === 'market'"),
    recommendationResultSource.indexOf("activePage === 'details'")
  );
  const marketMarkup = `${marketBranch}\n${marketPageComparisonSource}`;

  assert.match(
    recommendationResultSource,
    /createMarketPageMarket\(recommendedMarketForPage, true\)/
  );
  assert.match(marketMarkup, /primaryMarket\.isRecommended &&/);
  assert.match(marketMarkup, />\s*Recommended\s*</);
  assert.doesNotMatch(marketMarkup, /\.sort\(|\.reduce\(/);
  assert.match(
    marketMarkup,
    /Selected by the current market recommendation policy\./
  );
});

test('result-page navigation owns no fetch or recommendation POST', () => {
  const journeyPresentationSource = [
    resultScreenSource,
    resultJourneyProgressSource,
    resultJourneySource,
    recommendationResultSource,
  ].join('\n');

  assert.doesNotMatch(journeyPresentationSource, /\bfetch\s*\(/);
  assert.doesNotMatch(
    journeyPresentationSource,
    /submitSellAdvisorRecommendation|method:\s*['"]POST['"]|\/api\/recommend-market/
  );
});

test('active recommendation summary contains no unsupported static location claim', () => {
  assert.match(
    decisionDashboardSource,
    /Recommended market/
  );
  assert.doesNotMatch(
    [
      recommendationResultSource,
      decisionDashboardSource,
      earningsSummarySource,
      mlPredictionSource,
    ].join('\n'),
    /with lower transport risk|nearest market may|reduce transport cost/i
  );
});

test('Page 1 leads with the farmer decision, crop, district, and market', () => {
  assert.match(recommendationResultSource, /<DecisionPageDashboard/);
  assert.match(recommendationResultSource, /decision=\{actionDecision\}/);
  assert.match(decisionDashboardSource, /Sell Advisor decision/);
  assert.match(decisionDashboardSource, /\{hero\.label\}/);
  assert.match(decisionDashboardSource, /Recommended market/);
  assert.match(decisionDashboardSource, /\{recommendedMarketName\}/);
  assert.match(decisionDashboardSource, /\{cropName\}/);
  assert.match(decisionDashboardSource, /\{districtName\}/);

  const primaryMarkup = recommendationResultSource.slice(
    recommendationResultSource.indexOf("activePage === 'decision'"),
    recommendationResultSource.indexOf("activePage === 'market'")
  );
  assert.doesNotMatch(primaryMarkup, /Canonical Decision|>UNCERTAIN</);
  assert.doesNotMatch(primaryMarkup, /Timing advantage is uncertain/);
});

test('Page 1 keeps market outlook as collapsed evidence beneath canonical action', () => {
  const decisionMarkup = recommendationResultSource.slice(
    recommendationResultSource.indexOf("activePage === 'decision'"),
    recommendationResultSource.indexOf("activePage === 'market'")
  );

  assert.match(decisionMarkup, /decision=\{actionDecision\}/);
  assert.match(decisionMarkup, /marketOutlook=\{marketOutlook\}/);
  assert.match(
    decisionMarkup,
    /marketOutlookPresentation=\{marketOutlookPresentation\}/
  );
  assert.match(decisionDashboardSource, /getDecisionHeroPresentation\(decision\)/);
  assert.match(decisionDashboardSource, /detailKey="outlook"/);
  assert.match(decisionDashboardSource, /marketOutlookPresentation\?\.summary/);
  assert.match(decisionDashboardSource, /Classifier confidence/);
});

test('Page 3 keeps supporting market evidence visually secondary', () => {
  const detailsMarkup = recommendationResultSource.slice(
    recommendationResultSource.indexOf("activePage === 'details'")
  );

  assert.match(detailsMarkup, /Supporting evidence/);
  assert.match(detailsMarkup, /border-teal-100 bg-white/);
  assert.match(detailsMarkup, /border-slate-200 bg-white/);
  assert.doesNotMatch(detailsMarkup, /border-rose-200|bg-rose-50/);
});

test('Page 1 exposes prices, difference, harvest, earnings, and guidance', () => {
  const decisionMarkup = recommendationResultSource.slice(
    recommendationResultSource.indexOf("activePage === 'decision'"),
    recommendationResultSource.indexOf("activePage === 'market'")
  );

  assert.match(decisionMarkup, /currentPriceLabel=\{currentPriceLabel\}/);
  assert.match(decisionMarkup, /predictedPrice=\{predictedPrice\}/);
  assert.match(decisionMarkup, /priceDifference=\{priceDifference\}/);
  assert.match(decisionMarkup, /quantity=\{estimateQuantity\}/);
  assert.match(decisionMarkup, /practicalAction=\{practicalAction\}/);
  assert.match(decisionDashboardSource, /Expected next-period price/);
  assert.match(decisionDashboardSource, /Wholesale financial impact/);
  assert.match(decisionDashboardSource, /Potential gross difference/);
  assert.match(decisionDashboardSource, /What should I do\?/);
  assert.match(decisionDashboardSource, /View Market Details/);
  assert.match(decisionMarkup, /getNextResultPage\(activePage\)/);
});

test('Page 1 keeps the full farmer-district forecast collapsed by default', () => {
  const decisionMarkup = recommendationResultSource.slice(
    recommendationResultSource.indexOf("activePage === 'decision'"),
    recommendationResultSource.indexOf("activePage === 'market'")
  );
  assert.match(
    decisionMarkup,
    /weatherForecast=\{recommendation\.weather_forecast\}/
  );
  assert.doesNotMatch(decisionMarkup, /<WeatherForecastStrip/);
  assert.match(decisionDashboardSource, /detailKey="weather"/);
  assert.match(
    decisionDashboardSource,
    /useState<DecisionDetailKey \| null>\(null\)/
  );
  assert.match(
    decisionDashboardSource,
    /<WeatherForecastStrip forecast=\{weatherForecast\}/
  );
  assert.match(weatherForecastStripSource, /Next 7 Days Forecast/);
  assert.match(weatherForecastStripSource, /\{forecast\.location\}/);
  assert.match(weatherForecastStripSource, /Forecast location: \{forecast\.location\}/);
  assert.match(weatherForecastStripSource, /Open-Meteo/);
  assert.match(weatherForecastStripSource, /days\.map/);
  assert.match(weatherForecastStripSource, /formatForecastWeekday\(day\.date\)/);
  assert.match(weatherForecastStripSource, /<WeatherGlyph kind=\{weather\.icon\}/);
  assert.match(weatherForecastStripSource, /\{rainProbability\}%/);
  assert.match(weatherForecastStripSource, /Max \{maximumTemperature\}°C/);
  assert.match(weatherForecastStripSource, /if \(!forecast \|\| days\.length === 0\) return null/);
  assert.match(weatherForecastStripSource, /overflow-x-auto/);
  assert.match(
    weatherForecastStripSource,
    /w-\[calc\(100vw-1\.5rem\)\][\s\S]*sm:w-full/
  );
  assert.match(weatherForecastStripSource, /min-w-max/);
  assert.match(weatherForecastStripSource, /sm:grid-cols-7/);
  assert.match(weatherForecastStripSource, /divide-x divide-sky-100/);
  assert.match(weatherForecastStripSource, /size-10/);
  assert.match(weatherForecastStripSource, /data-weather-icon=\{weather\.icon\}/);
  assert.doesNotMatch(weatherForecastStripSource, /\{day\.weather_code\}/);
  assert.match(weatherForecastStripSource, /Rain chance/);
  assert.match(weatherForecastStripSource, /getWeatherDayAriaLabel\(day\)/);
});

test('weather UI is response-only and does not create selling policy', () => {
  const weatherSources = [
    weatherForecastStripSource,
    weatherForecastPresentationSource,
  ].join('\n');
  const marketMarkup = recommendationResultSource.slice(
    recommendationResultSource.indexOf("activePage === 'market'"),
    recommendationResultSource.indexOf("activePage === 'details'")
  );
  const detailsMarkup = recommendationResultSource.slice(
    recommendationResultSource.indexOf("activePage === 'details'")
  );

  assert.doesNotMatch(weatherSources, /fetch\(|axios|api\.open-meteo\.com/i);
  assert.doesNotMatch(weatherSources, /SELL_NOW|action_decision|action_authorized/);
  assert.doesNotMatch(weatherSources, /recommendedMarket|recommended_market/);
  assert.doesNotMatch(weatherSources, /best day to sell|sell Tuesday|wait until/i);
  assert.doesNotMatch(marketMarkup, /<WeatherForecastStrip/);
  assert.doesNotMatch(detailsMarkup, /<WeatherForecastStrip/);
});

test('selling scenario uses farmer-facing experimental terminology', () => {
  assert.match(earningsSummarySource, /Your selling scenario/i);
  assert.match(earningsSummarySource, /Sell at Current Price/);
  assert.match(earningsSummarySource, /Experimental Model-Implied Value/);
  assert.match(earningsSummarySource, /Model-Implied Difference/);
  assert.match(
    earningsSummarySource,
    /Experimental estimate — not guaranteed earnings\./
  );
  assert.doesNotMatch(earningsSummarySource, /Estimated Future Value/);
});

test('earnings formulas remain the existing exact and range calculations', () => {
  assert.match(
    earningsSummarySource,
    /harvestInputMode === 'exact'[\s\S]*exactQuantity[\s\S]*\(quantityMin \+ quantityMax\) \/ 2/
  );
  assert.match(
    earningsSummarySource,
    /currentRevenue \?\? \(price !== null \? price \* quantity : null\)/
  );
  assert.match(
    earningsSummarySource,
    /predictedPriceRsKg \* quantity/
  );
  assert.match(
    earningsSummarySource,
    /futureValueMin - sellNowValue/
  );
  assert.match(
    earningsSummarySource,
    /futureValueMax - sellNowValue/
  );
});

test('selling scenario adds a CSS-only value comparison without changing earnings', () => {
  assert.match(earningsSummarySource, /currentValueBarWidth/);
  assert.match(earningsSummarySource, /experimentalValueBarWidth/);
  assert.match(
    earningsSummarySource,
    /Visual comparison of current sale value and experimental model-implied value/
  );
  assert.match(earningsSummarySource, /style=\{\{ width:/);
  assert.doesNotMatch(earningsSummarySource, /recharts|chart\.js|canvas/i);
});

test('Page 3 leads with price evidence and the requested explanation hierarchy', () => {
  const detailsMarkup = recommendationResultSource.slice(
    recommendationResultSource.indexOf("activePage === 'details'")
  );

  assert.match(detailsMarkup, /Why this recommendation/);
  assert.match(detailsMarkup, /How did the system decide\?/);
  assert.match(
    detailsMarkup,
    /See the price comparison first,[\s\S]*supporting or technical[\s\S]*evidence if you need it\./
  );
  assert.match(detailsMarkup, /Decision summary/);
  assert.match(detailsMarkup, /Price evidence/);
  assert.match(detailsMarkup, /Current price/);
  assert.match(detailsMarkup, /Expected next-period price/);
  assert.match(detailsMarkup, /Difference per kg/);
  assert.match(detailsMarkup, /Reference baseline/);
  assert.match(
    detailsMarkup,
    /selling decision is based on how the expected next-period[\s\S]*price compares with today&apos;s price/i
  );
});

test('Page 3 keeps direction confidence and alignment inside supporting evidence', () => {
  const detailsMarkup = recommendationResultSource.slice(
    recommendationResultSource.indexOf("activePage === 'details'")
  );

  assert.match(detailsMarkup, /market-direction-signal-accordion/);
  assert.match(detailsMarkup, /Market direction signal/);
  assert.match(detailsMarkup, /Direction/);
  assert.match(detailsMarkup, /Confidence/);
  assert.match(detailsMarkup, /Signal alignment/);
  assert.doesNotMatch(detailsMarkup, /Action confidence/);
  assert.match(
    detailsMarkup,
    /does[\s\S]*not determine the canonical Sell\/Wait action/
  );
  assert.match(recommendationResultSource, /getModelSignalAlignment/);
  assert.match(recommendationResultSource, /signalAlignment=\{signalAlignment\}/);
  assert.match(recommendationResultSource, /marketOutlook=\{marketOutlook\}/);
  assert.match(
    recommendationResultSource,
    /marketOutlook\?\.signal_alignment \?\? signalAlignment/
  );
  assert.doesNotMatch(mlPredictionSource, /getModelSignalAlignment/);
  assert.match(recommendationResultSource, /direction\.confidenceProbability/);
});

test('Page 3 distinguishes the price decision from supporting direction evidence', () => {
  assert.match(
    recommendationResultSource,
    /The primary evidence behind the decision\./
  );
  assert.match(
    recommendationResultSource,
    /none of these signals[\s\S]*replaces the price decision/
  );
  assert.match(
    recommendationResultSource,
    /expected market direction[\s\S]*does[\s\S]*not determine the canonical Sell\/Wait action/
  );
});

test('farmer timing label requires canonical authorization', () => {
  assert.equal(
    resultJourneyModule.getFarmerTimingLabel('UNCERTAIN', false),
    'Timing Uncertain'
  );
  assert.equal(
    resultJourneyModule.getFarmerTimingLabel('WAIT', false),
    'Timing Uncertain'
  );
  assert.equal(
    resultJourneyModule.getFarmerTimingLabel('SELL_NOW', undefined),
    'Timing Uncertain'
  );
  assert.equal(resultJourneyModule.getFarmerTimingLabel('WAIT', true), 'Wait');
  assert.equal(
    resultJourneyModule.getFarmerTimingLabel('SELL_NOW', true),
    'Sell Now'
  );
  assert.match(recommendationResultSource, /decision=\{actionDecision\}/);
  assert.match(recommendationResultSource, /actionAuthorized=\{actionAuthorized\}/);
  assert.match(decisionDashboardSource, /getDecisionHeroPresentation\(decision\)/);
  assert.match(mlPredictionSource, /Canonical Decision/);
  assert.match(mlPredictionSource, /\{actionDecision\}/);
  assert.match(mlPredictionSource, /Action Authorized/);
});

test('Page 3 keeps concise practical guidance and moves selected Groq context behind disclosure', () => {
  assert.match(decisionDashboardSource, /What should I do\?/);
  assert.match(decisionDashboardSource, /aiInsights\?\.suggested_action/);
  assert.match(decisionDashboardSource, /Additional guidance/);
  assert.match(decisionDashboardSource, /\{item\}/);
  assert.match(recommendationResultSource, /Practical explanation/);
  assert.match(recommendationResultSource, /What this means/);
  assert.match(recommendationResultSource, /What you can do/);
  assert.match(recommendationResultSource, /marketOutlookExplanation/);
  assert.match(recommendationResultSource, /additionalContextItems/);
  assert.match(recommendationResultSource, /Expected market movement/);
  assert.match(recommendationResultSource, /Prediction strength/);
  assert.doesNotMatch(recommendationResultSource, /<AiInsightsPanel/);
  assert.doesNotMatch(
    [
      recommendationResultSource,
      decisionDashboardSource,
      aiInsightsPanelSource,
    ].join('\n'),
    /rainfall\s*[><=]|parse.*weather|weather.*risk\s*=/i
  );
});

test('Page 3 technical trace is split into collapsed native accordions', () => {
  const detailsMarkup = recommendationResultSource.slice(
    recommendationResultSource.indexOf("activePage === 'details'")
  );

  assert.match(detailsMarkup, /Technical trace/);
  assert.match(detailsMarkup, /<details/);
  assert.match(detailsMarkup, /<summary/);
  assert.match(detailsMarkup, /Model &amp; Decision/);
  assert.match(detailsMarkup, /Model Performance/);
  assert.match(detailsMarkup, /Data &amp; Limitations/);
  assert.doesNotMatch(detailsMarkup, /<details[^>]*\sopen(?:\s|=|>)/);
  assert.match(detailsMarkup, /focus-visible:ring-2/);
  assert.match(detailsMarkup, /group-open:rotate-180/);
  assert.match(recommendationResultSource, /<MLPredictionOutput/);
  assert.match(recommendationResultSource, /<TransparencyNote/);
  assert.match(recommendationResultSource, /getPreviousResultPage\(activePage\)/);
});

test('Model & Decision preserves canonical policy and signal traceability', () => {
  assert.match(mlPredictionSource, /Canonical Decision/);
  assert.match(mlPredictionSource, /Action Authorized/);
  assert.match(mlPredictionSource, /Action Policy/);
  assert.match(mlPredictionSource, /Persistence Baseline/);
  assert.match(mlPredictionSource, /modelRunId/);
  assert.match(mlPredictionSource, /Model Role/);
  assert.match(mlPredictionSource, /Next Market Period/);
  assert.match(mlPredictionSource, /Price Signal/);
  assert.match(mlPredictionSource, /Direction Signal/);
  assert.match(mlPredictionSource, /UP Probability/);
  assert.match(mlPredictionSource, /DOWN Probability/);
  assert.match(mlPredictionSource, /Signal Alignment/);
  assert.match(mlPredictionSource, /marketOutlook\.price_signal/);
  assert.match(mlPredictionSource, /marketOutlook\.direction_signal/);
  assert.match(mlPredictionSource, /marketOutlook\?\.signal_alignment/);
  assert.match(mlPredictionSource, /Market Context/);
  assert.match(mlPredictionSource, /Policy Checks/);
  assert.match(mlPredictionSource, /actionReasonCodes\.map/);
  assert.match(mlPredictionSource, /Comparison Metadata/);
});

test('Model Performance only renders authoritative metrics with presentation rounding', () => {
  assert.match(
    recommendationResultSource,
    /modelMetricPresentations\.length > 0/
  );
  assert.match(
    recommendationResultSource,
    /selectedMarketObject\?\.price_model_metrics/
  );
  assert.doesNotMatch(modelPerformanceSource, /63\.84|115\.66|0\.714|22\.52/);
  assert.deepEqual(modelPerformanceModule.getModelMetricPresentations(null), []);
  assert.deepEqual(
    modelPerformanceModule.getModelMetricPresentations({
      mae: 63.844,
      rmse: 115.655,
      r2: 0.7144,
      mape: '22.516%',
      missing: null,
    }),
    [
      { key: 'mae', label: 'MAE', value: '63.84' },
      { key: 'rmse', label: 'RMSE', value: '115.66' },
      { key: 'r2', label: 'R²', value: '0.714' },
      { key: 'mape', label: 'MAPE', value: '22.52%' },
    ]
  );
  assert.match(
    recommendationResultSource,
    /evaluation metrics for the experimental price[\s\S]*do not guarantee accuracy for an individual[\s\S]*recommendation/
  );
});

test('Data & Limitations organizes runtime metadata and existing source notes', () => {
  assert.match(recommendationResultSource, /Data basis/);
  assert.match(recommendationResultSource, /Price source/);
  assert.match(recommendationResultSource, /History basis/);
  assert.match(recommendationResultSource, /Source type/);
  assert.match(recommendationResultSource, /Comparison quality/);
  assert.match(recommendationResultSource, /Market-specific/);
  assert.match(recommendationResultSource, /Fallback used/);
  assert.match(transparencyNoteSource, /Limitations/);
  assert.match(transparencyNoteSource, /based on historical patterns/);
  assert.match(transparencyNoteSource, /experimental estimate is guidance/);
  assert.match(transparencyNoteSource, /Data sources/);
  assert.match(transparencyNoteSource, /HARTI market price data/);
});

test('result presentation does not derive a frontend SELL_NOW or WAIT action', () => {
  const resultPresentationSource = [
    recommendationResultSource,
    earningsSummarySource,
    mlPredictionSource,
  ].join('\n');

  assert.doesNotMatch(
    resultPresentationSource,
    /predictedPrice\s*[><=][\s\S]{0,100}(SELL_NOW|WAIT)/
  );
  assert.doesNotMatch(
    resultPresentationSource,
    /signalAlignment\s*[=!]=[\s\S]{0,100}(SELL_NOW|WAIT)/
  );
  assert.match(
    recommendationResultSource,
    /selectedMarketObject\?\.action_decision[\s\S]*recommendation\.action_decision/
  );
});
