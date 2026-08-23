import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPriceRecommendationRequest,
  getActionDecisionLabel,
} from '../app/dashboard/farmer/prediction/recommendationContract';

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
