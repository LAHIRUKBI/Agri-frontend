import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const marketMapModule = await import(
  '../app/dashboard/farmer/prediction/components/sell-advisor/marketMapLocations' +
    '.ts'
);

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), 'utf8');

const mapSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/SriLankaDistrictMap.tsx'
);
const pinSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/MarketMapPin.tsx'
);
const locationSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/LocationSelectionStep.tsx'
);
const locationConfigSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/marketMapLocations.ts'
);
const requestSource = await readSource(
  '../app/dashboard/farmer/prediction/sellAdvisorRequest.ts'
);
const saveSource = await readSource(
  '../app/dashboard/farmer/prediction/saveRecommendation.ts'
);
const notificationSource = await readSource(
  '../app/dashboard/farmer/components/notifications/notificationApi.ts'
);

test('market location metadata covers only the six existing canonical market values', () => {
  assert.deepEqual(
    marketMapModule.MARKET_MAP_LOCATIONS.map(
      (location: { marketValue: string }) => location.marketValue
    ).sort(),
    [
      'bandarawela',
      'dambulla',
      'kandy',
      'meegoda',
      'nuwaraeliya',
      'puttalam',
    ]
  );
  assert.ok(
    marketMapModule.MARKET_MAP_LOCATIONS.every(
      (location: { x: number; y: number }) =>
        Number.isFinite(location.x) &&
        Number.isFinite(location.y) &&
        location.x >= 0 &&
        location.x <= 474 &&
        location.y >= 0 &&
        location.y <= 797
    )
  );
});

test('pins are an intersection of API markets and metadata, never an availability source', () => {
  const availableMarkets = [
    { value: 'kandy', label: 'Kandy' },
    { value: 'future-market', label: 'Future market' },
  ];
  const pins = marketMapModule.getAvailableMarketMapPins(availableMarkets);

  assert.deepEqual(
    pins.map((pin: { value: string; label: string }) => ({
      value: pin.value,
      label: pin.label,
    })),
    [{ value: 'kandy', label: 'Kandy' }]
  );
  assert.equal(availableMarkets.length, 2);
  assert.equal(availableMarkets[1].label, 'Future market');
  assert.match(locationConfigSource, /availableMarkets\.flatMap/);
  assert.doesNotMatch(locationConfigSource, /fetch\s*\(|axios|available_markets/);
});

test('the wizard-owned market response is passed to the map without another fetch', () => {
  assert.match(
    locationSource,
    /<SriLankaDistrictMap[\s\S]*availableMarkets=\{availableMarkets\}/
  );
  assert.match(mapSource, /getAvailableMarketMapPins\(availableMarkets\)/);
  assert.match(
    mapSource,
    /selectedDistrict \? getAvailableMarketMapPins\(availableMarkets\) : \[\]/
  );
  assert.doesNotMatch(
    [mapSource, pinSource, locationConfigSource].join('\n'),
    /fetch\s*\(|axios|recommend-market\/options/
  );
});

test('compact and expanded maps render the same filtered market pins', () => {
  assert.equal(mapSource.match(/<DistrictMapGraphic/g)?.length, 2);
  assert.match(mapSource, /marketPins=\{marketPins\}[\s\S]*variant="compact"/);
  assert.match(mapSource, /marketPins=\{marketPins\}[\s\S]*variant="expanded"/);
  assert.match(mapSource, /role="dialog"/);
  assert.match(mapSource, /aria-modal="true"/);
  assert.match(mapSource, /Market pins show approximate locations/);
});

test('market pins remain visually distinct from selected districts', () => {
  assert.match(pinSource, /fill-amber-400/);
  assert.match(pinSource, /stroke-amber-900/);
  assert.match(mapSource, /fill-emerald-500/);
  assert.match(mapSource, /Map legend/);
  assert.match(mapSource, /Available market/);
});

test('hover, focus, keyboard, and click expose information without district bubbling', () => {
  assert.match(pinSource, /role="button"/);
  assert.match(pinSource, /tabIndex=\{0\}/);
  assert.match(pinSource, /aria-label=\{`Available market:/);
  assert.match(pinSource, /<title>/);
  assert.match(pinSource, /onMouseEnter=/);
  assert.match(pinSource, /onFocus=/);
  assert.match(pinSource, /event\.stopPropagation\(\)/);
  assert.match(pinSource, /event\.key !== 'Enter'/);
  assert.match(pinSource, /event\.key !== ' '/);
  assert.match(pinSource, /event\.key === 'Escape'/);
  assert.match(mapSource, /setActiveMarketValue/);
  assert.doesNotMatch(pinSource, /onSelectDistrict|farmerDistrict/);
});

test('pin activation is presentation-only with no recommendation or API side effects', () => {
  assert.doesNotMatch(
    [mapSource, pinSource, locationConfigSource].join('\n'),
    /recommended_market|submitSellAdvisor|saveRecommendation|notification|price_rs_kg|localStorage/
  );
  assert.match(mapSource, /current === marketValue \? null : marketValue/);
  assert.match(mapSource, /Available in[\s\S]*this Sell Advisor search/);
});

test('map coordinates never enter prediction, save, or notification payload modules', () => {
  const payloadSources = [requestSource, saveSource, notificationSource].join(
    '\n'
  );
  assert.doesNotMatch(
    payloadSources,
    /marketMapLocations|MARKET_MAP_LOCATIONS|marketValue|AvailableMarketMapPin/
  );
  assert.match(requestSource, /farmer_district: draft\.farmerDistrict/);
});

test('district map and chip accessibility remain in place alongside pins', () => {
  assert.match(mapSource, /aria-pressed=\{selectable \? selected : undefined\}/);
  assert.match(mapSource, /handleRegionKeyDown/);
  assert.match(locationSource, /FARMER_DISTRICT_OPTIONS\.map/);
  assert.match(locationSource, /aria-pressed=\{selected\}/);
  assert.match(locationSource, /if \(!selected\) onChange\(district\.value\)/);
});
