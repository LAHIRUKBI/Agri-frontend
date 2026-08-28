export type RecommendationReminder = {
  id: string;
  type: 'RECOMMENDATION_CUSTOM';
  scheduled_for: string;
};

type RecommendationReminderApiConfig = {
  apiBaseUrl?: string;
  fetcher?: typeof fetch;
  signal?: AbortSignal;
};

type JsonRecord = Record<string, unknown>;

const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const asRecord = (value: unknown): JsonRecord | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;

const getString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const normalizeToken = (token: string) => {
  const normalized = token.trim();
  if (!normalized) {
    throw new RecommendationReminderApiError(
      'Please sign in again to manage this reminder.',
      401
    );
  }
  return normalized;
};

const normalizeRecommendationId = (id: string) => {
  const normalized = id.trim();
  if (!normalized) {
    throw new RecommendationReminderApiError(
      'Saved recommendation not found.',
      404
    );
  }
  return normalized;
};

const parseReminder = (value: unknown): RecommendationReminder => {
  const reminder = asRecord(value);
  const id = getString(reminder?.id);
  const scheduledFor = getString(reminder?.scheduled_for);
  if (
    !reminder ||
    !id ||
    !scheduledFor ||
    reminder.type !== 'RECOMMENDATION_CUSTOM'
  ) {
    throw new RecommendationReminderApiError(
      'The reminder service returned an invalid response.'
    );
  }

  return {
    id,
    type: 'RECOMMENDATION_CUSTOM',
    scheduled_for: scheduledFor,
  };
};

const getSafeApiMessage = (value: unknown) =>
  getString(asRecord(value)?.message);

const requestJson = async (
  url: string,
  token: string,
  method: 'GET' | 'PUT' | 'DELETE',
  config: RecommendationReminderApiConfig,
  scheduledFor?: string
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
        ...(method === 'PUT' ? { 'Content-Type': 'application/json' } : {}),
      },
      body:
        method === 'PUT'
          ? JSON.stringify({ scheduled_for: scheduledFor })
          : undefined,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new RecommendationReminderApiError(
      'Could not manage this reminder. Please try again.'
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new RecommendationReminderApiError(
      'The reminder service returned an invalid response.',
      response.status
    );
  }

  const record = asRecord(data);
  if (!response.ok || record?.success !== true) {
    throw new RecommendationReminderApiError(
      getSafeApiMessage(data) ??
        'Could not manage this reminder. Please try again.',
      response.status
    );
  }
  if (!record) {
    throw new RecommendationReminderApiError(
      'The reminder service returned an invalid response.',
      response.status
    );
  }
  return record;
};

export class RecommendationReminderApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'RecommendationReminderApiError';
    this.status = status;
  }
}

export const buildRecommendationReminderUrl = (
  recommendationId: string,
  apiBaseUrl = DEFAULT_API_BASE_URL
) =>
  `${apiBaseUrl.replace(/\/$/, '')}/recommend-market/saved/${encodeURIComponent(
    normalizeRecommendationId(recommendationId)
  )}/reminder`;

export const getRecommendationReminder = async (
  recommendationId: string,
  token: string,
  config: RecommendationReminderApiConfig = {}
): Promise<RecommendationReminder | null> => {
  const record = await requestJson(
    buildRecommendationReminderUrl(recommendationId, config.apiBaseUrl),
    token,
    'GET',
    config
  );
  return record.reminder === null ? null : parseReminder(record.reminder);
};

export const scheduleRecommendationReminder = async (
  recommendationId: string,
  scheduledFor: string,
  token: string,
  config: RecommendationReminderApiConfig = {}
): Promise<RecommendationReminder> => {
  const record = await requestJson(
    buildRecommendationReminderUrl(recommendationId, config.apiBaseUrl),
    token,
    'PUT',
    config,
    scheduledFor
  );
  return parseReminder(record.reminder);
};

export const cancelRecommendationReminder = async (
  recommendationId: string,
  token: string,
  config: RecommendationReminderApiConfig = {}
): Promise<null> => {
  const record = await requestJson(
    buildRecommendationReminderUrl(recommendationId, config.apiBaseUrl),
    token,
    'DELETE',
    config
  );
  if (record.reminder !== null) {
    throw new RecommendationReminderApiError(
      'The reminder service returned an invalid cancellation response.'
    );
  }
  return null;
};

export const getRecommendationReminderErrorMessage = (
  error: unknown,
  fallback = 'Could not schedule this reminder. Please try again.'
) => {
  if (error instanceof RecommendationReminderApiError) {
    if (error.status === 400) {
      return 'The selected time must be in the future.';
    }
    if (error.status === 401) {
      return 'Please sign in again to manage this reminder.';
    }
    if (error.status === 403) {
      return 'Farmer access is required to manage reminders.';
    }
    if (error.status === 404) return 'Saved recommendation not found.';
  }
  return fallback;
};
