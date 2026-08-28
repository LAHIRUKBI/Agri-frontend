'use client';

import {
  BellAlertIcon,
  CalendarDaysIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import {
  getRecommendationReminderErrorMessage,
  scheduleRecommendationReminder,
  type RecommendationReminder,
} from '../recommendationReminderApi';
import {
  localDateAfterDays,
  localDateTimeToIso,
  toLocalDateTimeParts,
  type LocalDateTimeParts,
} from '../recommendationReminderPresentation';

type ScheduleRecommendationReminderModalProps = {
  isOpen: boolean;
  recommendationId: string;
  predictionTargetDate: string;
  reminder: RecommendationReminder | null;
  onClose: () => void;
  onSaved: (reminder: RecommendationReminder) => void;
};

const initialValues = (
  reminder: RecommendationReminder | null,
  predictionTargetDate: string
): LocalDateTimeParts => {
  if (reminder) return toLocalDateTimeParts(reminder.scheduled_for);

  const target = new Date(predictionTargetDate);
  if (Number.isFinite(target.getTime()) && target.getTime() > Date.now()) {
    return { date: toLocalDateTimeParts(predictionTargetDate).date, time: '' };
  }
  return { date: '', time: '' };
};

export default function ScheduleRecommendationReminderModal({
  isOpen,
  recommendationId,
  predictionTargetDate,
  reminder,
  onClose,
  onSaved,
}: ScheduleRecommendationReminderModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveInFlight = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    const values = initialValues(reminder, predictionTargetDate);
    setDate(values.date);
    setTime(values.time);
    setError(null);
    setIsSaving(false);
    saveInFlight.current = false;
  }, [isOpen, predictionTargetDate, reminder]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saveInFlight.current) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (saveInFlight.current) return;
    if (!date) {
      setError('Choose a date for this reminder.');
      return;
    }
    if (!time) {
      setError('Choose a time for this reminder.');
      return;
    }

    const scheduledFor = localDateTimeToIso(date, time);
    if (!scheduledFor || new Date(scheduledFor).getTime() <= Date.now()) {
      setError('The selected time must be in the future.');
      return;
    }

    const token = localStorage.getItem('token')?.trim();
    if (!token) {
      setError('Please sign in again to manage this reminder.');
      return;
    }

    saveInFlight.current = true;
    setIsSaving(true);
    setError(null);
    try {
      const savedReminder = await scheduleRecommendationReminder(
        recommendationId,
        scheduledFor,
        token
      );
      onSaved(savedReminder);
      onClose();
    } catch (caught) {
      setError(getRecommendationReminderErrorMessage(caught));
    } finally {
      saveInFlight.current = false;
      setIsSaving(false);
    }
  };

  const isRescheduling = reminder !== null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-[2px] sm:items-center sm:p-5"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-reminder-heading"
        aria-describedby="schedule-reminder-description"
        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-[1.5rem] border border-emerald-100 bg-white shadow-[0_30px_100px_-30px_rgba(15,23,42,0.65)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-emerald-100 bg-emerald-50/60 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <BellAlertIcon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="schedule-reminder-heading"
                className="text-xl font-black text-emerald-950"
              >
                Schedule notification
              </h2>
              <p
                id="schedule-reminder-description"
                className="mt-1 text-sm leading-6 text-slate-600"
              >
                Choose when you want to be reminded to review this
                recommendation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close schedule notification"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-800 disabled:opacity-50"
          >
            <XMarkIcon className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
          {!isRescheduling && (
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Quick date
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  ['Tomorrow', 1],
                  ['In 3 days', 3],
                  ['In 7 days', 7],
                ].map(([label, days]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setDate(localDateAfterDays(Number(days)));
                      setError(null);
                    }}
                    className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-800">
              <span className="inline-flex items-center gap-2">
                <CalendarDaysIcon
                  className="size-4 text-emerald-700"
                  aria-hidden="true"
                />
                Date
              </span>
              <input
                type="date"
                value={date}
                min={localDateAfterDays(0)}
                onChange={(event) => {
                  setDate(event.target.value);
                  setError(null);
                }}
                disabled={isSaving}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
              />
            </label>
            <label className="block text-sm font-bold text-slate-800">
              <span className="inline-flex items-center gap-2">
                <ClockIcon
                  className="size-4 text-emerald-700"
                  aria-hidden="true"
                />
                Time
              </span>
              <input
                type="time"
                value={time}
                onChange={(event) => {
                  setTime(event.target.value);
                  setError(null);
                }}
                disabled={isSaving}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
              />
            </label>
          </div>

          <p className="text-xs leading-5 text-slate-500">
            The date and time use your device&apos;s local timezone.
          </p>
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700"
            >
              {error}
            </p>
          )}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSaving}
            aria-busy={isSaving}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving
              ? 'Saving...'
              : isRescheduling
                ? 'Save new time'
                : 'Schedule reminder'}
          </button>
        </footer>
      </section>
    </div>
  );
}
