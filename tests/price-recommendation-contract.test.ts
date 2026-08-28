import test from 'node:test';
import assert from 'node:assert/strict';

type RecommendationContractModule = typeof import(
  '../app/dashboard/farmer/prediction/recommendationContract'
);

const {
  buildPriceRecommendationRequest,
  getActionDecisionLabel,
  getAiInsightGroups,
  getMarketOutlookPresentation,
  getModelSignalAlignment,
  MIXED_MODEL_SIGNALS_MESSAGE,
  MIXED_MODEL_SIGNALS_TITLE,
} = await import(
  '../app/dashboard/farmer/prediction/recommendationContract' + '.ts'
) as RecommendationContractModule;

const weatherForecastPresentation = await import(
  '../app/dashboard/farmer/prediction/components/sell-advisor/weatherForecastPresentation' +
    '.ts'
);

test('manual mode sends the entered Beans/Meegoda price', () => {
  const request = buildPriceRecommendationRequest({
    crop: 'beans',
    district: 'meegoda',
    current_price_source: 'manual',
    price_rs_kg: 400,
    horizon: 1,
  });

  assert.deepEqual(request, {
    crop: 'beans',
    district: 'meegoda',
    current_price_source: 'manual',
    price_rs_kg: 400,
    horizon: 1,
  });
});

test('system mode omits price instead of sending a placeholder', () => {
  const request = buildPriceRecommendationRequest({
    crop: 'beans',
    district: 'meegoda',
    current_price_source: 'system',
    horizon: 1,
  });

  assert.equal('price_rs_kg' in request, false);
  assert.equal(JSON.stringify(request).includes('"price_rs_kg":1'), false);
});

test('unsupported horizons are blocked by the request serializer', () => {
  for (const horizon of [2, 3, 4]) {
    assert.throws(
      () =>
        buildPriceRecommendationRequest({
          crop: 'beans',
          district: 'meegoda',
          current_price_source: 'manual',
          price_rs_kg: 400,
          horizon,
        }),
      /Only the next market period is supported/
    );
  }
});

test('frontend decision label depends only on backend action_decision', () => {
  assert.equal(
    getActionDecisionLabel('UNCERTAIN'),
    'Timing advantage is uncertain'
  );
  assert.equal(getActionDecisionLabel('WAIT'), 'Wait');
  assert.equal(getActionDecisionLabel('SELL_NOW'), 'Sell now');
});

test('weather-aware operational text is presented without creating an action decision', () => {
  const groups = getAiInsightGroups({
    why_this_matters:
      'Heavy rainfall is forecast for the coming market period and may make harvesting, farm access, transport, handling, or safe storage more difficult.',
    suggested_action:
      'Protect exposed produce, arrange transport early, confirm buyer availability, and secure storage while monitoring forecast changes.',
  });

  assert.deepEqual(
    groups.flatMap((group) => group.items.map((item) => item.text)),
    [
      'Heavy rainfall is forecast for the coming market period and may make harvesting, farm access, transport, handling, or safe storage more difficult.',
      'Protect exposed produce, arrange transport early, confirm buyer availability, and secure storage while monitoring forecast changes.',
    ]
  );
  assert.deepEqual(
    groups.flatMap((group) => group.items.map((item) => item.label)),
    ['Why this matters', 'What you can do']
  );
  assert.equal(
    getActionDecisionLabel('UNCERTAIN'),
    'Timing advantage is uncertain'
  );
  assert.equal(JSON.stringify(groups).includes('action_decision'), false);
});

test('normal non-weather insights use the same generic layout', () => {
  const groups = getAiInsightGroups({
    recommendation: 'Compare available buyer offers before choosing a market.',
    prediction_summary: 'The next-period estimate remains close to the baseline.',
    why_this_matters: 'Transport cost may outweigh a small price difference.',
    suggested_action: 'Confirm transport costs and buyer availability.',
  });

  assert.deepEqual(
    groups.map((group) => group.title),
    ['Recommendation summary', 'Market outlook', 'Practical context']
  );
  assert.equal(JSON.stringify(groups).includes('weather'), false);
});

test('missing optional AI insight fields are omitted cleanly', () => {
  assert.deepEqual(getAiInsightGroups(null), []);
  assert.deepEqual(getAiInsightGroups({}), []);

  const groups = getAiInsightGroups({
    recommendation: '  Use the current market comparison.  ',
    prediction_summary: ' ',
    price_movement: null,
  });

  assert.deepEqual(groups, [
    {
      key: 'recommendation_summary',
      title: 'Recommendation summary',
      items: [
        {
          key: 'recommendation',
          label: 'Recommendation',
          text: 'Use the current market comparison.',
        },
      ],
    },
  ]);
});

test('backend market outlook statuses map to farmer-readable evidence labels', () => {
  const expectedTitles = {
    UPWARD: 'Upward market indication',
    DOWNWARD: 'Downward market indication',
    MIXED: 'Mixed market signals',
    STABLE: 'Price outlook is stable',
    LIMITED: 'Market outlook is limited',
  } as const;

  for (const [status, title] of Object.entries(expectedTitles)) {
    const presentation = getMarketOutlookPresentation({
      status: status as keyof typeof expectedTitles,
      strength: 'LOW',
      signal_alignment: 'UNKNOWN',
      price_signal: null,
      direction_signal: null,
      confidence: null,
      summary: `${status} backend summary`,
    });

    assert.equal(presentation?.title, title);
  }
});

test('market outlook preserves backend summary and formats backend strength and confidence', () => {
  const summary =
    'Both experimental signals point upward, but confidence is low.';
  const presentation = getMarketOutlookPresentation({
    status: 'UPWARD',
    strength: 'LOW',
    signal_alignment: 'ALIGNED',
    price_signal: 'UP',
    direction_signal: 'UP',
    confidence: 0.5365,
    summary,
  });

  assert.equal(presentation?.summary, summary);
  assert.equal(presentation?.confidenceLabel, 'Low confidence • 53.65%');
  assert.equal(presentation?.confidencePercent, 53.65);
});

test('market outlook strength remains visible without numeric confidence', () => {
  const expectedLabels = {
    LOW: 'Low confidence',
    MODERATE: 'Moderate confidence',
    STRONG: 'Strong confidence',
  } as const;

  for (const [strength, confidenceLabel] of Object.entries(expectedLabels)) {
    const presentation = getMarketOutlookPresentation({
      status: 'DOWNWARD',
      strength: strength as keyof typeof expectedLabels,
      signal_alignment: 'ALIGNED',
      price_signal: 'DOWN',
      direction_signal: 'DOWN',
      confidence: null,
      summary: 'Both experimental signals point downward.',
    });

    assert.equal(presentation?.confidenceLabel, confidenceLabel);
    assert.equal(presentation?.confidencePercent, null);
  }
});

test('market outlook labels never create canonical selling actions', () => {
  const upward = getMarketOutlookPresentation({
    status: 'UPWARD',
    strength: 'MODERATE',
    signal_alignment: 'ALIGNED',
    price_signal: 'UP',
    direction_signal: 'UP',
    confidence: 0.6,
    summary: 'Upward evidence.',
  });
  const downward = getMarketOutlookPresentation({
    status: 'DOWNWARD',
    strength: 'MODERATE',
    signal_alignment: 'ALIGNED',
    price_signal: 'DOWN',
    direction_signal: 'DOWN',
    confidence: 0.6,
    summary: 'Downward evidence.',
  });

  assert.equal(JSON.stringify(upward).includes('WAIT'), false);
  assert.equal(JSON.stringify(downward).includes('SELL_NOW'), false);
});

test('missing market outlook returns the safe fallback signal', () => {
  assert.equal(getMarketOutlookPresentation(undefined), null);
  assert.equal(getMarketOutlookPresentation(null), null);
});

test('weather-code presentation maps Open-Meteo WMO groups without creating decisions', () => {
  const expected = new Map([
    [0, ['clear', 'clear sky']],
    [2, ['partly-cloudy', 'partly cloudy']],
    [3, ['cloudy', 'cloudy']],
    [45, ['fog', 'fog']],
    [51, ['drizzle', 'drizzle']],
    [61, ['rain', 'rain']],
    [71, ['snow', 'snow']],
    [80, ['showers', 'rain showers']],
    [95, ['thunderstorm', 'thunderstorm']],
    [999, ['unknown', 'weather unavailable']],
  ]);

  for (const [weatherCode, [icon, label]] of expected) {
    assert.deepEqual(
      weatherForecastPresentation.getWeatherCodePresentation(weatherCode),
      { icon, label }
    );
  }

  assert.doesNotMatch(
    JSON.stringify([...expected.values()]),
    /SELL_NOW|WAIT/
  );
});

test('forecast presentation keeps seven real days and exposes an accessible daily label', () => {
  const days = Array.from({ length: 8 }, (_, index) => ({
    date: `2026-08-${String(25 + index).padStart(2, '0')}`,
    weather_code: index === 0 ? 61 : 2,
    temperature_max_c: 28.4 + index,
    temperature_min_c: 23.1 + index,
    rain_probability: 85 - index,
    rainfall_mm: 12.6 - index,
  }));
  const forecast = {
    location: 'Kurunegala',
    period: 'next_7_days' as const,
    source: 'open_meteo' as const,
    days,
  };

  assert.equal(
    weatherForecastPresentation.getRenderableForecastDays(forecast).length,
    7
  );
  assert.deepEqual(
    weatherForecastPresentation.getRenderableForecastDays(null),
    []
  );
  assert.deepEqual(
    weatherForecastPresentation.getRenderableForecastDays({}),
    []
  );
  assert.deepEqual(
    weatherForecastPresentation.getRenderableForecastDays({ days: [] }),
    []
  );
  assert.equal(
    weatherForecastPresentation.formatForecastWeekday('2026-08-25'),
    'Tue'
  );
  assert.equal(
    weatherForecastPresentation.getWeatherDayAriaLabel(days[0]),
    'Tuesday: rain, 85 percent chance of rain, maximum temperature 28 degrees Celsius.'
  );
});

const assertSignalAlignmentDoesNotChangeDecision = (
  experimentalPrice: number | null,
  currentPrice: number | null,
  modelDirection: string | null,
  expectedAlignment: 'CONFLICT' | 'ALIGNED' | 'UNKNOWN'
) => {
  const actionDecision = 'UNCERTAIN' as const;
  const alignment = getModelSignalAlignment(
    experimentalPrice,
    currentPrice,
    modelDirection
  );

  assert.equal(alignment, expectedAlignment);
  assert.equal(actionDecision, 'UNCERTAIN');
  assert.equal(
    getActionDecisionLabel(actionDecision),
    'Timing advantage is uncertain'
  );
  assert.equal(JSON.stringify({ alignment }).includes('SELL_NOW'), false);
  assert.equal(JSON.stringify({ alignment }).includes('WAIT'), false);
};

test('UP experimental comparison and DOWN model signal show mixed signals', () => {
  assertSignalAlignmentDoesNotChangeDecision(426, 400, 'DOWN', 'CONFLICT');
  assert.equal(MIXED_MODEL_SIGNALS_TITLE, 'Model signals are mixed');
  assert.equal(
    MIXED_MODEL_SIGNALS_MESSAGE,
    'The experimental price estimate and direction model point in different directions, so confidence in timing is limited.'
  );
});

test('DOWN experimental comparison and UP model signal show mixed signals', () => {
  assertSignalAlignmentDoesNotChangeDecision(380, 400, 'UP', 'CONFLICT');
});

test('UP experimental comparison and UP model signal are aligned', () => {
  assertSignalAlignmentDoesNotChangeDecision(426, 400, 'UP', 'ALIGNED');
});

test('DOWN experimental comparison and DOWN model signal are aligned', () => {
  assertSignalAlignmentDoesNotChangeDecision(380, 400, 'DOWN', 'ALIGNED');
});

test('missing model direction produces no mixed-signal warning state', () => {
  assertSignalAlignmentDoesNotChangeDecision(426, 400, null, 'UNKNOWN');
});
