import type {
  AiInsights,
  WeatherForecast,
  WeatherForecastDay,
} from '../prediction/recommendationContract';
import type {
  RecommendationLifecycleStatus,
  RecommendationSnapshot,
  SavedMarketOutlookStatus,
  SavedMarketOutlookStrength,
  SavedRecommendationSummary,
} from './savedRecommendationsApi';

type JsonRecord = Record<string, unknown>;

export type LifecyclePresentation = {
  label: 'Active' | 'Due soon' | 'Due';
  explanation: string;
  badgeClassName: string;
};

export type OutlookPresentation = {
  label:
    | 'Upward market signals'
    | 'Downward market signals'
    | 'Mixed market signals'
    | 'Stable market signals'
    | 'Limited market evidence';
  badgeClassName: string;
};

export type HistoricalMarketComparison = {
  key: string;
  market: string;
  currentPrice: number | null;
  experimentalPrice: number | null;
};

const LIFECYCLE_PRESENTATIONS: Record<
  RecommendationLifecycleStatus,
  LifecyclePresentation
> = {
  ACTIVE: {
    label: 'Active',
    explanation: 'This recommendation is still within its next market period.',
    badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  DUE_SOON: {
    label: 'Due soon',
    explanation: 'The next market period is approaching.',
    badgeClassName: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  DUE: {
    label: 'Due',
    explanation:
      'The next market period has arrived. Check current prices and conditions.',
    badgeClassName: 'border-rose-200 bg-rose-50 text-rose-800',
  },
};

const OUTLOOK_PRESENTATIONS: Record<
  SavedMarketOutlookStatus,
  OutlookPresentation
> = {
  UPWARD: {
    label: 'Upward market signals',
    badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  DOWNWARD: {
    label: 'Downward market signals',
    badgeClassName: 'border-rose-200 bg-rose-50 text-rose-800',
  },
  MIXED: {
    label: 'Mixed market signals',
    badgeClassName: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  STABLE: {
    label: 'Stable market signals',
    badgeClassName: 'border-sky-200 bg-sky-50 text-sky-800',
  },
  LIMITED: {
    label: 'Limited market evidence',
    badgeClassName: 'border-slate-200 bg-slate-50 text-slate-700',
  },
};

const OUTLOOK_STRENGTH_LABELS: Record<SavedMarketOutlookStrength, string> = {
  LOW: 'Low evidence',
  MODERATE: 'Moderate evidence',
  STRONG: 'Strong evidence',
};

const asRecord = (value: unknown): JsonRecord | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;

const getText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const getNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export const formatSavedName = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

export const formatSavedDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not available';

  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(parsed);
  } catch {
    return 'Not available';
  }
};

const formatReminderPart = (
  value: string,
  options: Intl.DateTimeFormatOptions
): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not available';

  try {
    return new Intl.DateTimeFormat('en-LK', options).format(parsed);
  } catch {
    return 'Not available';
  }
};

export const formatReminderDate = (value: string): string =>
  formatReminderPart(value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const formatReminderTime = (value: string): string =>
  formatReminderPart(value, {
    hour: 'numeric',
    minute: '2-digit',
  });

export const formatReminderDateTime = (value: string): string => {
  const date = formatReminderDate(value);
  const time = formatReminderTime(value);
  return date === 'Not available' || time === 'Not available'
    ? 'Not available'
    : `${date} · ${time}`;
};

export const formatSavedPrice = (value: number | null): string =>
  value === null
    ? 'Not available'
    : `Rs. ${value.toLocaleString('en-LK', {
        maximumFractionDigits: 2,
      })}/kg`;

export const formatSavedQuantity = (value: number): string =>
  `${value.toLocaleString('en-LK', { maximumFractionDigits: 2 })} kg`;

export const getLifecyclePresentation = (
  status: RecommendationLifecycleStatus
) => LIFECYCLE_PRESENTATIONS[status];

export const getOutlookPresentation = (status: SavedMarketOutlookStatus) =>
  OUTLOOK_PRESENTATIONS[status];

export const getOutlookStrengthLabel = (
  strength: SavedMarketOutlookStrength
) => OUTLOOK_STRENGTH_LABELS[strength];

export const removeArchivedRecommendation = (
  recommendations: SavedRecommendationSummary[],
  archivedId: string
) => recommendations.filter((recommendation) => recommendation.id !== archivedId);

export const getSnapshotAiInsights = (
  snapshot: RecommendationSnapshot
): AiInsights | null => {
  const insights = asRecord(snapshot.ai_insights);
  if (!insights) return null;

  const result: AiInsights = {};
  const fields = [
    'recommendation',
    'prediction_summary',
    'price_movement',
    'prediction_strength',
    'why_this_matters',
    'suggested_action',
  ] as const;

  for (const field of fields) {
    const text = getText(insights[field]);
    if (text) result[field] = text;
  }

  return Object.keys(result).length > 0 ? result : null;
};

const parseWeatherDay = (value: unknown): WeatherForecastDay | null => {
  const day = asRecord(value);
  if (!day) return null;

  const date = getText(day.date);
  const weatherCode = getNumber(day.weather_code);
  const maximumTemperature = getNumber(day.temperature_max_c);
  const minimumTemperature = getNumber(day.temperature_min_c);
  const rainProbability = getNumber(day.rain_probability);
  const rainfall = getNumber(day.rainfall_mm);
  if (
    !date ||
    weatherCode === null ||
    maximumTemperature === null ||
    minimumTemperature === null ||
    rainProbability === null ||
    rainfall === null
  ) {
    return null;
  }

  return {
    date,
    weather_code: weatherCode,
    temperature_max_c: maximumTemperature,
    temperature_min_c: minimumTemperature,
    rain_probability: rainProbability,
    rainfall_mm: rainfall,
  };
};

export const getSnapshotWeatherForecast = (
  snapshot: RecommendationSnapshot
): WeatherForecast | null => {
  const forecast = asRecord(snapshot.weather_forecast);
  if (!forecast || !Array.isArray(forecast.days)) return null;

  const location = getText(forecast.location);
  const days = forecast.days.map(parseWeatherDay).filter(
    (day): day is WeatherForecastDay => day !== null
  );
  if (
    !location ||
    forecast.period !== 'next_7_days' ||
    forecast.source !== 'open_meteo' ||
    days.length === 0
  ) {
    return null;
  }

  return {
    location,
    period: 'next_7_days',
    source: 'open_meteo',
    days,
  };
};

export const getHistoricalMarketComparisons = (
  snapshot: RecommendationSnapshot
): HistoricalMarketComparison[] => {
  const value = Array.isArray(snapshot.comparisons)
    ? snapshot.comparisons
    : Array.isArray(snapshot.market_comparisons)
      ? snapshot.market_comparisons
      : [];

  return value.flatMap((item, index) => {
    if (typeof item === 'string' && item.trim()) {
      const market = formatSavedName(item);
      return [{ key: `${item}-${index}`, market, currentPrice: null, experimentalPrice: null }];
    }

    const record = asRecord(item);
    if (!record) return [];
    const marketValue =
      getText(record.market) ??
      getText(record.market_name) ??
      getText(record.name);
    if (!marketValue) return [];

    return [
      {
        key: `${marketValue}-${index}`,
        market: formatSavedName(marketValue),
        currentPrice:
          getNumber(record.resolved_current_price_rs_kg) ??
          getNumber(record.current_price_rs_kg) ??
          getNumber(record.current_price),
        experimentalPrice: getNumber(record.predicted_price_rs_kg),
      },
    ];
  });
};
