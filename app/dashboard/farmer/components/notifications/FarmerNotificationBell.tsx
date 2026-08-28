'use client';

import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import {
  getNotificationErrorMessage,
  getNotifications,
  markNotificationRead,
  type FarmerNotification,
} from './notificationApi';
import {
  decrementUnreadCount,
  formatNotificationDate,
  formatNotificationName,
  getNotificationBellLabel,
  getNotificationTypeLabel,
  getSavedRecommendationPath,
  getUnreadBadgeLabel,
  markNotificationReadLocally,
} from './notificationPresentation';

type FarmerNotificationBellProps = {
  placement: 'desktop' | 'mobile';
};

type LoadStatus = 'loading' | 'ready' | 'error' | 'missing-token';

const PANEL_ID = 'farmer-notifications-panel';
const PANEL_HEADING_ID = 'farmer-notifications-heading';

export default function FarmerNotificationBell({
  placement,
}: FarmerNotificationBellProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const markRequestsInFlight = useRef(new Set<string>());
  const [isOpen, setIsOpen] = useState(false);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<FarmerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set());

  const loadNotifications = useCallback(async (signal?: AbortSignal) => {
    const token = localStorage.getItem('token')?.trim();
    if (!token) {
      setLoadStatus('missing-token');
      setLoadError('Please sign in again to view notifications.');
      return;
    }

    setLoadStatus('loading');
    setLoadError(null);

    try {
      const response = await getNotifications(token, { signal });
      setNotifications(response.notifications);
      setUnreadCount(response.unread_count);
      setLoadStatus('ready');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setLoadError(getNotificationErrorMessage(error));
      setLoadStatus('error');
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadNotifications(controller.signal);
    return () => controller.abort();
  }, [loadNotifications]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const navigateToRecommendation = (
    notification: FarmerNotification,
    event?: ReactMouseEvent<HTMLButtonElement>
  ) => {
    event?.preventDefault();
    setIsOpen(false);
    router.push(getSavedRecommendationPath(notification.recommendation_id));
  };

  const handleNotificationClick = async (
    notification: FarmerNotification,
    event: ReactMouseEvent<HTMLButtonElement>
  ) => {
    if (notification.is_read) {
      navigateToRecommendation(notification, event);
      return;
    }
    if (markRequestsInFlight.current.has(notification.id)) return;

    const token = localStorage.getItem('token')?.trim();
    if (!token) {
      navigateToRecommendation(notification, event);
      return;
    }

    markRequestsInFlight.current.add(notification.id);
    setMarkingIds((current) => new Set(current).add(notification.id));

    try {
      const markedNotification = await markNotificationRead(
        notification.id,
        token
      );
      setNotifications((current) =>
        markNotificationReadLocally(
          current,
          notification.id,
          markedNotification.read_at
        )
      );
      setUnreadCount(decrementUnreadCount);
    } catch {
      // Navigation remains available; the backend stays authoritative on retry.
    } finally {
      markRequestsInFlight.current.delete(notification.id);
      setMarkingIds((current) => {
        const next = new Set(current);
        next.delete(notification.id);
        return next;
      });
      navigateToRecommendation(notification, event);
    }
  };

  const badgeLabel = getUnreadBadgeLabel(unreadCount);
  const panelPosition =
    placement === 'mobile'
      ? 'fixed inset-x-3 top-16 max-h-[calc(100dvh-5rem)] w-auto'
      : 'absolute left-full top-0 ml-3 max-h-[min(30rem,calc(100dvh-2rem))] w-96';

  return (
    <div
      ref={containerRef}
      data-notification-placement={placement}
      className={placement === 'mobile' ? 'fixed right-4 top-4 z-[60]' : 'relative'}
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={getNotificationBellLabel(unreadCount)}
        aria-expanded={isOpen}
        aria-controls={PANEL_ID}
        className="relative inline-flex size-11 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-800 shadow-lg shadow-emerald-950/10 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
      >
        <svg
          className="size-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .53-.21 1.04-.59 1.41L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {badgeLabel && (
          <span
            aria-hidden="true"
            className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white"
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          id={PANEL_ID}
          role="dialog"
          aria-labelledby={PANEL_HEADING_ID}
          className={`${panelPosition} z-[70] flex overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-[0_24px_80px_-28px_rgba(15,23,42,0.4)]`}
        >
          <div className="flex min-h-0 w-full flex-col">
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 bg-emerald-50/60 px-4 py-3.5">
              <div>
                <h2
                  id={PANEL_HEADING_ID}
                  className="font-black text-emerald-950"
                >
                  Notifications
                </h2>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  Sell Advisor reminders
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close notifications"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </header>

            <div className="min-h-0 overflow-y-auto overscroll-contain">
              {loadStatus === 'loading' && notifications.length === 0 && (
                <div
                  role="status"
                  aria-busy="true"
                  className="flex items-center gap-3 px-4 py-6 text-sm font-semibold text-slate-600"
                >
                  <span
                    className="size-4 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700 motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  Loading notifications...
                </div>
              )}

              {loadError && (
                <div className="border-b border-rose-100 bg-rose-50 px-4 py-4">
                  <p role="alert" className="text-sm font-semibold text-rose-800">
                    {loadError}
                  </p>
                  {loadStatus === 'error' && (
                    <button
                      type="button"
                      onClick={() => void loadNotifications()}
                      className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg border border-rose-200 bg-white px-3 text-xs font-black text-rose-800 hover:bg-rose-100"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}

              {loadStatus === 'ready' && notifications.length === 0 && (
                <div className="px-5 py-9 text-center">
                  <p className="font-black text-slate-900">
                    No notifications yet
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Saved recommendation reminders will appear here when their
                    target period approaches.
                  </p>
                </div>
              )}

              {notifications.length > 0 && (
                <div aria-label="Notification list" className="divide-y divide-slate-100">
                  {notifications.map((notification) => {
                    const isMarking = markingIds.has(notification.id);
                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={(event) =>
                          void handleNotificationClick(notification, event)
                        }
                        disabled={isMarking}
                        aria-label={`${notification.title}, ${
                          notification.is_read ? 'read' : 'unread'
                        }`}
                        className={`block w-full px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600 disabled:cursor-wait ${
                          notification.is_read
                            ? 'bg-white hover:bg-slate-50'
                            : 'bg-emerald-50/45 hover:bg-emerald-50'
                        }`}
                      >
                        <span className="flex items-start gap-3">
                          <span
                            className={`mt-1.5 size-2.5 shrink-0 rounded-full ${
                              notification.is_read
                                ? 'border border-slate-300 bg-white'
                                : 'bg-emerald-600 ring-4 ring-emerald-100'
                            }`}
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span
                                className={`break-words text-sm text-slate-950 ${
                                  notification.is_read
                                    ? 'font-semibold'
                                    : 'font-black'
                                }`}
                              >
                                {notification.title}
                              </span>
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-900">
                                {getNotificationTypeLabel(notification.type)}
                              </span>
                            </span>
                            <span className="mt-1.5 block break-words text-xs leading-5 text-slate-600">
                              {notification.message}
                            </span>
                            <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-slate-500">
                              <span>
                                {formatNotificationName(
                                  notification.recommendation.crop
                                )}{' '}
                                ·{' '}
                                {formatNotificationName(
                                  notification.recommendation.farmer_district
                                )}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>
                                {formatNotificationDate(
                                  notification.scheduled_for
                                )}
                              </span>
                              <span className="sr-only">
                                {notification.is_read ? 'Read' : 'Unread'}
                              </span>
                              {!notification.is_read && (
                                <span className="rounded bg-emerald-700 px-1.5 py-0.5 font-black text-white">
                                  {isMarking ? 'Opening...' : 'Unread'}
                                </span>
                              )}
                            </span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
