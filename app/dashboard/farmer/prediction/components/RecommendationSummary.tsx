'use client';

type MarketResult = {
  market: string;
  prediction: string;
  up_probability: number;
  down_probability: number;
};

type Props = {
  nearest: MarketResult;
  best: MarketResult;
  crop?: string;
  district?: string;
};

export default function RecommendationSummary({
  nearest,
  best,
  crop,
  district,
}: Props) {
  const formatLabel = (value: string) =>
    value
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const probabilityGap = Math.abs(
    (best?.up_probability ?? 0) - (nearest?.up_probability ?? 0)
  );

  const isSameMarket = nearest.market === best.market;

  const safeCrop = crop ? formatLabel(crop) : 'This crop';
  const safeDistrict = district ? formatLabel(district) : 'this district';

  const getDecisionLevel = () => {
    if (isSameMarket) {
      return {
        label: 'Recommended market',
        tone: 'strong',
        message: `${formatLabel(
          best.market
        )} is currently the most practical and best predicted market for selling ${safeCrop} from ${safeDistrict}.`,
      };
    }

    if (probabilityGap < 0.03) {
      return {
        label: 'Similar markets',
        tone: 'similar',
        message:
          'Both markets show very similar potential. Choosing the nearest market may be more practical.',
      };
    }

    if (probabilityGap < 0.07) {
      return {
        label: 'Slight advantage',
        tone: 'medium',
        message: `${formatLabel(best.market)} shows a slight predicted selling advantage over ${formatLabel(
          nearest.market
        )}.`,
      };
    }

    return {
      label: 'Strong recommendation',
      tone: 'strong',
      message: `${formatLabel(best.market)} shows a clearly stronger predicted selling opportunity than ${formatLabel(
        nearest.market
      )}.`,
      };
  };

  const decision = getDecisionLevel();

  const getDecisionBadgeStyle = () => {
    if (decision.tone === 'similar') {
      return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    }

    if (decision.tone === 'medium') {
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    }

    return 'bg-green-100 text-green-700 border border-green-200';
  };

  const getDecisionWarning = () => {
    if (isSameMarket) return null;

    if (probabilityGap < 0.03) {
      return {
        box: 'border border-yellow-200 bg-yellow-50',
        text: 'text-yellow-800',
        message:
          '⚠ Market potentials are very close. The nearest market may be the safer practical choice.',
      };
    }

    if (probabilityGap < 0.07) {
      return {
        box: 'border border-blue-200 bg-blue-50',
        text: 'text-blue-800',
        message:
          'ℹ A slight market advantage is detected. Compare transport and timing before deciding.',
      };
    }

    return {
      box: 'border border-green-200 bg-green-50',
      text: 'text-green-800',
      message:
        '✅ A stronger market advantage is detected for the best predicted market.',
    };
  };

  const warning = getDecisionWarning();

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <h3 className="mb-2 text-base font-semibold text-blue-800">
          Recommendation Summary
        </h3>

        <div className="space-y-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getDecisionBadgeStyle()}`}
          >
            {decision.label}
          </span>

          <p className="text-sm leading-6 text-blue-900">{decision.message}</p>
        </div>
      </div>

      {warning && (
        <div className={`rounded-xl px-4 py-3 ${warning.box}`}>
          <p className={`text-sm ${warning.text}`}>{warning.message}</p>
        </div>
      )}

      <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
        <p className="text-sm text-yellow-800">
          ⚠ Recommendation is based on historical trends, mapped markets,
          weather, and inflation conditions. Accuracy may decrease for longer
          forecast horizons.
        </p>
      </div>

      <div className="rounded-xl bg-gray-50 px-4 py-3">
        <p className="text-sm text-gray-500">
          Source:{' '}
          <span className="font-medium text-gray-700">
            Recommendation based on historical price, weather, inflation, and
            district-market mapping
          </span>
        </p>
      </div>
    </div>
  );
}