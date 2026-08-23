export type CurrentPriceSource = 'manual' | 'system';
export type ActionDecision = 'SELL_NOW' | 'WAIT' | 'UNCERTAIN';

export type AiInsights = {
  recommendation?: string | null;
  prediction_summary?: string | null;
  price_movement?: string | null;
  prediction_strength?: string | null;
  why_this_matters?: string | null;
  suggested_action?: string | null;
};

export type AiInsightKey = keyof AiInsights;

export type AiInsightItem = {
  key: AiInsightKey;
  label: string;
  text: string;
};

export type AiInsightGroup = {
  key: 'recommendation_summary' | 'market_outlook' | 'practical_context';
  title: string;
  items: AiInsightItem[];
};

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

const getInsightText = (
  insights: AiInsights | null | undefined,
  key: AiInsightKey
): string | null => {
  const value = insights?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

export const getAiInsightGroups = (
  insights: AiInsights | null | undefined
): AiInsightGroup[] => {
  const definitions: Array<{
    key: AiInsightGroup['key'];
    title: string;
    items: Array<{ key: AiInsightKey; label: string }>;
  }> = [
    {
      key: 'recommendation_summary',
      title: 'Recommendation summary',
      items: [{ key: 'recommendation', label: 'Recommendation' }],
    },
    {
      key: 'market_outlook',
      title: 'Market outlook',
      items: [
        { key: 'prediction_summary', label: 'Outlook' },
        { key: 'price_movement', label: 'Expected market movement' },
        { key: 'prediction_strength', label: 'Prediction strength' },
      ],
    },
    {
      key: 'practical_context',
      title: 'Practical context',
      items: [
        { key: 'why_this_matters', label: 'Why this matters' },
        { key: 'suggested_action', label: 'What you can do' },
      ],
    },
  ];

  return definitions
    .map((group) => ({
      ...group,
      items: group.items.flatMap((item) => {
        const text = getInsightText(insights, item.key);
        return text ? [{ ...item, text }] : [];
      }),
    }))
    .filter((group) => group.items.length > 0);
};
