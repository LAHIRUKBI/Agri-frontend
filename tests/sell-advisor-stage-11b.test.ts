import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const optionsModule = await import('../utils/prediction-options' + '.ts');
const stateModule = await import(
  '../app/dashboard/farmer/prediction/sellAdvisorState' + '.ts'
);
const requestModule = await import(
  '../app/dashboard/farmer/prediction/sellAdvisorRequest' + '.ts'
);
const districtMapModule = await import(
  '../app/dashboard/farmer/prediction/components/sell-advisor/districtMapRegions' +
    '.ts'
);

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), 'utf8');

const pageSource = await readSource(
  '../app/dashboard/farmer/prediction/page.tsx'
);
const locationSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/LocationSelectionStep.tsx'
);
const mapSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/SriLankaDistrictMap.tsx'
);
const regionSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/districtMapRegions.ts'
);
const requestSource = await readSource(
  '../app/dashboard/farmer/prediction/sellAdvisorRequest.ts'
);

const expectedDistricts = [
  'colombo',
  'gampaha',
  'kalutara',
  'kandy',
  'matale',
  'nuwara eliya',
  'galle',
  'matara',
  'kurunegala',
  'puttalam',
  'badulla',
  'kegalle',
  'ratnapura',
];

const reachLocation = () => {
  let state = stateModule.createSellAdvisorWizardState();
  state = stateModule.selectCrop(state, 'tomatoes');
  state = stateModule.advanceFromCrop(state);
  return stateModule.chooseCurrentPriceSource(state, 'system');
};

test('the active location step receives the existing single district state', () => {
  assert.match(pageSource, /location:\s*\(\s*<LocationSelectionStep/);
  assert.match(pageSource, /value=\{draft\.farmerDistrict\}/);
  assert.match(pageSource, /onChange=\{handleFarmerDistrictChange\}/);
  assert.match(pageSource, /onContinue=\{handleLocationContinue\}/);
  assert.match(locationSource, /Where are you selling from\?/);
});

test('all 13 supported district values remain exact with no additions', () => {
  assert.deepEqual(optionsModule.FARMER_DISTRICTS, expectedDistricts);
  assert.equal(optionsModule.FARMER_DISTRICT_OPTIONS.length, 13);
  assert.deepEqual(
    [...districtMapModule.SUPPORTED_DISTRICT_REGION_VALUES].sort(),
    [...expectedDistricts].sort()
  );
  assert.equal(
    new Set(districtMapModule.SUPPORTED_DISTRICT_REGION_VALUES).size,
    13
  );
});

test('the wizard still starts without a default district', () => {
  const draft = stateModule.createSellAdvisorDraft();

  assert.equal(draft.farmerDistrict, '');
  assert.match(locationSource, /No district selected/);
  assert.match(locationSource, /No district is selected automatically\./);
  assert.doesNotMatch(locationSource, /defaultValue=/);
});

test('the local Sri Lanka SVG includes all 25 regions and no map service', () => {
  assert.equal(districtMapModule.SRI_LANKA_DISTRICT_REGIONS.length, 25);
  assert.equal(
    new Set(
      districtMapModule.SRI_LANKA_DISTRICT_REGIONS.map(
        (region: { id: string }) => region.id
      )
    ).size,
    25
  );
  assert.match(mapSource, /<svg/);
  assert.match(mapSource, /Interactive map of supported Sri Lankan districts/);
  assert.match(mapSource, /SRI_LANKA_DISTRICT_REGIONS\.map/);
  assert.doesNotMatch(
    [mapSource, regionSource].join('\n'),
    /google maps|mapbox|leaflet|openstreetmap|https?:\/\/|geolocation/i
  );
});

test('the reference-shaped geometry remains complete and uniformly scaled', () => {
  assert.equal(districtMapModule.SRI_LANKA_MAP_VIEW_BOX, '0 0 474 797');
  assert.ok(districtMapModule.SRI_LANKA_ISLAND_OUTLINE.length > 1500);
  assert.ok(
    districtMapModule.SRI_LANKA_DISTRICT_REGIONS.every(
      (region: { path: string; marker: readonly [number, number] }) =>
        region.path.startsWith('M') &&
        region.path.length > 70 &&
        region.marker[0] >= 0 &&
        region.marker[0] <= 474 &&
        region.marker[1] >= 0 &&
        region.marker[1] <= 797
    )
  );
  assert.equal(
    new Set(
      districtMapModule.SRI_LANKA_DISTRICT_REGIONS.map(
        (region: { path: string }) => region.path
      )
    ).size,
    25
  );
  assert.match(mapSource, /preserveAspectRatio="xMidYMid meet"/);
});

test('only configured supported regions can produce a district value', () => {
  assert.equal(
    districtMapModule.getSelectableDistrictValue(
      'LK-32',
      optionsModule.FARMER_DISTRICTS
    ),
    'matara'
  );
  assert.equal(
    districtMapModule.getSelectableDistrictValue(
      'LK-41',
      optionsModule.FARMER_DISTRICTS
    ),
    null
  );
  assert.equal(
    districtMapModule.getSelectableDistrictValue(
      'LK-UNKNOWN',
      optionsModule.FARMER_DISTRICTS
    ),
    null
  );
  assert.equal(
    districtMapModule.getSelectableDistrictValue('LK-32', ['colombo']),
    null
  );
});

test('map regions are clickable, labelled, keyboard operable, and selected', () => {
  assert.match(mapSource, /role=\{selectable \? 'button' : undefined\}/);
  assert.match(mapSource, /aria-label=/);
  assert.match(mapSource, /aria-pressed=\{selectable \? selected : undefined\}/);
  assert.match(mapSource, /tabIndex=\{selectable \? 0 : undefined\}/);
  assert.match(mapSource, /onClick=\{selectable/);
  assert.match(mapSource, /onKeyDown=/);
  assert.match(mapSource, /event\.key !== 'Enter'/);
  assert.match(mapSource, /event\.key !== ' '/);
  assert.match(mapSource, /fill-emerald-500/);
  assert.match(mapSource, /stroke-\[3\]/);
  assert.match(mapSource, /<circle/);
});

test('Matara map selection updates the existing wizard state exactly', () => {
  const mapValue = districtMapModule.getSelectableDistrictValue(
    'LK-32',
    optionsModule.FARMER_DISTRICTS
  );
  assert.equal(mapValue, 'matara');

  const state = stateModule.selectFarmerDistrict(reachLocation(), mapValue);
  assert.equal(state.draft.farmerDistrict, 'matara');
  assert.equal(state.currentStep, 'location');
});

test('map and quick-select chips share value and onChange without local state', () => {
  assert.match(
    locationSource,
    /selectedDistrict=\{value\}[\s\S]*onSelectDistrict=\{onChange\}/
  );
  assert.match(locationSource, /FARMER_DISTRICT_OPTIONS\.map/);
  assert.match(locationSource, /const selected = district\.value === value/);
  assert.match(locationSource, /aria-pressed=\{selected\}/);
  assert.match(locationSource, /if \(!selected\) onChange\(district\.value\)/);
  assert.match(locationSource, /selectedDistrict\?\.label/);
  assert.doesNotMatch(locationSource, /useState|useReducer/);
});

test('changing a chip selection updates the same district state and map prop', () => {
  let state = stateModule.selectFarmerDistrict(reachLocation(), 'matara');
  assert.equal(state.draft.farmerDistrict, 'matara');

  state = stateModule.selectFarmerDistrict(state, 'colombo');
  assert.equal(state.draft.farmerDistrict, 'colombo');
  assert.match(mapSource, /region\.value === selectedDistrict/);
  assert.match(mapSource, /district === selectedDistrict/);
});

test('validation, Back, and guarded Continue progression remain unchanged', () => {
  let state = reachLocation();

  assert.equal(stateModule.advanceFromLocation(state).currentStep, 'location');
  state = stateModule.selectFarmerDistrict(state, 'matara');
  assert.equal(state.currentStep, 'location');
  assert.equal(stateModule.advanceFromLocation(state).currentStep, 'quantity');

  assert.match(locationSource, /onClick=\{onBack\}/);
  assert.match(locationSource, /onClick=\{onContinue\}/);
  assert.match(locationSource, /disabled=\{!canContinue\}/);

  const changeHandler = pageSource.slice(
    pageSource.indexOf('const handleFarmerDistrictChange'),
    pageSource.indexOf('const handleMarketOptionsRetry')
  );
  assert.match(changeHandler, /selectFarmerDistrict/);
  assert.match(changeHandler, /loadAvailableMarkets/);
  assert.doesNotMatch(changeHandler, /advanceFromLocation/);
});

test('farmer_district request serialization remains byte-for-value unchanged', () => {
  const draft = {
    ...stateModule.createSellAdvisorDraft(),
    crop: 'tomatoes',
    farmerDistrict: 'matara',
    currentPriceSource: 'system',
  };
  const request = requestModule.buildSellAdvisorRequest(draft);

  assert.deepEqual(request, {
    crop: 'tomatoes',
    farmer_district: 'matara',
    current_price_source: 'system',
    horizon: 1,
  });
  assert.match(requestSource, /farmer_district: draft\.farmerDistrict/);
  assert.doesNotMatch(
    [locationSource, mapSource, regionSource].join('\n'),
    /\bfetch\s*\(|axios|saveRecommendation|notification/i
  );
});

test('desktop and mobile layouts stay compact without horizontal scrolling', () => {
  assert.match(locationSource, /md:grid-cols-\[minmax\(13rem,0\.75fr\)_minmax\(0,1\.25fr\)\]/);
  assert.match(locationSource, /grid-cols-2[\s\S]*sm:grid-cols-3[\s\S]*md:grid-cols-4/);
  assert.match(locationSource, /min-h-11/);
  assert.match(mapSource, /mx-auto mt-1 h-60 w-full/);
  assert.match(mapSource, /preserveAspectRatio="xMidYMid meet"/);
  assert.match(mapSource, /overflow-hidden/);
  assert.doesNotMatch(locationSource, /overflow-x-auto|whitespace-nowrap/);
});
