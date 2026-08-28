import {
  ArchiveBoxIcon,
  ArrowRightIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { SavedRecommendationSummary } from '../savedRecommendationsApi';
import type { RecommendationReminder } from '../recommendationReminderApi';
import {
  formatSavedDate,
  formatSavedName,
  formatSavedPrice,
  formatSavedQuantity,
  getLifecyclePresentation,
  getOutlookPresentation,
  getOutlookStrengthLabel,
} from '../savedRecommendationPresentation';
import RecommendationReminderControls from './RecommendationReminderControls';

type SavedRecommendationCardProps = {
  recommendation: SavedRecommendationSummary;
  archiveConfirmationOpen: boolean;
  archiveError?: string | null;
  isArchiving: boolean;
  onRequestArchive: () => void;
  onCancelArchive: () => void;
  onConfirmArchive: () => void;
  onReminderChange: (reminder: RecommendationReminder | null) => void;
};

export default function SavedRecommendationCard({
  recommendation,
  archiveConfirmationOpen,
  archiveError,
  isArchiving,
  onRequestArchive,
  onCancelArchive,
  onConfirmArchive,
  onReminderChange,
}: SavedRecommendationCardProps) {
  const lifecycle = getLifecyclePresentation(recommendation.status);
  const outlook = getOutlookPresentation(
    recommendation.market_outlook_status
  );

  return (
    <article
      data-testid="saved-recommendation-card"
      className="overflow-hidden rounded-[1.6rem] border border-emerald-100 bg-white shadow-[0_20px_55px_-42px_rgba(5,100,70,0.65)]"
    >
      <div className="border-b border-emerald-100 bg-[linear-gradient(125deg,#edf9f1_0%,#fffdf5_100%)] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
              Saved recommendation
            </p>
            <h2 className="mt-1 break-words text-2xl font-black tracking-tight text-emerald-950">
              {formatSavedName(recommendation.crop)}
            </h2>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-black ${lifecycle.badgeClassName}`}
          >
            {lifecycle.label}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {lifecycle.explanation}
        </p>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="flex min-w-0 items-start gap-3 rounded-xl bg-slate-50 px-3 py-3">
            <MapPinIcon
              className="mt-0.5 size-5 shrink-0 text-emerald-700"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <dt className="text-xs font-semibold text-slate-500">
                Farmer district
              </dt>
              <dd className="mt-0.5 break-words text-sm font-black text-slate-900">
                {formatSavedName(recommendation.farmer_district)}
              </dd>
            </div>
          </div>
          <div className="flex min-w-0 items-start gap-3 rounded-xl bg-emerald-50/70 px-3 py-3">
            <MapPinIcon
              className="mt-0.5 size-5 shrink-0 text-teal-700"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <dt className="text-xs font-semibold text-slate-500">
                Recommended market
              </dt>
              <dd className="mt-0.5 break-words text-sm font-black text-emerald-950">
                {formatSavedName(recommendation.recommended_market)}
              </dd>
            </div>
          </div>
        </dl>

        <dl className="grid gap-x-5 gap-y-3 border-y border-slate-100 py-4 sm:grid-cols-2">
          <div className="flex min-w-0 gap-2.5">
            <CalendarDaysIcon
              className="mt-0.5 size-4 shrink-0 text-slate-500"
              aria-hidden="true"
            />
            <div>
              <dt className="text-xs font-semibold text-slate-500">Saved</dt>
              <dd className="mt-0.5 text-sm font-bold text-slate-800">
                {formatSavedDate(recommendation.created_at)}
              </dd>
            </div>
          </div>
          <div className="flex min-w-0 gap-2.5">
            <CalendarDaysIcon
              className="mt-0.5 size-4 shrink-0 text-amber-600"
              aria-hidden="true"
            />
            <div>
              <dt className="text-xs font-semibold text-slate-500">
                Next market period
              </dt>
              <dd className="mt-0.5 text-sm font-bold text-slate-800">
                {formatSavedDate(recommendation.prediction_target_date)}
              </dd>
            </div>
          </div>
        </dl>

        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="min-w-0 rounded-xl border border-slate-100 px-3 py-3">
            <BanknotesIcon
              className="size-5 text-slate-500"
              aria-hidden="true"
            />
            <dt className="mt-2 text-xs font-semibold text-slate-500">
              Current price
            </dt>
            <dd className="mt-0.5 break-words text-sm font-black text-slate-950">
              {formatSavedPrice(recommendation.current_price)}
            </dd>
          </div>
          <div className="min-w-0 rounded-xl border border-teal-100 bg-teal-50/40 px-3 py-3">
            <BanknotesIcon
              className="size-5 text-teal-700"
              aria-hidden="true"
            />
            <dt className="mt-2 text-xs font-semibold leading-4 text-slate-500">
              Experimental next-period price
            </dt>
            <dd className="mt-0.5 break-words text-sm font-black text-teal-900">
              {formatSavedPrice(recommendation.experimental_price)}
            </dd>
          </div>
          <div className="min-w-0 rounded-xl border border-amber-100 bg-amber-50/40 px-3 py-3">
            <ScaleIcon
              className="size-5 text-amber-700"
              aria-hidden="true"
            />
            <dt className="mt-2 text-xs font-semibold text-slate-500">
              Harvest quantity
            </dt>
            <dd className="mt-0.5 break-words text-sm font-black text-slate-950">
              {formatSavedQuantity(recommendation.quantity_kg)}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${outlook.badgeClassName}`}
          >
            {outlook.label}
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            {getOutlookStrengthLabel(
              recommendation.market_outlook_strength
            )}
          </span>
        </div>

        <RecommendationReminderControls
          recommendationId={recommendation.id}
          predictionTargetDate={recommendation.prediction_target_date}
          reminder={recommendation.reminder}
          variant="compact"
          onReminderChange={onReminderChange}
        />

        {archiveConfirmationOpen && (
          <div
            role="alertdialog"
            aria-labelledby={`archive-heading-${recommendation.id}`}
            aria-describedby={`archive-description-${recommendation.id}`}
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
          >
            <p
              id={`archive-heading-${recommendation.id}`}
              className="text-sm font-black text-amber-950"
            >
              Archive this saved recommendation?
            </p>
            <p
              id={`archive-description-${recommendation.id}`}
              className="mt-1 text-xs leading-5 text-amber-900"
            >
              It will be removed from My Recommendations and future reminders
              will no longer appear.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onCancelArchive}
                disabled={isArchiving}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-amber-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirmArchive}
                disabled={isArchiving}
                aria-busy={isArchiving}
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-700 px-3 text-xs font-bold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isArchiving ? 'Archiving...' : 'Confirm archive'}
              </button>
            </div>
          </div>
        )}

        {archiveError && (
          <p role="alert" className="text-sm leading-6 text-rose-700">
            {archiveError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onRequestArchive}
            disabled={isArchiving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArchiveBoxIcon className="size-4" aria-hidden="true" />
            Archive
          </button>
          <Link
            href={`/dashboard/farmer/recommendations/${encodeURIComponent(
              recommendation.id
            )}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-black text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            View
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
