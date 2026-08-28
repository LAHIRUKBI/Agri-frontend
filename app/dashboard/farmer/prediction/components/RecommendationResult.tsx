'use client';

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
  BeakerIcon,
  ChevronDownIcon,
  CloudIcon,
  InformationCircleIcon,
  ScaleIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';

import {
  getMarketOutlookPresentation,
  getModelSignalAlignment,
  type ActionDecision,
  type AiInsights,
  type MarketOutlookResponse,
  type WeatherForecast,
} from '../recommendationContract';
import {
  calculateModelImpliedHarvestValue,
  resolveEarningsQuantity,
} from './EarningsSummaryCards';
import MLPredictionOutput from './MLPredictionOutput';
import TransparencyNote from './TransparencyNote';
import {
  getNextResultPage,
  getPreviousResultPage,
  type ResultJourneyPage,
} from './sell-advisor/resultJourney';
import DecisionPageDashboard from './sell-advisor/DecisionPageDashboard';
import {
  formatDetailsPrice,
  formatDetailsPriceDifference,
  formatDetailsSignalLabel,
  getDetailsDecisionPresentation,
} from './sell-advisor/detailsPagePresentation';
import MarketPageComparison from './sell-advisor/MarketPageComparison';
import type { MarketPageMarket } from './sell-advisor/marketPagePresentation';
import { getModelMetricPresentations } from './sell-advisor/modelPerformance';

type ProbabilityMap = {
  UP?: number | string;
  DOWN?: number | string;
};

type FarmerOutcomeSignal = {
  direction?: string | null;
  message?: string | null;
  change_rs_per_kg?: number | string | null;
  change_pct?: number | string | null;
  value_change_rs?: number | string | null;
};

type DirectionModelSignal = {
  prediction?: string | null;
  confidence_probability?: number | string | null;
  confidence_label?: string | null;
  up_probability?: number | string | null;
  down_probability?: number | string | null;
  probabilities?: ProbabilityMap | null;
};

type MarketContextSignal = {
  trend?: string | null;
  message?: string | null;
};

type CurrentPriceSource = 'manual' | 'system' | 'system_reference';

type MarketResult = {
  market?: string;
  market_name?: string;
  name?: string;
  prediction?: string | null;
  trend?: string | null;
  probability?: number | string | null;
  confidence?: number | string | null;
  up_probability?: number | string | null;
  down_probability?: number | string | null;
  probabilities?: ProbabilityMap | null;
  current_price?: number | string;
  current_price_rs_kg?: number | string;
  reference_price_rs_kg?: number | string;
  predicted_price_rs_kg?: number | string | null;
  resolved_current_price_rs_kg?: number | string | null;
  resolved_current_price_at?: string | null;
  persistence_next_price_rs_kg?: number | string | null;
  action_decision?: ActionDecision | null;
  action_decision_message?: string | null;
  action_reason_codes?: string[];
  action_authorized?: boolean;
  action_policy?: string | null;
  price_prediction_source?: string | null;
  price_model_metrics?: Record<string, unknown> | null;
  model_run_id?: string | null;
  model_role?: string | null;
  farmer_outcome_signal?: FarmerOutcomeSignal | null;
  direction_model_signal?: DirectionModelSignal | null;
  market_context_signal?: MarketContextSignal | null;
  farmer_decision?: string | null;
  farmer_decision_message?: string | null;
  source_type?: string;
  history_basis?: string;
  fallback_used?: boolean;
  is_market_specific?: boolean;
  comparison_quality?: string;
  source?: string;
};

type MarketLike = string | MarketResult | null | undefined;

type SubmittedInput = {
  crop?: string;
  district?: string;
  farmer_district?: string;
  price_rs_kg?: number;
  current_price_source?: CurrentPriceSource;
  price_source_mode?: CurrentPriceSource;
  harvest_input_mode?: 'range' | 'exact';
  quantity_kg?: number;
  quantity_min_kg?: number;
  quantity_max_kg?: number;
  quantity_range_label?: string;
  exact_quantity_kg?: number;
  horizon?: number;
} | null;

type AvailableMarket =
  | string
  | {
      value?: string;
      label?: string;
    };

type RecommendationData = MarketOutlookResponse & {
  recommended_market?: MarketLike;
  best_farmer_return_market?: MarketLike;
  nearest_market?: MarketLike;
  primary_mapped_market?: MarketLike;
  available_markets?: AvailableMarket[];
  comparisons?: MarketLike[];
  market_comparisons?: MarketLike[];
  farmer_district?: string;
  best_market?: MarketLike;
  best_predicted_market?: MarketLike;
  farmer_outcome_signal?: FarmerOutcomeSignal | null;
  direction_model_signal?: DirectionModelSignal | null;
  market_context_signal?: MarketContextSignal | null;
  action_decision?: ActionDecision | null;
  action_decision_message?: string | null;
  action_reason_codes?: string[];
  action_authorized?: boolean;
  action_policy?: string | null;
  persistence_next_price_rs_kg?: number | string | null;
  recommendation_basis?: string | null;
  comparison_note?: string | null;
  comparison_strength?: string;
  is_close_call?: boolean;
  ai_insights?: AiInsights | null;
  weather_forecast?: WeatherForecast | null;
  input?: SubmittedInput;
};

type Props = {
  result: unknown;
  loading?: boolean;
  submittedInput?: SubmittedInput;
  activePage: ResultJourneyPage;
  onPageChange: (page: ResultJourneyPage) => void;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;

  if (typeof value === 'string') {
    const parsed = Number(value.replace('%', '').trim());
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
};

const getText = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const normalizePercent = (value: unknown): number | null => {
  const parsed = toNumber(value);
  if (parsed === null) return null;
  return parsed >= 0 && parsed <= 1 ? parsed * 100 : parsed;
};

const getConfidenceLabel = (value: number | null) => {
  if (value === null) return null;
  if (value < 60) return 'Low';
  if (value < 75) return 'Moderate';
  return 'Strong';
};

const formatMarketName = (name: string) => {
  if (!name || name === '-') return 'Not available';

  const knownNames: Record<string, string> = {
    nuwaraeliya: 'Nuwara Eliya',
    nuwara_eliya: 'Nuwara Eliya',
    'nuwara-eliya': 'Nuwara Eliya',
  };

  const normalized = name.trim().toLowerCase().replace(/\s+/g, '');
  if (knownNames[normalized]) return knownNames[normalized];

  return name
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const getMarketObject = (market: MarketLike): MarketResult | null =>
  market && typeof market !== 'string' ? market : null;

const getMarketName = (market: MarketLike) => {
  if (!market) return 'Not available';
  const rawName =
    typeof market === 'string'
      ? market
      : market.market || market.market_name || market.name || '';

  return formatMarketName(rawName);
};

const getMarketIdentity = (market: MarketLike) =>
  getMarketName(market).trim().toLowerCase();

const getMarketPredictedPrice = (market: MarketLike) => {
  const marketObject = getMarketObject(market);
  return toNumber(marketObject?.predicted_price_rs_kg);
};

const getMarketCurrentPrice = (market: MarketLike) => {
  const marketObject = getMarketObject(market);
  if (!marketObject) return null;

  return (
    toNumber(marketObject.resolved_current_price_rs_kg) ??
    toNumber(marketObject.current_price_rs_kg) ??
    toNumber(marketObject.current_price) ??
    toNumber(marketObject.reference_price_rs_kg)
  );
};

const getDirectionPresentation = (
  market: MarketLike,
  fallbackSignal?: DirectionModelSignal | null
) => {
  const marketObject = getMarketObject(market);
  const directionSignal = marketObject?.direction_model_signal ?? fallbackSignal;
  const directionValue =
    getText(directionSignal?.prediction) ??
    getText(marketObject?.prediction) ??
    getText(marketObject?.trend) ??
    'Not available';
  const directionUpper = directionValue.toUpperCase();
  const upProbability =
    normalizePercent(directionSignal?.up_probability) ??
    normalizePercent(directionSignal?.probabilities?.UP) ??
    normalizePercent(marketObject?.up_probability) ??
    normalizePercent(marketObject?.probabilities?.UP);
  const downProbability =
    normalizePercent(directionSignal?.down_probability) ??
    normalizePercent(directionSignal?.probabilities?.DOWN) ??
    normalizePercent(marketObject?.down_probability) ??
    normalizePercent(marketObject?.probabilities?.DOWN);
  const legacyConfidence =
    directionUpper === 'UP' && upProbability !== null
      ? upProbability
      : directionUpper === 'DOWN' && downProbability !== null
        ? downProbability
        : normalizePercent(marketObject?.probability) ??
          normalizePercent(marketObject?.confidence) ??
          (upProbability !== null || downProbability !== null
            ? Math.max(upProbability ?? 0, downProbability ?? 0)
            : null);
  const confidenceProbability =
    normalizePercent(directionSignal?.confidence_probability) ?? legacyConfidence;
  const confidenceLabel =
    getText(directionSignal?.confidence_label) ??
    getConfidenceLabel(confidenceProbability);
  const confidenceText =
    confidenceProbability === null
      ? 'Not available'
      : `${confidenceProbability.toFixed(2)}%${
          confidenceLabel ? ` • ${confidenceLabel}` : ''
        }`;

  return {
    directionValue,
    directionUpper,
    upProbability,
    downProbability,
    confidenceProbability,
    confidenceText,
  };
};

const getAvailableMarketName = (market: AvailableMarket) =>
  typeof market === 'string' ? market : market.label || market.value || '';

const formatReportedBoolean = (value: boolean | undefined) => {
  if (value === undefined) return 'Not reported';
  return value ? 'Yes' : 'No';
};

export default function RecommendationResult({
  result,
  loading,
  submittedInput,
  activePage,
  onPageChange,
}: Props) {
  if (loading) {
    return (
      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">
          Processing recommendation
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Reviewing market information and your selling scenario...
        </p>
      </div>
    );
  }

  if (!result) return null;

  const recommendation = result as RecommendationData;
  const { input } = recommendation;
  const recommendedMarket = recommendation.recommended_market ?? null;
  const selectedMarket =
    recommendedMarket ??
    recommendation.best_farmer_return_market ??
    recommendation.nearest_market ??
    recommendation.best_predicted_market ??
    null;
  const selectedMarketObject = getMarketObject(selectedMarket);

  const cropNameRaw = submittedInput?.crop || input?.crop || 'Crop';
  const cropName = formatMarketName(String(cropNameRaw));
  const districtNameRaw =
    submittedInput?.farmer_district ||
    input?.farmer_district ||
    recommendation.farmer_district ||
    submittedInput?.district ||
    input?.district ||
    'your district';
  const districtName = formatMarketName(String(districtNameRaw));
  const recommendedMarketName = getMarketName(recommendedMarket);
  const recommendedMarketIdentity = getMarketIdentity(recommendedMarket);

  const actionDecision =
    selectedMarketObject?.action_decision ??
    recommendation.action_decision ??
    'UNCERTAIN';
  const actionDecisionMessage =
    selectedMarketObject?.action_decision_message ??
    recommendation.action_decision_message ??
    'Timing evidence is not available.';
  const actionReasonCodes =
    selectedMarketObject?.action_reason_codes ??
    recommendation.action_reason_codes ??
    [];
  const actionAuthorized =
    selectedMarketObject?.action_authorized ?? recommendation.action_authorized;
  const actionPolicy =
    selectedMarketObject?.action_policy ?? recommendation.action_policy;
  const persistenceNextPrice =
    toNumber(selectedMarketObject?.persistence_next_price_rs_kg) ??
    toNumber(recommendation.persistence_next_price_rs_kg);

  const rawCurrentPriceSource =
    submittedInput?.current_price_source ??
    input?.current_price_source ??
    submittedInput?.price_source_mode ??
    input?.price_source_mode ??
    'manual';
  const priceSourceMode =
    rawCurrentPriceSource === 'system' ||
    rawCurrentPriceSource === 'system_reference'
      ? 'system_reference'
      : 'manual';
  const manualCurrentPrice = toNumber(
    submittedInput?.price_rs_kg ?? input?.price_rs_kg
  );
  const systemCurrentPrice =
    getMarketCurrentPrice(recommendedMarket) ?? getMarketCurrentPrice(selectedMarket);
  const selectedCurrentPrice =
    priceSourceMode === 'system_reference'
      ? systemCurrentPrice
      : manualCurrentPrice;
  const currentPriceLabel =
    priceSourceMode === 'system_reference'
      ? `Latest Recorded Market Price${
          selectedMarketObject?.resolved_current_price_at
            ? ` (${selectedMarketObject.resolved_current_price_at})`
            : ''
        }`
      : 'Current Price';
  const currentPriceUnavailableText =
    priceSourceMode === 'system_reference'
      ? 'Latest recorded market price unavailable'
      : 'Current price unavailable';
  const predictedPrice = getMarketPredictedPrice(selectedMarket);
  const priceDifference =
    predictedPrice === null || selectedCurrentPrice === null
      ? null
      : predictedPrice - selectedCurrentPrice;

  const quantity = Number(
    submittedInput?.quantity_kg ?? input?.quantity_kg ?? 0
  );
  const harvestInputMode =
    submittedInput?.harvest_input_mode || input?.harvest_input_mode || 'range';
  const quantityMin = Number(
    submittedInput?.quantity_min_kg ?? input?.quantity_min_kg ?? quantity
  );
  const quantityMax = Number(
    submittedInput?.quantity_max_kg ?? input?.quantity_max_kg ?? quantity
  );
  const exactQuantity = Number(
    submittedInput?.exact_quantity_kg ?? input?.exact_quantity_kg ?? quantity
  );
  const quantityRangeLabel =
    submittedInput?.quantity_range_label || input?.quantity_range_label || '';
  const estimateQuantity = resolveEarningsQuantity({
    harvestInputMode,
    quantityMin,
    quantityMax,
    exactQuantity,
  });
  const direction = getDirectionPresentation(
    selectedMarket,
    recommendation.direction_model_signal
  );
  const priceComparison =
    predictedPrice === null || selectedCurrentPrice === null
      ? 'Not available'
      : predictedPrice > selectedCurrentPrice
        ? 'UP'
        : predictedPrice < selectedCurrentPrice
          ? 'DOWN'
          : 'STABLE';
  const priceComparisonDisplay =
    priceComparison === 'STABLE' ? 'No material change' : priceComparison;
  const signalAlignment = getModelSignalAlignment(
    predictedPrice,
    selectedCurrentPrice,
    direction.directionValue
  );
  const marketOutlook = recommendation.market_outlook ?? null;
  const marketOutlookPresentation =
    getMarketOutlookPresentation(marketOutlook);
  const displayedSignalAlignment =
    marketOutlook?.signal_alignment ?? signalAlignment;
  const displayedDirectionSignal = marketOutlook
    ? marketOutlook.direction_signal ?? 'Not available'
    : direction.directionValue;
  const displayedConfidence =
  marketOutlookPresentation?.confidenceLabel ??
  (direction.confidenceProbability === null
    ? 'Not available'
    : direction.confidenceText);
  const modelMetricPresentations = getModelMetricPresentations(
    selectedMarketObject?.price_model_metrics
  );

  const aiInsights = recommendation.ai_insights;
  const practicalAction = getText(aiInsights?.suggested_action);
  const detailsDecision = getDetailsDecisionPresentation(actionDecision);
  const detailsDecisionTone =
    actionDecision === 'SELL_NOW'
      ? {
          shell: 'border-emerald-200 bg-emerald-50/70',
          badge: 'bg-emerald-700 text-white',
          accent: 'text-emerald-900',
        }
      : actionDecision === 'WAIT'
        ? {
            shell: 'border-amber-200 bg-amber-50/70',
            badge: 'bg-amber-600 text-white',
            accent: 'text-amber-950',
          }
        : {
            shell: 'border-slate-200 bg-slate-50/80',
            badge: 'bg-slate-700 text-white',
            accent: 'text-slate-900',
          };
  const supportingDirectionLabel = formatDetailsSignalLabel(
    displayedDirectionSignal
  );
  const marketOutlookExplanation =
    getText(aiInsights?.prediction_summary) ??
    marketOutlookPresentation?.summary ??
    'No detailed market outlook was reported for this recommendation.';
  const additionalContextItems = [
    {
      key: 'recommendation',
      label: 'Recommendation',
      value: getText(aiInsights?.recommendation),
    },
    {
      key: 'price_movement',
      label: 'Expected market movement',
      value: getText(aiInsights?.price_movement),
    },
    {
      key: 'prediction_strength',
      label: 'Prediction strength',
      value: getText(aiInsights?.prediction_strength),
    },
  ].flatMap((item) => (item.value ? [{ ...item, value: item.value }] : []));

  const richMarketComparisons =
    recommendation.market_comparisons?.length
      ? recommendation.market_comparisons
      : recommendation.comparisons ?? [];
  const availableMarketNames = (recommendation.available_markets ?? [])
    .map(getAvailableMarketName)
    .filter((marketName): marketName is string => Boolean(marketName));
  const candidateMarkets: Array<Exclude<MarketLike, null | undefined>> =
    richMarketComparisons.length > 0
      ? richMarketComparisons.filter(
          (market): market is Exclude<MarketLike, null | undefined> =>
            market !== null && market !== undefined
        )
      : availableMarketNames;
  const recommendedMarketForPage =
    recommendedMarketIdentity !== 'not available'
      ? (candidateMarkets.find(
          (market) =>
            getMarketIdentity(market) === recommendedMarketIdentity &&
            getMarketObject(market) !== null
        ) ?? recommendedMarket)
      : null;
  const createMarketPageMarket = (
    market: Exclude<MarketLike, null | undefined>,
    isRecommended: boolean
  ): MarketPageMarket => {
    const expectedPrice = getMarketPredictedPrice(market);
    const marketDirection = getDirectionPresentation(market);

    return {
      id: getMarketIdentity(market),
      name: getMarketName(market),
      currentPrice: getMarketCurrentPrice(market),
      expectedPrice,
      harvestValue: calculateModelImpliedHarvestValue(
        expectedPrice,
        estimateQuantity
      ),
      direction: marketDirection.directionValue,
      isRecommended,
    };
  };
  const marketPageMarkets: MarketPageMarket[] = [
    ...(recommendedMarketForPage
      ? [createMarketPageMarket(recommendedMarketForPage, true)]
      : []),
    ...candidateMarkets
      .filter(
        (market) =>
          getMarketIdentity(market) !== 'not available' &&
          getMarketIdentity(market) !== recommendedMarketIdentity
      )
      .map((market) => createMarketPageMarket(market, false)),
  ];

  return (
    <div
      id={`result-page-${activePage}`}
      aria-labelledby={`${activePage}-page-heading`}
      className="mt-2 outline-none"
    >
      {activePage === 'decision' && (
        <DecisionPageDashboard
          decision={actionDecision}
          decisionMessage={actionDecisionMessage}
          cropName={cropName}
          districtName={districtName}
          currentPriceLabel={currentPriceLabel}
          currentPriceUnavailableText={currentPriceUnavailableText}
          currentPrice={selectedCurrentPrice}
          predictedPrice={predictedPrice}
          priceDifference={priceDifference}
          quantity={estimateQuantity}
          quantityRangeLabel={
            harvestInputMode === 'range' ? quantityRangeLabel : undefined
          }
          recommendedMarketName={recommendedMarketName}
          practicalAction={practicalAction}
          aiInsights={aiInsights}
          actionAuthorized={actionAuthorized}
          actionPolicy={actionPolicy}
          actionReasonCodes={actionReasonCodes}
          persistenceNextPrice={persistenceNextPrice}
          marketOutlook={marketOutlook}
          marketOutlookPresentation={marketOutlookPresentation}
          displayedConfidence={displayedConfidence}
          displayedSignalAlignment={displayedSignalAlignment}
          displayedDirectionSignal={displayedDirectionSignal}
          modelMetricPresentations={modelMetricPresentations}
          pricePredictionSource={getText(
            selectedMarketObject?.price_prediction_source
          )}
          modelRunId={getText(selectedMarketObject?.model_run_id)}
          modelRole={getText(selectedMarketObject?.model_role)}
          weatherForecast={recommendation.weather_forecast}
          onViewMarketDetails={() =>
            onPageChange(getNextResultPage(activePage))
          }
        />
      )}

      {activePage === 'market' && (
        <MarketPageComparison
          cropName={cropName}
          districtName={districtName}
          markets={marketPageMarkets}
          onBack={() => onPageChange(getPreviousResultPage(activePage))}
          onViewDetails={() => onPageChange(getNextResultPage(activePage))}
        />
      )}

      {activePage === 'details' && (
        <section
          className="space-y-3.5"
          data-testid="details-explainability-page"
        >
          <header className="details-enter rounded-[1.55rem] border border-emerald-100 bg-[linear-gradient(120deg,#f1faf4_0%,#fffdf7_100%)] px-4 py-3 shadow-[0_16px_38px_-34px_rgba(5,100,70,0.45)] sm:px-5">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-teal-700">
              Why this recommendation
            </p>
            <h1
              id="details-page-heading"
              className="mt-0.5 text-3xl font-bold tracking-tight text-emerald-950 sm:text-[2.15rem]"
            >
              How did the system decide?
            </h1>
            <p className="mt-1 text-[15px] font-normal leading-5 text-slate-600">
              See the price comparison first, then open supporting or technical
              evidence if you need it.
            </p>
          </header>

          <div className="grid items-start gap-3.5 lg:grid-cols-[minmax(0,1.06fr)_minmax(320px,0.94fr)]">
            <div className="grid min-w-0 gap-3.5">
              <section
                aria-labelledby="decision-summary-heading"
                data-testid="details-decision-summary"
                data-action-decision={actionDecision}
                className={`details-enter details-delay-1 rounded-[1.4rem] border p-4 shadow-[0_14px_34px_-32px_rgba(5,100,70,0.45)] transition duration-200 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none ${detailsDecisionTone.shell}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2
                    id="decision-summary-heading"
                    className="text-lg font-semibold text-slate-950"
                  >
                    Decision summary
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${detailsDecisionTone.badge}`}
                  >
                    Price-comparison decision
                  </span>
                </div>
                <p
                  className={`mt-2 text-2xl font-semibold tracking-tight ${detailsDecisionTone.accent}`}
                  data-testid="canonical-details-decision"
                >
                  {detailsDecision.label}
                </p>
                <dl className="mt-3 grid min-w-0 grid-cols-3 gap-2">
                  <div className="min-w-0 rounded-xl bg-white/75 px-3 py-2.5">
                    <dt className="text-[13px] font-medium leading-4 text-slate-600">
                      Current price
                    </dt>
                    <dd className="mt-1 break-words text-sm font-semibold text-slate-950">
                      {formatDetailsPrice(
                        selectedCurrentPrice,
                        currentPriceUnavailableText
                      )}
                    </dd>
                  </div>
                  <div className="min-w-0 rounded-xl bg-white/75 px-3 py-2.5">
                    <dt className="text-[13px] font-medium leading-4 text-slate-600">
                      Expected price
                    </dt>
                    <dd className="mt-1 break-words text-sm font-semibold text-slate-950">
                      {formatDetailsPrice(
                        predictedPrice,
                        'Estimate unavailable'
                      )}
                    </dd>
                  </div>
                  <div className="min-w-0 rounded-xl bg-white/75 px-3 py-2.5">
                    <dt className="text-[13px] font-medium leading-4 text-slate-600">
                      Difference per kg
                    </dt>
                    <dd
                      className="mt-1 break-words text-sm font-semibold text-slate-950"
                      data-testid="details-price-difference"
                    >
                      {formatDetailsPriceDifference(priceDifference)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 border-t border-white/80 pt-3 text-[13px] font-normal leading-5 text-slate-700">
                  The selling decision is based on how the expected next-period
                  price compares with today&apos;s price.
                </p>
              </section>

              <section
                aria-labelledby="price-evidence-heading"
                data-testid="details-price-evidence"
                className="details-enter details-delay-2 rounded-[1.4rem] border border-emerald-100 bg-white p-4 shadow-[0_14px_34px_-32px_rgba(5,100,70,0.4)] transition duration-200 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <BanknotesIcon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2
                      id="price-evidence-heading"
                      className="text-lg font-semibold text-slate-950"
                    >
                      Price evidence
                    </h2>
                    <p className="text-[13px] font-normal leading-5 text-slate-500">
                      The primary evidence behind the decision.
                    </p>
                  </div>
                </div>

                <dl className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2.5">
                  <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5">
                    <dt className="text-[13px] font-medium leading-4 text-slate-600">
                      Current price
                    </dt>
                    <dd className="mt-1 break-words text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
                      {formatDetailsPrice(
                        selectedCurrentPrice,
                        currentPriceUnavailableText
                      )}
                    </dd>
                  </div>
                  <span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                    <ArrowRightIcon className="size-4" aria-hidden="true" />
                    <span className="sr-only">compared with</span>
                  </span>
                  <div className="min-w-0 rounded-xl bg-teal-50 px-3 py-2.5">
                    <dt className="text-[13px] font-medium leading-4 text-teal-700">
                      Expected next-period price
                    </dt>
                    <dd className="mt-1 break-words text-lg font-semibold tracking-tight text-teal-950 sm:text-xl">
                      {formatDetailsPrice(
                        predictedPrice,
                        'Estimate unavailable'
                      )}
                    </dd>
                  </div>
                </dl>

                <dl className="mt-3 grid min-w-0 grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                  <div className="min-w-0">
                    <dt className="text-[13px] font-medium text-slate-600">
                      Difference per kg
                    </dt>
                    <dd className="mt-0.5 text-[15px] font-semibold text-emerald-900">
                      {formatDetailsPriceDifference(priceDifference)}
                    </dd>
                  </div>
                  <div className="min-w-0 border-l border-slate-100 pl-3">
                    <dt className="text-[13px] font-medium text-slate-600">
                      Reference baseline
                    </dt>
                    <dd className="mt-0.5 break-words text-sm font-medium text-slate-800">
                      {formatDetailsPrice(
                        persistenceNextPrice,
                        'Baseline unavailable'
                      )}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>

            <div className="grid min-w-0 gap-3.5">
              <section
                aria-labelledby="practical-explanation-heading"
                data-testid="details-practical-explanation"
                className="details-enter details-delay-1 rounded-[1.4rem] border border-emerald-100 bg-white p-4 shadow-[0_14px_34px_-32px_rgba(5,100,70,0.4)] transition duration-200 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <CloudIcon className="size-5" aria-hidden="true" />
                  </span>
                  <h2
                    id="practical-explanation-heading"
                    className="text-lg font-semibold text-slate-950"
                  >
                    Practical explanation
                  </h2>
                </div>
                <div className="mt-3 grid gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      What this means
                    </h3>
                    <p className="mt-1 text-sm font-normal leading-5 text-slate-600">
                      {detailsDecision.explanation}
                    </p>
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <h3 className="text-sm font-semibold text-slate-900">
                      What you can do
                    </h3>
                    <p className="mt-1 text-sm font-normal leading-5 text-slate-600">
                      Compare confirmed buyer offers and selling costs before
                      finalizing the sale.
                    </p>
                  </div>
                </div>
              </section>

              <section
                aria-labelledby="supporting-evidence-heading"
                className="details-enter details-delay-2"
              >
                <div className="mb-2 px-1">
                  <h2
                    id="supporting-evidence-heading"
                    className="text-base font-semibold text-slate-900"
                  >
                    Supporting evidence
                  </h2>
                  <p className="mt-0.5 text-[13px] font-normal leading-5 text-slate-500">
                    Open a section for more context; none of these signals
                    replaces the price decision.
                  </p>
                </div>

                <div className="grid gap-2.5">
                  <details
                    data-testid="market-direction-signal-accordion"
                    className="group rounded-2xl border border-teal-100 bg-white shadow-[0_12px_28px_-28px_rgba(15,118,110,0.45)]"
                  >
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-semibold text-slate-800 transition-colors duration-200 hover:bg-teal-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 motion-reduce:transition-none [&::-webkit-details-marker]:hidden">
                      <span className="inline-flex min-w-0 items-center gap-2.5">
                        <SignalIcon
                          className="size-[18px] shrink-0 text-teal-700"
                          aria-hidden="true"
                        />
                        <span className="break-words">
                          Market direction signal
                        </span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-2">
                        <span className="text-[13px] font-medium text-teal-700">
                          {supportingDirectionLabel}
                        </span>
                        <ChevronDownIcon
                          className="size-[18px] transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                          aria-hidden="true"
                        />
                      </span>
                    </summary>
                    <div className="details-accordion-content border-t border-teal-100 px-4 py-3.5">
                      <p className="rounded-xl bg-teal-50/70 px-3 py-2.5 text-[13px] font-medium leading-5 text-teal-950">
                        This signal describes expected market direction and does
                        not determine the canonical Sell/Wait action.
                      </p>
                      <dl className="mt-3 grid min-w-0 grid-cols-3 gap-3">
                        <div className="min-w-0">
                          <dt className="text-[13px] font-normal text-slate-500">
                            Direction
                          </dt>
                          <dd className="mt-0.5 break-words text-sm font-medium text-slate-900">
                            {supportingDirectionLabel}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-[13px] font-normal text-slate-500">
                            Confidence
                          </dt>
                          <dd className="mt-0.5 break-words text-sm font-medium text-slate-900">
                            {displayedConfidence}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-[13px] font-normal text-slate-500">
                            Signal alignment
                          </dt>
                          <dd className="mt-0.5 break-words text-xs font-medium text-slate-700">
                            {displayedSignalAlignment}
                          </dd>
                        </div>
                      </dl>
                      <p className="mt-3 border-t border-slate-100 pt-3 text-[13px] font-normal leading-5 text-slate-600">
                        The direction model indicates{' '}
                        {supportingDirectionLabel.toLowerCase()} movement for the
                        next market period.
                      </p>
                    </div>
                  </details>

                  <details
                    data-testid="market-outlook-accordion"
                    className="group rounded-2xl border border-teal-100 bg-white shadow-[0_12px_28px_-28px_rgba(15,118,110,0.45)]"
                  >
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-semibold text-slate-800 transition-colors duration-200 hover:bg-teal-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 motion-reduce:transition-none [&::-webkit-details-marker]:hidden">
                      <span className="inline-flex min-w-0 items-center gap-2.5">
                        <ArrowsRightLeftIcon
                          className="size-[18px] shrink-0 text-teal-700"
                          aria-hidden="true"
                        />
                        <span className="break-words">Market outlook</span>
                      </span>
                      <ChevronDownIcon
                        className="size-[18px] shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                        aria-hidden="true"
                      />
                    </summary>
                    <div className="details-accordion-content border-t border-teal-100 px-4 py-3.5">
                      <dl className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-3">
                        <div className="min-w-0">
                          <dt className="text-[13px] font-normal text-slate-500">
                            Outlook state
                          </dt>
                          <dd className="mt-0.5 break-words text-sm font-medium text-slate-900">
                            {marketOutlookPresentation?.title ?? 'Not reported'}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-[13px] font-normal text-slate-500">
                            Strength
                          </dt>
                          <dd className="mt-0.5 text-sm font-medium text-slate-900">
                            {formatDetailsSignalLabel(
                              marketOutlook?.strength ?? 'Not available'
                            )}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-[13px] font-normal text-slate-500">
                            Price comparison
                          </dt>
                          <dd className="mt-0.5 text-sm font-medium text-slate-900">
                            {formatDetailsSignalLabel(priceComparisonDisplay)}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-[13px] font-normal text-slate-500">
                            Direction evidence
                          </dt>
                          <dd className="mt-0.5 text-sm font-medium text-slate-900">
                            {supportingDirectionLabel}
                          </dd>
                        </div>
                      </dl>
                      <p className="mt-3 border-t border-slate-100 pt-3 text-[13px] font-normal leading-5 text-slate-600">
                        {marketOutlookExplanation}
                      </p>
                    </div>
                  </details>

                  <details
                    data-testid="additional-context-accordion"
                    className="group rounded-2xl border border-slate-200 bg-white shadow-[0_12px_28px_-28px_rgba(15,23,42,0.4)]"
                  >
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-semibold text-slate-800 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none [&::-webkit-details-marker]:hidden">
                      <span className="inline-flex min-w-0 items-center gap-2.5">
                        <InformationCircleIcon
                          className="size-[18px] shrink-0 text-slate-600"
                          aria-hidden="true"
                        />
                        <span className="break-words">Additional context</span>
                      </span>
                      <ChevronDownIcon
                        className="size-[18px] shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                        aria-hidden="true"
                      />
                    </summary>
                    <div className="details-accordion-content border-t border-slate-100 px-4 py-3.5">
                      {additionalContextItems.length > 0 ? (
                        <dl className="grid min-w-0 gap-3">
                          {additionalContextItems.map((item) => (
                            <div key={item.key} className="min-w-0">
                              <dt className="text-[13px] font-medium text-slate-600">
                                {item.label}
                              </dt>
                              <dd className="mt-0.5 break-words text-sm font-normal leading-5 text-slate-700">
                                {item.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="text-[13px] font-normal leading-5 text-slate-600">
                          No additional seller context was reported.
                        </p>
                      )}
                    </div>
                  </details>
                </div>
              </section>
            </div>
          </div>

          <section
            aria-labelledby="technical-trace-heading"
            className="details-enter details-delay-3"
          >
            <div className="mb-2 px-1">
              <h2
                id="technical-trace-heading"
                className="text-[13px] font-semibold uppercase tracking-[0.14em] text-slate-700"
              >
                Technical trace
              </h2>
              <p className="mt-0.5 text-[13px] font-normal leading-5 text-slate-500">
                Optional model, performance, and data details.
              </p>
            </div>

            <div className="grid items-start gap-2.5 lg:grid-cols-3">
              <details
                data-testid="model-decision-accordion"
                className="group rounded-2xl border border-slate-200 bg-white shadow-[0_12px_28px_-28px_rgba(15,23,42,0.4)] lg:open:col-span-3"
              >
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-semibold text-slate-800 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 motion-reduce:transition-none [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex min-w-0 items-center gap-2.5">
                    <BeakerIcon
                      className="size-[18px] shrink-0 text-teal-700"
                      aria-hidden="true"
                    />
                    <span className="break-words">Model &amp; Decision</span>
                  </span>
                  <ChevronDownIcon
                    className="size-[18px] shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </summary>
                <div className="details-accordion-content border-t border-slate-100 p-4">
                  <MLPredictionOutput
                    market={selectedMarket}
                    horizon={submittedInput?.horizon ?? input?.horizon}
                    priceSourceMode={priceSourceMode}
                    currentPrice={selectedCurrentPrice}
                    actionDecision={actionDecision}
                    actionDecisionMessage={actionDecisionMessage}
                    actionReasonCodes={actionReasonCodes}
                    actionAuthorized={actionAuthorized}
                    actionPolicy={actionPolicy}
                    persistenceNextPriceRsKg={persistenceNextPrice}
                    comparisonStrength={recommendation.comparison_strength}
                    comparisonNote={recommendation.comparison_note}
                    priceComparison={priceComparison}
                    signalAlignment={signalAlignment}
                    marketOutlook={marketOutlook}
                  />
                </div>
              </details>

              <details
                data-testid="model-performance-accordion"
                className="group rounded-2xl border border-slate-200 bg-white shadow-[0_12px_28px_-28px_rgba(15,23,42,0.4)] lg:open:col-span-3"
              >
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-semibold text-slate-800 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 motion-reduce:transition-none [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex min-w-0 items-center gap-2.5">
                    <ScaleIcon
                      className="size-[18px] shrink-0 text-sky-700"
                      aria-hidden="true"
                    />
                    <span className="break-words">Model Performance</span>
                  </span>
                  <ChevronDownIcon
                    className="size-[18px] shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </summary>
                <div className="details-accordion-content border-t border-slate-100 p-4">
                  {modelMetricPresentations.length > 0 ? (
                    <dl className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {modelMetricPresentations.map((metric) => (
                        <div
                          key={metric.key}
                          className="min-w-0 rounded-xl bg-sky-50/70 px-3 py-2.5"
                        >
                          <dt className="text-[13px] font-medium text-slate-500">
                            {metric.label}
                          </dt>
                          <dd className="mt-0.5 break-words text-[17px] font-semibold text-slate-950">
                            {metric.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-[13px] font-normal leading-5 text-slate-600">
                      No model performance metrics were reported.
                    </p>
                  )}
                  <p className="mt-3 text-[13px] font-normal leading-5 text-slate-600">
                    These are evaluation metrics for the experimental price model
                    and do not guarantee accuracy for an individual
                    recommendation.
                  </p>
                </div>
              </details>

              <details
                data-testid="data-limitations-accordion"
                className="group rounded-2xl border border-slate-200 bg-white shadow-[0_12px_28px_-28px_rgba(15,23,42,0.4)] lg:open:col-span-3"
              >
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-semibold text-slate-800 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex min-w-0 items-center gap-2.5">
                    <InformationCircleIcon
                      className="size-[18px] shrink-0 text-slate-600"
                      aria-hidden="true"
                    />
                    <span className="break-words">Data &amp; Limitations</span>
                  </span>
                  <ChevronDownIcon
                    className="size-[18px] shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </summary>
                <div className="details-accordion-content border-t border-slate-100 p-4">
                  <div className="grid min-w-0 gap-5 lg:grid-cols-2">
                    <section>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Data basis
                      </h3>
                      <dl className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        <div className="min-w-0">
                          <dt className="text-[13px] font-medium text-slate-500">
                            Price source
                          </dt>
                          <dd className="mt-0.5 break-words text-sm font-normal text-slate-700">
                            {getText(
                              selectedMarketObject?.price_prediction_source
                            ) ??
                              getText(selectedMarketObject?.source) ??
                              'Not reported'}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-[13px] font-medium text-slate-500">
                            History basis
                          </dt>
                          <dd className="mt-0.5 break-words text-sm font-normal text-slate-700">
                            {getText(selectedMarketObject?.history_basis) ??
                              'Not reported'}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-[13px] font-medium text-slate-500">
                            Source type
                          </dt>
                          <dd className="mt-0.5 break-words text-sm font-normal text-slate-700">
                            {getText(selectedMarketObject?.source_type) ??
                              'Not reported'}
                          </dd>
                        </div>
                      </dl>
                    </section>

                    <section>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Comparison quality
                      </h3>
                      <dl className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        <div className="min-w-0">
                          <dt className="text-[13px] font-medium text-slate-500">
                            Quality
                          </dt>
                          <dd className="mt-0.5 break-words text-sm font-normal text-slate-700">
                            {getText(selectedMarketObject?.comparison_quality) ??
                              'Not reported'}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-[13px] font-medium text-slate-500">
                            Market-specific
                          </dt>
                          <dd className="mt-0.5 text-sm font-normal text-slate-700">
                            {formatReportedBoolean(
                              selectedMarketObject?.is_market_specific
                            )}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-[13px] font-medium text-slate-500">
                            Fallback used
                          </dt>
                          <dd className="mt-0.5 text-sm font-normal text-slate-700">
                            {formatReportedBoolean(
                              selectedMarketObject?.fallback_used
                            )}
                          </dd>
                        </div>
                      </dl>
                    </section>
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <TransparencyNote />
                  </div>
                </div>
              </details>
            </div>
          </section>

          <div className="flex justify-start pt-0.5">
            <button
              type="button"
              onClick={() => onPageChange(getPreviousResultPage(activePage))}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              <ArrowLeftIcon className="size-4" aria-hidden="true" />
              Back to Market
            </button>
          </div>

          <style jsx>{`
            @keyframes details-page-enter {
              from {
                opacity: 0;
                transform: translateY(6px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes details-content-enter {
              from {
                opacity: 0;
                transform: translateY(-2px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .details-enter {
              animation: details-page-enter 320ms ease-out both;
            }

            .details-delay-1 {
              animation-delay: 55ms;
            }

            .details-delay-2 {
              animation-delay: 105ms;
            }

            .details-delay-3 {
              animation-delay: 155ms;
            }

            details[open] .details-accordion-content {
              animation: details-content-enter 180ms ease-out both;
            }

            @media (prefers-reduced-motion: reduce) {
              .details-enter,
              details[open] .details-accordion-content {
                animation: none;
              }
            }
          `}</style>
        </section>
      )}
    </div>
  );
}
