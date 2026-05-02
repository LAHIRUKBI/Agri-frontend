'use client';

type MarketLike =
  | string
  | {
      market?: string;
      market_name?: string;
      name?: string;
      prediction?: string;
      trend?: string;
      current_price?: number | string;
      current_price_rs_kg?: number | string;
      reference_price_rs_kg?: number | string;
      predicted_price_rs_kg?: number | string | null;
      price_prediction_source?: string | null;
      price_model_metrics?: Record<string, unknown> | null;
      market_trend?: string | null;
      market_trend_message?: string | null;
      market_trend_basis?: string | null;
      farmer_decision?: string | null;
      farmer_decision_message?: string | null;
      farmer_decision_basis?: string | null;
      source_type?: string;
      history_basis?: string;
      fallback_used?: boolean;
      comparison_quality?: string;
    }
  | null
  | undefined;

type Props = {
  nearestMarket?: MarketLike;
  bestMarket?: MarketLike;
  cropName: string;
  districtName: string;
  quantity: number;
  currentRevenue: number;
  fallbackPrice: number;
};

export default function RecommendationDecisionCard({
  nearestMarket,
  bestMarket,
  cropName,
  districtName,
  quantity,
  currentRevenue,
  fallbackPrice,
}: Props) {
  const toNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && !Number.isNaN(value)) return value;

    if (typeof value === 'string') {
      const cleaned = value.replace('%', '').trim();
      const parsed = Number(cleaned);
      return Number.isNaN(parsed) ? null : parsed;
    }

    return null;
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

  const getMarketName = (market: MarketLike) => {
    if (!market) return '-';
    const rawName =
      typeof market === 'string'
        ? market
        : market.market || market.market_name || market.name || '-';

    return formatMarketName(rawName);
  };

  const getMarketCurrentPrice = (market: MarketLike) => {
    if (!market || typeof market === 'string') {
      return fallbackPrice;
    }

    const marketPrice =
      toNumber(market.current_price) ??
      toNumber(market.current_price_rs_kg) ??
      toNumber(market.reference_price_rs_kg) ??
      fallbackPrice;

    return marketPrice;
  };

  const getMarketPredictedPrice = (market: MarketLike) => {
    if (!market || typeof market === 'string') return null;
    return toNumber(market.predicted_price_rs_kg);
  };

  const getMarketTextField = (
    market: MarketLike,
    field:
      | 'market_trend'
      | 'market_trend_message'
      | 'farmer_decision'
      | 'farmer_decision_message'
  ) => {
    if (!market || typeof market === 'string') return null;

    const value = market[field];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
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

  const getMarketPredictedRevenue = (market: MarketLike) => {
    const predictedPrice = getMarketPredictedPrice(market);
    if (predictedPrice === null) return null;

    return predictedPrice * quantity;
  };

  const nearestNextRevenue = nearestMarket
    ? getMarketPredictedRevenue(nearestMarket)
    : null;

  const bestNextRevenue = bestMarket
    ? getMarketPredictedRevenue(bestMarket)
    : null;

  const bestVsNearest =
    bestNextRevenue !== null && nearestNextRevenue !== null
      ? bestNextRevenue - nearestNextRevenue
      : null;

  const isMeaningfulDifference = (value: number) => {
    const threshold = Math.max(50, currentRevenue * 0.005);
    return Math.abs(value) >= threshold;
  };

  const formatCurrency = (value: number) =>
    `Rs. ${Math.round(Math.abs(value)).toLocaleString()}`;

  const formatSignedCurrency = (value: number) => {
    if (!isMeaningfulDifference(value)) return formatCurrency(0);
    return `${value > 0 ? '+' : '-'}${formatCurrency(value)}`;
  };

  const formatPricePerKg = (value: number) => `${formatCurrency(value)}/kg`;
  const unavailableText = 'Price estimate unavailable';
  const formatOptionalCurrency = (value: number | null) =>
    value !== null ? formatCurrency(value) : unavailableText;
  const formatOptionalPricePerKg = (value: number | null) =>
    value !== null ? formatPricePerKg(value) : unavailableText;
  const formatOptionalSignedCurrency = (value: number | null) =>
    value !== null ? formatSignedCurrency(value) : unavailableText;

  const nearestMarketName = getMarketName(nearestMarket);
  const bestMarketName = getMarketName(bestMarket);
  const hasNearestMarket = nearestMarket && nearestMarketName !== '-';
  const hasBestMarket = bestMarket && bestMarketName !== '-';
  const sameRecommendedMarket =
    hasNearestMarket &&
    hasBestMarket &&
    nearestMarketName.toLowerCase() === bestMarketName.toLowerCase();
  const bestHasMeaningfulAdvantage =
    hasNearestMarket &&
    hasBestMarket &&
    bestVsNearest !== null &&
    !sameRecommendedMarket &&
    bestVsNearest > 0 &&
    isMeaningfulDifference(bestVsNearest);
  const marketsAreClose =
    hasNearestMarket &&
    hasBestMarket &&
    bestVsNearest !== null &&
    !sameRecommendedMarket &&
    !isMeaningfulDifference(bestVsNearest);
  const recommendedMarket = bestHasMeaningfulAdvantage
    ? bestMarket
    : nearestMarket || bestMarket;
  const otherMarket =
    recommendedMarket === bestMarket ? nearestMarket : bestMarket;
  const recommendedMarketName = getMarketName(recommendedMarket);
  const otherMarketName = getMarketName(otherMarket);
  const recommendedCurrentPrice = getMarketCurrentPrice(recommendedMarket);
  const recommendedEstimatedPrice = getMarketPredictedPrice(recommendedMarket);
  const recommendedEstimatedValue = getMarketPredictedRevenue(recommendedMarket);
  const estimatedPriceLabel = 'AI Estimated Future Price (Model-Based)';
  const otherEstimatedValue = otherMarket
    ? getMarketPredictedRevenue(otherMarket)
    : null;
  const hasRecommendedEstimate =
    recommendedEstimatedPrice !== null && recommendedEstimatedValue !== null;
  const otherMarketEstimateUnavailable =
    otherMarket !== null &&
    otherMarket !== undefined &&
    otherEstimatedValue === null;
  const recommendedFarmerDecision = getMarketTextField(
    recommendedMarket,
    'farmer_decision'
  )?.toUpperCase();
  const recommendedIsNearest =
    recommendedMarketName !== '-' &&
    nearestMarketName !== '-' &&
    recommendedMarketName.toLowerCase() === nearestMarketName.toLowerCase();
  const recommendationSentence =
    recommendedMarketName === '-'
      ? `${cropName} market outlook is available.`
      : recommendedIsNearest
      ? `${recommendedMarketName} may be the more practical option for ${cropName} in ${districtName}, as it can reduce transport cost and selling risk.`
      : `${recommendedMarketName} may offer a better estimated return for ${cropName}, but transport cost and buyer availability should be considered.`;
  const recommendedReason = bestHasMeaningfulAdvantage
    ? 'Better estimated return, with transport cost and buyer availability still worth checking.'
    : marketsAreClose || sameRecommendedMarket
    ? 'Markets are close. The nearest market may reduce transport cost and selling risk.'
    : !hasRecommendedEstimate
    ? 'Model-based price estimate is unavailable for this market.'
    : recommendedFarmerDecision === 'WAIT'
    ? 'Waiting may improve your return compared with your entered price.'
    : recommendedFarmerDecision === 'SELL_NOW'
    ? 'Selling now may be safer based on this estimate.'
    : recommendedFarmerDecision === 'SMALL_DIFFERENCE'
    ? 'Difference is small. Choose the practical option.'
    : 'Higher practical return + lower transport risk';
  const marketSummaryText = recommendationSentence;
  const otherMarketNote = otherMarketEstimateUnavailable
    ? `${otherMarketName} was checked, but its model-based price estimate is unavailable.`
    : bestHasMeaningfulAdvantage
    ? `${otherMarketName} was checked as the nearest market. The recommended market may give a better estimated return, but transport cost should still be considered.`
    : `${otherMarketName} was checked, but it did not give a better practical return.`;
  const otherMarketTone = bestHasMeaningfulAdvantage
    ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
    : marketsAreClose
    ? 'border-gray-200 bg-gray-50 text-gray-700'
    : bestVsNearest !== null && bestVsNearest < 0
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-gray-200 bg-gray-50 text-gray-700';

  if (!recommendedMarket) return null;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
          AI Market Intelligence Engine Analysis
        </p>
        <h4 className="mt-2 text-3xl font-bold text-gray-900">
          {recommendedMarketName}
        </h4>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-green-100 bg-green-50 p-4">
            <p className="text-sm font-medium text-gray-600">
              {estimatedPriceLabel}
            </p>
            <p
              className={`mt-1 font-bold text-gray-900 ${
                recommendedEstimatedPrice !== null ? 'text-xl' : 'text-base'
              }`}
            >
              {formatOptionalPricePerKg(recommendedEstimatedPrice)}
            </p>
          </div>

          <div className="rounded-xl border border-green-100 bg-green-50 p-4">
            <p className="text-sm font-medium text-gray-600">
             AI Estimated Selling Value
            </p>
            <p
              className={`mt-1 font-bold text-green-800 ${
                recommendedEstimatedValue !== null ? 'text-xl' : 'text-base'
              }`}
            >
              {formatOptionalCurrency(recommendedEstimatedValue)}
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

        <details className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-gray-700">
            Technical price context
          </summary>
          <div className="mt-3 border-t border-gray-200 pt-3">
            <p className="text-sm font-medium text-gray-600">
              Reference Market Price
            </p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {formatPricePerKg(recommendedCurrentPrice)}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Latest observed market price used as model context.
            </p>
          </div>
        </details>
      </div>

      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
          Market Decision Summary
        </p>
        <h3 className="mt-2 text-2xl font-bold text-gray-900">
          {marketSummaryText}
        </h3>
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
                 AI Estimated Value
                </p>
                <p
                  className={`mt-1 font-bold text-gray-900 ${
                    otherEstimatedValue !== null ? 'text-lg' : 'text-base'
                  }`}
                >
                  {formatOptionalCurrency(otherEstimatedValue)}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Difference: {formatOptionalSignedCurrency(bestVsNearest)}
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
