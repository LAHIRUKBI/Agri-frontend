'use client';

import {
  ArrowRightIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  CloudIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  LightBulbIcon,
  MapPinIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useState, type ReactNode } from 'react';
import type {
  ActionDecision,
  AiInsights,
  MarketOutlook,
  MarketOutlookPresentation,
  WeatherForecast,
} from '../../recommendationContract';
import type { ModelMetricPresentation } from './modelPerformance';
import WeatherForecastStrip from './WeatherForecastStrip';
import {
  calculateWholesaleGrossDifference,
  formatSignedCurrency,
  getDecisionHeroPresentation,
  getShortSellerGuidance,
  getWeatherImpactPresentation,
  getWhyDecisionExplanation,
} from './decisionPagePresentation';

type DecisionDetailKey =
  | 'why'
  | 'outlook'
  | 'weather'
  | 'guidance'
  | 'technical';

type DecisionPageDashboardProps = {
  decision: ActionDecision;
  decisionMessage: string;
  cropName: string;
  districtName: string;
  currentPriceLabel: string;
  currentPriceUnavailableText: string;
  currentPrice: number | null;
  predictedPrice: number | null;
  priceDifference: number | null;
  quantity: number;
  quantityRangeLabel?: string;
  recommendedMarketName: string;
  practicalAction: string | null;
  aiInsights?: AiInsights | null;
  actionAuthorized?: boolean;
  actionPolicy?: string | null;
  actionReasonCodes: string[];
  persistenceNextPrice: number | null;
  marketOutlook?: MarketOutlook | null;
  marketOutlookPresentation?: MarketOutlookPresentation | null;
  displayedConfidence: string;
  displayedSignalAlignment: string;
  displayedDirectionSignal: string;
  modelMetricPresentations: ModelMetricPresentation[];
  pricePredictionSource?: string | null;
  modelRunId?: string | null;
  modelRole?: string | null;
  weatherForecast?: WeatherForecast | null;
  onViewMarketDetails: () => void;
};

type DecisionTone = {
  shell: string;
  eyebrow: string;
  title: string;
  icon: string;
  accent: string;
};

const DECISION_TONES: Record<ActionDecision, DecisionTone> = {
  WAIT: {
    shell: 'border-emerald-200 bg-emerald-50/80',
    eyebrow: 'text-emerald-700',
    title: 'text-emerald-950',
    icon: 'bg-emerald-700 text-white',
    accent: 'text-emerald-800',
  },
  SELL_NOW: {
    shell: 'border-amber-200 bg-amber-50/80',
    eyebrow: 'text-amber-800',
    title: 'text-amber-950',
    icon: 'bg-amber-500 text-amber-950',
    accent: 'text-amber-800',
  },
  UNCERTAIN: {
    shell: 'border-slate-200 bg-slate-50/90',
    eyebrow: 'text-slate-600',
    title: 'text-slate-950',
    icon: 'bg-slate-700 text-white',
    accent: 'text-slate-700',
  },
};

const MARKET_OUTLOOK_LABELS: Record<MarketOutlook['status'], string> = {
  UPWARD: 'Upward',
  DOWNWARD: 'Downward',
  MIXED: 'Mixed',
  STABLE: 'Stable',
  LIMITED: 'Limited',
};

const formatCurrency = (value: number | null, fallback = 'Unavailable') =>
  value === null || !Number.isFinite(value)
    ? fallback
    : `Rs. ${Math.round(value).toLocaleString()}`;

const formatPrice = (value: number | null, fallback: string) =>
  value === null || !Number.isFinite(value)
    ? fallback
    : `${formatCurrency(value)}/kg`;

const DecisionIcon = ({ decision }: { decision: ActionDecision }) => {
  if (decision === 'WAIT') {
    return <ArrowTrendingUpIcon className="size-7" aria-hidden="true" />;
  }
  if (decision === 'SELL_NOW') {
    return <ArrowTrendingDownIcon className="size-7" aria-hidden="true" />;
  }
  return <QuestionMarkCircleIcon className="size-7" aria-hidden="true" />;
};

const DetailControl = ({
  detailKey,
  label,
  summary,
  icon,
  open,
  onToggle,
}: {
  detailKey: DecisionDetailKey;
  label: string;
  summary?: string;
  icon: ReactNode;
  open: boolean;
  onToggle: (detailKey: DecisionDetailKey) => void;
}) => (
  <button
    type="button"
    aria-expanded={open}
    aria-controls={`decision-detail-${detailKey}`}
    onClick={() => onToggle(detailKey)}
    className={`group inline-flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition duration-200 hover:border-emerald-200 hover:bg-emerald-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none ${
      open
        ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
        : 'border-slate-200 bg-white text-slate-800'
    }`}
  >
    <span className="inline-flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-emerald-700">{icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold">{label}</span>
        {summary && (
          <span className="block truncate text-[13px] font-normal leading-5 text-slate-600">
            {summary}
          </span>
        )}
      </span>
    </span>
    <ChevronDownIcon
      className={`size-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${
        open ? 'rotate-180' : ''
      }`}
      aria-hidden="true"
    />
  </button>
);

const SecondaryDetailControl = ({
  detailKey,
  label,
  icon,
  open,
  onToggle,
}: {
  detailKey: DecisionDetailKey;
  label: string;
  icon: ReactNode;
  open: boolean;
  onToggle: (detailKey: DecisionDetailKey) => void;
}) => (
  <button
    type="button"
    aria-expanded={open}
    aria-controls={`decision-detail-${detailKey}`}
    onClick={() => onToggle(detailKey)}
    className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none ${
      open
        ? 'bg-emerald-50 text-emerald-800'
        : 'text-slate-600 hover:bg-slate-100 hover:text-emerald-800'
    }`}
  >
    {icon}
    {label}
    <ChevronDownIcon
      className={`size-3.5 transition-transform duration-200 motion-reduce:transition-none ${
        open ? 'rotate-180' : ''
      }`}
      aria-hidden="true"
    />
  </button>
);

export default function DecisionPageDashboard({
  decision,
  decisionMessage,
  cropName,
  districtName,
  currentPriceLabel,
  currentPriceUnavailableText,
  currentPrice,
  predictedPrice,
  priceDifference,
  quantity,
  quantityRangeLabel,
  recommendedMarketName,
  practicalAction,
  aiInsights,
  actionAuthorized,
  actionPolicy,
  actionReasonCodes,
  persistenceNextPrice,
  marketOutlook,
  marketOutlookPresentation,
  displayedConfidence,
  displayedSignalAlignment,
  displayedDirectionSignal,
  modelMetricPresentations,
  pricePredictionSource,
  modelRunId,
  modelRole,
  weatherForecast,
  onViewMarketDetails,
}: DecisionPageDashboardProps) {
  const [openSection, setOpenSection] = useState<DecisionDetailKey | null>(null);
  const hero = getDecisionHeroPresentation(decision);
  const tone = DECISION_TONES[decision];
  const grossDifference = calculateWholesaleGrossDifference(
    currentPrice,
    predictedPrice,
    quantity
  );
  const currentGross =
    currentPrice !== null && Number.isFinite(currentPrice) && quantity > 0
      ? currentPrice * quantity
      : null;
  const expectedGross =
    predictedPrice !== null && Number.isFinite(predictedPrice) && quantity > 0
      ? predictedPrice * quantity
      : null;
  const visibleGuidance = getShortSellerGuidance(
    practicalAction ?? decisionMessage,
    hero.summary
  );
  const whyDecision = getWhyDecisionExplanation(decision, priceDifference);
  const additionalGuidance = Array.from(
    new Set(
      [
        aiInsights?.recommendation,
        aiInsights?.why_this_matters,
        aiInsights?.suggested_action,
      ].flatMap((item) =>
        typeof item === 'string' && item.trim() ? [item.trim()] : []
      )
    )
  );
  const hasAdditionalGuidance = additionalGuidance.length > 0;
  const weatherSummary = weatherForecast
    ? `7-day forecast for ${weatherForecast.location}`
    : 'Forecast unavailable';
  const weatherImpact = getWeatherImpactPresentation(weatherForecast);
  const priceDifferenceSummary =
    priceDifference !== null && Number.isFinite(priceDifference)
      ? `${formatSignedCurrency(priceDifference)} / kg`
      : 'Estimate unavailable';
  const hasQuantity = Number.isFinite(quantity) && quantity > 0;
  const quantitySummary = hasQuantity
    ? `${quantity.toLocaleString()} kg${
        quantityRangeLabel ? ` · ${quantityRangeLabel}` : ''
      }`
    : 'Quantity unavailable';
  const guidanceItems = visibleGuidance
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 2);

  const toggleSection = (section: DecisionDetailKey) => {
    setOpenSection((current) => (current === section ? null : section));
  };

  const expandedPanel = (
    detailKey: DecisionDetailKey,
    label: string,
    content: ReactNode
  ) => {
    const open = openSection === detailKey;

    return (
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 motion-reduce:transition-none ${
          open
            ? 'mt-2 grid-rows-[1fr] opacity-100'
            : 'invisible grid-rows-[0fr] opacity-0'
        }`}
        aria-hidden={!open}
      >
        <div className="overflow-hidden">
          <section
            id={`decision-detail-${detailKey}`}
            aria-label={label}
            className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"
          >
            {content}
          </section>
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-3" data-testid="decision-dashboard">
      <div
        className={`decision-enter relative overflow-hidden rounded-[1.65rem] border px-4 py-4 shadow-[0_18px_46px_-40px_rgba(5,100,70,0.55)] sm:px-5 ${tone.shell}`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 size-52 rounded-full border-[28px] border-white/45"
        />
        <div className="relative grid gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div className="grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] items-start gap-x-3">
            <span
              className={`decision-icon flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${tone.icon}`}
            >
              <DecisionIcon decision={decision} />
            </span>
            <div className="min-w-0">
              <div>
                <p
                  className={`text-[13px] font-semibold uppercase tracking-[0.14em] ${tone.eyebrow}`}
                >
                  Sell Advisor decision
                </p>
                <h1
                  id="decision-page-heading"
                  className={`mt-0.5 text-4xl font-bold tracking-tight sm:text-[2.5rem] sm:leading-none ${tone.title}`}
                  data-testid="canonical-decision"
                  data-action-decision={decision}
                >
                  {hero.label}
                </h1>
              </div>
              <p className="mt-3 max-w-xl text-[15px] font-normal leading-6 text-slate-700 sm:text-base">
                {hero.summary}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm font-medium text-slate-600">
                <span className="rounded-full border border-white/80 bg-white/70 px-2.5 py-1">
                  {cropName}
                </span>
                <span className="rounded-full border border-white/80 bg-white/70 px-2.5 py-1">
                  {districtName}
                </span>
              </p>
            </div>
          </div>

          <section
            aria-labelledby="decision-price-summary-heading"
            className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[0_12px_30px_-28px_rgba(15,23,42,0.35)]"
          >
            <div className="flex items-center justify-between gap-3">
              <h2
                id="decision-price-summary-heading"
                className="text-lg font-semibold text-slate-950"
              >
                Price summary
              </h2>
              <span
                className={`rounded-full bg-white/75 px-2.5 py-1 text-xs font-medium ${tone.accent}`}
              >
                {priceDifferenceSummary}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
              <div className="min-w-0">
                <dt className="text-[13px] font-medium text-slate-600">
                  {currentPriceLabel}
                </dt>
                <dd className="mt-1 break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-[1.7rem]">
                  {formatPrice(currentPrice, currentPriceUnavailableText)}
                </dd>
              </div>
              <span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <ArrowRightIcon className="size-4" aria-hidden="true" />
                <span className="sr-only">compared with</span>
              </span>
              <div className="min-w-0">
                <dt className="text-[13px] font-medium text-teal-700">
                  Expected next-period price
                </dt>
                <dd className="mt-1 break-words text-2xl font-semibold tracking-tight text-teal-900 sm:text-[1.7rem]">
                  {formatPrice(predictedPrice, 'Estimate unavailable')}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <div className="grid items-stretch gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <section
          aria-labelledby="wholesale-impact-heading"
          className="decision-enter decision-delay-1 rounded-[1.4rem] border border-emerald-100 bg-white p-4 shadow-[0_14px_34px_-32px_rgba(5,100,70,0.45)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <BanknotesIcon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2
                  id="wholesale-impact-heading"
                  className="text-lg font-semibold text-slate-950"
                >
                  Wholesale financial impact
                </h2>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600">
              {quantitySummary}
            </p>
          </div>

          <dl className="mt-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
              <div className="min-w-0 border-b border-slate-200 pb-2">
                <dt className="text-[13px] font-medium text-slate-600">Today</dt>
                <dd className="mt-1 break-words text-2xl font-semibold tracking-tight text-slate-950">
                  {formatCurrency(currentGross, currentPriceUnavailableText)}
                </dd>
              </div>
              <span className="flex size-8 items-center justify-center rounded-full bg-slate-50 text-slate-500">
                <ArrowRightIcon className="size-4" aria-hidden="true" />
                <span className="sr-only">then expected</span>
              </span>
              <div className="min-w-0 border-b border-emerald-300 pb-2">
                <dt className="text-[13px] font-medium text-emerald-700">
                  Expected
                </dt>
                <dd className="mt-1 break-words text-2xl font-semibold tracking-tight text-emerald-900">
                  {formatCurrency(expectedGross, 'Estimate unavailable')}
                </dd>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 rounded-xl bg-amber-50/65 px-3.5 py-2.5">
              <div>
                <dt className="text-[13px] font-medium text-amber-800">
                  Potential gross difference
                </dt>
                <p className="mt-0.5 text-[13px] font-normal leading-5 text-slate-600">
                  Presentation estimate, not guaranteed earnings
                </p>
              </div>
              <dd className="text-2xl font-semibold tracking-tight text-amber-950">
                {formatSignedCurrency(grossDifference)}
              </dd>
            </div>
          </dl>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <section className="decision-enter decision-delay-2 flex items-start gap-3 rounded-[1.35rem] border border-emerald-100 bg-emerald-50/60 p-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
              <MapPinIcon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-950">
                Recommended market
              </h2>
              <p className="mt-0.5 truncate text-lg font-semibold tracking-tight text-slate-950">
                {recommendedMarketName}
              </p>
            </div>
          </section>

          <section
            className="decision-enter decision-delay-3 rounded-[1.35rem] border border-sky-100 bg-sky-50/55 p-3.5"
            aria-labelledby="weather-impact-heading"
            data-testid="weather-impact-summary"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm">
                <CloudIcon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <h2
                    id="weather-impact-heading"
                    className="text-sm font-semibold text-slate-950"
                  >
                    Weather impact
                  </h2>
                  <span className="text-[13px] font-normal text-sky-800">
                    {weatherImpact.rainLabel}
                  </span>
                </div>
                <p className="mt-0.5 text-sm font-medium leading-5 text-slate-800">
                  {weatherImpact.headline}
                </p>
                <p className="text-[13px] font-normal leading-5 text-slate-600">
                  {weatherImpact.guidance}
                </p>
                <button
                  type="button"
                  onClick={() => toggleSection('weather')}
                  aria-expanded={openSection === 'weather'}
                  aria-controls="decision-detail-weather"
                  className="mt-1 inline-flex min-h-8 items-center gap-1 text-[13px] font-medium text-sky-800 hover:text-sky-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
                >
                  View 7-day forecast
                  <ChevronDownIcon
                    className={`size-3.5 transition-transform duration-200 motion-reduce:transition-none ${
                      openSection === 'weather' ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </section>

          <section className="decision-enter decision-delay-3 flex items-start gap-3 rounded-[1.35rem] border border-amber-100 bg-amber-50/55 p-3.5 sm:col-span-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
              <LightBulbIcon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-950">
                What should I do?
              </h2>
              <div className="mt-1 space-y-1">
                {guidanceItems.map((item) => (
                  <p
                    key={item}
                    className="flex items-start gap-1.5 text-[13px] font-normal leading-5 text-slate-700"
                  >
                    <CheckCircleIcon
                      className="mt-0.5 size-3.5 shrink-0 text-amber-700"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </p>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <section aria-label="Supporting recommendation details">
        <div className="grid gap-2 sm:grid-cols-3">
          <DetailControl
            detailKey="why"
            label="Why this decision?"
            summary={priceDifferenceSummary}
            icon={<QuestionMarkCircleIcon className="size-5" aria-hidden="true" />}
            open={openSection === 'why'}
            onToggle={toggleSection}
          />
          <DetailControl
            detailKey="weather"
            label="Weather forecast"
            summary={weatherSummary}
            icon={<CloudIcon className="size-5" aria-hidden="true" />}
            open={openSection === 'weather'}
            onToggle={toggleSection}
          />
          <DetailControl
            detailKey="outlook"
            label="Market outlook"
            summary={marketOutlook ? MARKET_OUTLOOK_LABELS[marketOutlook.status] : 'Limited'}
            icon={<InformationCircleIcon className="size-5" aria-hidden="true" />}
            open={openSection === 'outlook'}
            onToggle={toggleSection}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-end gap-1.5">
          {hasAdditionalGuidance && (
            <SecondaryDetailControl
              detailKey="guidance"
              label="Additional guidance"
              icon={<SparklesIcon className="size-4" aria-hidden="true" />}
              open={openSection === 'guidance'}
              onToggle={toggleSection}
            />
          )}
          <SecondaryDetailControl
            detailKey="technical"
            label="Technical details"
            icon={<Cog6ToothIcon className="size-4" aria-hidden="true" />}
            open={openSection === 'technical'}
            onToggle={toggleSection}
          />
        </div>

        {expandedPanel(
          'why',
          'Why this decision?',
          <div className="flex items-start gap-3">
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}>
              <DecisionIcon decision={decision} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Why this decision?
              </h2>
              <p className="mt-1 text-[15px] leading-6 text-slate-700">
                {whyDecision}
              </p>
              <p className="mt-2 text-sm leading-5 text-slate-500">
                {decisionMessage}
              </p>
            </div>
          </div>
        )}

        {expandedPanel(
          'outlook',
          'Market outlook',
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-950">
                Market outlook
              </h2>
              <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
                {marketOutlook
                  ? MARKET_OUTLOOK_LABELS[marketOutlook.status]
                  : 'Limited'}
              </span>
            </div>
            <p className="mt-2 text-[15px] leading-6 text-slate-700">
              {marketOutlookPresentation?.summary ??
                'Detailed market outlook evidence is not available.'}
            </p>
            <dl className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <dt className="text-xs font-medium text-slate-500">Direction</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                  {displayedDirectionSignal}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <dt className="text-xs font-medium text-slate-500">Alignment</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                  {displayedSignalAlignment}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <dt className="text-xs font-medium text-slate-500">Confidence</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                  {displayedConfidence}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {expandedPanel(
          'weather',
          'Weather forecast',
          <div>
            <h2 className="sr-only">Weather forecast</h2>
            {weatherForecast ? (
              <WeatherForecastStrip forecast={weatherForecast} />
            ) : (
              <p className="text-sm text-slate-600">
                Weather forecast is not available for this recommendation.
              </p>
            )}
          </div>
        )}

        {hasAdditionalGuidance &&
          expandedPanel(
            'guidance',
            'Additional guidance',
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Additional guidance
              </h2>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {additionalGuidance.map((item) => (
                  <p
                    key={item}
                    className="rounded-xl bg-amber-50/70 px-3 py-2.5 text-sm leading-5 text-slate-700"
                  >
                    {item}
                  </p>
                ))}
              </div>
            </div>
          )}

        {expandedPanel(
          'technical',
          'Technical details',
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Technical details
            </h2>
            <dl className="mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Action authorized', actionAuthorized === undefined ? 'Not reported' : actionAuthorized ? 'Yes' : 'No'],
                ['Action policy', actionPolicy ?? 'Not reported'],
                ['Reason codes', actionReasonCodes.length > 0 ? actionReasonCodes.join(', ') : 'Not reported'],
                ['Persistence baseline', formatPrice(persistenceNextPrice, 'Not available')],
                ['Classifier confidence', displayedConfidence],
                ['Outlook alignment', displayedSignalAlignment],
                ['Price source', pricePredictionSource ?? 'Not reported'],
                ['Model role', modelRole ?? 'Not reported'],
                ['Model run', modelRunId ?? 'Not reported'],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-xs font-medium text-slate-500">{label}</dt>
                  <dd className="mt-0.5 break-words text-sm font-semibold text-slate-800">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            {modelMetricPresentations.length > 0 && (
              <dl className="mt-3 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-4">
                {modelMetricPresentations.map((metric) => (
                  <div key={metric.key} className="rounded-xl bg-sky-50/70 px-3 py-2">
                    <dt className="text-xs font-medium text-slate-500">
                      {metric.label}
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                      {metric.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onViewMarketDetails}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 sm:w-auto motion-reduce:transform-none motion-reduce:transition-none"
        >
          View Market Details
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </button>
      </div>

      <style jsx>{`
        @keyframes decision-enter {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes decision-icon-enter {
          from {
            opacity: 0;
            transform: scale(0.86);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .decision-enter {
          animation: decision-enter 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .decision-icon {
          animation: decision-icon-enter 380ms cubic-bezier(0.22, 1, 0.36, 1)
            80ms both;
        }

        .decision-delay-1 {
          animation-delay: 70ms;
        }

        .decision-delay-2 {
          animation-delay: 120ms;
        }

        .decision-delay-3 {
          animation-delay: 170ms;
        }

        @media (prefers-reduced-motion: reduce) {
          .decision-enter,
          .decision-icon {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
