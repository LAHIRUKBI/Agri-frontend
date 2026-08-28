import type { SellAdvisorDraft } from './sellAdvisorState';

export type SellAdvisorRequest = {
  crop: string;
  farmer_district: string;
  current_price_source: 'manual' | 'system';
  price_rs_kg?: number;
  horizon: 1;
};

export type SellAdvisorQuantityRange = {
  label: string;
  value: number;
  min: number;
  max?: number;
};

export type SellAdvisorSubmittedInput = SellAdvisorRequest & {
  harvest_input_mode: 'range' | 'exact';
  quantity_kg: number;
  quantity_min_kg?: number;
  quantity_max_kg?: number;
  quantity_range_label?: string;
  exact_quantity_kg?: number;
};

type SubmitRecommendationConfig = {
  signal?: AbortSignal;
  fetcher?: typeof fetch;
  apiBaseUrl?: string;
};

type ApiErrorPayload = {
  success?: boolean;
  message?: string;
  code?: string;
};

const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type CompleteRequestDraft = SellAdvisorDraft & {
  crop: Exclude<SellAdvisorDraft['crop'], ''>;
  farmerDistrict: Exclude<SellAdvisorDraft['farmerDistrict'], ''>;
  currentPriceSource: NonNullable<SellAdvisorDraft['currentPriceSource']>;
};

function requireCompleteRequestContext(
  draft: SellAdvisorDraft
): asserts draft is CompleteRequestDraft {
  if (!draft.crop) throw new Error('A crop is required');
  if (!draft.farmerDistrict) throw new Error('A farmer district is required');
  if (!draft.currentPriceSource) throw new Error('A price source is required');
}

export const buildSellAdvisorRequest = (
  draft: SellAdvisorDraft
): SellAdvisorRequest => {
  requireCompleteRequestContext(draft);

  const request: SellAdvisorRequest = {
    crop: draft.crop,
    farmer_district: draft.farmerDistrict,
    current_price_source: draft.currentPriceSource,
    horizon: 1,
  };

  if (draft.currentPriceSource === 'manual') {
    const price = Number(draft.currentPrice);
    if (!draft.currentPrice.trim() || !Number.isFinite(price) || price <= 0) {
      throw new Error('A positive current price is required');
    }

    request.price_rs_kg = price;
  }

  return request;
};

export const resolveSellAdvisorQuantity = (
  draft: SellAdvisorDraft,
  quantityRanges: readonly SellAdvisorQuantityRange[]
): Omit<SellAdvisorSubmittedInput, keyof SellAdvisorRequest> => {
  if (draft.quantityMode === 'exact') {
    const quantity = Number(draft.exactQuantity);
    if (
      !draft.exactQuantity.trim() ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      throw new Error('A positive exact quantity is required');
    }

    return {
      harvest_input_mode: 'exact',
      quantity_kg: quantity,
      exact_quantity_kg: quantity,
    };
  }

  const selectedRange = quantityRanges.find(
    (range) => range.label === draft.harvestRange
  );
  if (!selectedRange) throw new Error('A supported harvest range is required');

  return {
    harvest_input_mode: 'range',
    quantity_kg: selectedRange.value,
    quantity_min_kg: selectedRange.min,
    quantity_max_kg: selectedRange.max,
    quantity_range_label: selectedRange.label,
  };
};

export const buildSellAdvisorSubmission = (
  draft: SellAdvisorDraft,
  quantityRanges: readonly SellAdvisorQuantityRange[]
): {
  request: SellAdvisorRequest;
  submittedInput: SellAdvisorSubmittedInput;
} => {
  const request = buildSellAdvisorRequest(draft);
  const quantity = resolveSellAdvisorQuantity(draft, quantityRanges);

  return {
    request,
    submittedInput: { ...request, ...quantity },
  };
};

export const canSubmitSellAdvisorDraft = (
  draft: SellAdvisorDraft,
  quantityRanges: readonly SellAdvisorQuantityRange[]
): boolean => {
  try {
    buildSellAdvisorSubmission(draft, quantityRanges);
    return true;
  } catch {
    return false;
  }
};

export const buildSellAdvisorRecommendationUrl = (
  apiBaseUrl = DEFAULT_API_BASE_URL
) => `${apiBaseUrl.replace(/\/$/, '')}/recommend-market`;

export const submitSellAdvisorRecommendation = async (
  request: SellAdvisorRequest,
  config: SubmitRecommendationConfig = {}
): Promise<unknown> => {
  const response = await (config.fetcher ?? fetch)(
    buildSellAdvisorRecommendationUrl(config.apiBaseUrl),
    {
      method: 'POST',
      signal: config.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }
  );

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('The recommendation service returned an invalid response');
  }

  const errorPayload =
    payload && typeof payload === 'object'
      ? (payload as ApiErrorPayload)
      : undefined;

  if (!response.ok || errorPayload?.success === false) {
    throw new Error(
      errorPayload?.message || 'The recommendation request was unsuccessful'
    );
  }

  return payload;
};
