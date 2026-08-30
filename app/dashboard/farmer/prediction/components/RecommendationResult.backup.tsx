
'use client';

import MLPredictionOutput from './MLPredictionOutput';

type MarketLike =
  | string
  | {
      market?: string;
      market_name?: string;
      name?: string;
      prediction?: string;
      trend?: string;
      probability?: number | string;
      confidence?: number | string;
      up_probability?: number | string;
      down_probability?: number | string;
      probabilities?: {
        UP?: number | string;
        DOWN?: number | string;
      };
      current_price?: number | string;
      current_price_rs_kg?: number | string;
      reference_price_rs_kg?: number | string;
      source_type?: string;
      history_basis?: string;
      fallback_used?: boolean;
      is_market_specific?: boolean;
      comparison_quality?: string;
      source?: string;
    }
  | null
  | undefined;

type ProbabilityMap = {
  UP?: number | string;
  DOWN?: number | string;
};

type SubmittedInput = {
  crop?: string;
  district?: string;
  price_rs_kg?: number;
  harvest_input_mode?: 'range' | 'exact';
  quantity_kg?: number;
  quantity_min_kg?: number;
  quantity_max_kg?: number;
  quantity_range_label?: string;
  exact_quantity_kg?: number;
  horizon?: number;
} | null;

type AiInsights = {
  recommendation: string;
  prediction_summary: string;
  price_movement: string;
  prediction_strength: string;
  why_this_matters: string;
  suggested_action: string;
};

type RecommendationData = {
  prediction?: string;
  trend?: string;
  probability?: number | string;
  confidence?: number | string;
  probabilities?: ProbabilityMap;
  nearest_market?: MarketLike;
  best_market?: MarketLike;
  best_predicted_market?: MarketLike;
  comparison_note?: string | null;
  comparison_strength?: string;
  is_close_call?: boolean;
  ai_insights?: AiInsights | null;
  input?: SubmittedInput;
};

type Props = {
  result: unknown;
  loading?: boolean;
  submittedInput?: SubmittedInput;
};

export default function RecommendationResult({
  result,
  loading,
  submittedInput,
}: Props) {
  if (loading) {
    return (
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-lg font-semibold text-gray-800">
          Processing Recommendation
        </h3>
        <p className="text-sm text-gray-600">
          Analyzing mapped markets and calculating earnings estimate...
        </p>
      </div>
    );
  }

  if (!result) return null;

  const recommendation = result as RecommendationData;
  const {
    nearest_market,
    best_market: legacyBestMarket,
    best_predicted_market,
    input,
  } = recommendation;
  const best_market = legacyBestMarket ?? best_predicted_market;

  const cropNameRaw = submittedInput?.crop || input?.crop || 'Crop';
  const cropName = String(cropNameRaw)
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  const districtNameRaw = submittedInput?.district || input?.district || 'your district';
  const districtName = String(districtNameRaw)
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

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

    // 0.52 -> 52, 52 stays 52
    if (parsed >= 0 && parsed <= 1) return parsed * 100;
    return parsed;
  };

  const getMarketName = (market: MarketLike) => {
    if (!market) return '-';
    const rawName =
      typeof market === 'string'
        ? market
        : market.market || market.market_name || market.name || '-';

    return formatMarketName(rawName);
  };

  const formatMarketName = (name: string) => {
    if (!name || name === '-') return '-';

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

  const getMarketPrediction = (market: MarketLike) => {
    if (!market || typeof market === 'string') return null;
    return market.prediction || market.trend || null;
  };

  const getMarketProbability = (market: MarketLike) => {
    if (!market || typeof market === 'string') return null;

    const prediction = getMarketPrediction(market);

    if (prediction === 'UP') {
      return (
        normalizePercent(market.up_probability) ??
        normalizePercent(market.probabilities?.UP) ??
        normalizePercent(market.probability) ??
        normalizePercent(market.confidence) ??
        null
      );
    }

    if (prediction === 'DOWN') {
      return (
        normalizePercent(market.down_probability) ??
        normalizePercent(market.probabilities?.DOWN) ??
        normalizePercent(market.probability) ??
        normalizePercent(market.confidence) ??
        null
      );
    }

    const direct =
      normalizePercent(market.probability) ??
      normalizePercent(market.confidence);

    if (direct !== null) return direct;

    const up =
      normalizePercent(market.up_probability) ??
      normalizePercent(market.probabilities?.UP);
    const down =
      normalizePercent(market.down_probability) ??
      normalizePercent(market.probabilities?.DOWN);

    if (up !== null || down !== null) return Math.max(up ?? 0, down ?? 0);

    return null;
  };

  const getMarketCurrentPrice = (market: MarketLike) => {
    if (!market || typeof market === 'string') {
      return Number(submittedInput?.price_rs_kg ?? input?.price_rs_kg ?? 0);
    }

    const marketPrice =
      toNumber(market.current_price) ??
      toNumber(market.current_price_rs_kg) ??
      toNumber(market.reference_price_rs_kg) ??
      Number(submittedInput?.price_rs_kg ?? input?.price_rs_kg ?? 0);

    return marketPrice;
  };

  const getMarketHistoryLabel = (market: MarketLike) => {
    if (!market || typeof market === 'string') return null;

    const sourceType = market.source_type || market.history_basis;

    if (sourceType === 'exact_market') return 'Market-specific history';
    if (sourceType === 'market_fallback') {
      return 'Market history from available districts';
    }
    if (sourceType === 'district_fallback') {
      return 'District fallback history';
    }
    if (sourceType === 'crop_fallback') return 'Crop-level fallback history';

    if (market.fallback_used || market.comparison_quality === 'weak_fallback') {
      return 'Fallback history';
    }

    return null;
  };

  const isWeakMarketHistory = (market: MarketLike) => {
    if (!market || typeof market === 'string') return false;
    return (
      market.comparison_quality === 'weak_fallback' ||
      market.source_type === 'district_fallback' ||
      market.source_type === 'crop_fallback'
    );
  };

  const extractPrediction = (): string => {
    if (recommendation.prediction) return recommendation.prediction;
    if (recommendation.trend) return recommendation.trend;
    if (best_market && getMarketPrediction(best_market))
      return getMarketPrediction(best_market) as string;
    if (nearest_market && getMarketPrediction(nearest_market))
      return getMarketPrediction(nearest_market) as string;
    return '-';
  };

  const extractConfidence = (prediction: string): number | null => {
    // direct fields
    const direct =
      normalizePercent(recommendation.probability) ??
      normalizePercent(recommendation.confidence);

    if (direct !== null) return direct;

    if (recommendation.probabilities) {
      const up = normalizePercent(recommendation.probabilities.UP);
      const down = normalizePercent(recommendation.probabilities.DOWN);

      if (prediction === 'UP' && up !== null) return up;
      if (prediction === 'DOWN' && down !== null) return down;

      if (up !== null || down !== null) {
        return Math.max(up ?? 0, down ?? 0);
      }
    }

    // fallback market-level
    const bestProb = getMarketProbability(best_market);
    if (bestProb !== null) return bestProb;

    const nearestProb = getMarketProbability(nearest_market);
    if (nearestProb !== null) return nearestProb;

    return null;
  };

  const summaryPrediction = extractPrediction();
  const summaryProbability = extractConfidence(summaryPrediction);

  const price = Number(
    submittedInput?.price_rs_kg ?? input?.price_rs_kg ?? 0
  );
  const quantity = Number(
    submittedInput?.quantity_kg ?? input?.quantity_kg ?? 0
  );
  const harvestInputMode =
    submittedInput?.harvest_input_mode ||
    input?.harvest_input_mode ||
    'range';
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

  const currentRevenue = price * quantity;
  const rangeMinRevenue = price * quantityMin;
  const rangeMaxRevenue = price * quantityMax;
  const exactRevenue = price * exactQuantity;

  let summaryChangeRate = 0;
  if (summaryPrediction === 'UP') summaryChangeRate = 0.02;
  else if (summaryPrediction === 'DOWN') summaryChangeRate = -0.02;

  const predictedRevenue = price * (1 + summaryChangeRate) * quantity;
  const difference = predictedRevenue - currentRevenue;

  const getMarketPredictedRevenue = (market: MarketLike) => {
    const marketPrice = getMarketCurrentPrice(market);
    const marketPrediction = getMarketPrediction(market);

    let rate = 0;
    if (marketPrediction === 'UP') rate = 0.02;
    else if (marketPrediction === 'DOWN') rate = -0.02;

    return marketPrice * (1 + rate) * quantity;
  };

  const getMarketEstimatedPrice = (market: MarketLike) => {
    const marketPrice = getMarketCurrentPrice(market);
    const marketPrediction = getMarketPrediction(market);

    let rate = 0;
    if (marketPrediction === 'UP') rate = 0.02;
    else if (marketPrediction === 'DOWN') rate = -0.02;

    return marketPrice * (1 + rate);
  };

  const nearestNextRevenue = nearest_market
    ? getMarketPredictedRevenue(nearest_market)
    : 0;

  const bestNextRevenue = best_market
    ? getMarketPredictedRevenue(best_market)
    : 0;

  const bestVsNearest = bestNextRevenue - nearestNextRevenue;

  const isMeaningfulDifference = (value: number) => {
    const threshold = Math.max(50, currentRevenue * 0.005);
    return Math.abs(value) >= threshold;
  };

  const formatCurrency = (value: number) =>
    `Rs. ${Math.round(Math.abs(value)).toLocaleString()}`;

  const formatUnsignedCurrency = (value: number) =>
    `Rs. ${Math.round(value).toLocaleString()}`;

  const formatSignedCurrency = (value: number) => {
    if (!isMeaningfulDifference(value)) return formatCurrency(0);
    return `${value > 0 ? '+' : '-'}${formatCurrency(value)}`;
  };

  const formatPricePerKg = (value: number) => `${formatCurrency(value)}/kg`;

  const exactFormulaText = `${formatUnsignedCurrency(price)} x ${exactQuantity.toLocaleString()} kg = ${formatUnsignedCurrency(exactRevenue)}`;

  const formatPercent = (value: number | null) =>
    typeof value === 'number' ? `${value.toFixed(2)}%` : 'Not available';

  const getStrengthLabel = (value: number | null) => {
    if (value === null) return null;
    if (value < 50) return 'Low';
    if (value < 70) return 'Moderate';
    return 'Strong';
  };

  const formatPredictionStrength = (value: number | null) => {
    const percent = formatPercent(value);
    const label = getStrengthLabel(value);

    return label ? `${percent} \u00B7 ${label}` : percent;
  };

  const getPredictionLabel = (prediction: string) => {
    if (prediction === 'UP') return 'Price may go up';
    if (prediction === 'DOWN') return 'Price may go down';
    return 'Price movement unavailable';
  };

  const getRecommendationMessage = () => {
    const nearestName = getMarketName(nearest_market);
    const bestName = getMarketName(best_market);
    const hasBothMarkets = bestName !== '-' && nearestName !== '-';
    const sameMarket =
      hasBothMarkets && bestName.toLowerCase() === nearestName.toLowerCase();

    if (hasBothMarkets && (sameMarket || !isMeaningfulDifference(bestVsNearest))) {
      return `Both markets show a similar return. The nearest market may be the more practical option for ${cropName}.`;
    }

    if (recommendation.comparison_note) {
      return recommendation.comparison_note;
    }

    if (hasBothMarkets && bestVsNearest > 0) {
      return `${bestName} may offer a better return than ${nearestName} for ${cropName}.`;
    }

    if (summaryPrediction === 'DOWN') {
      return `${cropName} prices may soften soon. Selling earlier may reduce risk.`;
    }

    if (nearestName !== '-') {
      return `${nearestName} looks like a practical option for ${cropName} based on the current outlook.`;
    }

    return `${cropName} market outlook is available below.`;
  };

  const getAiText = (field: keyof AiInsights, fallback: string) => {
    const value = recommendation.ai_insights?.[field];
    return typeof value === 'string' && value.trim() ? value : fallback;
  };

  const getSellTimingMessage = () => {
    if (!isMeaningfulDifference(difference)) {
      return 'Selling now or waiting one week shows a similar return.';
    }

    if (difference > 0) {
      return `Waiting one week may improve your return by around ${formatCurrency(difference)}.`;
    }

    return `Selling now may avoid a possible loss of ${formatCurrency(difference)}.`;
  };

  const quickStatTone =
    isMeaningfulDifference(difference) && difference > 0
      ? 'text-green-700'
      : isMeaningfulDifference(difference) && difference < 0
      ? 'text-red-700'
      : 'text-gray-700';

  const recommendationSubtext = `Based on historical patterns, mapped market comparison, and the current wholesale price entered for ${cropName}.`;
  const whyThisMattersFallback =
    'Small price changes can create meaningful revenue differences in wholesale selling.';
  const nearestMarketName = getMarketName(nearest_market);
  const bestMarketName = getMarketName(best_market);
  const hasNearestMarket = nearest_market && nearestMarketName !== '-';
  const hasBestMarket = best_market && bestMarketName !== '-';
  const sameRecommendedMarket =
    hasNearestMarket &&
    hasBestMarket &&
    nearestMarketName.toLowerCase() === bestMarketName.toLowerCase();
  const bestHasMeaningfulAdvantage =
    hasNearestMarket &&
    hasBestMarket &&
    !sameRecommendedMarket &&
    bestVsNearest > 0 &&
    isMeaningfulDifference(bestVsNearest);
  const marketsAreClose =
    hasNearestMarket &&
    hasBestMarket &&
    !sameRecommendedMarket &&
    !isMeaningfulDifference(bestVsNearest);
  const recommendedMarket = bestHasMeaningfulAdvantage
    ? best_market
    : nearest_market || best_market;
  const otherMarket =
    recommendedMarket === best_market ? nearest_market : best_market;
  const recommendedMarketName = getMarketName(recommendedMarket);
  const otherMarketName = getMarketName(otherMarket);
  const recommendedCurrentPrice = getMarketCurrentPrice(recommendedMarket);
  const recommendedEstimatedPrice = getMarketEstimatedPrice(recommendedMarket);
  const recommendedEstimatedValue = getMarketPredictedRevenue(recommendedMarket);
  const estimatedPriceLabel =
    input?.horizon === 1
      ? 'Next Week AI Estimated Price'
      : input?.horizon && input.horizon > 1
      ? `${input.horizon} Weeks Ahead Estimated Price`
      : 'Future Estimated Price';
  const otherEstimatedValue = otherMarket
    ? getMarketPredictedRevenue(otherMarket)
    : 0;
  const trendText =
    summaryPrediction === 'UP'
      ? 'an upward'
      : summaryPrediction === 'DOWN'
      ? 'a downward'
      : 'an uncertain';
  const recommendedReason = bestHasMeaningfulAdvantage
    ? 'Better estimated return based on the model signal'
    : marketsAreClose || sameRecommendedMarket
    ? 'Markets are close. The nearest market may be the safer practical option.'
    : 'Higher practical return + lower transport risk';
  const marketSummaryText = `${recommendedMarketName} Market is recommended for ${cropName} in ${districtName}.`;
  const marketSummaryDetail = bestHasMeaningfulAdvantage
    ? `The model predicts ${trendText} trend, and this market gives the better estimated return. Transport cost should still be considered.`
    : marketsAreClose
    ? 'Markets are close. The nearest market may be the safer practical option.'
    : `The model predicts ${trendText} trend, and this market gives the better practical return.`;
  const otherMarketNote = bestHasMeaningfulAdvantage
    ? `${otherMarketName} was checked as the nearest market. The recommended market may give a better estimated return, but transport cost should still be considered.`
    : `${otherMarketName} was checked, but it did not give a better practical return.`;
  const otherMarketTone = bestHasMeaningfulAdvantage
    ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
    : marketsAreClose
    ? 'border-gray-200 bg-gray-50 text-gray-700'
    : bestVsNearest < 0
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-gray-200 bg-gray-50 text-gray-700';

  return (
    <div className="mt-6 space-y-6">
      {/* ML Prediction Output */}
      <MLPredictionOutput
        bestPredictedMarket={best_predicted_market}
        horizon={input?.horizon}
        actionDecision="UNCERTAIN"
        actionDecisionMessage="Timing advantage is uncertain"
      />

      {/* Recommendation Banner */}
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
          Recommendation
        </p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900">
          {getAiText('recommendation', getRecommendationMessage())}
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-700">
          {getAiText('suggested_action', recommendationSubtext)}
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-600">{cropName}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {harvestInputMode === 'exact'
              ? `${exactQuantity.toLocaleString()} kg`
              : quantityRangeLabel || '-'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {harvestInputMode === 'exact'
              ? 'Exact harvest quantity'
              : 'Quantity range used'}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-600">
            {harvestInputMode === 'exact'
              ? 'Sell Now Value'
              : 'Estimated Sell Now Range'}
          </p>
          {harvestInputMode === 'exact' ? (
            <>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatCurrency(exactRevenue)}
              </p>
              <p className="mt-1 text-sm text-gray-500">{exactFormulaText}</p>
            </>
          ) : (
            <>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatCurrency(rangeMinRevenue)} - {formatCurrency(rangeMaxRevenue)}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Most likely estimate: {formatCurrency(currentRevenue)}
              </p>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Next Week Estimate</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(predictedRevenue)}
          </p>
          <p className="mt-1 text-sm text-gray-500">Based on predicted movement</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-600">
            Possible{' '}
            {!isMeaningfulDifference(difference)
              ? 'Change'
              : difference > 0
              ? 'Gain'
              : 'Loss'}
          </p>
          <p className={`mt-2 text-2xl font-bold ${quickStatTone}`}>
            {isMeaningfulDifference(difference)
              ? formatSignedCurrency(difference)
              : 'Similar return'}
          </p>
          <p className="mt-1 text-sm text-gray-500">Compared with selling now</p>
        </div>
      </div>

      {/* Prediction Summary */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900">Prediction Summary</h3>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-700">
            Sell now vs next week
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {getAiText('prediction_summary', getSellTimingMessage())}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-600">
              Expected Price Movement
            </p>
            <p className="mt-2 text-xl font-bold text-gray-900">
              {getAiText(
                'price_movement',
                getPredictionLabel(summaryPrediction)
              )}
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

      {/* Market Recommendation */}
      {recommendedMarket && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
              Market Decision Summary
            </p>
            <h3 className="mt-2 text-2xl font-bold text-gray-900">
              {marketSummaryText}
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-700">
              {marketSummaryDetail}
            </p>
          </div>

          <div className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
              AI Market Intelligence Engine Analysis
            </p>
            <h4 className="mt-2 text-3xl font-bold text-gray-900">
              {recommendedMarketName}
            </h4>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                <p className="text-sm font-medium text-gray-600">
                  AI Estimated Today&apos;s Price
                </p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {formatPricePerKg(recommendedCurrentPrice)}
                </p>
              </div>

              <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                <p className="text-sm font-medium text-gray-600">
                  {estimatedPriceLabel}
                </p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {formatPricePerKg(recommendedEstimatedPrice)}
                </p>
              </div>

              <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                <p className="text-sm font-medium text-gray-600">
                 AI Estimated Selling Value
                </p>
                <p className="mt-1 text-xl font-bold text-green-800">
                  {formatCurrency(recommendedEstimatedValue)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3">
              <p className="text-sm font-medium text-green-800">Reason</p>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {recommendedReason}
              </p>
            </div>

            {getMarketHistoryLabel(recommendedMarket) && (
              <p
                className={`mt-3 text-sm font-medium ${
                  isWeakMarketHistory(recommendedMarket)
                    ? 'text-amber-700'
                    : 'text-green-700'
                }`}
              >
                {getMarketHistoryLabel(recommendedMarket)}
              </p>
            )}
          </div>

          {otherMarket &&
            otherMarketName !== '-' &&
            otherMarketName.toLowerCase() !== recommendedMarketName.toLowerCase() && (
              <div className={`rounded-2xl border p-5 shadow-sm ${otherMarketTone}`}>
                <p className="text-sm font-semibold uppercase tracking-wide">
                  Other Markets Checked By AI
                </p>
                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div>
                    <p className="text-xl font-bold text-gray-900">
                      {otherMarketName}
                    </p>
                    <p className="mt-1 text-sm leading-6">{otherMarketNote}</p>
                  </div>
                  <div className="rounded-xl border border-white/70 bg-white/70 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                     AI Estimated Value Today
                    </p>
                    <p className="mt-1 text-lg font-bold text-gray-900">
                      {formatCurrency(otherEstimatedValue)}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Difference: {formatSignedCurrency(bestVsNearest)}
                    </p>
                  </div>
                </div>
              </div>
            )}
        </div>
      )}

      {/* Bottom Note */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Note
        </p>
        <p className="mt-2 text-base leading-7 text-gray-800">
          This estimate is based on historical patterns and may change with real
          market conditions.
        </p>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Data sources used in this system include HARTI market price data, DCS
          market price data, DOA seasonal data, weather records, and inflation
          data.
        </p>
      </div>
    </div>
  );
}
