'use client';

import { useState } from 'react';

import EarningsSummaryCards from './EarningsSummaryCards';
import MLPredictionOutput from './MLPredictionOutput';
import TransparencyNote from './TransparencyNote';

type ProbabilityMap = {
  UP?: number | string;
  DOWN?: number | string;
};

type FarmerOutcomeSignal = {
  direction?: string | null;
  message?: string | null;
  price_change_rs?: number | string | null;
  price_change_pct?: number | string | null;
  value_change_rs?: number | string | null;
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

type CurrentPriceSource = 'manual' | 'system' | 'system_reference';

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
      probabilities?: ProbabilityMap;
      current_price?: number | string;
      current_price_rs_kg?: number | string;
      reference_price_rs_kg?: number | string;
      predicted_price_rs_kg?: number | string | null;
      price_prediction_source?: string | null;
      price_model_metrics?: Record<string, unknown> | null;
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
    }
  | null
  | undefined;

type SubmittedInput = {
  crop?: string;
  district?: string;
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

type AiInsights = {
  recommendation: string;
  prediction_summary: string;
  price_movement: string;
  prediction_strength: string;
  why_this_matters: string;
  suggested_action: string;
};

type RecommendationData = {
  recommended_market?: MarketLike;
  best_farmer_return_market?: MarketLike;
  nearest_market?: MarketLike;
  best_market?: MarketLike;
  best_predicted_market?: MarketLike;
  farmer_outcome_signal?: FarmerOutcomeSignal | null;
  direction_model_signal?: DirectionModelSignal | null;
  market_context_signal?: MarketContextSignal | null;
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
  const [showAiDetails, setShowAiDetails] = useState(false);

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
    input,
  } = recommendation;
  const selectedMarket =
    recommendation.recommended_market ??
    recommendation.best_farmer_return_market ??
    recommendation.nearest_market ??
    recommendation.best_predicted_market ??
    null;

  const cropNameRaw = submittedInput?.crop || input?.crop || 'Crop';
  const cropName = String(cropNameRaw)
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  const districtNameRaw =
    submittedInput?.district || input?.district || 'your district';
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

  const getMarketPredictedPrice = (market: MarketLike) => {
    if (!market || typeof market === 'string') return null;
    return toNumber(market.predicted_price_rs_kg);
  };

  const getMarketCurrentPrice = (market: MarketLike) => {
    if (!market || typeof market === 'string') return null;

    return (
      toNumber(market.current_price_rs_kg) ??
      toNumber(market.current_price) ??
      toNumber(market.reference_price_rs_kg)
    );
  };

  const getMarketFarmerOutcomeSignal = (
    market: MarketLike
  ): FarmerOutcomeSignal | null => {
    if (!market || typeof market === 'string') return null;
    return market.farmer_outcome_signal ?? null;
  };

  const getLegacyFarmerOutcomeSignal = (
    market: MarketLike
  ): FarmerOutcomeSignal | null => {
    if (!market || typeof market === 'string') return null;

    const legacyDecision = market.farmer_decision?.trim().toUpperCase();
    const direction =
      legacyDecision === 'WAIT'
        ? 'GAIN'
        : legacyDecision === 'SELL_NOW'
        ? 'LOSS'
        : legacyDecision === 'SMALL_DIFFERENCE'
        ? 'SMALL_DIFFERENCE'
        : null;

    if (!direction && !market.farmer_decision_message) return null;

    return {
      direction,
      message: market.farmer_decision_message ?? null,
    };
  };

  const farmerOutcomeSignal =
    getMarketFarmerOutcomeSignal(selectedMarket) ??
    recommendation.farmer_outcome_signal ??
    getLegacyFarmerOutcomeSignal(selectedMarket);

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
    getMarketCurrentPrice(recommendation.recommended_market) ??
    getMarketCurrentPrice(selectedMarket);
  const selectedCurrentPrice =
    priceSourceMode === 'system_reference'
      ? systemCurrentPrice
      : manualCurrentPrice;
  const currentPriceLabel =
    priceSourceMode === 'system_reference'
      ? 'System Current Market Price'
      : 'Current Price';
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

  const estimateQuantity =
    harvestInputMode === 'exact'
      ? exactQuantity
      : (quantityMin + quantityMax) / 2;
  const currentRevenue =
    selectedCurrentPrice !== null ? selectedCurrentPrice * estimateQuantity : null;

  const recommendedMarketName = getMarketName(selectedMarket);
  const nearestMarketName = getMarketName(nearest_market);
  const recommendedIsNearest =
    recommendedMarketName !== '-' &&
    nearestMarketName !== '-' &&
    recommendedMarketName.toLowerCase() === nearestMarketName.toLowerCase();

  const getRecommendationMessage = () => {
    if (recommendedMarketName === '-') {
      return `${cropName} market outlook is available below.`;
    }

    if (recommendedIsNearest) {
      return `${recommendedMarketName} may be the practical option for ${cropName} in ${districtName}, with lower transport risk.`;
    }

    return `${recommendedMarketName} may offer a better estimated return, but transport cost should be considered.`;
  };

  const recommendationSubtext = `Based on your entered price, expected quantity, and the model price estimate for the selected market.`;

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
          Recommendation
        </p>
        <h2 className="mt-3 text-2xl font-bold leading-tight text-gray-900 md:text-3xl">
          {getRecommendationMessage()}
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-700">
          {recommendationSubtext}
        </p>
      </div>

      <EarningsSummaryCards
        cropName={cropName}
        harvestInputMode={harvestInputMode}
        quantityMin={quantityMin}
        quantityMax={quantityMax}
        exactQuantity={exactQuantity}
        quantityRangeLabel={quantityRangeLabel}
        price={selectedCurrentPrice}
        currentPriceLabel={currentPriceLabel}
        currentPriceUnavailableText="System current market price unavailable"
        predictedPriceRsKg={getMarketPredictedPrice(selectedMarket)}
        currentRevenue={currentRevenue}
        farmerDecision={farmerOutcomeSignal?.direction ?? null}
        farmerDecisionMessage={farmerOutcomeSignal?.message ?? null}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <button
          type="button"
          aria-expanded={showAiDetails}
          onClick={() => setShowAiDetails((current) => !current)}
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <span>
            <span className="block text-base font-bold text-gray-900">
              View AI reasoning
            </span>
            <span className="mt-1 block text-sm text-gray-500">
              Open the direction model signal and market context.
            </span>
          </span>
          <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-semibold text-gray-700">
            {showAiDetails ? 'Hide' : 'View'}
          </span>
        </button>

        {showAiDetails && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <MLPredictionOutput
              market={selectedMarket}
              horizon={submittedInput?.horizon ?? input?.horizon}
              priceSourceMode={priceSourceMode}
              currentPrice={selectedCurrentPrice}
            />
          </div>
        )}
      </div>

      <TransparencyNote />
    </div>
  );
}
