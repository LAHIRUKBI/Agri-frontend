import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const apiModule = await import(
  '../app/dashboard/farmer/components/notifications/notificationApi' + '.ts'
);
const presentationModule = await import(
  '../app/dashboard/farmer/components/notifications/notificationPresentation' +
    '.ts'
);

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), 'utf8');

const apiSource = await readSource(
  '../app/dashboard/farmer/components/notifications/notificationApi.ts'
);
const bellSource = await readSource(
  '../app/dashboard/farmer/components/notifications/FarmerNotificationBell.tsx'
);
const presentationSource = await readSource(
  '../app/dashboard/farmer/components/notifications/notificationPresentation.ts'
);
const farmerNavigationSource = await readSource(
  '../app/navigation/farmer/page.tsx'
);
const savedListSource = await readSource(
  '../app/dashboard/farmer/recommendations/page.tsx'
);
const savedDetailSource = await readSource(
  '../app/dashboard/farmer/recommendations/[id]/page.tsx'
);
const savedApiSource = await readSource(
  '../app/dashboard/farmer/recommendations/savedRecommendationsApi.ts'
);
const stageSixScreenSource = await readSource(
  '../app/dashboard/farmer/prediction/components/sell-advisor/SellAdvisorResultScreen.tsx'
);
const stageSixSaveSource = await readSource(
  '../app/dashboard/farmer/prediction/saveRecommendation.ts'
);

const notification = {
  id: 'notification/abc 123',
  recommendation_id: 'saved/recommendation 456',
  type: 'RECOMMENDATION_DUE_SOON',
  title: 'Beans recommendation due tomorrow',
  message:
    'Your saved recommendation for Kandy reaches its next market period tomorrow. Check current buyer prices and market conditions before deciding.',
  scheduled_for: '2026-08-27T08:30:00.000Z',
  delivered_at: '2026-08-27T08:30:00.000Z',
  read_at: null,
  is_read: false,
  created_at: '2026-08-20T10:00:00.000Z',
  recommendation: {
    crop: 'beans',
    farmer_district: 'kandy',
    recommended_market: 'kandy',
    prediction_target_date: '2026-08-28T00:00:00.000Z',
  },
} as const;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

test('notifications request uses GET with JWT and no ownership data', async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const response = await apiModule.getNotifications('jwt-notifications', {
    apiBaseUrl: 'http://localhost:5000/api/',
    fetcher: async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ url: String(input), init });
      return jsonResponse({
        success: true,
        unread_count: 1,
        notifications: [notification],
      });
    },
  });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'http://localhost:5000/api/notifications');
  assert.equal(requests[0].init?.method, 'GET');
  assert.equal(
    new Headers(requests[0].init?.headers).get('Authorization'),
    'Bearer jwt-notifications'
  );
  assert.equal(requests[0].init?.body, undefined);
  assert.equal(response.notifications[0].id, notification.id);
  assert.doesNotMatch(JSON.stringify(requests[0]), /user_id|owner/i);
});

test('backend unread_count remains authoritative instead of being recomputed', async () => {
  const response = await apiModule.getNotifications('jwt', {
    fetcher: async () =>
      jsonResponse({
        success: true,
        unread_count: 7,
        notifications: [notification],
      }),
  });

  assert.equal(response.unread_count, 7);
  assert.equal(response.notifications.length, 1);
  assert.match(bellSource, /setUnreadCount\(response\.unread_count\)/);
});

test('custom recommendation reminders use the existing bell contract', async () => {
  const customNotification = {
    ...notification,
    type: 'RECOMMENDATION_CUSTOM',
    title: 'Recommendation reminder',
    message: 'Review your saved Beans recommendation for Kandy.',
  } as const;
  const response = await apiModule.getNotifications('jwt', {
    fetcher: async () =>
      jsonResponse({
        success: true,
        unread_count: 1,
        notifications: [customNotification],
      }),
  });

  assert.equal(response.notifications[0].type, 'RECOMMENDATION_CUSTOM');
  assert.equal(
    presentationModule.getNotificationTypeLabel(
      response.notifications[0].type
    ),
    'Reminder'
  );
  assert.equal(
    presentationModule.getSavedRecommendationPath(
      response.notifications[0].recommendation_id
    ),
    '/dashboard/farmer/recommendations/saved%2Frecommendation%20456'
  );
});

test('mark read uses one authenticated PATCH with encoded ID and no body', async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const marked = await apiModule.markNotificationRead(
    notification.id,
    'jwt-read',
    {
      apiBaseUrl: 'http://localhost:5000/api',
      fetcher: async (input: RequestInfo | URL, init?: RequestInit) => {
        requests.push({ url: String(input), init });
        return jsonResponse({
          success: true,
          notification: {
            id: notification.id,
            recommendation_id: notification.recommendation_id,
            type: notification.type,
            read_at: '2026-08-27T09:00:00.000Z',
            delivered_at: notification.delivered_at,
          },
        });
      },
    }
  );

  assert.equal(requests.length, 1);
  assert.equal(
    requests[0].url,
    'http://localhost:5000/api/notifications/notification%2Fabc%20123/read'
  );
  assert.equal(requests[0].init?.method, 'PATCH');
  assert.equal(
    new Headers(requests[0].init?.headers).get('Authorization'),
    'Bearer jwt-read'
  );
  assert.equal(requests[0].init?.body, undefined);
  assert.equal(marked.read_at, '2026-08-27T09:00:00.000Z');
  assert.doesNotMatch(JSON.stringify(requests[0]), /user_id|owner/i);
});

test('missing token blocks both notification API requests', async () => {
  let fetchCount = 0;
  const fetcher = async () => {
    fetchCount += 1;
    return jsonResponse({ success: true });
  };

  await assert.rejects(
    () => apiModule.getNotifications('   ', { fetcher }),
    /sign in/i
  );
  await assert.rejects(
    () => apiModule.markNotificationRead(notification.id, '', { fetcher }),
    /sign in/i
  );
  assert.equal(fetchCount, 0);
  assert.match(bellSource, /localStorage\.getItem\('token'\)/);
});

test('401 and 403 responses use controlled farmer-facing messages', async () => {
  for (const [status, message] of [
    [401, 'Please sign in again to view notifications.'],
    [403, 'Farmer access is required to view notifications.'],
  ] as const) {
    let error: unknown;
    try {
      await apiModule.getNotifications('jwt', {
        fetcher: async () => jsonResponse({ success: false }, status),
      });
    } catch (caught) {
      error = caught;
    }
    assert.equal(apiModule.getNotificationErrorMessage(error), message);
  }
});

test('malformed and network notification responses fail safely', async () => {
  await assert.rejects(
    () =>
      apiModule.getNotifications('jwt', {
        fetcher: async () => jsonResponse({ success: true, notifications: [] }),
      }),
    /invalid response/i
  );
  await assert.rejects(
    () =>
      apiModule.getNotifications('jwt', {
        fetcher: async () => {
          throw new TypeError('network details');
        },
      }),
    /Could not load notifications/i
  );
});

test('unknown backend fields are ignored rather than exposed', async () => {
  const response = await apiModule.getNotifications('jwt', {
    fetcher: async () =>
      jsonResponse({
        success: true,
        unread_count: 1,
        notifications: [
          {
            ...notification,
            fingerprint: 'internal-value',
            user_id: 'hidden-owner',
            recommendation: {
              ...notification.recommendation,
              internal_note: 'hidden',
            },
          },
        ],
      }),
  });

  assert.equal('fingerprint' in response.notifications[0], false);
  assert.equal('user_id' in response.notifications[0], false);
  assert.equal(
    'internal_note' in response.notifications[0].recommendation,
    false
  );
});

test('badge and accessible bell labels handle zero, normal, and 9+ counts', () => {
  assert.equal(presentationModule.getUnreadBadgeLabel(0), null);
  assert.equal(presentationModule.getUnreadBadgeLabel(2), '2');
  assert.equal(presentationModule.getUnreadBadgeLabel(10), '9+');
  assert.equal(presentationModule.getNotificationBellLabel(0), 'Notifications');
  assert.equal(
    presentationModule.getNotificationBellLabel(12),
    'Notifications, 12 unread'
  );
});

test('notification presentation uses neutral due labels and simple dates', () => {
  assert.equal(
    presentationModule.getNotificationTypeLabel('RECOMMENDATION_DUE_SOON'),
    'Due soon'
  );
  assert.equal(
    presentationModule.getNotificationTypeLabel('RECOMMENDATION_DUE'),
    'Due'
  );
  assert.equal(
    presentationModule.getNotificationTypeLabel('RECOMMENDATION_CUSTOM'),
    'Reminder'
  );
  const date = presentationModule.formatNotificationDate(
    '2026-08-27T08:30:00.000Z',
    new Date('2026-08-01T00:00:00.000Z')
  );
  assert.match(date, /27/);
  assert.match(date, /Aug/i);
  assert.equal(
    presentationModule.getSavedRecommendationPath('saved/id 1'),
    '/dashboard/farmer/recommendations/saved%2Fid%201'
  );
});

test('confirmed local read update changes one item and decrements once safely', () => {
  const secondNotification = {
    ...notification,
    id: 'already-read',
    is_read: true,
    read_at: '2026-08-27T08:45:00.000Z',
  };
  const updated = presentationModule.markNotificationReadLocally(
    [notification, secondNotification],
    notification.id,
    '2026-08-27T09:00:00.000Z'
  );

  assert.equal(updated[0].is_read, true);
  assert.equal(updated[0].read_at, '2026-08-27T09:00:00.000Z');
  assert.equal(updated[1], secondNotification);
  assert.equal(presentationModule.decrementUnreadCount(2), 1);
  assert.equal(presentationModule.decrementUnreadCount(0), 0);
});

test('bell is an accessible button with toggled compact responsive panel', () => {
  assert.match(bellSource, /<button[\s\S]*?aria-label=\{getNotificationBellLabel/);
  assert.match(bellSource, /aria-expanded=\{isOpen\}/);
  assert.match(bellSource, /aria-controls=\{PANEL_ID\}/);
  assert.match(bellSource, /role="dialog"/);
  assert.match(bellSource, /aria-labelledby=\{PANEL_HEADING_ID\}/);
  assert.match(bellSource, /setIsOpen\(\(open\) => !open\)/);
  assert.match(bellSource, /inset-x-3 top-16/);
  assert.match(bellSource, /w-96/);
  assert.match(bellSource, /overflow-y-auto/);
});

test('panel covers loading, empty, error, retry, title, message, and context', () => {
  for (const text of [
    'Loading notifications...',
    'No notifications yet',
    'Saved recommendation reminders will appear here',
    'Retry',
    'notification.title',
    'notification.message',
    'notification.recommendation.crop',
    'notification.recommendation.farmer_district',
    'notification.scheduled_for',
  ]) {
    assert.match(bellSource, new RegExp(text.replace('.', '\\.')));
  }
  assert.match(bellSource, /notification\.is_read \? 'read' : 'unread'/);
  assert.match(bellSource, /isMarking \? 'Opening\.\.\.' : 'Unread'/);
});

test('read interaction is backend-confirmed with per-item duplicate protection', () => {
  const alreadyReadPosition = bellSource.indexOf('if (notification.is_read)');
  const inFlightPosition = bellSource.indexOf(
    'markRequestsInFlight.current.has(notification.id)'
  );
  const patchPosition = bellSource.indexOf('await markNotificationRead(');
  const localReadPosition = bellSource.indexOf('markNotificationReadLocally(');
  const decrementPosition = bellSource.indexOf(
    'setUnreadCount(decrementUnreadCount)'
  );
  const catchPosition = bellSource.indexOf('} catch {', patchPosition);

  assert.ok(alreadyReadPosition >= 0 && alreadyReadPosition < patchPosition);
  assert.ok(inFlightPosition >= 0 && inFlightPosition < patchPosition);
  assert.ok(patchPosition >= 0 && patchPosition < localReadPosition);
  assert.ok(localReadPosition < catchPosition);
  assert.ok(decrementPosition < catchPosition);
  assert.match(bellSource, /markRequestsInFlight\.current\.add/);
  assert.match(bellSource, /markRequestsInFlight\.current\.delete/);
  assert.match(bellSource, /disabled=\{isMarking\}/);
});

test('PATCH failure retains unread state while navigation remains available', () => {
  const patchPosition = bellSource.indexOf('await markNotificationRead(');
  const catchPosition = bellSource.indexOf('} catch {', patchPosition);
  const finallyPosition = bellSource.indexOf('} finally {', catchPosition);
  const navigationPosition = bellSource.indexOf(
    'navigateToRecommendation(notification, event);',
    finallyPosition
  );

  assert.ok(patchPosition >= 0);
  assert.ok(catchPosition > patchPosition);
  assert.ok(finallyPosition > catchPosition);
  assert.ok(navigationPosition > finallyPosition);
  assert.equal(
    bellSource.slice(catchPosition, finallyPosition).includes(
      'markNotificationReadLocally'
    ),
    false
  );
});

test('notification navigation uses recommendation_id and closes the panel', () => {
  assert.match(
    bellSource,
    /getSavedRecommendationPath\(notification\.recommendation_id\)/
  );
  assert.match(bellSource, /setIsOpen\(false\);[\s\S]*?router\.push/);
  assert.doesNotMatch(
    presentationSource,
    /crop[\s\S]{0,80}recommendations|recommended_market[\s\S]{0,80}recommendations/
  );
  assert.match(savedDetailSource, /getSavedRecommendation\(/);
  assert.doesNotMatch(savedDetailSource, /POST|Open-Meteo|Groq/);
});

test('one reusable bell is integrated for desktop and mobile farmer navigation', () => {
  assert.match(
    farmerNavigationSource,
    /import FarmerNotificationBell from '@\/app\/dashboard\/farmer\/components\/notifications\/FarmerNotificationBell'/
  );
  assert.match(
    farmerNavigationSource,
    /<FarmerNotificationBell placement="mobile" \/>/
  );
  assert.match(
    farmerNavigationSource,
    /<FarmerNotificationBell placement="desktop" \/>/
  );
  assert.equal(
    farmerNavigationSource.match(/import FarmerNotificationBell/g)?.length,
    1
  );
});

test('notification UI adds no push, email, inference, or action-policy logic', () => {
  const notificationSources = `${apiSource}\n${bellSource}\n${presentationSource}`;
  assert.doesNotMatch(
    notificationSources,
    /Notification\.requestPermission|ServiceWorker|PushManager|firebase|Resend|SendGrid|Nodemailer/i
  );
  assert.doesNotMatch(
    notificationSources,
    /POST\s*\/api\/recommend-market|Open-Meteo|Groq|SELL_NOW|SELL NOW|['"`]WAIT['"`]|>\s*WAIT\s*<|['"`]HOLD['"`]|>\s*HOLD\s*</i
  );
});

test('frontend trusts backend due/archive filtering without local eligibility logic', () => {
  const notificationSources = `${apiSource}\n${bellSource}\n${presentationSource}`;
  assert.doesNotMatch(notificationSources, /Date\.now\(\)/);
  assert.doesNotMatch(notificationSources, /ARCHIVED/);
  assert.doesNotMatch(notificationSources, /recommendation\.status/);
  assert.doesNotMatch(notificationSources, /scheduled_for\s*<=/);
  assert.match(bellSource, /notifications\.map\(/);
});

test('Stage 6 and Stage 7 persistence, list, detail, and archive flows remain intact', () => {
  assert.match(stageSixScreenSource, /'Save Recommendation'/);
  assert.match(stageSixSaveSource, /method: 'POST'/);
  assert.match(stageSixSaveSource, /prediction_target_date/);
  assert.match(savedListSource, /getSavedRecommendations\(/);
  assert.match(savedDetailSource, /recommendation_snapshot/);
  assert.match(savedDetailSource, /getSnapshotWeatherForecast/);
  assert.match(savedApiSource, /archiveSavedRecommendation/);
  assert.match(savedApiSource, /method: 'GET' \| 'DELETE'/);
});
