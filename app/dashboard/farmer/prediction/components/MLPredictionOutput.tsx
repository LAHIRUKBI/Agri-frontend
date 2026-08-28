'use client';

import {
  getMarketOutlookPresentation,
  type ActionDecision,
  type MarketOutlook,
  type ModelSignalAlignment,
} from '../recommendationContract';

type ProbabilityMap = {
  UP?: number | string;
  DOWN?: number | string;
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

type MarketLike =
  | string
  | {
      prediction?: string | null;
      trend?: string | null;
      probability?: number | string | null;
      confidence?: number | string | null;
      up_probability?: number | string | null;
      down_probability?: number | string | null;
      probabilities?: ProbabilityMap | null;
      direction_model_signal?: DirectionModelSignal | null;
      market_context_signal?: MarketContextSignal | null;
      market_trend?: string | null;
      market_trend_message?: string | null;
      action_decision?: 'SELL_NOW' | 'WAIT' | 'UNCERTAIN' | null;
      action_authorized?: boolean;
      action_policy?: string | null;
      persistence_next_price_rs_kg?: number | string | null;
      model_run_id?: string | null;
      model_role?: string | null;
    }
  | null
  | undefined;

type Props = {
  market?: MarketLike | null;
  bestPredictedMarket?: MarketLike | null;
  horizon?: number;
  priceSourceMode?: 'manual' | 'system_reference';
  currentPrice?: number | null;
  actionDecision: ActionDecision;
  actionDecisionMessage: string;
  actionReasonCodes?: string[];
  actionAuthorized?: boolean;
  actionPolicy?: string | null;
  persistenceNextPriceRsKg?: number | null;
  comparisonStrength?: string | null;
  comparisonNote?: string | null;
  priceComparison?: string;
  signalAlignment?: ModelSignalAlignment;
  marketOutlook?: MarketOutlook | null;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;

  if (typeof value === 'string') {
    const parsed = Number(value.replace('%', '').trim());
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
};

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

const formatPercent = (value: number | null) =>
  value === null ? 'Not available' : `${value.toFixed(2)}%`;

const getText = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const getReportedBoolean = (value: boolean | undefined) => {
  if (value === undefined) return 'Not reported';
  return value ? 'Yes' : 'No';
};

export default function MLPredictionOutput({
  market,
  bestPredictedMarket,
  horizon,
  priceSourceMode = 'manual',
  actionDecision,
  actionDecisionMessage,
  actionReasonCodes = [],
  actionAuthorized,
  actionPolicy,
  persistenceNextPriceRsKg = null,
  comparisonStrength,
  comparisonNote,
  priceComparison = 'Not available',
  signalAlignment,
  marketOutlook,
}: Props) {
  const selectedMarket = market ?? bestPredictedMarket ?? null;
  const marketObject =
    selectedMarket && typeof selectedMarket !== 'string' ? selectedMarket : null;
  const directionSignal = marketObject?.direction_model_signal ?? null;
  const marketContext = marketObject?.market_context_signal ?? null;
  const directionValue =
    getText(directionSignal?.prediction) ??
    getText(marketObject?.prediction) ??
    getText(marketObject?.trend) ??
    'Not available';
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
    directionValue.toUpperCase() === 'UP' && upProbability !== null
      ? upProbability
      : directionValue.toUpperCase() === 'DOWN' && downProbability !== null
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
      : `${formatPercent(confidenceProbability)}${
          confidenceLabel ? ` (${confidenceLabel})` : ''
        }`;
  const marketContextValue =
    getText(marketContext?.trend) ??
    getText(marketObject?.market_trend) ??
    'Not available';
  const marketContextMessage =
    priceSourceMode === 'system_reference'
      ? 'This signal compares the estimated future price with recent market reference prices and historical market patterns.'
      : getText(marketContext?.message) ??
        getText(marketObject?.market_trend_message) ??
        'Market context is not available for this estimate.';
  const modelRunId = getText(marketObject?.model_run_id) ?? 'run_001';
  const modelRole =
    getText(marketObject?.model_role) ?? 'experimental_secondary';
  const reportedActionAuthorized =
    actionAuthorized ?? marketObject?.action_authorized;
  const reportedActionPolicy =
    getText(actionPolicy) ?? getText(marketObject?.action_policy);
  const persistenceBaseline =
    persistenceNextPriceRsKg ??
    toNumber(marketObject?.persistence_next_price_rs_kg);
  const marketOutlookPresentation =
    getMarketOutlookPresentation(marketOutlook);
  const reportedPriceSignal = marketOutlook
    ? marketOutlook.price_signal ?? 'Not available'
    : priceComparison;
  const reportedDirectionSignal = marketOutlook
    ? marketOutlook.direction_signal ?? 'Not available'
    : directionValue;
  const reportedConfidence = marketOutlookPresentation
    ? marketOutlookPresentation.confidenceLabel
    : confidenceText;
  const reportedSignalAlignment =
    marketOutlook?.signal_alignment ?? signalAlignment ?? 'UNKNOWN';

  return (
    <div className="min-w-0">
      <dl className="grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="min-w-0">
          <dt className="text-xs font-semibold text-slate-500">
            Canonical Decision
          </dt>
          <dd className="mt-1 break-words font-mono text-sm font-bold text-slate-950">
            {actionDecision}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold text-slate-500">
            Action Authorized
          </dt>
          <dd className="mt-1 text-sm font-bold text-slate-950">
            {getReportedBoolean(reportedActionAuthorized)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold text-slate-500">
            Action Policy
          </dt>
          <dd className="mt-1 break-words font-mono text-sm font-bold text-slate-950">
            {reportedActionPolicy ?? 'Not reported'}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold text-slate-500">
            Persistence Baseline
          </dt>
          <dd className="mt-1 text-sm font-bold text-slate-950">
            {persistenceBaseline === null
              ? 'Not available'
              : `Rs. ${Math.round(persistenceBaseline).toLocaleString()}/kg`}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold text-slate-500">
            Experimental Model
          </dt>
          <dd className="mt-1 break-words font-mono text-sm font-bold text-slate-950">
            {modelRunId}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold text-slate-500">Model Role</dt>
          <dd className="mt-1 break-words font-mono text-sm font-bold text-slate-950">
            {modelRole}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold text-slate-500">
            Prediction Horizon
          </dt>
          <dd className="mt-1 text-sm font-bold text-slate-950">
            {horizon === 1 ? 'Next Market Period' : 'Not reported'}
          </dd>
        </div>
      </dl>

      <section className="mt-5 border-t border-slate-100 pt-5">
        <h3 className="text-sm font-black text-slate-900">
          Experimental signals
        </h3>
        <dl className="mt-3 grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-slate-500">
              Price Signal
            </dt>
            <dd className="mt-1 break-words text-sm font-bold text-slate-950">
              {reportedPriceSignal}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-slate-500">
              Direction Signal
            </dt>
            <dd className="mt-1 break-words text-sm font-bold text-slate-950">
              {reportedDirectionSignal}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-slate-500">Confidence</dt>
            <dd className="mt-1 break-words text-sm font-bold text-slate-950">
              {reportedConfidence}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-slate-500">
              UP Probability
            </dt>
            <dd className="mt-1 text-sm font-bold text-slate-950">
              {formatPercent(upProbability)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-slate-500">
              DOWN Probability
            </dt>
            <dd className="mt-1 text-sm font-bold text-slate-950">
              {formatPercent(downProbability)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-slate-500">
              Signal Alignment
            </dt>
            <dd className="mt-1 break-words font-mono text-sm font-bold text-slate-950">
              {reportedSignalAlignment}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-5 border-t border-slate-100 pt-5">
        <h3 className="text-sm font-black text-slate-900">Market Context</h3>
        <p className="mt-2 text-sm font-semibold text-slate-800">
          {marketContextValue}
        </p>
        <p className="mt-1 break-words text-sm leading-6 text-slate-600">
          {marketContextMessage}
        </p>
        <p className="mt-3 break-words rounded-xl bg-slate-50 px-3 py-2.5 text-sm leading-6 text-slate-700">
          {actionDecisionMessage}
        </p>
      </section>

      {actionReasonCodes.length > 0 && (
        <section className="mt-5 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-black text-slate-900">Policy Checks</h3>
          <ul className="mt-2 flex min-w-0 flex-wrap gap-2">
            {actionReasonCodes.map((code) => (
              <li
                key={code}
                className="max-w-full break-all rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-700"
              >
                {code}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(comparisonStrength || comparisonNote) && (
        <section className="mt-5 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-black text-slate-900">
            Comparison Metadata
          </h3>
          <dl className="mt-3 grid min-w-0 gap-x-6 gap-y-3 sm:grid-cols-2">
            {comparisonStrength && (
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-slate-500">
                  Comparison Strength
                </dt>
                <dd className="mt-1 break-words text-sm text-slate-700">
                  {comparisonStrength}
                </dd>
              </div>
            )}
            {comparisonNote && (
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-slate-500">
                  Comparison Note
                </dt>
                <dd className="mt-1 break-words text-sm leading-6 text-slate-700">
                  {comparisonNote}
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}
    </div>
  );
}
