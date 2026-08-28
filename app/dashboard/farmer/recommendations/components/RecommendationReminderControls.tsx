'use client';

import {
  BellAlertIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useRef, useState } from 'react';
import {
  cancelRecommendationReminder,
  getRecommendationReminderErrorMessage,
  type RecommendationReminder,
} from '../recommendationReminderApi';
import {
  formatReminderDate,
  formatReminderDateTime,
  formatReminderTime,
} from '../savedRecommendationPresentation';
import ScheduleRecommendationReminderModal from './ScheduleRecommendationReminderModal';

type RecommendationReminderControlsProps = {
  recommendationId: string;
  predictionTargetDate: string;
  reminder: RecommendationReminder | null;
  variant: 'compact' | 'detail';
  onReminderChange: (reminder: RecommendationReminder | null) => void;
};

export default function RecommendationReminderControls({
  recommendationId,
  predictionTargetDate,
  reminder,
  variant,
  onReminderChange,
}: RecommendationReminderControlsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelConfirmationOpen, setCancelConfirmationOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [message, setMessage] = useState<{
    kind: 'success' | 'error';
    text: string;
  } | null>(null);
  const cancelInFlight = useRef(false);

  const handleCancel = async () => {
    if (cancelInFlight.current) return;
    const token = localStorage.getItem('token')?.trim();
    if (!token) {
      setMessage({
        kind: 'error',
        text: 'Please sign in again to manage this reminder.',
      });
      return;
    }

    cancelInFlight.current = true;
    setIsCancelling(true);
    setMessage(null);
    try {
      await cancelRecommendationReminder(recommendationId, token);
      onReminderChange(null);
      setCancelConfirmationOpen(false);
      setMessage({ kind: 'success', text: 'Reminder cancelled' });
    } catch (error) {
      setMessage({
        kind: 'error',
        text: getRecommendationReminderErrorMessage(
          error,
          'Could not cancel this reminder. Please try again.'
        ),
      });
    } finally {
      cancelInFlight.current = false;
      setIsCancelling(false);
    }
  };

  const openScheduler = () => {
    setMessage(null);
    setCancelConfirmationOpen(false);
    setModalOpen(true);
  };

  return (
    <>
      <section
        aria-label="Notification reminder"
        className={
          variant === 'detail'
            ? 'rounded-[1.6rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6'
            : 'rounded-xl border border-emerald-100 bg-emerald-50/55 px-4 py-3'
        }
      >
        {reminder ? (
          <div
            className={
              variant === 'detail'
                ? 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'
                : 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
            }
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
                <BellAlertIcon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-emerald-950">
                  {variant === 'detail' ? 'Notification reminder' : 'Reminder'}
                </h3>
                {variant === 'detail' ? (
                  <dl className="mt-2 grid gap-x-5 gap-y-2 text-sm sm:grid-cols-2">
                    <div className="flex items-start gap-2">
                      <CalendarDaysIcon
                        className="mt-0.5 size-4 shrink-0 text-emerald-700"
                        aria-hidden="true"
                      />
                      <div>
                        <dt className="text-xs font-semibold text-slate-500">
                          Scheduled date
                        </dt>
                        <dd className="font-black text-slate-900">
                          {formatReminderDate(reminder.scheduled_for)}
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <ClockIcon
                        className="mt-0.5 size-4 shrink-0 text-emerald-700"
                        aria-hidden="true"
                      />
                      <div>
                        <dt className="text-xs font-semibold text-slate-500">
                          Scheduled time
                        </dt>
                        <dd className="font-black text-slate-900">
                          {formatReminderTime(reminder.scheduled_for)}
                        </dd>
                      </div>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-1 break-words text-sm font-bold text-slate-800">
                    {formatReminderDateTime(reminder.scheduled_for)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={openScheduler}
                disabled={isCancelling}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-emerald-200 bg-white px-3 text-xs font-black text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
              >
                {variant === 'detail' ? 'Reschedule' : 'Change'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCancelConfirmationOpen(true);
                  setMessage(null);
                }}
                disabled={isCancelling}
                className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-black text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              >
                {variant === 'detail' ? 'Cancel reminder' : 'Cancel'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {variant === 'detail' && (
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <BellAlertIcon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Notification reminder
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Choose a future date and time to review this recommendation.
                  </p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={openScheduler}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-800 shadow-sm hover:bg-emerald-50"
            >
              <BellAlertIcon className="size-5" aria-hidden="true" />
              Schedule Notification
            </button>
          </div>
        )}

        {cancelConfirmationOpen && reminder && (
          <div
            role="alertdialog"
            aria-labelledby={`cancel-reminder-heading-${recommendationId}`}
            aria-describedby={`cancel-reminder-description-${recommendationId}`}
            className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
          >
            <h4
              id={`cancel-reminder-heading-${recommendationId}`}
              className="text-sm font-black text-rose-950"
            >
              Cancel this reminder?
            </h4>
            <p
              id={`cancel-reminder-description-${recommendationId}`}
              className="mt-1 text-xs leading-5 text-rose-900"
            >
              You will stop receiving this scheduled notification for this
              recommendation.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCancelConfirmationOpen(false)}
                disabled={isCancelling}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-rose-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-rose-100 disabled:opacity-50"
              >
                Keep reminder
              </button>
              <button
                type="button"
                onClick={() => void handleCancel()}
                disabled={isCancelling}
                aria-busy={isCancelling}
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-rose-700 px-3 text-xs font-bold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel reminder'}
              </button>
            </div>
          </div>
        )}

        {message && (
          <p
            role={message.kind === 'error' ? 'alert' : 'status'}
            className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
              message.kind === 'error'
                ? 'bg-rose-50 text-rose-700'
                : 'bg-white text-emerald-800'
            }`}
          >
            {message.kind === 'success' && (
              <CheckCircleIcon className="size-4" aria-hidden="true" />
            )}
            {message.text}
          </p>
        )}
      </section>

      <ScheduleRecommendationReminderModal
        isOpen={modalOpen}
        recommendationId={recommendationId}
        predictionTargetDate={predictionTargetDate}
        reminder={reminder}
        onClose={() => setModalOpen(false)}
        onSaved={(savedReminder) => {
          onReminderChange(savedReminder);
          setMessage({
            kind: 'success',
            text: reminder ? 'Reminder rescheduled' : 'Reminder scheduled',
          });
        }}
      />
    </>
  );
}
