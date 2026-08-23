export type CurrentPriceSource = 'manual' | 'system';
export type ActionDecision = 'SELL_NOW' | 'WAIT' | 'UNCERTAIN';

export type PriceRecommendationRequestInput = {
  crop: string;
  district: string;
  current_price_source: CurrentPriceSource;
  price_rs_kg?: number;
  horizon: number;
};

export type PriceRecommendationRequest = {
  crop: string;
  district: string;
  current_price_source: CurrentPriceSource;
  price_rs_kg?: number;
  horizon: 1;
};

export const buildPriceRecommendationRequest = (
  input: PriceRecommendationRequestInput
): PriceRecommendationRequest => {
  if (input.horizon !== 1) {
    throw new Error('Only the next market period is supported');
  }

  const request: PriceRecommendationRequest = {
    crop: input.crop,
    district: input.district,
    current_price_source: input.current_price_source,
    horizon: 1,
  };

  if (input.current_price_source === 'manual') {
    if (!Number.isFinite(input.price_rs_kg) || Number(input.price_rs_kg) <= 0) {
      throw new Error('A positive price is required for manual current-price mode');
    }
    request.price_rs_kg = Number(input.price_rs_kg);
  }

  return request;
};

export const getActionDecisionLabel = (decision: ActionDecision): string => {
  if (decision === 'WAIT') return 'Wait';
  if (decision === 'SELL_NOW') return 'Sell now';
  return 'Timing advantage is uncertain';
};
