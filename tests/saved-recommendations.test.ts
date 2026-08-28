import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const apiModule = await import(
  '../app/dashboard/farmer/recommendations/savedRecommendationsApi' + '.ts'
);
const presentationModule = await import(
  '../app/dashboard/farmer/recommendations/savedRecommendationPresentation' +
    '.ts'
);

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), 'utf8');

const apiSource = await readSource(
  '../app/dashboard/farmer/recommendations/savedRecommendationsApi.ts'
);
const listPageSource = await readSource(
  '../app/dashboard/farmer/recommendations/page.tsx'
);
const detailPageSource = await readSource(
  '../app/dashboard/farmer/recommendations/[id]/page.tsx'
);
const cardSource = await readSource(
  '../app/dashboard/farmer/recommendations/components/SavedRecommendationCard.tsx'
);
const layoutSource = await readSource(
  '../app/dashboard/farmer/recommendations/components/RecommendationsLayout.tsx'
);
const presentationSource = await readSource(
  '../app/dashboard/farmer/recommendations/savedRecommendationPresentation.ts'
);
const farmerNavigationSource = await readSource(
  '../app/navigation/farmer/page.tsx'
);
const stageSixPageSource = await readSource(
  '../app/dashboard/farmer/prediction/page.tsx'
);
const stageSixScreenSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/SellAdvisorResultScreen.tsx'
);
const stageSixSaveSource = await readSource(
  '../app/dashboard/farmer/prediction/saveRecommendation.ts'
);
const recommendationResultSource = await readSource(
  '../app/dashboard/farmer/prediction/components/RecommendationResult.tsx'
);
const decisionDashboardSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/DecisionPageDashboard.tsx'
);

const summary = {
  id: 'saved/abc 123',
  crop: 'beans',
  farmer_district: 'kandy',
  recommended_market: 'dambulla',
  current_price: 200,
  experimental_price: 215,
  quantity_kg: 100,
  market_outlook_status: 'UPWARD',
  market_outlook_strength: 'MODERATE',
  prediction_target_date: '2026-09-03T00:00:00.000Z',
  status: 'ACTIVE',
  created_at: '2026-08-27T10:30:00.000Z',
  reminder: null,
} as const;

const snapshot = {
  ai_insights: {
    prediction_summary: 'Prices showed a modest upward signal.',
    suggested_action: 'Compare buyer offers before choosing.',
  },
  weather_forecast: {
    location: 'Kandy',
    period: 'next_7_days',
    source: 'open_meteo',
    days: [
      {
        date: '2026-08-28',
        weather_code: 61,
        temperature_max_c: 28,
        temperature_min_c: 21,
        rain_probability: 65,
        rainfall_mm: 3.2,
      },
    ],
  },
  comparisons: [
    {
      market: 'dambulla',
      resolved_current_price_rs_kg: 200,
      predicted_price_rs_kg: 215,
    },
  ],
};

const detail = {
  ...summary,
  current_price_source: 'manual',
  persistence_baseline: 200,
  action_decision: 'UNCERTAIN',
  action_authorized: false,
  model_version: 'run_001',
  policy_version: 'persistence_primary_v1',
  updated_at: '2026-08-27T10:30:01.000Z',
  recommendation_snapshot: snapshot,
} as const;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

test('list request uses GET saved endpoint with JWT and no ownership data', async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const recommendations = await apiModule.getSavedRecommendations('jwt-123', {
    apiBaseUrl: 'http://localhost:5000/api/',
    fetcher: async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ url: String(input), init });
      return jsonResponse({ success: true, saved_recommendations: [summary] });
    },
  });

  assert.equal(requests.length, 1);
  assert.equal(
    requests[0].url,
    'http://localhost:5000/api/recommend-market/saved'
  );
  assert.equal(requests[0].init?.method, 'GET');
  assert.equal(
    new Headers(requests[0].init?.headers).get('Authorization'),
    'Bearer jwt-123'
  );
  assert.equal(requests[0].init?.body, undefined);
  assert.deepEqual(recommendations, [summary]);
  assert.doesNotMatch(JSON.stringify(requests[0]), /user_id|owner/i);
});

test('detail request encodes the saved ID and uses GET without prediction POST', async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const recommendation = await apiModule.getSavedRecommendation(
    summary.id,
    'jwt-123',
    {
      apiBaseUrl: 'http://localhost:5000/api',
      fetcher: async (input: RequestInfo | URL, init?: RequestInit) => {
        requests.push({ url: String(input), init });
        return jsonResponse({ success: true, saved_recommendation: detail });
      },
    }
  );

  assert.equal(requests.length, 1);
  assert.equal(
    requests[0].url,
    'http://localhost:5000/api/recommend-market/saved/saved%2Fabc%20123'
  );
  assert.equal(requests[0].init?.method, 'GET');
  assert.equal(recommendation.id, summary.id);
  assert.deepEqual(recommendation.recommendation_snapshot, snapshot);
});

test('archive uses one authenticated DELETE with no body or ownership field', async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const archived = await apiModule.archiveSavedRecommendation(
    summary.id,
    'jwt-archive',
    {
      apiBaseUrl: 'http://localhost:5000/api',
      fetcher: async (input: RequestInfo | URL, init?: RequestInit) => {
        requests.push({ url: String(input), init });
        return jsonResponse({
          success: true,
          saved_recommendation: { id: summary.id, status: 'ARCHIVED' },
        });
      },
    }
  );

  assert.deepEqual(archived, { id: summary.id, status: 'ARCHIVED' });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].init?.method, 'DELETE');
  assert.equal(
    new Headers(requests[0].init?.headers).get('Authorization'),
    'Bearer jwt-archive'
  );
  assert.equal(requests[0].init?.body, undefined);
  assert.doesNotMatch(JSON.stringify(requests[0]), /user_id|owner/i);
});

test('missing token blocks list, detail, and archive requests', async () => {
  let requests = 0;
  const fetcher: typeof fetch = async () => {
    requests += 1;
    return jsonResponse({ success: true });
  };

  await assert.rejects(
    apiModule.getSavedRecommendations(' ', { fetcher }),
    /sign in/i
  );
  await assert.rejects(
    apiModule.getSavedRecommendation('saved-1', '', { fetcher }),
    /sign in/i
  );
  await assert.rejects(
    apiModule.archiveSavedRecommendation('saved-1', '', { fetcher }),
    /sign in/i
  );
  assert.equal(requests, 0);
});

test('401, 403, and detail 404 use controlled farmer-facing messages', async () => {
  const getError = async (status: number) => {
    try {
      await apiModule.getSavedRecommendation('saved-1', 'jwt', {
        fetcher: async () =>
          jsonResponse({ success: false, message: 'Internal detail' }, status),
      });
    } catch (error) {
      return error;
    }
    assert.fail('Expected API request to reject');
  };

  assert.equal(
    apiModule.getSavedRecommendationsErrorMessage(await getError(401)),
    'Please sign in again to view your saved recommendations.'
  );
  assert.equal(
    apiModule.getSavedRecommendationsErrorMessage(await getError(403)),
    'Farmer access is required to view saved recommendations.'
  );
  assert.equal(
    apiModule.getSavedRecommendationsErrorMessage(await getError(404)),
    'Saved recommendation not found.'
  );
});

test('malformed and network list responses reject safely', async () => {
  await assert.rejects(
    apiModule.getSavedRecommendations('jwt', {
      fetcher: async () => jsonResponse({ success: true }),
    }),
    /invalid response/i
  );
  await assert.rejects(
    apiModule.getSavedRecommendations('jwt', {
      fetcher: async () => {
        throw new TypeError('Network unavailable');
      },
    }),
    /Could not load saved recommendations/i
  );
});

test('effective lifecycle states map only to reminder language', () => {
  assert.equal(
    presentationModule.getLifecyclePresentation('ACTIVE').label,
    'Active'
  );
  assert.equal(
    presentationModule.getLifecyclePresentation('DUE_SOON').label,
    'Due soon'
  );
  assert.equal(
    presentationModule.getLifecyclePresentation('DUE').label,
    'Due'
  );

  const lifecycleSource = presentationSource.slice(
    presentationSource.indexOf('const LIFECYCLE_PRESENTATIONS'),
    presentationSource.indexOf('const OUTLOOK_PRESENTATIONS')
  );
  assert.doesNotMatch(lifecycleSource, /SELL_NOW|\bWAIT\b|\bHOLD\b/);
});

test('outlook and strength use neutral evidence wording', () => {
  assert.equal(
    presentationModule.getOutlookPresentation('UPWARD').label,
    'Upward market signals'
  );
  assert.equal(
    presentationModule.getOutlookPresentation('DOWNWARD').label,
    'Downward market signals'
  );
  assert.equal(
    presentationModule.getOutlookPresentation('MIXED').label,
    'Mixed market signals'
  );
  assert.equal(
    presentationModule.getOutlookPresentation('STABLE').label,
    'Stable market signals'
  );
  assert.equal(
    presentationModule.getOutlookPresentation('LIMITED').label,
    'Limited market evidence'
  );
  assert.equal(
    presentationModule.getOutlookStrengthLabel('MODERATE'),
    'Moderate evidence'
  );
});

test('saved values receive presentation formatting without changing semantics', () => {
  assert.equal(presentationModule.formatSavedName('nuwara_eliya'), 'Nuwara Eliya');
  assert.equal(
    presentationModule.formatSavedDate('2026-08-27T10:30:00.000Z'),
    '27 Aug 2026'
  );
  assert.equal(presentationModule.formatSavedPrice(200), 'Rs. 200/kg');
  assert.equal(presentationModule.formatSavedPrice(null), 'Not available');
  assert.equal(presentationModule.formatSavedQuantity(100), '100 kg');
  assert.doesNotMatch(
    presentationModule.formatSavedDate.toString(),
    /setDate|getDate\(\)\s*\+|604800000/
  );
});

test('stored snapshot selectors preserve guidance, weather, and comparisons', () => {
  const insights = presentationModule.getSnapshotAiInsights(snapshot);
  const weather = presentationModule.getSnapshotWeatherForecast(snapshot);
  const comparisons =
    presentationModule.getHistoricalMarketComparisons(snapshot);

  assert.equal(
    insights?.suggested_action,
    'Compare buyer offers before choosing.'
  );
  assert.equal(weather?.location, 'Kandy');
  assert.equal(weather?.days.length, 1);
  assert.deepEqual(comparisons, [
    {
      key: 'dambulla-0',
      market: 'Dambulla',
      currentPrice: 200,
      experimentalPrice: 215,
    },
  ]);
  assert.equal(
    presentationModule.getSnapshotWeatherForecast({}),
    null
  );
});

test('list page covers loading, empty, cards, saved fields, and safe labels', () => {
  assert.match(listPageSource, />\s*My Recommendations\s*</);
  assert.match(listPageSource, /Loading saved recommendations\.\.\./);
  assert.match(listPageSource, /No saved recommendations yet/);
  assert.match(listPageSource, /Open Sell Advisor/);
  assert.match(listPageSource, /<SavedRecommendationCard/);

  for (const label of [
    'Farmer district',
    'Recommended market',
    'Saved',
    'Next market period',
    'Current price',
    'Experimental next-period price',
    'Harvest quantity',
    'View',
    'Archive',
  ]) {
    assert.match(cardSource, new RegExp(label));
  }
  assert.doesNotMatch(
    [listPageSource, cardSource].join('\n'),
    /recommendation_fingerprint|user_id|Delete forever/
  );
});

test('archive confirmation, cancel, success removal, failure retention, and click guard are explicit', () => {
  assert.match(cardSource, /Archive this saved recommendation\?/);
  assert.match(cardSource, /future reminders[\s\S]*will no longer appear/);
  assert.match(cardSource, /onClick=\{onCancelArchive\}/);
  assert.match(cardSource, /onClick=\{onConfirmArchive\}/);
  assert.match(
    listPageSource,
    /if \(archiveRequestsInFlight\.current\.has\(id\)\) return/
  );
  assert.match(listPageSource, /await archiveSavedRecommendation\(id, token\)/);
  assert.match(listPageSource, /removeArchivedRecommendation\(current, id\)/);
  assert.match(listPageSource, /Could not archive this recommendation/);
  assert.deepEqual(
    presentationModule.removeArchivedRecommendation(
      [summary, { ...summary, id: 'saved-2' }],
      summary.id
    ).map((item: { id: string }) => item.id),
    ['saved-2']
  );
});

test('detail route renders only stored historical snapshot sections when present', () => {
  assert.match(detailPageSource, /Saved Recommendation/);
  assert.match(detailPageSource, /saved at that time/);
  assert.match(detailPageSource, /getSavedRecommendation\(savedRecommendationId, token/);
  assert.match(detailPageSource, /recommendation\.recommendation_snapshot/);
  assert.match(detailPageSource, /Guidance saved with this recommendation/);
  assert.match(detailPageSource, /Weather forecast saved with this recommendation/);
  assert.match(detailPageSource, /Market comparison saved with this recommendation/);
  assert.match(detailPageSource, /Technical details saved with this recommendation/);
  assert.match(detailPageSource, /recommendation\.action_decision/);
  assert.match(detailPageSource, /String\(recommendation\.action_authorized\)/);
  assert.match(
    detailPageSource,
    /router\.push\('\/dashboard\/farmer\/recommendations'\)/
  );
});

test('Stage 7 makes no inference, weather-provider, Groq, notification, or local cache request', () => {
  const stageSevenSources = [
    apiSource,
    listPageSource,
    detailPageSource,
    cardSource,
    layoutSource,
    presentationSource,
  ].join('\n');

  assert.doesNotMatch(stageSevenSources, /method:\s*['"]POST['"]/);
  assert.doesNotMatch(stageSevenSources, /submitSellAdvisorRecommendation/);
  assert.doesNotMatch(stageSevenSources, /api\.open-meteo\.com|fetchWeather/);
  assert.doesNotMatch(stageSevenSources, /groq|api\/notifications|notifications\/.*read/i);
  assert.doesNotMatch(
    stageSevenSources,
    /localStorage\.setItem\(['"](?:saved|recommendation)/i
  );
});

test('farmer navigation adds the route beside prediction and supports detail active state', () => {
  const predictionPosition = farmerNavigationSource.indexOf("name: 'Price Prediction'");
  const recommendationsPosition = farmerNavigationSource.indexOf(
    "name: 'My Recommendations'"
  );
  const settingsPosition = farmerNavigationSource.indexOf("name: 'Settings'");

  assert.ok(recommendationsPosition > predictionPosition);
  assert.ok(settingsPosition > recommendationsPosition);
  assert.match(
    farmerNavigationSource,
    /path: '\/dashboard\/farmer\/recommendations'/
  );
  assert.match(
    farmerNavigationSource,
    /pathname === itemPath \|\| pathname\.startsWith\(`\$\{itemPath\}\/`\)/
  );
  assert.equal(
    farmerNavigationSource.match(/isFarmerNavigationItemActive\(/g)?.length,
    2
  );
  assert.match(farmerNavigationSource, /setIsMobileMenuOpen\(false\)/);
  assert.match(farmerNavigationSource, /aria-label="Toggle menu"/);
});

test('Stage 6 save, timestamp, Page 2/3, and weather contracts remain intact', () => {
  assert.match(stageSixScreenSource, /Save Recommendation/);
  assert.match(stageSixScreenSource, /await saveRecommendation\(payload, token\)/);
  assert.match(stageSixSaveSource, /\/recommend-market\/saved/);
  assert.match(
    stageSixPageSource,
    /setRecommendationTimestamp\(createRecommendationTimestamp\(\)\)/
  );
  assert.match(recommendationResultSource, /activePage === 'market'/);
  assert.match(recommendationResultSource, /activePage === 'details'/);
  assert.match(
    recommendationResultSource,
    /weatherForecast=\{recommendation\.weather_forecast\}/
  );
  assert.match(
    decisionDashboardSource,
    /<WeatherForecastStrip forecast=\{weatherForecast\}/
  );
});
