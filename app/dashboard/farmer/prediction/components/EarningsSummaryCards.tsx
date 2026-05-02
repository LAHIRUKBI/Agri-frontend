'use client';

type HarvestInputMode = 'range' | 'exact';

type Props = {
  cropName: string;
  harvestInputMode: HarvestInputMode;
  quantityMin: number;
  quantityMax: number;
  exactQuantity: number;
  quantityRangeLabel: string;
  price: number | null;
  currentPriceLabel?: string;
  currentPriceUnavailableText?: string;
  predictedPriceRsKg: number | null;
  predictedPriceRangeMinRsKg?: number | null;
  predictedPriceRangeMaxRsKg?: number | null;
  currentRevenue: number | null;
  farmerDecision?: string | null;
  farmerDecisionMessage?: string | null;
};

export default function EarningsSummaryCards({
  cropName,
  harvestInputMode,
  quantityMin,
  quantityMax,
  exactQuantity,
  quantityRangeLabel,
  price,
  currentPriceLabel = 'Current Price',
  currentPriceUnavailableText = 'Price estimate unavailable',
  predictedPriceRsKg,
  predictedPriceRangeMinRsKg,
  predictedPriceRangeMaxRsKg,
  currentRevenue,
}: Props) {
  const quantity =
    harvestInputMode === 'exact' ? exactQuantity : (quantityMin + quantityMax) / 2;
  const hasPredictedPrice = predictedPriceRsKg !== null;
  const hasPredictedPriceRange =
    predictedPriceRangeMinRsKg !== null &&
    predictedPriceRangeMinRsKg !== undefined &&
    predictedPriceRangeMaxRsKg !== null &&
    predictedPriceRangeMaxRsKg !== undefined;

  const predictedPriceMin = hasPredictedPriceRange
    ? Math.min(predictedPriceRangeMinRsKg, predictedPriceRangeMaxRsKg)
    : predictedPriceRsKg;
  const predictedPriceMax = hasPredictedPriceRange
    ? Math.max(predictedPriceRangeMinRsKg, predictedPriceRangeMaxRsKg)
    : predictedPriceRsKg;
  const hasFuturePrice =
    predictedPriceMin !== null &&
    predictedPriceMin !== undefined &&
    predictedPriceMax !== null &&
    predictedPriceMax !== undefined;

  const sellNowValue =
    currentRevenue ?? (price !== null ? price * quantity : null);
  const futureValueMin = hasFuturePrice ? predictedPriceMin * quantity : null;
  const futureValueMax = hasFuturePrice ? predictedPriceMax * quantity : null;
  const potentialGainMin =
    futureValueMin !== null && sellNowValue !== null
      ? futureValueMin - sellNowValue
      : null;
  const potentialGainMax =
    futureValueMax !== null && sellNowValue !== null
      ? futureValueMax - sellNowValue
      : null;

  const formatCurrency = (value: number) =>
    `Rs. ${Math.round(Math.abs(value)).toLocaleString()}`;

  const formatSignedCurrency = (value: number) => {
    if (value > 0) return formatCurrency(value);
    if (value < 0) return `${formatCurrency(value)} loss`;
    return formatCurrency(value);
  };

  const formatPricePerKg = (value: number) => `${formatCurrency(value)}/kg`;

  const formatPriceRangePerKg = (min: number | null, max: number | null) => {
    if (min === null || max === null) return 'Price estimate unavailable';
    if (Math.round(min) === Math.round(max)) return formatPricePerKg(min);
    return `${formatCurrency(min)} - ${formatCurrency(max)}/kg`;
  };

  const formatValueRange = (min: number | null, max: number | null) => {
    if (min === null || max === null) return 'Price estimate unavailable';
    if (Math.round(min) === Math.round(max)) return formatCurrency(min);
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  };

  const formatGainRange = (min: number | null, max: number | null) => {
    if (min === null || max === null) return 'Price estimate unavailable';

    const lower = Math.min(min, max);
    const upper = Math.max(min, max);

    if (Math.round(lower) === Math.round(upper)) {
      return formatSignedCurrency(lower);
    }

    if (lower < 0 && upper < 0) {
      return `${formatCurrency(lower)} - ${formatCurrency(upper)} loss`;
    }

    if (lower < 0 && upper > 0) {
      return `${formatCurrency(lower)} loss - ${formatCurrency(upper)} gain`;
    }

    return `${formatCurrency(lower)} - ${formatCurrency(upper)}`;
  };

  const quantityLabel =
    harvestInputMode === 'exact'
      ? `${exactQuantity.toLocaleString()} kg`
      : quantityRangeLabel || `${quantityMin.toLocaleString()} - ${quantityMax.toLocaleString()} kg`;
  const currentPriceValueLabel =
    price !== null ? formatPricePerKg(price) : currentPriceUnavailableText;
  const sellNowFormula =
    price !== null
      ? `${formatPricePerKg(price)} x ${quantity.toLocaleString()} kg`
      : currentPriceUnavailableText;
  const futureFormula =
    hasFuturePrice && hasPredictedPrice
      ? `${formatPricePerKg(predictedPriceRsKg)} x ${quantity.toLocaleString()} kg`
      : 'Price estimate unavailable';
  const futurePriceLabel = formatPriceRangePerKg(predictedPriceMin, predictedPriceMax);
  const futureValueLabel = formatValueRange(futureValueMin, futureValueMax);
  const potentialGainLabel = formatGainRange(potentialGainMin, potentialGainMax);
  const potentialGainTitle =
    potentialGainMin !== null &&
    potentialGainMax !== null &&
    Math.min(potentialGainMin, potentialGainMax) > 0
      ? 'Potential Gain'
      : potentialGainMin !== null &&
        potentialGainMax !== null &&
        Math.max(potentialGainMin, potentialGainMax) < 0
      ? 'Potential Loss'
      : 'Estimated Difference';
  const decisionText =
    predictedPriceRsKg === null || price === null
      ? 'Price estimate unavailable'
      : predictedPriceRsKg > price
      ? 'Waiting may improve your return'
      : predictedPriceRsKg < price
      ? 'Selling now may be safer'
      : 'The difference is small';
  const potentialGainTone =
    potentialGainMin !== null && potentialGainMax !== null && Math.max(potentialGainMin, potentialGainMax) > 0
      ? 'text-green-700'
      : potentialGainMin !== null && potentialGainMax !== null && Math.min(potentialGainMin, potentialGainMax) < 0
      ? 'text-red-700'
      : 'text-gray-700';

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <section className="rounded-2xl border border-green-100 bg-green-50/60 p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-green-700">{cropName}</p>
            <h3 className="text-xl font-bold text-gray-900 md:text-2xl">
              AI Price Estimate
            </h3>
          </div>
          <p className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
            Model-based estimate
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-600">
              {currentPriceLabel}
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {currentPriceValueLabel}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-600">
              Estimated Future Price
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {futurePriceLabel}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Quantity</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {quantityLabel}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Decision</p>
            <p className={`mt-2 text-xl font-bold ${potentialGainTone}`}>
              {decisionText}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 shadow-sm md:p-6">
        <h3 className="text-xl font-bold text-gray-900 md:text-2xl">
          Earnings Comparison
        </h3>

        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sell Now Value</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {sellNowValue !== null
                    ? formatCurrency(sellNowValue)
                    : currentPriceUnavailableText}
                </p>
              </div>
              <p className="text-xs font-medium text-gray-400">
                Formula: {sellNowFormula}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Estimated Future Value
                </p>
                <p
                  className={`mt-2 font-bold text-gray-900 ${
                    hasFuturePrice ? 'text-2xl' : 'text-base'
                  }`}
                >
                  {futureValueLabel}
                </p>
              </div>
              <p className="text-xs font-medium text-gray-400">
                Formula: {futureFormula}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-600">
              {potentialGainTitle}
            </p>
            <p className={`mt-2 text-2xl font-bold ${potentialGainTone}`}>
              {potentialGainLabel}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
