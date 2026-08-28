import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const saveModule = await import(
  '../app/dashboard/farmer/prediction/saveRecommendation' + '.ts'
);

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), 'utf8');

const pageSource = await readSource(
  '../app/dashboard/farmer/prediction/page.tsx'
);
const resultScreenSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/SellAdvisorResultScreen.tsx'
);
const recommendationResultSource = await readSource(
  '../app/dashboard/farmer/prediction/components/RecommendationResult.tsx'
);
const decisionDashboardSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/DecisionPageDashboard.tsx'
);
const weatherForecastSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/WeatherForecastStrip.tsx'
);
const marketPageSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/MarketPageComparison.tsx'
);

const recommendationTimestamp = '2026-08-27T08:15:30.000Z';
const recommendedMarket = {
  market: 'dambulla',
  resolved_current_price_rs_kg: '375.50',
  predicted_price_rs_kg: 402,
  persistence_next_price_rs_kg: 380,
  action_decision: 'UNCERTAIN',
  action_authorized: false,
  action_policy: 'conservative-v3',
  model_run_id: 'price-model-run-42',
};
const marketOutlook = {
  status: 'MIXED',
  strength: 'LOW',
  signal_alignment: 'CONFLICT',
  price_signal: 'UP',
  direction_signal: 'DOWN',
  confidence: 0.58,
  summary: 'Signals remain mixed.',
};
const weatherForecast = {
  location: 'Kandy',
  period: 'next_7_days',
  source: 'open_meteo',
  days: [{ date: '2026-08-28', rain_probability: 60 }],
};
const comparisons = [{ market: 'dambulla' }, { market: 'colombo' }];
const availableMarkets = ['dambulla', 'colombo'];
const aiInsights = {
  recommendation: 'Compare buyer offers before committing.',
};

const systemSubmittedInput = {
  crop: 'beans',
  farmer_district: 'colombo',
  current_price_source: 'system',
  horizon: 1,
  harvest_input_mode: 'range',
  quantity_kg: 250,
  quantity_min_kg: 201,
  quantity_max_kg: 299,
  quantity_range_label: '201-299 kg',
} as const;

const systemResult = {
  input: {
    crop: 'tomato',
    farmer_district: 'matale',
    current_price_source: 'system',
    horizon: 1,
  },
  farmer_district: 'kandy',
  recommended_market: recommendedMarket,
  market_outlook: marketOutlook,
  action_decision: 'WAIT',
  action_authorized: true,
  action_policy: 'top-level-fallback-policy',
  persistence_next_price_rs_kg: 379,
  comparisons,
  available_markets: availableMarkets,
  ai_insights: aiInsights,
  weather_forecast: weatherForecast,
};

const buildSystemPayload = () =>
  saveModule.buildSaveRecommendationPayload(
    systemResult,
    systemSubmittedInput,
    recommendationTimestamp
  );

test('save payload maps the displayed system-price recommendation explicitly', () => {
  const payload = buildSystemPayload();

  assert.equal(payload.recommendation_timestamp, recommendationTimestamp);
  assert.equal(payload.crop, 'tomato');
  assert.equal(payload.farmer_district, 'kandy');
  assert.deepEqual(payload.recommended_market, recommendedMarket);
  assert.equal(payload.current_price, 375.5);
  assert.equal(payload.current_price_source, 'system');
  assert.equal(payload.quantity_kg, 250);
  assert.deepEqual(payload.market_outlook, marketOutlook);
  assert.equal(payload.action_decision, 'UNCERTAIN');
  assert.equal(payload.action_authorized, false);
  assert.equal(payload.horizon, 1);
  assert.equal(payload.experimental_price, 402);
  assert.equal(payload.persistence_baseline, 380);
  assert.equal(payload.model_version, 'price-model-run-42');
  assert.equal(payload.policy_version, 'conservative-v3');
  assert.deepEqual(payload.available_markets, availableMarkets);
  assert.deepEqual(payload.comparisons, comparisons);
  assert.deepEqual(payload.ai_insights, aiInsights);
  assert.deepEqual(payload.weather_forecast, weatherForecast);
});

test('manual price mode saves the submitted price without inferring from its value', () => {
  const payload = saveModule.buildSaveRecommendationPayload(
    {
      ...systemResult,
      recommended_market: {
        ...recommendedMarket,
        resolved_current_price_rs_kg: 999,
      },
    },
    {
      ...systemSubmittedInput,
      current_price_source: 'manual',
      price_rs_kg: 1,
    },
    recommendationTimestamp
  );

  assert.equal(payload.current_price_source, 'manual');
  assert.equal(payload.current_price, 1);
});

test('payload never adds ownership, server scheduling, auth, or fingerprint fields', () => {
  const payload = buildSystemPayload();
  const forbiddenFields = [
    'user',
    'user_id',
    'owner',
    'recommendation_fingerprint',
    'prediction_target_date',
    'status',
    'scheduled_for',
    'createdAt',
    'updatedAt',
    'token',
    'jwt',
    'authorization',
  ];

  for (const field of forbiddenFields) {
    assert.equal(field in payload, false, `${field} must stay server-controlled`);
  }
});

test('quantity must use the existing finite positive normalized quantity', () => {
  for (const quantity of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(
      () =>
        saveModule.buildSaveRecommendationPayload(
          systemResult,
          { ...systemSubmittedInput, quantity_kg: quantity },
          recommendationTimestamp
        ),
      /harvest quantity/i
    );
  }
});

test('the result-instance timestamp is supplied once and reused by every payload build', () => {
  const timestamp = saveModule.createRecommendationTimestamp(
    new Date('2026-08-27T10:00:00.000Z')
  );
  const firstAttempt = saveModule.buildSaveRecommendationPayload(
    systemResult,
    systemSubmittedInput,
    timestamp
  );
  const retry = saveModule.buildSaveRecommendationPayload(
    systemResult,
    systemSubmittedInput,
    timestamp
  );
  const nextResultTimestamp = saveModule.createRecommendationTimestamp(
    new Date('2026-08-27T10:05:00.000Z')
  );

  assert.equal(firstAttempt.recommendation_timestamp, timestamp);
  assert.equal(retry.recommendation_timestamp, timestamp);
  assert.notEqual(nextResultTimestamp, timestamp);
});

test('save helper makes one authenticated POST only to the saved endpoint', async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    requests.push({ url: String(input), init });
    return new Response(
      JSON.stringify({
        success: true,
        already_saved: false,
        saved_recommendation: {
          id: 'saved-123',
          prediction_target_date: '2026-09-03T00:00:00.000Z',
        },
        reminders: [],
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  };
  const payload = buildSystemPayload();

  const response = await saveModule.saveRecommendation(payload, 'jwt-123', {
    fetcher,
    apiBaseUrl: 'http://localhost:5000/api/',
  });

  assert.equal(requests.length, 1);
  assert.equal(
    requests[0].url,
    'http://localhost:5000/api/recommend-market/saved'
  );
  assert.notEqual(requests[0].url, 'http://localhost:5000/api/recommend-market');
  assert.equal(requests[0].init?.method, 'POST');
  assert.equal(
    new Headers(requests[0].init?.headers).get('Authorization'),
    'Bearer jwt-123'
  );
  assert.deepEqual(JSON.parse(String(requests[0].init?.body)), payload);
  assert.equal(response.saved_recommendation.id, 'saved-123');
});

test('an already-saved backend response is a valid saved result', async () => {
  const response = await saveModule.saveRecommendation(
    buildSystemPayload(),
    'jwt-123',
    {
      fetcher: async () =>
        new Response(
          JSON.stringify({
            success: true,
            already_saved: true,
            saved_recommendation: { id: 'existing-123' },
            reminders: [],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
    }
  );

  assert.equal(response.already_saved, true);
  assert.equal(response.saved_recommendation.id, 'existing-123');
});

test('missing token is rejected before fetch is issued', async () => {
  let requests = 0;

  await assert.rejects(
    saveModule.saveRecommendation(buildSystemPayload(), '   ', {
      fetcher: async () => {
        requests += 1;
        return new Response();
      },
    }),
    /sign in/i
  );
  assert.equal(requests, 0);
});

test('400 validation messages are safe to show while 401 and 403 use controlled copy', async () => {
  const makeError = async (status: number, message: string) => {
    try {
      await saveModule.saveRecommendation(buildSystemPayload(), 'jwt-123', {
        fetcher: async () =>
          new Response(JSON.stringify({ success: false, message }), {
            status,
            headers: { 'Content-Type': 'application/json' },
          }),
      });
    } catch (error) {
      return error;
    }
    assert.fail('Expected saveRecommendation to reject');
  };

  const badRequest = await makeError(400, 'Quantity is not valid.');
  const unauthorized = await makeError(401, 'Internal auth details');
  const forbidden = await makeError(403, 'Internal role details');

  assert.equal(
    saveModule.getSaveRecommendationErrorMessage(badRequest),
    'Quantity is not valid.'
  );
  assert.equal(
    saveModule.getSaveRecommendationErrorMessage(unauthorized),
    'Please sign in again to save this recommendation.'
  );
  assert.equal(
    saveModule.getSaveRecommendationErrorMessage(forbidden),
    'Farmer access is required to save recommendations.'
  );
});

test('network and malformed success responses never become saved results', async () => {
  await assert.rejects(
    saveModule.saveRecommendation(buildSystemPayload(), 'jwt-123', {
      fetcher: async () => {
        throw new TypeError('Network failed');
      },
    }),
    /Could not save this recommendation/
  );

  await assert.rejects(
    saveModule.saveRecommendation(buildSystemPayload(), 'jwt-123', {
      fetcher: async () =>
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    }),
    /Could not save this recommendation/
  );
});

test('target-date feedback formats only the backend-returned date', () => {
  assert.equal(
    saveModule.formatPredictionTargetDate('2026-09-03T00:00:00.000Z'),
    '3 Sept'
  );
  assert.equal(saveModule.formatPredictionTargetDate('not-a-date'), null);
  assert.doesNotMatch(
    saveModule.formatPredictionTargetDate.toString(),
    /setDate|getDate\(\)\s*\+|604800000/
  );
});

test('Page 1 alone exposes an accessible Save Recommendation action', () => {
  assert.match(resultScreenSource, /activePage === 'decision' &&/);
  assert.match(resultScreenSource, /type="button"[\s\S]*\{saveButtonLabel\}/);
  assert.match(resultScreenSource, /: 'Save Recommendation'/);
  assert.match(
    resultScreenSource,
    /disabled=\{saveStatus === 'saving' \|\| saveStatus === 'saved'\}/
  );
  assert.match(resultScreenSource, /aria-busy=\{saveStatus === 'saving'\}/);
  assert.doesNotMatch(recommendationResultSource, /Save Recommendation/);
});

test('save UI implements idle, saving, saved, error, target date, and saved ID state', () => {
  assert.match(resultScreenSource, /type SaveStatus = 'idle' \| 'saving' \| 'saved' \| 'error'/);
  assert.match(resultScreenSource, /useState<SaveStatus>\('idle'\)/);
  assert.match(resultScreenSource, /'Saving\.\.\.'/);
  assert.match(resultScreenSource, /\? 'Saved'/);
  assert.match(resultScreenSource, /setSaveStatus\('error'\)/);
  assert.match(resultScreenSource, /response\.saved_recommendation\.prediction_target_date/);
  assert.match(resultScreenSource, /Next market period:/);
  assert.match(resultScreenSource, /setSavedRecommendationId\(response\.saved_recommendation\.id\)/);
  assert.match(resultScreenSource, /role=\{saveStatus === 'error' \? 'alert' : 'status'\}/);
});

test('JWT lookup, rapid-click guard, and success disabling are local to save', () => {
  const tokenPosition = resultScreenSource.indexOf("localStorage.getItem('token')");
  const saveCallPosition = resultScreenSource.indexOf(
    'await saveRecommendation(payload, token)'
  );

  assert.ok(tokenPosition >= 0);
  assert.ok(saveCallPosition > tokenPosition);
  assert.match(
    resultScreenSource,
    /if \(saveInFlight\.current \|\| saveStatus === 'saved'\) return/
  );
  assert.match(resultScreenSource, /saveInFlight\.current = true/);
  assert.match(resultScreenSource, /saveInFlight\.current = false/);
  assert.match(resultScreenSource, /if \(!token\)[\s\S]*Please sign in to save this recommendation/);
});

test('prediction receipt owns timestamp creation and a new result resets save state', () => {
  const timestampPosition = pageSource.indexOf(
    'setRecommendationTimestamp(createRecommendationTimestamp())'
  );
  const resultReceiptPosition = pageSource.indexOf('setRecommendationResult(result)');

  assert.ok(timestampPosition > resultReceiptPosition);
  assert.equal(
    pageSource.match(/setRecommendationTimestamp\(createRecommendationTimestamp\(\)\)/g)
      ?.length,
    1
  );
  assert.match(pageSource, /setRecommendationTimestamp\(null\)/);
  assert.match(pageSource, /key=\{recommendationTimestamp\}/);
  assert.match(resultScreenSource, /recommendationTimestamp\s*\)/);
  assert.doesNotMatch(
    resultScreenSource,
    /recommendation_timestamp:\s*new Date|new Date\(\)\.toISOString/
  );
});

test('save integration cannot rerun the prediction request', () => {
  assert.doesNotMatch(resultScreenSource, /submitSellAdvisorRecommendation/);
  assert.doesNotMatch(resultScreenSource, /\/api\/recommend-market/);
  assert.match(resultScreenSource, /await saveRecommendation\(payload, token\)/);
});

test('decision dashboard, market, details, and weather presentation remain in place', () => {
  const decisionMarkup = recommendationResultSource.slice(
    recommendationResultSource.indexOf("activePage === 'decision'"),
    recommendationResultSource.indexOf("activePage === 'market'")
  );
  const marketMarkup = recommendationResultSource.slice(
    recommendationResultSource.indexOf("activePage === 'market'"),
    recommendationResultSource.indexOf("activePage === 'details'")
  );
  const detailsMarkup = recommendationResultSource.slice(
    recommendationResultSource.indexOf("activePage === 'details'")
  );

  for (const expected of [
    'Sell Advisor decision',
    'Recommended market',
    'Expected next-period price',
    'Quantity',
    'What should I do?',
    '<WeatherForecastStrip',
    'View Market Details',
  ]) {
    assert.match(
      decisionDashboardSource,
      new RegExp(expected.replace(/[?]/g, '\\?'))
    );
  }
  assert.match(decisionMarkup, /<DecisionPageDashboard/);
  assert.match(marketMarkup, /<MarketPageComparison/);
  assert.match(marketPageSource, /Where should I sell\?/);
  assert.match(detailsMarkup, /Why this recommendation/);
  assert.match(detailsMarkup, /How did the system decide\?/);
  assert.doesNotMatch(marketMarkup, /<WeatherForecastStrip/);
  assert.doesNotMatch(detailsMarkup, /<WeatherForecastStrip/);
  assert.doesNotMatch(weatherForecastSource, /fetch\(|axios|SELL_NOW|\bWAIT\b/i);
});
