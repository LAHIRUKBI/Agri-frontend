import type { RecommendationReminder } from './recommendationReminderApi';

export type RecommendationLifecycleStatus = 'ACTIVE' | 'DUE_SOON' | 'DUE';

export type SavedMarketOutlookStatus =
  | 'UPWARD'
  | 'DOWNWARD'
  | 'MIXED'
  | 'STABLE'
  | 'LIMITED';

export type SavedMarketOutlookStrength = 'LOW' | 'MODERATE' | 'STRONG';
export type SavedActionDecision = 'SELL_NOW' | 'WAIT' | 'UNCERTAIN';
export type SavedCurrentPriceSource = 'manual' | 'system';

export type RecommendationSnapshot = Readonly<
  {
    ai_insights?: unknown;
    weather_forecast?: unknown;
    comparisons?: unknown;
    market_comparisons?: unknown;
    market_outlook?: unknown;
  } & Record<string, unknown>
>;

export type SavedRecommendationSummary = {
  id: string;
  crop: string;
  farmer_district: string;
  recommended_market: string;
  current_price: number;
  experimental_price: number | null;
  quantity_kg: number;
  market_outlook_status: SavedMarketOutlookStatus;
  market_outlook_strength: SavedMarketOutlookStrength;
  prediction_target_date: string;
  status: RecommendationLifecycleStatus;
  created_at: string;
  reminder: RecommendationReminder | null;
};

export type SavedRecommendationDetail = SavedRecommendationSummary & {
  current_price_source: SavedCurrentPriceSource;
  persistence_baseline: number | null;
  action_decision: SavedActionDecision;
  action_authorized: boolean;
  model_version: string | null;
  policy_version: string | null;
  updated_at: string;
  recommendation_snapshot: RecommendationSnapshot;
};

export type ArchivedRecommendation = {
  id: string;
  status: 'ARCHIVED';
};

type SavedRecommendationsApiConfig = {
  apiBaseUrl?: string;
  fetcher?: typeof fetch;
  signal?: AbortSignal;
};

type JsonRecord = Record<string, unknown>;

const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const LIFECYCLE_STATUSES = new Set<RecommendationLifecycleStatus>([
  'ACTIVE',
  'DUE_SOON',
  'DUE',
]);
const OUTLOOK_STATUSES = new Set<SavedMarketOutlookStatus>([
  'UPWARD',
  'DOWNWARD',
  'MIXED',
  'STABLE',
  'LIMITED',
]);
const OUTLOOK_STRENGTHS = new Set<SavedMarketOutlookStrength>([
  'LOW',
  'MODERATE',
  'STRONG',
]);
const ACTION_DECISIONS = new Set<SavedActionDecision>([
  'SELL_NOW',
  'WAIT',
  'UNCERTAIN',
]);

const asRecord = (value: unknown): JsonRecord | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;

const getString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const getFiniteNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const requireString = (
  record: JsonRecord,
  field: string,
  context: string
) => {
  const value = getString(record[field]);
  if (!value) {
    throw new SavedRecommendationsApiError(
      `The ${context} response is missing ${field}.`
    );
  }
  return value;
};

const requireNumber = (
  record: JsonRecord,
  field: string,
  context: string
) => {
  const value = getFiniteNumber(record[field]);
  if (value === null) {
    throw new SavedRecommendationsApiError(
      `The ${context} response is missing ${field}.`
    );
  }
  return value;
};

const optionalNumber = (
  record: JsonRecord,
  field: string,
  context: string
): number | null => {
  if (record[field] === null || record[field] === undefined) return null;
  return requireNumber(record, field, context);
};

const optionalString = (record: JsonRecord, field: string): string | null =>
  record[field] === null || record[field] === undefined
    ? null
    : getString(record[field]);

const requireEnum = <T extends string>(
  record: JsonRecord,
  field: string,
  values: ReadonlySet<T>,
  context: string
): T => {
  const value = getString(record[field]);
  if (!value || !values.has(value as T)) {
    throw new SavedRecommendationsApiError(
      `The ${context} response has an invalid ${field}.`
    );
  }
  return value as T;
};

const parseReminder = (
  value: unknown,
  context: string
): RecommendationReminder | null => {
  if (value === null || value === undefined) return null;
  const reminder = asRecord(value);
  if (!reminder || reminder.type !== 'RECOMMENDATION_CUSTOM') {
    throw new SavedRecommendationsApiError(
      `The ${context} response has an invalid reminder.`
    );
  }

  return {
    id: requireString(reminder, 'id', `${context} reminder`),
    type: 'RECOMMENDATION_CUSTOM',
    scheduled_for: requireString(
      reminder,
      'scheduled_for',
      `${context} reminder`
    ),
  };
};

const parseSummary = (
  value: unknown,
  context = 'saved recommendations'
): SavedRecommendationSummary => {
  const record = asRecord(value);
  if (!record) {
    throw new SavedRecommendationsApiError(
      `The ${context} response is malformed.`
    );
  }

  return {
    id: requireString(record, 'id', context),
    crop: requireString(record, 'crop', context),
    farmer_district: requireString(record, 'farmer_district', context),
    recommended_market: requireString(record, 'recommended_market', context),
    current_price: requireNumber(record, 'current_price', context),
    experimental_price: optionalNumber(
      record,
      'experimental_price',
      context
    ),
    quantity_kg: requireNumber(record, 'quantity_kg', context),
    market_outlook_status: requireEnum(
      record,
      'market_outlook_status',
      OUTLOOK_STATUSES,
      context
    ),
    market_outlook_strength: requireEnum(
      record,
      'market_outlook_strength',
      OUTLOOK_STRENGTHS,
      context
    ),
    prediction_target_date: requireString(
      record,
      'prediction_target_date',
      context
    ),
    status: requireEnum(record, 'status', LIFECYCLE_STATUSES, context),
    created_at: requireString(record, 'created_at', context),
    reminder: parseReminder(record.reminder, context),
  };
};

const parseDetail = (value: unknown): SavedRecommendationDetail => {
  const context = 'saved recommendation detail';
  const record = asRecord(value);
  if (!record) {
    throw new SavedRecommendationsApiError(`The ${context} response is malformed.`);
  }
  const snapshot = asRecord(record.recommendation_snapshot);
  if (!snapshot) {
    throw new SavedRecommendationsApiError(
      `The ${context} response is missing recommendation_snapshot.`
    );
  }
  const currentPriceSource = requireEnum(
    record,
    'current_price_source',
    new Set<SavedCurrentPriceSource>(['manual', 'system']),
    context
  );
  const actionDecision = requireEnum(
    record,
    'action_decision',
    ACTION_DECISIONS,
    context
  );
  if (typeof record.action_authorized !== 'boolean') {
    throw new SavedRecommendationsApiError(
      `The ${context} response is missing action_authorized.`
    );
  }

  return {
    ...parseSummary(record, context),
    current_price_source: currentPriceSource,
    persistence_baseline: optionalNumber(
      record,
      'persistence_baseline',
      context
    ),
    action_decision: actionDecision,
    action_authorized: record.action_authorized,
    model_version: optionalString(record, 'model_version'),
    policy_version: optionalString(record, 'policy_version'),
    updated_at: requireString(record, 'updated_at', context),
    recommendation_snapshot: snapshot,
  };
};

const getSafeApiMessage = (value: unknown) => {
  const record = asRecord(value);
  return getString(record?.message);
};

const normalizeToken = (token: string) => {
  const normalized = token.trim();
  if (!normalized) {
    throw new SavedRecommendationsApiError(
      'Please sign in to view your saved recommendations.',
      401
    );
  }
  return normalized;
};

const normalizeSavedRecommendationId = (id: string) => {
  const normalized = id.trim();
  if (!normalized) {
    throw new SavedRecommendationsApiError(
      'Saved recommendation not found.',
      404
    );
  }
  return normalized;
};

const requestJson = async (
  url: string,
  token: string,
  method: 'GET' | 'DELETE',
  config: SavedRecommendationsApiConfig
): Promise<JsonRecord> => {
  const normalizedToken = normalizeToken(token);
  let response: Response;
  try {
    response = await (config.fetcher ?? fetch)(url, {
      method,
      signal: config.signal,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${normalizedToken}`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new SavedRecommendationsApiError(
      'Could not load saved recommendations. Please try again.'
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new SavedRecommendationsApiError(
      'The saved recommendations service returned an invalid response.',
      response.status
    );
  }

  const record = asRecord(data);
  if (!response.ok || record?.success !== true) {
    throw new SavedRecommendationsApiError(
      getSafeApiMessage(data) ??
        'Could not load saved recommendations. Please try again.',
      response.status
    );
  }
  if (!record) {
    throw new SavedRecommendationsApiError(
      'The saved recommendations service returned an invalid response.',
      response.status
    );
  }

  return record;
};

export class SavedRecommendationsApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'SavedRecommendationsApiError';
    this.status = status;
  }
}

export const buildSavedRecommendationsUrl = (
  apiBaseUrl = DEFAULT_API_BASE_URL
) => `${apiBaseUrl.replace(/\/$/, '')}/recommend-market/saved`;

export const buildSavedRecommendationDetailUrl = (
  id: string,
  apiBaseUrl = DEFAULT_API_BASE_URL
) =>
  `${buildSavedRecommendationsUrl(apiBaseUrl)}/${encodeURIComponent(
    normalizeSavedRecommendationId(id)
  )}`;

export const getSavedRecommendations = async (
  token: string,
  config: SavedRecommendationsApiConfig = {}
): Promise<SavedRecommendationSummary[]> => {
  const record = await requestJson(
    buildSavedRecommendationsUrl(config.apiBaseUrl),
    token,
    'GET',
    config
  );
  if (!Array.isArray(record.saved_recommendations)) {
    throw new SavedRecommendationsApiError(
      'The saved recommendations service returned an invalid response.'
    );
  }

  return record.saved_recommendations.map((item) => parseSummary(item));
};

export const getSavedRecommendation = async (
  id: string,
  token: string,
  config: SavedRecommendationsApiConfig = {}
): Promise<SavedRecommendationDetail> => {
  const record = await requestJson(
    buildSavedRecommendationDetailUrl(id, config.apiBaseUrl),
    token,
    'GET',
    config
  );

  return parseDetail(record.saved_recommendation);
};

export const archiveSavedRecommendation = async (
  id: string,
  token: string,
  config: SavedRecommendationsApiConfig = {}
): Promise<ArchivedRecommendation> => {
  const record = await requestJson(
    buildSavedRecommendationDetailUrl(id, config.apiBaseUrl),
    token,
    'DELETE',
    config
  );
  const archived = asRecord(record.saved_recommendation);
  if (
    !archived ||
    getString(archived.id) !== normalizeSavedRecommendationId(id) ||
    archived.status !== 'ARCHIVED'
  ) {
    throw new SavedRecommendationsApiError(
      'The saved recommendations service returned an invalid archive response.'
    );
  }

  return { id: normalizeSavedRecommendationId(id), status: 'ARCHIVED' };
};

export const getSavedRecommendationsErrorMessage = (
  error: unknown,
  fallback = 'Could not load saved recommendations. Please try again.'
) => {
  if (error instanceof SavedRecommendationsApiError) {
    if (error.status === 401) {
      return 'Please sign in again to view your saved recommendations.';
    }
    if (error.status === 403) {
      return 'Farmer access is required to view saved recommendations.';
    }
    if (error.status === 404) return 'Saved recommendation not found.';
  }
  return fallback;
};
