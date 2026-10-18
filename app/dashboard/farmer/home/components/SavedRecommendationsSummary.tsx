'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  getSavedRecommendations,
  type SavedRecommendationSummary,
} from '../../recommendations/savedRecommendationsApi';
import {
  formatSavedDate,
  formatSavedName,
  formatSavedPrice,
  getLifecyclePresentation,
} from '../../recommendations/savedRecommendationPresentation';
import { getSavedRecommendationsPreview } from './savedRecommendationsPreview';

type SummaryStatus = 'loading' | 'ready' | 'error';

export default function SavedRecommendationsSummary() {
  const [status, setStatus] = useState<SummaryStatus>('loading');
  const [recommendations, setRecommendations] = useState<
    SavedRecommendationSummary[]
  >([]);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token') ?? '';

    void getSavedRecommendations(token, { signal: controller.signal })
      .then((items) => {
        setRecommendations(getSavedRecommendationsPreview(items));
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setStatus('error');
      });

    return () => controller.abort();
  }, []);

  return (
    <section
      aria-labelledby="saved-recommendations-summary-heading"
      className="shrink-0 rounded-[28px] border border-amber-100 bg-[linear-gradient(135deg,_#fffbeb,_#ffffff_58%,_#f0fdf4)] p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-amber-700">
            Sell Advisor
          </p>
          <h2
            id="saved-recommendations-summary-heading"
            className="mt-0.5 text-base font-bold text-gray-900"
          >
            Saved Recommendations
          </h2>
        </div>
        <Link
          href="/dashboard/farmer/recommendations"
          className="rounded-full border-2 border-amber-200 bg-white px-4 py-2 text-xs font-bold text-amber-800 shadow-sm transition-colors hover:bg-amber-50"
        >
          Show More
        </Link>
      </div>

      {status === 'loading' && (
        <div
          role="status"
          aria-label="Loading saved recommendations"
          className="mt-3 grid gap-3 md:grid-cols-2"
        >
          {[0, 1].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-[20px] border border-white/80 bg-white/90 p-3 shadow-sm motion-reduce:animate-none"
            >
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-40 rounded bg-gray-100" />
              <div className="mt-3 h-3 w-full rounded bg-gray-100" />
            </div>
          ))}
        </div>
      )}

      {status === 'error' && (
        <p className="mt-3 rounded-[20px] border border-amber-100 bg-white/80 px-4 py-3 text-sm font-medium text-gray-500">
          Saved recommendations are unavailable right now.
        </p>
      )}

      {status === 'ready' && recommendations.length === 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            No saved recommendations yet.
          </p>
          <Link
            href="/dashboard/farmer/prediction"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            Open Sell Advisor
          </Link>
        </div>
      )}

      {status === 'ready' && recommendations.length > 0 && (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {recommendations.map((recommendation) => {
            const lifecycle = getLifecyclePresentation(recommendation.status);

            return (
              <Link
                key={recommendation.id}
                href={`/dashboard/farmer/recommendations/${encodeURIComponent(
                  recommendation.id
                )}`}
                aria-label={`View saved recommendation for ${formatSavedName(
                  recommendation.crop
                )}`}
                className="group rounded-[20px] border border-white/80 bg-white/95 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-extrabold text-gray-900">
                      {formatSavedName(recommendation.crop)}
                    </h3>
                    <p className="mt-0.5 truncate text-xs font-medium text-gray-500">
                      {formatSavedName(recommendation.farmer_district)} →{' '}
                      {formatSavedName(recommendation.recommended_market)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${lifecycle.badgeClassName}`}
                  >
                    {lifecycle.label}
                  </span>
                </div>

                <div
                  className={`mt-3 grid gap-2 text-xs ${
                    recommendation.experimental_price === null
                      ? 'grid-cols-2'
                      : 'grid-cols-3'
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-400">Current</p>
                    <p className="mt-0.5 truncate font-bold text-gray-800">
                      {formatSavedPrice(recommendation.current_price)}
                    </p>
                  </div>
                  {recommendation.experimental_price !== null && (
                    <div>
                      <p className="font-medium text-gray-400">Expected</p>
                      <p className="mt-0.5 truncate font-bold text-emerald-700">
                        {formatSavedPrice(recommendation.experimental_price)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-400">Target date</p>
                    <p className="mt-0.5 truncate font-bold text-gray-800">
                      {formatSavedDate(recommendation.prediction_target_date)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
