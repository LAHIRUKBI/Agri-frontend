'use client';

import {
  ArrowPathIcon,
  BookmarkSquareIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import RecommendationsLayout from './components/RecommendationsLayout';
import SavedRecommendationCard from './components/SavedRecommendationCard';
import {
  archiveSavedRecommendation,
  getSavedRecommendations,
  getSavedRecommendationsErrorMessage,
  type SavedRecommendationSummary,
} from './savedRecommendationsApi';
import { removeArchivedRecommendation } from './savedRecommendationPresentation';

type ListStatus = 'loading' | 'ready' | 'error' | 'missing-token';

export default function SavedRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<
    SavedRecommendationSummary[]
  >([]);
  const [listStatus, setListStatus] = useState<ListStatus>('loading');
  const [listError, setListError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [archiveConfirmationId, setArchiveConfirmationId] = useState<
    string | null
  >(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const [archiveSuccess, setArchiveSuccess] = useState<string | null>(null);
  const archiveRequestsInFlight = useRef(new Set<string>());

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token')?.trim();

    if (!token) {
      setListStatus('missing-token');
      setListError('Please sign in to view your saved recommendations.');
      return () => controller.abort();
    }

    setListStatus('loading');
    setListError(null);

    void getSavedRecommendations(token, { signal: controller.signal })
      .then((savedRecommendations) => {
        setRecommendations(savedRecommendations);
        setListStatus('ready');
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setListError(getSavedRecommendationsErrorMessage(error));
        setListStatus('error');
      });

    return () => controller.abort();
  }, [requestVersion]);

  const handleConfirmArchive = async (id: string) => {
    if (archiveRequestsInFlight.current.has(id)) return;

    const token = localStorage.getItem('token')?.trim();
    if (!token) {
      setArchiveError({
        id,
        message: 'Please sign in again to view your saved recommendations.',
      });
      return;
    }

    archiveRequestsInFlight.current.add(id);
    setArchivingId(id);
    setArchiveError(null);
    setArchiveSuccess(null);

    try {
      await archiveSavedRecommendation(id, token);
      setRecommendations((current) =>
        removeArchivedRecommendation(current, id)
      );
      setArchiveConfirmationId(null);
      setArchiveSuccess('Recommendation archived');
    } catch (error) {
      setArchiveError({
        id,
        message: getSavedRecommendationsErrorMessage(
          error,
          'Could not archive this recommendation. Please try again.'
        ),
      });
    } finally {
      archiveRequestsInFlight.current.delete(id);
      setArchivingId((current) => (current === id ? null : current));
    }
  };

  return (
    <RecommendationsLayout>
      <header className="rounded-[1.75rem] border border-emerald-100 bg-white/85 px-5 py-6 shadow-[0_24px_70px_-52px_rgba(5,100,70,0.7)] backdrop-blur sm:px-7">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
            <BookmarkSquareIcon className="size-7" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Sell Advisor library
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
              My Recommendations
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              Review recommendations you saved from Sell Advisor and check when
              their next market period is due.
            </p>
          </div>
        </div>
      </header>

      {archiveSuccess && (
        <div
          role="status"
          className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"
        >
          <CheckCircleIcon className="size-5" aria-hidden="true" />
          {archiveSuccess}
        </div>
      )}

      {listStatus === 'loading' && (
        <div
          role="status"
          aria-busy="true"
          className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-sm"
        >
          <ArrowPathIcon
            className="size-5 animate-spin text-emerald-700 motion-reduce:animate-none"
            aria-hidden="true"
          />
          Loading saved recommendations...
        </div>
      )}

      {(listStatus === 'error' || listStatus === 'missing-token') && (
        <section className="mt-6 rounded-2xl border border-rose-200 bg-white px-5 py-6 shadow-sm">
          <ExclamationTriangleIcon
            className="size-7 text-rose-600"
            aria-hidden="true"
          />
          <h2 className="mt-3 text-lg font-black text-slate-900">
            Saved recommendations are unavailable
          </h2>
          <p role="alert" className="mt-1 text-sm leading-6 text-rose-700">
            {listError}
          </p>
          <div className="mt-4">
            {listStatus === 'missing-token' ? (
              <Link
                href="/signin"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
              >
                Sign in
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setRequestVersion((version) => version + 1)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
              >
                Try again
              </button>
            )}
          </div>
        </section>
      )}

      {listStatus === 'ready' && recommendations.length === 0 && (
        <section className="mt-6 rounded-[1.6rem] border border-dashed border-emerald-200 bg-white px-6 py-12 text-center shadow-sm">
          <BookmarkSquareIcon
            className="mx-auto size-10 text-emerald-600"
            aria-hidden="true"
          />
          <h2 className="mt-4 text-xl font-black text-emerald-950">
            No saved recommendations yet
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
            Run Sell Advisor and save a recommendation to review it here later.
          </p>
          <Link
            href="/dashboard/farmer/prediction"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-black text-white hover:bg-emerald-800"
          >
            Open Sell Advisor
          </Link>
        </section>
      )}

      {listStatus === 'ready' && recommendations.length > 0 && (
        <section aria-label="Saved recommendations" className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-700">
              Active saved recommendations
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              {recommendations.length}{' '}
              {recommendations.length === 1 ? 'recommendation' : 'recommendations'}
            </p>
          </div>
          <div className="grid items-start gap-5 xl:grid-cols-2">
            {recommendations.map((recommendation) => (
              <SavedRecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                archiveConfirmationOpen={
                  archiveConfirmationId === recommendation.id
                }
                archiveError={
                  archiveError?.id === recommendation.id
                    ? archiveError.message
                    : null
                }
                isArchiving={archivingId === recommendation.id}
                onRequestArchive={() => {
                  setArchiveConfirmationId(recommendation.id);
                  setArchiveError(null);
                  setArchiveSuccess(null);
                }}
                onCancelArchive={() => {
                  setArchiveConfirmationId(null);
                  setArchiveError(null);
                }}
                onConfirmArchive={() =>
                  void handleConfirmArchive(recommendation.id)
                }
                onReminderChange={(reminder) => {
                  setRecommendations((current) =>
                    current.map((item) =>
                      item.id === recommendation.id
                        ? { ...item, reminder }
                        : item
                    )
                  );
                }}
              />
            ))}
          </div>
        </section>
      )}
    </RecommendationsLayout>
  );
}
