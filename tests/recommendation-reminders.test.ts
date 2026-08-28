import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const apiModule = await import(
  '../app/dashboard/farmer/recommendations/recommendationReminderApi' + '.ts'
);
const reminderPresentation = await import(
  '../app/dashboard/farmer/recommendations/recommendationReminderPresentation' +
    '.ts'
);
const savedPresentation = await import(
  '../app/dashboard/farmer/recommendations/savedRecommendationPresentation' +
    '.ts'
);

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), 'utf8');

const apiSource = await readSource(
  '../app/dashboard/farmer/recommendations/recommendationReminderApi.ts'
);
const presentationSource = await readSource(
  '../app/dashboard/farmer/recommendations/recommendationReminderPresentation.ts'
);
const modalSource = await readSource(
  '../app/dashboard/farmer/recommendations/components/ScheduleRecommendationReminderModal.tsx'
);
const controlsSource = await readSource(
  '../app/dashboard/farmer/recommendations/components/RecommendationReminderControls.tsx'
);
const listSource = await readSource(
  '../app/dashboard/farmer/recommendations/page.tsx'
);
const cardSource = await readSource(
  '../app/dashboard/farmer/recommendations/components/SavedRecommendationCard.tsx'
);
const detailSource = await readSource(
  '../app/dashboard/farmer/recommendations/[id]/page.tsx'
);
const savedApiSource = await readSource(
  '../app/dashboard/farmer/recommendations/savedRecommendationsApi.ts'
);

const reminder = {
  id: 'reminder/abc 123',
  type: 'RECOMMENDATION_CUSTOM',
  scheduled_for: '2026-09-04T03:30:00.000Z',
} as const;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

test('GET reminder uses the owned saved-recommendation endpoint without a user ID', async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const result = await apiModule.getRecommendationReminder(
    'saved/id 1',
    'jwt-reminder',
    {
      apiBaseUrl: 'http://localhost:5000/api/',
      fetcher: async (input: RequestInfo | URL, init?: RequestInit) => {
        requests.push({ url: String(input), init });
        return jsonResponse({ success: true, reminder });
      },
    }
  );

  assert.deepEqual(result, reminder);
  assert.equal(requests.length, 1);
  assert.equal(
    requests[0].url,
    'http://localhost:5000/api/recommend-market/saved/saved%2Fid%201/reminder'
  );
  assert.equal(requests[0].init?.method, 'GET');
  assert.equal(requests[0].init?.body, undefined);
  assert.equal(
    new Headers(requests[0].init?.headers).get('Authorization'),
    'Bearer jwt-reminder'
  );
  assert.doesNotMatch(JSON.stringify(requests[0]), /user_id|owner/i);
});

test('PUT sends only scheduled_for and returns the custom reminder', async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const result = await apiModule.scheduleRecommendationReminder(
    'saved-1',
    reminder.scheduled_for,
    'jwt-reminder',
    {
      fetcher: async (input: RequestInfo | URL, init?: RequestInit) => {
        requests.push({ url: String(input), init });
        return jsonResponse({ success: true, reminder });
      },
    }
  );

  assert.deepEqual(result, reminder);
  assert.equal(requests[0].init?.method, 'PUT');
  assert.deepEqual(JSON.parse(String(requests[0].init?.body)), {
    scheduled_for: reminder.scheduled_for,
  });
  assert.equal(
    new Headers(requests[0].init?.headers).get('Content-Type'),
    'application/json'
  );
  assert.doesNotMatch(
    String(requests[0].init?.body),
    /user|recommendation|type|read|delivered/i
  );
});

test('DELETE is bodyless and accepts the idempotent null response', async () => {
  const requests: RequestInit[] = [];
  const result = await apiModule.cancelRecommendationReminder(
    'saved-1',
    'jwt-reminder',
    {
      fetcher: async (_input: RequestInfo | URL, init?: RequestInit) => {
        requests.push(init ?? {});
        return jsonResponse({ success: true, reminder: null });
      },
    }
  );

  assert.equal(result, null);
  assert.equal(requests[0].method, 'DELETE');
  assert.equal(requests[0].body, undefined);
});

test('missing token blocks all reminder calls before fetch', async () => {
  let fetchCount = 0;
  const fetcher = async () => {
    fetchCount += 1;
    return jsonResponse({ success: true, reminder: null });
  };

  await assert.rejects(
    () => apiModule.getRecommendationReminder('saved-1', ' ', { fetcher }),
    /sign in/i
  );
  await assert.rejects(
    () =>
      apiModule.scheduleRecommendationReminder(
        'saved-1',
        reminder.scheduled_for,
        '',
        { fetcher }
      ),
    /sign in/i
  );
  await assert.rejects(
    () => apiModule.cancelRecommendationReminder('saved-1', '', { fetcher }),
    /sign in/i
  );
  assert.equal(fetchCount, 0);
});

test('400, 401, 403, 404, and 500 use controlled seller-friendly messages', async () => {
  const errorFor = async (status: number) => {
    try {
      await apiModule.scheduleRecommendationReminder(
        'saved-1',
        reminder.scheduled_for,
        'jwt',
        {
          fetcher: async () =>
            jsonResponse(
              { success: false, message: 'internal database detail' },
              status
            ),
        }
      );
    } catch (error) {
      return error;
    }
    assert.fail('Expected request to fail');
  };

  assert.equal(
    apiModule.getRecommendationReminderErrorMessage(await errorFor(400)),
    'The selected time must be in the future.'
  );
  assert.match(
    apiModule.getRecommendationReminderErrorMessage(await errorFor(401)),
    /sign in/i
  );
  assert.match(
    apiModule.getRecommendationReminderErrorMessage(await errorFor(403)),
    /Farmer access/i
  );
  assert.equal(
    apiModule.getRecommendationReminderErrorMessage(await errorFor(404)),
    'Saved recommendation not found.'
  );
  assert.equal(
    apiModule.getRecommendationReminderErrorMessage(
      await errorFor(500),
      'Could not schedule this reminder. Please try again.'
    ),
    'Could not schedule this reminder. Please try again.'
  );
});

test('local date and time round-trip through ISO without a hard-coded timezone', () => {
  const iso = reminderPresentation.localDateTimeToIso('2026-09-04', '09:00');
  assert.ok(iso);
  assert.deepEqual(reminderPresentation.toLocalDateTimeParts(iso), {
    date: '2026-09-04',
    time: '09:00',
  });
  assert.doesNotMatch(presentationSource, /\+05:30|Asia\/Colombo/);
  assert.match(presentationSource, /toISOString\(\)/);

  const display = savedPresentation.formatReminderDateTime(iso);
  assert.match(display, /2026/);
  assert.match(display, /9:00|09:00/);
});

test('list contract carries reminder summaries and avoids an N+1 GET pattern', () => {
  assert.match(savedApiSource, /reminder: RecommendationReminder \| null/);
  assert.match(savedApiSource, /reminder: parseReminder\(record\.reminder/);
  assert.match(cardSource, /reminder=\{recommendation\.reminder\}/);
  assert.doesNotMatch(listSource, /getRecommendationReminder\(/);
  assert.equal(
    listSource.match(/getSavedRecommendations\(/g)?.length,
    1
  );
});

test('card and detail expose schedule, reschedule, and confirmed cancellation states', () => {
  assert.match(cardSource, /<RecommendationReminderControls/);
  assert.match(detailSource, /<RecommendationReminderControls/);
  assert.match(controlsSource, /Schedule Notification/);
  assert.match(controlsSource, /'Reschedule' : 'Change'/);
  assert.match(controlsSource, /Reschedule/);
  assert.match(controlsSource, /Cancel this reminder\?/);
  assert.match(controlsSource, /Keep reminder/);
  assert.match(controlsSource, /Cancel reminder/);
  assert.match(controlsSource, /await cancelRecommendationReminder/);
  assert.match(controlsSource, /onReminderChange\(null\)/);
  assert.match(detailSource, /current \? \{ \.\.\.current, reminder \}/);
});

test('modal has native date/time fields, future validation, presets, and duplicate-submit protection', () => {
  assert.match(modalSource, /Schedule notification/);
  assert.match(
    modalSource,
    /Choose when you want to be reminded to review this\s+recommendation/
  );
  assert.match(modalSource, /type="date"/);
  assert.match(modalSource, /type="time"/);
  assert.match(modalSource, /The selected time must be in the future/);
  assert.match(modalSource, /Date\.now\(\)/);
  assert.match(modalSource, /saveInFlight\.current/);
  assert.match(modalSource, /disabled=\{isSaving\}/);
  assert.match(modalSource, /Tomorrow/);
  assert.match(modalSource, /In 3 days/);
  assert.match(modalSource, /In 7 days/);
  assert.match(modalSource, /Save new time/);
  assert.match(modalSource, /Schedule reminder/);
});

test('reminder frontend adds no push, email, SMS, cron, or polling path', () => {
  const sources = `${apiSource}\n${modalSource}\n${controlsSource}`;
  assert.doesNotMatch(
    sources,
    /Notification\.requestPermission|ServiceWorker|PushManager|firebase|email|SMS|cron|setInterval/i
  );
});
