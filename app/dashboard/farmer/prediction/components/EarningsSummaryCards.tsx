'use client';

type HarvestInputMode = 'range' | 'exact';

type EarningsQuantityInput = {
  harvestInputMode: HarvestInputMode;
  quantityMin: number;
  quantityMax: number;
  exactQuantity: number;
};

export const resolveEarningsQuantity = ({
  harvestInputMode,
  quantityMin,
  quantityMax,
  exactQuantity,
}: EarningsQuantityInput) =>
  harvestInputMode === 'exact'
    ? exactQuantity
    : (quantityMin + quantityMax) / 2;

export const calculateModelImpliedHarvestValue = (
  predictedPriceRsKg: number | null | undefined,
  quantity: number
) =>
  predictedPriceRsKg === null || predictedPriceRsKg === undefined
    ? null
    : predictedPriceRsKg * quantity;

type Props = {
  harvestInputMode: HarvestInputMode;
  quantityMin: number;
  quantityMax: number;
  exactQuantity: number;
  price: number | null;
  currentPriceUnavailableText?: string;
  predictedPriceRsKg: number | null;
  predictedPriceRangeMinRsKg?: number | null;
  predictedPriceRangeMaxRsKg?: number | null;
  currentRevenue: number | null;
};

export default function EarningsSummaryCards({
  harvestInputMode,
  quantityMin,
  quantityMax,
  exactQuantity,
  price,
  currentPriceUnavailableText = 'Price estimate unavailable',
  predictedPriceRsKg,
  predictedPriceRangeMinRsKg,
  predictedPriceRangeMaxRsKg,
  currentRevenue,
}: Props) {
  const quantity = resolveEarningsQuantity({
    harvestInputMode,
    quantityMin,
    quantityMax,
    exactQuantity,
  });
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
  const futureValueMin = hasFuturePrice
    ? calculateModelImpliedHarvestValue(predictedPriceMin, quantity)
    : null;
  const futureValueMax = hasFuturePrice
    ? calculateModelImpliedHarvestValue(predictedPriceMax, quantity)
    : null;
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
    if (value > 0) return `+ ${formatCurrency(value)}`;
    if (value < 0) return `− ${formatCurrency(value)}`;
    return formatCurrency(value);
  };

  const formatValueRange = (min: number | null, max: number | null) => {
    if (min === null || max === null) return 'Price estimate unavailable';
    if (Math.round(min) === Math.round(max)) return formatCurrency(min);
    return `${formatCurrency(min)} – ${formatCurrency(max)}`;
  };

  const formatGainRange = (min: number | null, max: number | null) => {
    if (min === null || max === null) return 'Price estimate unavailable';

    const lower = Math.min(min, max);
    const upper = Math.max(min, max);
    if (Math.round(lower) === Math.round(upper)) {
      return formatSignedCurrency(lower);
    }

    return `${formatSignedCurrency(lower)} to ${formatSignedCurrency(upper)}`;
  };

  const experimentalScenarioValue = futureValueMax ?? futureValueMin;
  const comparisonScale = Math.max(
    sellNowValue ?? 0,
    experimentalScenarioValue ?? 0,
    1
  );
  const currentValueBarWidth =
    sellNowValue === null ? 0 : Math.max(sellNowValue, 0) / comparisonScale * 100;
  const experimentalValueBarWidth =
    experimentalScenarioValue === null
      ? 0
      : Math.max(experimentalScenarioValue, 0) / comparisonScale * 100;

  return (
    <section
      aria-labelledby="selling-scenario-heading"
      className="overflow-hidden rounded-[1.35rem] border border-emerald-100 bg-[linear-gradient(145deg,#ffffff_0%,#f4fbf7_100%)] shadow-sm"
    >
      <div className="border-b border-emerald-100/80 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">
          Your selling scenario
        </p>
        <h3 id="selling-scenario-heading" className="sr-only">
          Current and experimental crop values
        </h3>
      </div>

      <div className="p-4">
        <dl className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <div className="border-b border-slate-100 pb-3 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-3 lg:border-b lg:border-r-0 lg:pb-3 lg:pr-0 xl:border-b-0 xl:border-r xl:pb-0 xl:pr-3">
            <dt className="text-xs font-semibold leading-4 text-slate-500">
              Sell at Current Price
            </dt>
            <dd className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              {sellNowValue !== null
                ? formatCurrency(sellNowValue)
                : currentPriceUnavailableText}
            </dd>
          </div>
          <div className="border-b border-slate-100 pb-3 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-3 lg:border-b lg:border-r-0 lg:pb-3 lg:pr-0 xl:border-b-0 xl:border-r xl:pb-0 xl:pr-3">
            <dt className="text-xs font-semibold leading-4 text-slate-500">
              Experimental Model-Implied Value
            </dt>
            <dd className="mt-1 text-2xl font-black tracking-tight text-teal-800">
              {formatValueRange(futureValueMin, futureValueMax)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold leading-4 text-slate-500">
              Model-Implied Difference
            </dt>
            <dd className="mt-1 text-2xl font-black tracking-tight text-amber-800">
              {formatGainRange(potentialGainMin, potentialGainMax)}
            </dd>
          </div>
        </dl>

        <div
          role="img"
          aria-label="Visual comparison of current sale value and experimental model-implied value"
          className="mt-4 space-y-3 rounded-xl bg-slate-950/[0.025] p-3"
        >
          <div>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-slate-600">
                Current price value
              </span>
              <span className="font-bold text-slate-800">
                {sellNowValue !== null
                  ? formatCurrency(sellNowValue)
                  : currentPriceUnavailableText}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-600 transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${currentValueBarWidth}%` }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-slate-600">
                Experimental scenario
              </span>
              <span className="font-bold text-teal-800">
                {formatValueRange(futureValueMin, futureValueMax)}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${experimentalValueBarWidth}%` }}
              />
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-600">
          Experimental estimate — not guaranteed earnings.
        </p>
      </div>
    </section>
  );
}
