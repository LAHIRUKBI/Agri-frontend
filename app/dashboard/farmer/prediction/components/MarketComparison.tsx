'use client';

type MarketResult = {
  market: string;
  prediction: string;
  up_probability: number;
  down_probability: number;
};

type Props = {
  comparisons: MarketResult[];
};

export default function MarketComparison({ comparisons }: Props) {
  if (!comparisons || comparisons.length === 0) {
    return null;
  }

  const formatLabel = (value: string) =>
    value
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <h3 className="mb-3 text-base font-semibold text-gray-800">
        Market Comparison
      </h3>

      <div className="space-y-3">
        {comparisons.map((item) => (
          <div
            key={item.market}
            className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-semibold text-gray-800">
                {formatLabel(item.market)}
              </p>
              <p className="text-sm text-gray-500">
                Prediction: {item.prediction}
              </p>
            </div>

            <div className="flex gap-3">
              <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                UP: {(item.up_probability * 100).toFixed(2)}%
              </div>
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                DOWN: {(item.down_probability * 100).toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}