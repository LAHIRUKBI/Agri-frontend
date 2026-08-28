import type {
  FarmerNotification,
  FarmerNotificationType,
} from './notificationApi';

export const getUnreadBadgeLabel = (unreadCount: number): string | null => {
  if (unreadCount <= 0) return null;
  return unreadCount > 9 ? '9+' : String(unreadCount);
};

export const getNotificationBellLabel = (unreadCount: number) =>
  unreadCount > 0
    ? `Notifications, ${unreadCount} unread`
    : 'Notifications';

export const getNotificationTypeLabel = (
  type: FarmerNotificationType
): 'Due soon' | 'Due' | 'Reminder' => {
  if (type === 'RECOMMENDATION_CUSTOM') return 'Reminder';
  return type === 'RECOMMENDATION_DUE_SOON' ? 'Due soon' : 'Due';
};

export const formatNotificationName = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

export const formatNotificationDate = (
  value: string,
  now = new Date()
): string => {
  const scheduledDate = new Date(value);
  if (Number.isNaN(scheduledDate.getTime())) return 'Date unavailable';

  try {
    return new Intl.DateTimeFormat('en-LK', {
      day: 'numeric',
      month: 'short',
      ...(scheduledDate.getFullYear() !== now.getFullYear()
        ? { year: 'numeric' as const }
        : {}),
      hour: 'numeric',
      minute: '2-digit',
    }).format(scheduledDate);
  } catch {
    return 'Date unavailable';
  }
};

export const getSavedRecommendationPath = (recommendationId: string) =>
  `/dashboard/farmer/recommendations/${encodeURIComponent(
    recommendationId.trim()
  )}`;

export const markNotificationReadLocally = (
  notifications: FarmerNotification[],
  notificationId: string,
  readAt: string
) =>
  notifications.map((notification) =>
    notification.id === notificationId && !notification.is_read
      ? { ...notification, is_read: true, read_at: readAt }
      : notification
  );

export const decrementUnreadCount = (unreadCount: number) =>
  Math.max(0, unreadCount - 1);
