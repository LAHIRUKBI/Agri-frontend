'use client';

import {
  ArchiveBoxIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  BanknotesIcon,
  BeakerIcon,
  BookmarkSquareIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import AiInsightsPanel from '../../prediction/components/AiInsightsPanel';
import WeatherForecastStrip from '../../prediction/components/sell-advisor/WeatherForecastStrip';
import RecommendationsLayout from '../components/RecommendationsLayout';
import RecommendationReminderControls from '../components/RecommendationReminderControls';
import {
  archiveSavedRecommendation,
  getSavedRecommendation,
  getSavedRecommendationsErrorMessage,
  type SavedRecommendationDetail,
} from '../savedRecommendationsApi';
import {
  formatSavedDate,
  formatSavedName,
  formatSavedPrice,
  formatSavedQuantity,
  getHistoricalMarketComparisons,
  getLifecyclePresentation,
  getOutlookPresentation,
  getOutlookStrengthLabel,
  getSnapshotAiInsights,
  getSnapshotWeatherForecast,
} from '../savedRecommendationPresentation';

type DetailStatus = 'loading' | 'ready' | 'error' | 'missing-token';

export default function SavedRecommendationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const savedRecommendationId =
    typeof params.id === 'string' ? params.id : '';
  const [recommendation, setRecommendation] =
    useState<SavedRecommendationDetail | null>(null);
  const [detailStatus, setDetailStatus] = useState<DetailStatus>('loading');
  const [detailError, setDetailError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [archiveConfirmationOpen, setArchiveConfirmationOpen] =
    useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const archiveInFlight = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token')?.trim();

    if (!token) {
      setDetailStatus('missing-token');
      setDetailError('Please sign in to view your saved recommendations.');
      return () => controller.abort();
    }

    setDetailStatus('loading');
    setDetailError(null);

    void getSavedRecommendation(savedRecommendationId, token, {
      signal: controller.signal,
    })
      .then((savedRecommendation) => {
        setRecommendation(savedRecommendation);
        setDetailStatus('ready');
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setDetailError(
          getSavedRecommendationsErrorMessage(
            error,
            'Could not load this saved recommendation. Please try again.'
          )
        );
        setDetailStatus('error');
      });

    return () => controller.abort();
  }, [requestVersion, savedRecommendationId]);

  const handleArchive = async () => {
    if (archiveInFlight.current || !recommendation) return;

    const token = localStorage.getItem('token')?.trim();
    if (!token) {
      setArchiveError(
        'Please sign in again to view your saved recommendations.'
      );
      return;
    }

    archiveInFlight.current = true;
    setIsArchiving(true);
    setArchiveError(null);

    try {
      await archiveSavedRecommendation(recommendation.id, token);
      router.push('/dashboard/farmer/recommendations');
    } catch (error) {
      setArchiveError(
        getSavedRecommendationsErrorMessage(
          error,
          'Could not archive this recommendation. Please try again.'
        )
      );
    } finally {
      archiveInFlight.current = false;
      setIsArchiving(false);
    }
  };

  const lifecycle = recommendation
    ? getLifecyclePresentation(recommendation.status)
    : null;
  const outlook = recommendation
    ? getOutlookPresentation(recommendation.market_outlook_status)
    : null;
  const historicalGuidance = recommendation
    ? getSnapshotAiInsights(recommendation.recommendation_snapshot)
    : null;
  const historicalWeather = recommendation
    ? getSnapshotWeatherForecast(recommendation.recommendation_snapshot)
    : null;
  const historicalComparisons = recommendation
    ? getHistoricalMarketComparisons(recommendation.recommendation_snapshot)
    : [];

  return (
    <RecommendationsLayout>
      <Link
        href="/dashboard/farmer/recommendations"
        className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-white hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        Back to My Recommendations
      </Link>

      <header className="mt-3 rounded-[1.75rem] border border-emerald-100 bg-white/85 px-5 py-6 shadow-[0_24px_70px_-52px_rgba(5,100,70,0.7)] backdrop-blur sm:px-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
              <BookmarkSquareIcon className="size-7" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Historical Sell Advisor result
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
                Saved Recommendation
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                This is the recommendation that was saved at that time.
              </p>
            </div>
          </div>

          {detailStatus === 'ready' && recommendation && (
            <button
              type="button"
              onClick={() => {
                setArchiveConfirmationOpen(true);
                setArchiveError(null);
              }}
              disabled={isArchiving}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-4 text-sm font-bold text-amber-800 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArchiveBoxIcon className="size-4" aria-hidden="true" />
              Archive
            </button>
          )}
        </div>
      </header>

      {detailStatus === 'loading' && (
        <div
          role="status"
          aria-busy="true"
          className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-sm"
        >
          <ArrowPathIcon
            className="size-5 animate-spin text-emerald-700 motion-reduce:animate-none"
            aria-hidden="true"
          />
          Loading saved recommendation...
        </div>
      )}

      {(detailStatus === 'error' || detailStatus === 'missing-token') && (
        <section className="mt-6 rounded-2xl border border-rose-200 bg-white px-5 py-6 shadow-sm">
          <ExclamationTriangleIcon
            className="size-7 text-rose-600"
            aria-hidden="true"
          />
          <h2 className="mt-3 text-lg font-black text-slate-900">
            {detailError === 'Saved recommendation not found.'
              ? 'Saved recommendation not found.'
              : 'Saved recommendation is unavailable'}
          </h2>
          {detailError !== 'Saved recommendation not found.' && (
            <p role="alert" className="mt-1 text-sm leading-6 text-rose-700">
              {detailError}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/dashboard/farmer/recommendations"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:border-emerald-200 hover:text-emerald-800"
            >
              Back to My Recommendations
            </Link>
            {detailStatus === 'error' &&
              detailError !== 'Saved recommendation not found.' && (
                <button
                  type="button"
                  onClick={() =>
                    setRequestVersion((version) => version + 1)
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
                >
                  Try again
                </button>
              )}
          </div>
        </section>
      )}

      {detailStatus === 'ready' && recommendation && lifecycle && outlook && (
        <div className="mt-6 space-y-5">
          {archiveConfirmationOpen && (
            <section
              role="alertdialog"
              aria-labelledby="detail-archive-heading"
              aria-describedby="detail-archive-description"
              className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4"
            >
              <h2
                id="detail-archive-heading"
                className="text-base font-black text-amber-950"
              >
                Archive this saved recommendation?
              </h2>
              <p
                id="detail-archive-description"
                className="mt-1 text-sm leading-6 text-amber-900"
              >
                It will be removed from My Recommendations and future reminders
                will no longer appear.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setArchiveConfirmationOpen(false);
                    setArchiveError(null);
                  }}
                  disabled={isArchiving}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-amber-200 bg-white px-3 text-sm font-bold text-slate-700 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleArchive()}
                  disabled={isArchiving}
                  aria-busy={isArchiving}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-700 px-3 text-sm font-bold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isArchiving ? 'Archiving...' : 'Confirm archive'}
                </button>
              </div>
              {archiveError && (
                <p role="alert" className="mt-3 text-sm text-rose-700">
                  {archiveError}
                </p>
              )}
            </section>
          )}

          <section className="rounded-[1.6rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  Recommendation at that time
                </p>
                <h2 className="mt-1 text-2xl font-black text-emerald-950">
                  {formatSavedName(recommendation.crop)}
                </h2>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-black ${lifecycle.badgeClassName}`}
              >
                {lifecycle.label}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {lifecycle.explanation}
            </p>

            <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <MapPinIcon className="size-5 text-slate-500" aria-hidden="true" />
                <dt className="mt-2 text-xs font-semibold text-slate-500">
                  Farmer district
                </dt>
                <dd className="mt-0.5 text-sm font-black text-slate-950">
                  {formatSavedName(recommendation.farmer_district)}
                </dd>
              </div>
              <div className="rounded-xl bg-emerald-50 px-4 py-3">
                <MapPinIcon className="size-5 text-emerald-700" aria-hidden="true" />
                <dt className="mt-2 text-xs font-semibold text-slate-500">
                  Recommended market
                </dt>
                <dd className="mt-0.5 text-sm font-black text-emerald-950">
                  {formatSavedName(recommendation.recommended_market)}
                </dd>
              </div>
              <div className="rounded-xl bg-amber-50 px-4 py-3">
                <ScaleIcon className="size-5 text-amber-700" aria-hidden="true" />
                <dt className="mt-2 text-xs font-semibold text-slate-500">
                  Harvest quantity
                </dt>
                <dd className="mt-0.5 text-sm font-black text-slate-950">
                  {formatSavedQuantity(recommendation.quantity_kg)}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-100 px-4 py-3">
                <CalendarDaysIcon className="size-5 text-slate-500" aria-hidden="true" />
                <dt className="mt-2 text-xs font-semibold text-slate-500">
                  Saved date
                </dt>
                <dd className="mt-0.5 text-sm font-black text-slate-950">
                  {formatSavedDate(recommendation.created_at)}
                </dd>
              </div>
              <div className="rounded-xl border border-amber-100 px-4 py-3">
                <CalendarDaysIcon className="size-5 text-amber-600" aria-hidden="true" />
                <dt className="mt-2 text-xs font-semibold text-slate-500">
                  Next market period
                </dt>
                <dd className="mt-0.5 text-sm font-black text-slate-950">
                  {formatSavedDate(recommendation.prediction_target_date)}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-100 px-4 py-3">
                <BanknotesIcon className="size-5 text-slate-500" aria-hidden="true" />
                <dt className="mt-2 text-xs font-semibold text-slate-500">
                  Current price source
                </dt>
                <dd className="mt-0.5 text-sm font-black text-slate-950">
                  {formatSavedName(recommendation.current_price_source)}
                </dd>
              </div>
            </dl>

            <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-100 px-4 py-3">
                <dt className="text-xs font-semibold text-slate-500">
                  Current price
                </dt>
                <dd className="mt-1 text-lg font-black text-slate-950">
                  {formatSavedPrice(recommendation.current_price)}
                </dd>
              </div>
              <div className="rounded-xl border border-teal-100 bg-teal-50/40 px-4 py-3">
                <dt className="text-xs font-semibold text-slate-500">
                  Experimental next-period price
                </dt>
                <dd className="mt-1 text-lg font-black text-teal-900">
                  {formatSavedPrice(recommendation.experimental_price)}
                </dd>
              </div>
              {recommendation.persistence_baseline !== null && (
                <div className="rounded-xl border border-sky-100 bg-sky-50/40 px-4 py-3">
                  <dt className="text-xs font-semibold text-slate-500">
                    Persistence baseline
                  </dt>
                  <dd className="mt-1 text-lg font-black text-sky-900">
                    {formatSavedPrice(recommendation.persistence_baseline)}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <RecommendationReminderControls
            recommendationId={recommendation.id}
            predictionTargetDate={recommendation.prediction_target_date}
            reminder={recommendation.reminder}
            variant="detail"
            onReminderChange={(reminder) =>
              setRecommendation((current) =>
                current ? { ...current, reminder } : current
              )
            }
          />

          <section className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-800">
              Market outlook saved with this recommendation
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1.5 text-sm font-black ${outlook.badgeClassName}`}
              >
                {outlook.label}
              </span>
              <span className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-600">
                {getOutlookStrengthLabel(
                  recommendation.market_outlook_strength
                )}
              </span>
            </div>
          </section>

          {historicalGuidance && (
            <section aria-labelledby="historical-guidance-heading">
              <h2
                id="historical-guidance-heading"
                className="mb-3 px-1 text-sm font-black uppercase tracking-[0.14em] text-emerald-900"
              >
                Guidance saved with this recommendation
              </h2>
              <AiInsightsPanel aiInsights={historicalGuidance} />
            </section>
          )}

          {historicalWeather && (
            <section aria-labelledby="historical-weather-heading">
              <h2
                id="historical-weather-heading"
                className="mb-3 px-1 text-sm font-black uppercase tracking-[0.14em] text-sky-900"
              >
                Weather forecast saved with this recommendation
              </h2>
              <WeatherForecastStrip forecast={historicalWeather} />
            </section>
          )}

          {historicalComparisons.length > 0 && (
            <section className="rounded-[1.6rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-sm font-black uppercase tracking-[0.14em] text-emerald-900">
                Market comparison saved with this recommendation
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {historicalComparisons.map((comparison) => (
                  <article
                    key={comparison.key}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <h3 className="font-black text-slate-900">
                      {comparison.market}
                    </h3>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div>
                        <dt className="text-xs font-semibold text-slate-500">
                          Current price at that time
                        </dt>
                        <dd className="font-bold text-slate-800">
                          {formatSavedPrice(comparison.currentPrice)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-500">
                          Experimental next-period price
                        </dt>
                        <dd className="font-bold text-teal-800">
                          {formatSavedPrice(comparison.experimentalPrice)}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </section>
          )}

          <details className="group rounded-[1.6rem] border border-slate-200 bg-white shadow-sm">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-[1.6rem] px-5 py-4 text-sm font-black text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2">
                <BeakerIcon className="size-5 text-teal-700" aria-hidden="true" />
                Technical details saved with this recommendation
              </span>
              <span className="text-xs font-bold text-slate-500 group-open:hidden">
                Show
              </span>
              <span className="hidden text-xs font-bold text-slate-500 group-open:inline">
                Hide
              </span>
            </summary>
            <dl className="grid gap-4 border-t border-slate-100 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  Model version
                </dt>
                <dd className="mt-1 break-words text-sm font-bold text-slate-900">
                  {recommendation.model_version ?? 'Not available'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  Policy version
                </dt>
                <dd className="mt-1 break-words text-sm font-bold text-slate-900">
                  {recommendation.policy_version ?? 'Not available'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  Action decision
                </dt>
                <dd className="mt-1 break-words text-sm font-bold text-slate-900">
                  {recommendation.action_decision}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  Action authorized
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">
                  {String(recommendation.action_authorized)}
                </dd>
              </div>
            </dl>
          </details>
        </div>
      )}
    </RecommendationsLayout>
  );
}
