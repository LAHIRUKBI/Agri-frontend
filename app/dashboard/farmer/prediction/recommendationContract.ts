export type CurrentPriceSource = 'manual' | 'system';
export type ActionDecision = 'SELL_NOW' | 'WAIT' | 'UNCERTAIN';
export type ModelSignalAlignment = 'CONFLICT' | 'ALIGNED' | 'UNKNOWN';

export type MarketOutlookStatus =
  | 'UPWARD'
  | 'DOWNWARD'
  | 'MIXED'
  | 'STABLE'
  | 'LIMITED';
export type MarketOutlookStrength = 'LOW' | 'MODERATE' | 'STRONG';
export type MarketOutlookSignalAlignment =
  | 'ALIGNED'
  | 'CONFLICT'
  | 'STABLE'
  | 'UNKNOWN';

export type MarketOutlook = {
  status: MarketOutlookStatus;
  strength: MarketOutlookStrength;
  signal_alignment: MarketOutlookSignalAlignment;
  price_signal: 'UP' | 'DOWN' | 'STABLE' | null;
  direction_signal: 'UP' | 'DOWN' | null;
  confidence: number | null;
  summary: string;
};

export type MarketOutlookResponse = {
  market_outlook?: MarketOutlook | null;
};

export type MarketOutlookPresentation = {
  title: string;
  summary: string;
  confidenceLabel: string;
  confidencePercent: number | null;
};

const MARKET_OUTLOOK_STATUS_LABELS: Record<MarketOutlookStatus, string> = {
  UPWARD: 'Upward market indication',
  DOWNWARD: 'Downward market indication',
  MIXED: 'Mixed market signals',
  STABLE: 'Price outlook is stable',
  LIMITED: 'Market outlook is limited',
};

const MARKET_OUTLOOK_STRENGTH_LABELS: Record<
  MarketOutlookStrength,
  string
> = {
  LOW: 'Low confidence',
  MODERATE: 'Moderate confidence',
  STRONG: 'Strong confidence',
};

export const getMarketOutlookPresentation = (
  marketOutlook?: MarketOutlook | null
): MarketOutlookPresentation | null => {
  if (!marketOutlook) return null;

  const strengthLabel =
    MARKET_OUTLOOK_STRENGTH_LABELS[marketOutlook.strength];
  const normalizedConfidence =
    marketOutlook.confidence !== null &&
    Number.isFinite(marketOutlook.confidence)
      ? marketOutlook.confidence >= 0 && marketOutlook.confidence <= 1
        ? marketOutlook.confidence * 100
        : marketOutlook.confidence
      : null;

  return {
    title: MARKET_OUTLOOK_STATUS_LABELS[marketOutlook.status],
    summary: marketOutlook.summary,
    confidenceLabel:
      normalizedConfidence === null
        ? strengthLabel
        : `${strengthLabel} • ${normalizedConfidence.toFixed(2)}%`,
    confidencePercent: normalizedConfidence,
  };
};

export type WeatherForecastDay = {
  date: string;
  weather_code: number;
  temperature_max_c: number;
  temperature_min_c: number;
  rain_probability: number;
  rainfall_mm: number;
};

export type WeatherForecast = {
  location: string;
  period: 'next_7_days';
  source: 'open_meteo';
  days: WeatherForecastDay[];
};

export const MIXED_MODEL_SIGNALS_TITLE = 'Model signals are mixed';
export const MIXED_MODEL_SIGNALS_MESSAGE =
  'The experimental price estimate and direction model point in different directions, so confidence in timing is limited.';

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

export const getModelSignalAlignment = (
  experimentalPrice: number | null,
  currentPrice: number | null,
  modelDirection: string | null | undefined
): ModelSignalAlignment => {
  if (
    experimentalPrice === null ||
    currentPrice === null ||
    !Number.isFinite(experimentalPrice) ||
    !Number.isFinite(currentPrice) ||
    experimentalPrice === currentPrice
  ) {
    return 'UNKNOWN';
  }

  const experimentalDirection =
    experimentalPrice > currentPrice ? 'UP' : 'DOWN';
  const normalizedModelDirection = modelDirection?.trim().toUpperCase();

  if (
    normalizedModelDirection !== 'UP' &&
    normalizedModelDirection !== 'DOWN'
  ) {
    return 'UNKNOWN';
  }

  return experimentalDirection === normalizedModelDirection
    ? 'ALIGNED'
    : 'CONFLICT';
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
