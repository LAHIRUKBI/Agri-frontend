import type { SellAdvisorSubmittedInput } from './sellAdvisorRequest';

type JsonRecord = Record<string, unknown>;
type RecommendedMarket = string | JsonRecord;

export type SaveRecommendationPayload = {
  recommendation_timestamp: string;
  crop: string;
  farmer_district: string;
  recommended_market: RecommendedMarket;
  current_price: number;
  current_price_source: 'manual' | 'system';
  quantity_kg: number;
  market_outlook: JsonRecord;
  action_decision: 'SELL_NOW' | 'WAIT' | 'UNCERTAIN';
  action_authorized: boolean;
  horizon: 1;
  available_markets?: unknown;
  comparisons?: unknown;
  experimental_price?: number | null;
  persistence_baseline?: number | null;
  ai_insights?: unknown;
  weather_forecast?: unknown;
  model_version?: string;
  policy_version?: string;
};

export type SavedRecommendationSummary = {
  id: string;
  crop?: string;
  recommended_market?: unknown;
  prediction_target_date?: string;
  status?: string;
  created_at?: string;
};

export type SaveRecommendationResponse = {
  success: true;
  already_saved: boolean;
  saved_recommendation: SavedRecommendationSummary;
  reminders?: unknown[];
};

type SaveRecommendationConfig = {
  fetcher?: typeof fetch;
  apiBaseUrl?: string;
};

type ApiErrorPayload = {
  success?: boolean;
  message?: string;
};

const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const asRecord = (value: unknown): JsonRecord | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;

const nonEmptyString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const finiteNumber = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const firstDefined = (...values: unknown[]) =>
  values.find((value) => value !== undefined);

const optionalNumber = (value: unknown): number | null =>
  value === null ? null : finiteNumber(value);

const getMarketName = (market: RecommendedMarket): string | null => {
  if (typeof market === 'string') return nonEmptyString(market);

  return (
    nonEmptyString(market.market) ??
    nonEmptyString(market.market_name) ??
    nonEmptyString(market.name)
  );
};

const getMarketCurrentPrice = (market: JsonRecord | null): number | null => {
  if (!market) return null;

  return (
    finiteNumber(market.resolved_current_price_rs_kg) ??
    finiteNumber(market.current_price_rs_kg) ??
    finiteNumber(market.current_price) ??
    finiteNumber(market.reference_price_rs_kg)
  );
};

const requireField = <T>(
  value: T | null | undefined,
  message: string
): T => {
  if (value === null || value === undefined) {
    throw new SaveRecommendationError(message, 400);
  }

  return value;
};

export class SaveRecommendationError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'SaveRecommendationError';
    this.status = status;
  }
}

export const createRecommendationTimestamp = (now = new Date()) =>
  now.toISOString();

export const buildSaveRecommendationPayload = (
  result: unknown,
  submittedInput: SellAdvisorSubmittedInput,
  recommendationTimestamp: string
): SaveRecommendationPayload => {
  const recommendation = asRecord(result);
  if (!recommendation) {
    throw new SaveRecommendationError(
      'This recommendation cannot be saved because its result is unavailable.',
      400
    );
  }

  const parsedTimestamp = Date.parse(recommendationTimestamp);
  if (!recommendationTimestamp || Number.isNaN(parsedTimestamp)) {
    throw new SaveRecommendationError(
      'This recommendation cannot be saved because its timestamp is unavailable.',
      400
    );
  }

  const input = asRecord(recommendation.input);
  const recommendedMarketValue = recommendation.recommended_market;
  const recommendedMarket =
    typeof recommendedMarketValue === 'string'
      ? recommendedMarketValue
      : asRecord(recommendedMarketValue);
  if (!recommendedMarket || !getMarketName(recommendedMarket)) {
    throw new SaveRecommendationError(
      'The recommended market is unavailable for this recommendation.',
      400
    );
  }

  const recommendedMarketRecord = asRecord(recommendedMarket);
  const crop = requireField(
    nonEmptyString(input?.crop) ?? nonEmptyString(submittedInput.crop),
    'The crop is unavailable for this recommendation.'
  );
  const farmerDistrict = requireField(
    nonEmptyString(recommendation.farmer_district) ??
      nonEmptyString(input?.farmer_district) ??
      nonEmptyString(submittedInput.farmer_district),
    'The farmer district is unavailable for this recommendation.'
  );
  const rawPriceSource =
    submittedInput.current_price_source ?? input?.current_price_source;
  const currentPriceSource =
    rawPriceSource === 'system'
      ? 'system'
      : rawPriceSource === 'manual'
        ? 'manual'
        : null;
  const resolvedPriceSource = requireField(
    currentPriceSource,
    'The current price source is unavailable for this recommendation.'
  );
  const currentPrice = requireField(
    resolvedPriceSource === 'manual'
      ? finiteNumber(submittedInput.price_rs_kg ?? input?.price_rs_kg)
      : getMarketCurrentPrice(recommendedMarketRecord),
    'The current price is unavailable for this recommendation.'
  );
  const quantity = finiteNumber(
    submittedInput.quantity_kg ?? input?.quantity_kg
  );
  if (quantity === null || quantity <= 0) {
    throw new SaveRecommendationError(
      'The harvest quantity is unavailable for this recommendation.',
      400
    );
  }

  const marketOutlook = asRecord(recommendation.market_outlook);
  if (!marketOutlook) {
    throw new SaveRecommendationError(
      'The market outlook is unavailable for this recommendation.',
      400
    );
  }

  const actionDecisionValue =
    recommendedMarketRecord?.action_decision ?? recommendation.action_decision;
  const actionDecision =
    actionDecisionValue === 'SELL_NOW' ||
    actionDecisionValue === 'WAIT' ||
    actionDecisionValue === 'UNCERTAIN'
      ? actionDecisionValue
      : null;
  const resolvedActionDecision = requireField(
    actionDecision,
    'The action decision is unavailable for this recommendation.'
  );
  const actionAuthorizedValue =
    recommendedMarketRecord?.action_authorized ??
    recommendation.action_authorized;
  if (typeof actionAuthorizedValue !== 'boolean') {
    throw new SaveRecommendationError(
      'The action authorization is unavailable for this recommendation.',
      400
    );
  }

  const horizonValue = input?.horizon ?? submittedInput.horizon;
  if (horizonValue !== 1) {
    throw new SaveRecommendationError(
      'Only the next market period can be saved.',
      400
    );
  }

  const payload: SaveRecommendationPayload = {
    recommendation_timestamp: recommendationTimestamp,
    crop,
    farmer_district: farmerDistrict,
    recommended_market: recommendedMarket,
    current_price: currentPrice,
    current_price_source: resolvedPriceSource,
    quantity_kg: quantity,
    market_outlook: marketOutlook,
    action_decision: resolvedActionDecision,
    action_authorized: actionAuthorizedValue,
    horizon: 1,
  };

  const experimentalPriceValue = recommendedMarketRecord
    ? recommendedMarketRecord.predicted_price_rs_kg
    : undefined;
  if (experimentalPriceValue !== undefined) {
    payload.experimental_price = optionalNumber(experimentalPriceValue);
  }

  const persistenceBaselineValue = firstDefined(
    recommendedMarketRecord?.persistence_next_price_rs_kg,
    recommendation.persistence_next_price_rs_kg
  );
  if (persistenceBaselineValue !== undefined) {
    payload.persistence_baseline = optionalNumber(persistenceBaselineValue);
  }

  const comparisonsValue = firstDefined(
    recommendation.comparisons,
    recommendation.market_comparisons
  );
  if (comparisonsValue !== undefined) {
    payload.comparisons = comparisonsValue;
  }
  if (recommendation.available_markets !== undefined) {
    payload.available_markets = recommendation.available_markets;
  }
  if (recommendation.ai_insights !== undefined) {
    payload.ai_insights = recommendation.ai_insights;
  }
  if (recommendation.weather_forecast !== undefined) {
    payload.weather_forecast = recommendation.weather_forecast;
  }

  const modelVersion = nonEmptyString(recommendedMarketRecord?.model_run_id);
  if (modelVersion) payload.model_version = modelVersion;

  const policyVersion =
    nonEmptyString(recommendedMarketRecord?.action_policy) ??
    nonEmptyString(recommendation.action_policy);
  if (policyVersion) payload.policy_version = policyVersion;

  return payload;
};

export const buildSaveRecommendationUrl = (
  apiBaseUrl = DEFAULT_API_BASE_URL
) => `${apiBaseUrl.replace(/\/$/, '')}/recommend-market/saved`;

export const saveRecommendation = async (
  payload: SaveRecommendationPayload,
  token: string,
  config: SaveRecommendationConfig = {}
): Promise<SaveRecommendationResponse> => {
  const normalizedToken = token.trim();
  if (!normalizedToken) {
    throw new SaveRecommendationError(
      'Please sign in to save this recommendation.',
      401
    );
  }

  let response: Response;
  try {
    response = await (config.fetcher ?? fetch)(
      buildSaveRecommendationUrl(config.apiBaseUrl),
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${normalizedToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );
  } catch {
    throw new SaveRecommendationError(
      'Could not save this recommendation. Please try again.'
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new SaveRecommendationError(
      'Could not save this recommendation. Please try again.',
      response.status
    );
  }

  const responseRecord = asRecord(data);
  const savedRecommendation = asRecord(
    responseRecord?.saved_recommendation
  );
  const savedRecommendationId = nonEmptyString(savedRecommendation?.id);

  if (
    !response.ok ||
    responseRecord?.success !== true ||
    !savedRecommendation ||
    !savedRecommendationId
  ) {
    const errorPayload = responseRecord as ApiErrorPayload | null;
    const safeValidationMessage =
      response.status === 400 ? nonEmptyString(errorPayload?.message) : null;

    throw new SaveRecommendationError(
      safeValidationMessage ??
        'Could not save this recommendation. Please try again.',
      response.status
    );
  }

  return {
    success: true,
    already_saved: responseRecord.already_saved === true,
    saved_recommendation: {
      ...savedRecommendation,
      id: savedRecommendationId,
    },
    reminders: Array.isArray(responseRecord.reminders)
      ? responseRecord.reminders
      : undefined,
  } as SaveRecommendationResponse;
};

export const getSaveRecommendationErrorMessage = (error: unknown): string => {
  if (error instanceof SaveRecommendationError) {
    if (error.status === 401) {
      return 'Please sign in again to save this recommendation.';
    }
    if (error.status === 403) {
      return 'Farmer access is required to save recommendations.';
    }
    if (error.status === 400 && error.message.trim()) {
      return error.message;
    }
  }

  return 'Could not save this recommendation. Please try again.';
};

export const formatPredictionTargetDate = (value: unknown): string | null => {
  const isoDate = nonEmptyString(value);
  if (!isoDate) return null;

  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return null;

  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(parsed);
  } catch {
    return null;
  }
};
