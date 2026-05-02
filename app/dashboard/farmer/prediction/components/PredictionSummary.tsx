'use client';

type AiInsights = {
  recommendation: string;
  prediction_summary: string;
  price_movement: string;
  prediction_strength: string;
  why_this_matters: string;
  suggested_action: string;
};

type Props = {
  aiInsights?: AiInsights | null;
  summaryPrediction: string;
  summaryProbability: number | null;
  predictedPriceRsKg: number | null;
  quantity: number;
  currentRevenue: number;

  marketTrend?: string | null;
  marketTrendMessage?: string | null;
  farmerDecision?: string | null;
  farmerDecisionMessage?: string | null;
};

export default function PredictionSummary({
  aiInsights,
  summaryPrediction,
  summaryProbability,
  predictedPriceRsKg,
  quantity,
  currentRevenue,
  marketTrend,
  marketTrendMessage,
  farmerDecision,
  farmerDecisionMessage,
}: Props) {
  const predictedRevenue =
    predictedPriceRsKg !== null ? predictedPriceRsKg * quantity : null;

  const difference =
    predictedRevenue !== null ? predictedRevenue - currentRevenue : null;

  const isMeaningfulDifference = (value: number) => {
    const threshold = Math.max(50, currentRevenue * 0.005);
    return Math.abs(value) >= threshold;
  };

  const formatCurrency = (value: number) =>
    `Rs. ${Math.round(Math.abs(value)).toLocaleString()}`;

  const formatPercent = (value: number | null) =>
    typeof value === 'number' ? `${value.toFixed(2)}%` : 'Not available';

  const getStrengthLabel = (value: number | null) => {
    if (value === null) return null;
    if (value < 60) return 'Low';
    if (value < 75) return 'Moderate';
    return 'Strong';
  };

  const formatPredictionStrength = (value: number | null) => {
    const percent = formatPercent(value);
    const label = getStrengthLabel(value);

    return label ? `${percent} · ${label} confidence` : percent;
  };

  const getPredictionLabel = (prediction: string) => {
    if (prediction === 'UP') return 'Price may go up';
    if (prediction === 'DOWN') return 'Price may go down';
    return 'Price movement unavailable';
  };

  const getAiText = (field: keyof AiInsights, fallback: string) => {
    const value = aiInsights?.[field];
    return typeof value === 'string' && value.trim() ? value : fallback;
  };

  const getFarmerDecisionFallback = () => {
    if (farmerDecisionMessage) return farmerDecisionMessage;

    if (difference === null) {
      return 'Price estimate unavailable.';
    }

    if (!isMeaningfulDifference(difference)) {
      return 'The difference is small, so choosing the practical option may be better.';
    }

    if (farmerDecision === 'WAIT' || difference > 0) {
      return `Waiting may improve your return by around ${formatCurrency(
        difference
      )}.`;
    }

    if (farmerDecision === 'SELL_NOW' || difference < 0) {
      return `Selling now may avoid a possible loss of ${formatCurrency(
        difference
      )}.`;
    }

    return 'Use this as guidance and compare real market conditions before deciding.';
  };

  const getMarketMovementFallback = () => {
    if (marketTrendMessage) return marketTrendMessage;

    if (marketTrend === 'UP') {
      return 'The model estimate is higher than the latest observed market price.';
    }

    if (marketTrend === 'DOWN') {
      return 'The model estimate is lower than the latest observed market price.';
    }

    if (marketTrend === 'STABLE') {
      return 'The model estimate is close to the latest observed market price.';
    }

    return getPredictionLabel(summaryPrediction);
  };

  const whyThisMattersFallback =
    'Market trend and farmer selling decision are shown separately to avoid confusing market movement with your personal return.';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900">Prediction Summary</h3>

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-700">
          Farmer Selling Decision
        </p>
        <p className="mt-1 text-lg font-bold text-gray-900">
          {getFarmerDecisionFallback()}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-600">
            Expected Market Movement
          </p>
          <p className="mt-2 text-xl font-bold text-gray-900">
            {getAiText('price_movement', getMarketMovementFallback())}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-600">
            Prediction Strength
          </p>
          <p className="mt-2 text-xl font-bold text-gray-900">
            {getAiText(
              'prediction_strength',
              formatPredictionStrength(summaryProbability)
            )}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-600">Why this matters</p>
          <p className="mt-2 text-base font-semibold text-gray-900">
            {getAiText('why_this_matters', whyThisMattersFallback)}
          </p>
        </div>
      </div>
    </div>
  );
}