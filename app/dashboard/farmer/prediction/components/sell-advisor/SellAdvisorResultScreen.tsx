'use client';

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BookmarkIcon,
  BookmarkSquareIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  buildSaveRecommendationPayload,
  formatPredictionTargetDate,
  getSaveRecommendationErrorMessage,
  saveRecommendation,
} from '../../saveRecommendation';
import type { SellAdvisorSubmittedInput } from '../../sellAdvisorRequest';
import RecommendationResult from '../RecommendationResult';
import ResultJourneyProgress from './ResultJourneyProgress';
import type { ResultJourneyPage } from './resultJourney';

type SellAdvisorResultScreenProps = {
  result: unknown;
  submittedInput: SellAdvisorSubmittedInput;
  recommendationTimestamp: string;
  onStartNew: () => void;
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function SellAdvisorResultScreen({
  result,
  submittedInput,
  recommendationTimestamp,
  onStartNew,
}: SellAdvisorResultScreenProps) {
  const resultRef = useRef<HTMLDivElement>(null);
  const saveInFlight = useRef(false);
  const [activePage, setActivePage] =
    useState<ResultJourneyPage>('decision');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savedRecommendationId, setSavedRecommendationId] = useState<
    string | null
  >(null);

  useEffect(() => {
    resultRef.current?.focus();
  }, [activePage]);

  const handleSaveRecommendation = async () => {
    if (saveInFlight.current || saveStatus === 'saved') return;

    const token = localStorage.getItem('token')?.trim();
    if (!token) {
      setSaveStatus('error');
      setSaveMessage('Please sign in to save this recommendation.');
      return;
    }

    saveInFlight.current = true;
    setSaveStatus('saving');
    setSaveMessage(null);

    try {
      const payload = buildSaveRecommendationPayload(
        result,
        submittedInput,
        recommendationTimestamp
      );
      const response = await saveRecommendation(payload, token);
      const targetDate = formatPredictionTargetDate(
        response.saved_recommendation.prediction_target_date
      );

      setSavedRecommendationId(response.saved_recommendation.id);
      setSaveStatus('saved');
      setSaveMessage(
        targetDate
          ? `Recommendation saved · Next market period: ${targetDate}`
          : 'Recommendation saved'
      );
    } catch (error) {
      setSaveStatus('error');
      setSaveMessage(getSaveRecommendationErrorMessage(error));
    } finally {
      saveInFlight.current = false;
    }
  };

  const saveButtonLabel =
    saveStatus === 'saving'
      ? 'Saving...'
      : saveStatus === 'saved'
        ? 'Saved'
        : 'Save Recommendation';

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_8%_12%,rgba(167,243,208,0.22),transparent_24%),radial-gradient(circle_at_92%_6%,rgba(254,243,199,0.34),transparent_24%),linear-gradient(145deg,#f8fcf9_0%,#fbfcf7_54%,#f7fbfd_100%)] px-3 py-2 text-slate-950 sm:px-5 lg:px-7">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-col gap-2 rounded-2xl border border-emerald-100/80 bg-white/80 px-4 py-2 shadow-[0_16px_40px_-34px_rgba(5,100,70,0.5)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span
              className="flex size-9 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="size-5"
              >
                <path
                  d="M12 20v-9m0 0c0-4 3-6 7-6 0 4-2 7-7 7m0-1C12 7 9 5 5 5c0 4 2 7 7 7"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div>
              <p className="text-lg font-black tracking-tight text-emerald-950 sm:text-xl">
                Sell Advisor
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Recommendation
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <button
              type="button"
              onClick={onStartNew}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 text-sm font-bold text-emerald-800 transition-colors duration-200 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              <ArrowPathIcon className="size-4" aria-hidden="true" />
              Start new recommendation
            </button>
            {activePage === 'decision' && (
              <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
                <button
                  type="button"
                  onClick={handleSaveRecommendation}
                  disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                  aria-busy={saveStatus === 'saving'}
                  data-saved-recommendation-id={
                    savedRecommendationId ?? undefined
                  }
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-700 bg-white px-3.5 text-sm font-bold text-emerald-800 transition-colors duration-200 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-emerald-200 disabled:bg-emerald-50 disabled:text-emerald-700 disabled:opacity-80 motion-reduce:transition-none"
                >
                  {saveStatus === 'saved' ? (
                    <CheckCircleIcon className="size-4" aria-hidden="true" />
                  ) : (
                    <BookmarkIcon className="size-4" aria-hidden="true" />
                  )}
                  {saveButtonLabel}
                </button>
                {saveMessage && (
                  <p
                    role={saveStatus === 'error' ? 'alert' : 'status'}
                    aria-live="polite"
                    className={`max-w-xs text-xs leading-5 sm:text-right ${
                      saveStatus === 'error'
                        ? 'text-rose-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {saveMessage}
                  </p>
                )}
              </div>
            )}
            <Link
              href="/dashboard/farmer/recommendations"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              <BookmarkSquareIcon className="size-4" aria-hidden="true" />
              View My Recommendations
            </Link>
            <Link
              href="/dashboard/farmer/home"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3.5 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              <ArrowLeftIcon className="size-4" aria-hidden="true" />
              Back to Dashboard
            </Link>
          </div>
        </header>

        <div className="mt-2 rounded-2xl border border-emerald-100/80 bg-white/75 px-3 py-1.5 shadow-sm sm:px-5">
          <ResultJourneyProgress
            activePage={activePage}
            onPageChange={setActivePage}
          />
        </div>

        <div
          ref={resultRef}
          tabIndex={-1}
          aria-label={`${activePage} recommendation result page`}
          aria-live="polite"
          className="outline-none"
        >
          <RecommendationResult
            result={result}
            submittedInput={submittedInput}
            activePage={activePage}
            onPageChange={setActivePage}
          />
        </div>
      </div>
    </main>
  );
}
