'use client';

type ProbabilityMap = {
  UP?: number | string;
  DOWN?: number | string;
};

type DirectionModelSignal = {
  prediction?: string | null;
  confidence_probability?: number | string | null;
  confidence_label?: string | null;
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
      predicted_price_rs_kg?: number | string | null;
      direction_model_signal?: DirectionModelSignal | null;
      market_context_signal?: MarketContextSignal | null;
      market_trend?: string | null;
      market_trend_message?: string | null;
    }
  | null
  | undefined;

type Props = {
  market?: MarketLike | null;
  bestPredictedMarket?: MarketLike | null;
  horizon?: number;
  priceSourceMode?: 'manual' | 'system_reference';
  currentPrice?: number | null;
};

const MODEL_ACCURACY_LABEL = '70%';

export default function MLPredictionOutput({
  market,
  bestPredictedMarket,
  horizon,
  priceSourceMode = 'manual',
  currentPrice = null,
}: Props) {
  const selectedMarket = market ?? bestPredictedMarket ?? null;
  const marketObject =
    selectedMarket && typeof selectedMarket !== 'string' ? selectedMarket : null;

  const toNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && !Number.isNaN(value)) return value;

    if (typeof value === 'string') {
      const cleaned = value.replace('%', '').trim();
      const parsed = Number(cleaned);
      return Number.isNaN(parsed) ? null : parsed;
    }

    return null;
  };

  const normalizePercent = (value: unknown): number | null => {
    const parsed = toNumber(value);
    if (parsed === null) return null;
    if (parsed >= 0 && parsed <= 1) return parsed * 100;
    return parsed;
  };

  const getConfidenceLabel = (value: number | null) => {
    if (value === null) return null;
    if (value < 60) return 'Low';
    if (value < 75) return 'Moderate';
    return 'Strong';
  };

  const formatPercent = (value: number | null) =>
    value === null ? 'Not available' : `${value.toFixed(2)}%`;

  const getHorizonLabel = (value: number | undefined) => {
    if (value === 1) return 'Next Week';
    if (value === 2) return '2 Weeks Ahead';
    if (value === 3) return '3 Weeks Ahead';
    if (value === 4) return '4 Weeks Ahead';
    return 'Selected Forecast Period';
  };

  const getText = (value: unknown) =>
    typeof value === 'string' && value.trim() ? value.trim() : null;

  const directionSignal = marketObject?.direction_model_signal ?? null;
  const marketContext = marketObject?.market_context_signal ?? null;
  const predictedPrice = toNumber(marketObject?.predicted_price_rs_kg);

  const legacyDirection =
    getText(marketObject?.prediction) ?? getText(marketObject?.trend);
  const directionValue =
    getText(directionSignal?.prediction) ?? legacyDirection ?? 'Not available';

  const getLegacyConfidence = () => {
    const direction = directionValue.toUpperCase();
    const upProbability =
      normalizePercent(marketObject?.up_probability) ??
      normalizePercent(marketObject?.probabilities?.UP);
    const downProbability =
      normalizePercent(marketObject?.down_probability) ??
      normalizePercent(marketObject?.probabilities?.DOWN);

    if (direction === 'UP' && upProbability !== null) return upProbability;
    if (direction === 'DOWN' && downProbability !== null) return downProbability;

    const direct =
      normalizePercent(marketObject?.probability) ??
      normalizePercent(marketObject?.confidence);

    if (direct !== null) return direct;
    if (upProbability !== null || downProbability !== null) {
      return Math.max(upProbability ?? 0, downProbability ?? 0);
    }

    return null;
  };

  const confidenceProbability =
    normalizePercent(directionSignal?.confidence_probability) ??
    getLegacyConfidence();
  const confidenceLabel =
    getText(directionSignal?.confidence_label) ??
    getConfidenceLabel(confidenceProbability);
  const confidenceText =
    confidenceProbability === null
      ? 'Not available'
      : confidenceLabel
      ? `${formatPercent(confidenceProbability)} (${confidenceLabel})`
      : formatPercent(confidenceProbability);

  const marketContextValue =
    getText(marketContext?.trend) ?? getText(marketObject?.market_trend);
  const marketContextMessage =
    priceSourceMode === 'system_reference'
      ? 'This signal compares the estimated future price with recent market reference prices and historical market patterns.'
      : getText(marketContext?.message) ??
        getText(marketObject?.market_trend_message) ??
        (marketContextValue === 'UP'
          ? 'Slight upward movement compared with recent market prices.'
          : marketContextValue === 'DOWN'
          ? 'Slight downward movement compared with recent market prices.'
          : marketContextValue === 'STABLE'
          ? 'Prices appear close to recent market levels.'
          : 'Market context is not available for this estimate.');
  const signalsDiffer =
    directionValue !== 'Not available' &&
    marketContextValue !== null &&
    directionValue.toUpperCase() !== marketContextValue.toUpperCase();
  const farmerComparisonSignal =
    predictedPrice === null || currentPrice === null
      ? 'Price comparison unavailable.'
      : priceSourceMode === 'system_reference'
      ? predictedPrice > currentPrice
        ? 'UP — the estimated future price is higher than the system current market price.'
        : predictedPrice < currentPrice
        ? 'DOWN — the system current market price is higher than the estimated future price.'
        : 'STABLE — the system current market price and estimated future price are the same.'
      : predictedPrice > currentPrice
      ? 'UP — your estimated future price is higher than your entered price.'
      : predictedPrice < currentPrice
      ? 'DOWN — your entered price is higher than the estimated future price.'
      : 'STABLE — your entered price and estimated future price are the same.';
  const finalDecision =
    predictedPrice === null || currentPrice === null
      ? 'Price comparison unavailable'
      : predictedPrice > currentPrice
      ? 'Waiting may improve your return'
      : predictedPrice < currentPrice
      ? 'Selling now may be safer'
      : 'The difference is small';
  const noteText =
    priceSourceMode === 'system_reference'
      ? 'This decision uses the system current market price and model market signal.'
      : 'This decision compares your entered price with the estimated future price.';
  const showMarketSignals = priceSourceMode === 'system_reference';

  return (
    <div className="rounded-2xl border border-green-100 border-l-4 border-l-green-600 bg-green-50/60 p-5 shadow-sm">
      <p className="text-sm font-medium text-green-800">
        AI Reasoning Details
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold text-gray-800">Final Decision</p>
          <p className="mt-3 text-lg font-bold text-gray-900">
            {finalDecision}
          </p>
          <p className="mt-2 text-sm font-medium text-gray-600">
            {getHorizonLabel(horizon)} | RF Model (~{MODEL_ACCURACY_LABEL}{' '}
            Accuracy)
          </p>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold text-gray-800">
            Farmer Price Comparison Signal
          </p>
          <p className="mt-3 text-sm font-semibold leading-6 text-gray-900">
            {farmerComparisonSignal}
          </p>
        </section>

        {showMarketSignals && (
          <>
            <section className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-sm font-semibold text-gray-800">
                Market Direction Model Signal
              </p>
              <p className="mt-3 text-lg font-bold text-gray-900">
                {directionValue}
              </p>
              <p className="mt-2 text-sm font-medium text-gray-600">
                Confidence: {confidenceText}
              </p>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-sm font-semibold text-gray-800">
                Market Context
              </p>
              <p className="mt-3 text-sm font-semibold leading-6 text-gray-900">
                {marketContextMessage}
              </p>
            </section>
          </>
        )}
      </div>

      <p className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-gray-700 shadow-sm">
        {noteText}
      </p>

      {showMarketSignals && signalsDiffer && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-800">
          These signals use different reference points: the direction model
          predicts market movement probability, while the price estimate is used
          for your selling calculation.
        </p>
      )}
    </div>
  );
}
