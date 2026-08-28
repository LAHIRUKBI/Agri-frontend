export type FarmerNotificationType =
  | 'RECOMMENDATION_DUE_SOON'
  | 'RECOMMENDATION_DUE'
  | 'RECOMMENDATION_CUSTOM';

export type NotificationRecommendationSummary = {
  crop: string;
  farmer_district: string;
  recommended_market: string;
  prediction_target_date: string;
};

export type FarmerNotification = {
  id: string;
  recommendation_id: string;
  type: FarmerNotificationType;
  title: string;
  message: string;
  scheduled_for: string;
  delivered_at: string | null;
  read_at: string | null;
  is_read: boolean;
  created_at: string;
  recommendation: NotificationRecommendationSummary;
};

export type NotificationsResponse = {
  unread_count: number;
  notifications: FarmerNotification[];
};

export type MarkedNotificationRead = {
  id: string;
  recommendation_id: string;
  type: FarmerNotificationType;
  read_at: string;
  delivered_at: string | null;
};

type NotificationApiConfig = {
  apiBaseUrl?: string;
  fetcher?: typeof fetch;
  signal?: AbortSignal;
};

type JsonRecord = Record<string, unknown>;

const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const NOTIFICATION_TYPES = new Set<FarmerNotificationType>([
  'RECOMMENDATION_DUE_SOON',
  'RECOMMENDATION_DUE',
  'RECOMMENDATION_CUSTOM',
]);

const asRecord = (value: unknown): JsonRecord | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;

const getString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const requireString = (record: JsonRecord, field: string, context: string) => {
  const value = getString(record[field]);
  if (!value) {
    throw new NotificationApiError(
      `The ${context} response is missing ${field}.`
    );
  }
  return value;
};

const nullableString = (
  record: JsonRecord,
  field: string,
  context: string
): string | null => {
  if (record[field] === null || record[field] === undefined) return null;
  return requireString(record, field, context);
};

const requireNotificationType = (
  record: JsonRecord,
  context: string
): FarmerNotificationType => {
  const value = getString(record.type);
  if (!value || !NOTIFICATION_TYPES.has(value as FarmerNotificationType)) {
    throw new NotificationApiError(
      `The ${context} response has an invalid notification type.`
    );
  }
  return value as FarmerNotificationType;
};

const parseRecommendationSummary = (
  value: unknown
): NotificationRecommendationSummary => {
  const context = 'notification recommendation';
  const record = asRecord(value);
  if (!record) {
    throw new NotificationApiError(`The ${context} response is malformed.`);
  }

  return {
    crop: requireString(record, 'crop', context),
    farmer_district: requireString(record, 'farmer_district', context),
    recommended_market: requireString(record, 'recommended_market', context),
    prediction_target_date: requireString(
      record,
      'prediction_target_date',
      context
    ),
  };
};

const parseNotification = (value: unknown): FarmerNotification => {
  const context = 'notification';
  const record = asRecord(value);
  if (!record) {
    throw new NotificationApiError(`The ${context} response is malformed.`);
  }
  if (typeof record.is_read !== 'boolean') {
    throw new NotificationApiError(
      `The ${context} response is missing is_read.`
    );
  }

  return {
    id: requireString(record, 'id', context),
    recommendation_id: requireString(record, 'recommendation_id', context),
    type: requireNotificationType(record, context),
    title: requireString(record, 'title', context),
    message: requireString(record, 'message', context),
    scheduled_for: requireString(record, 'scheduled_for', context),
    delivered_at: nullableString(record, 'delivered_at', context),
    read_at: nullableString(record, 'read_at', context),
    is_read: record.is_read,
    created_at: requireString(record, 'created_at', context),
    recommendation: parseRecommendationSummary(record.recommendation),
  };
};

const parseMarkedNotification = (value: unknown): MarkedNotificationRead => {
  const context = 'marked notification';
  const record = asRecord(value);
  if (!record) {
    throw new NotificationApiError(`The ${context} response is malformed.`);
  }

  return {
    id: requireString(record, 'id', context),
    recommendation_id: requireString(record, 'recommendation_id', context),
    type: requireNotificationType(record, context),
    read_at: requireString(record, 'read_at', context),
    delivered_at: nullableString(record, 'delivered_at', context),
  };
};

const normalizeToken = (token: string) => {
  const normalized = token.trim();
  if (!normalized) {
    throw new NotificationApiError(
      'Please sign in again to view notifications.',
      401
    );
  }
  return normalized;
};

const normalizeNotificationId = (id: string) => {
  const normalized = id.trim();
  if (!normalized) {
    throw new NotificationApiError('Notification not found.', 404);
  }
  return normalized;
};

const getSafeApiMessage = (value: unknown) => {
  const record = asRecord(value);
  return getString(record?.message);
};

const requestJson = async (
  url: string,
  token: string,
  method: 'GET' | 'PATCH',
  config: NotificationApiConfig
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
    throw new NotificationApiError('Could not load notifications.');
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new NotificationApiError(
      'The notification service returned an invalid response.',
      response.status
    );
  }

  const record = asRecord(data);
  if (!response.ok || record?.success !== true) {
    throw new NotificationApiError(
      getSafeApiMessage(data) ?? 'Could not load notifications.',
      response.status
    );
  }
  if (!record) {
    throw new NotificationApiError(
      'The notification service returned an invalid response.',
      response.status
    );
  }

  return record;
};

export class NotificationApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'NotificationApiError';
    this.status = status;
  }
}

export const buildNotificationsUrl = (
  apiBaseUrl = DEFAULT_API_BASE_URL
) => `${apiBaseUrl.replace(/\/$/, '')}/notifications`;

export const buildMarkNotificationReadUrl = (
  id: string,
  apiBaseUrl = DEFAULT_API_BASE_URL
) =>
  `${buildNotificationsUrl(apiBaseUrl)}/${encodeURIComponent(
    normalizeNotificationId(id)
  )}/read`;

export const getNotifications = async (
  token: string,
  config: NotificationApiConfig = {}
): Promise<NotificationsResponse> => {
  const record = await requestJson(
    buildNotificationsUrl(config.apiBaseUrl),
    token,
    'GET',
    config
  );
  if (
    !Number.isInteger(record.unread_count) ||
    (record.unread_count as number) < 0 ||
    !Array.isArray(record.notifications)
  ) {
    throw new NotificationApiError(
      'The notification service returned an invalid response.'
    );
  }

  return {
    unread_count: record.unread_count as number,
    notifications: record.notifications.map(parseNotification),
  };
};

export const markNotificationRead = async (
  id: string,
  token: string,
  config: NotificationApiConfig = {}
): Promise<MarkedNotificationRead> => {
  const normalizedId = normalizeNotificationId(id);
  const record = await requestJson(
    buildMarkNotificationReadUrl(normalizedId, config.apiBaseUrl),
    token,
    'PATCH',
    config
  );
  const notification = parseMarkedNotification(record.notification);
  if (notification.id !== normalizedId) {
    throw new NotificationApiError(
      'The notification service returned an invalid read response.'
    );
  }
  return notification;
};

export const getNotificationErrorMessage = (
  error: unknown,
  fallback = 'Could not load notifications.'
) => {
  if (error instanceof NotificationApiError) {
    if (error.status === 401) {
      return 'Please sign in again to view notifications.';
    }
    if (error.status === 403) {
      return 'Farmer access is required to view notifications.';
    }
  }
  return fallback;
};
