import test from 'node:test';
import assert from 'node:assert/strict';

type RecommendationContractModule = typeof import(
  '../app/dashboard/farmer/prediction/recommendationContract'
);

const {
  buildPriceRecommendationRequest,
  getActionDecisionLabel,
  getAiInsightGroups,
} = await import(
  '../app/dashboard/farmer/prediction/recommendationContract' + '.ts'
) as RecommendationContractModule;

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
