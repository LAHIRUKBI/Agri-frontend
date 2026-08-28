import type {
  ActionDecision,
  WeatherForecast,
} from '../../recommendationContract';

export type DecisionHeroPresentation = {
  label: 'Sell Now' | 'Wait' | 'Check the market';
  summary: string;
};

export type WeatherImpactPresentation = {
  headline: string;
  guidance: string;
  rainLabel: string;
};

export const getDecisionHeroPresentation = (
  decision: ActionDecision
): DecisionHeroPresentation => {
  if (decision === 'SELL_NOW') {
    return {
      label: 'Sell Now',
      summary:
        'Prices are expected to be lower in the next market period, so selling now has the clearer price advantage.',
    };
  }

  if (decision === 'WAIT') {
    return {
      label: 'Wait',
      summary:
        'Prices are expected to be higher in the next market period, so waiting has the clearer price advantage.',
    };
  }

  return {
    label: 'Check the market',
    summary:
      'The expected price movement does not give a clear sell-now or wait signal.',
  };
};

export const calculateWholesaleGrossDifference = (
  currentPrice: number | null,
  predictedPrice: number | null,
  quantity: number
): number | null => {
  if (
    currentPrice === null ||
    predictedPrice === null ||
    !Number.isFinite(currentPrice) ||
    !Number.isFinite(predictedPrice) ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    return null;
  }

  return (predictedPrice - currentPrice) * quantity;
};

const formatRoundedCurrency = (value: number) =>
  `Rs. ${Math.round(Math.abs(value)).toLocaleString()}`;

export const formatSignedCurrency = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return 'Estimate unavailable';
  if (value > 0) return `+ ${formatRoundedCurrency(value)}`;
  if (value < 0) return `- ${formatRoundedCurrency(value)}`;
  return formatRoundedCurrency(0);
};

export const getWhyDecisionExplanation = (
  decision: ActionDecision,
  priceDifference: number | null
): string => {
  if (priceDifference === null || !Number.isFinite(priceDifference)) {
    return 'A reliable current-to-expected price comparison is unavailable, so no price difference has been fabricated.';
  }

  const absoluteDifference = Math.abs(priceDifference);
  const formattedDifference = `Rs. ${absoluteDifference.toLocaleString(
    undefined,
    { maximumFractionDigits: 2 }
  )}/kg`;

  if (decision === 'WAIT') {
    return absoluteDifference >= 5
      ? `The expected price is ${formattedDifference} higher than today, which reaches the Rs. 5/kg action boundary.`
      : `The backend action is Wait. The expected price is ${formattedDifference} higher than today; the backend policy remains authoritative.`;
  }

  if (decision === 'SELL_NOW') {
    return absoluteDifference >= 5
      ? `The expected price is ${formattedDifference} lower than today, which reaches the Rs. 5/kg action boundary.`
      : `The backend action is Sell Now. The expected price is ${formattedDifference} lower than today; the backend policy remains authoritative.`;
  }

  return absoluteDifference < 5
    ? `The difference is ${formattedDifference}, below the Rs. 5/kg action boundary, so there is no clear price advantage to selling now or waiting.`
    : `The backend returned an uncertain action even though the displayed difference is ${formattedDifference}; the backend action remains authoritative.`;
};

export const getShortSellerGuidance = (
  guidance: string | null | undefined,
  fallback: string
): string => {
  const normalized = guidance?.trim() || fallback;
  const firstTwoSentences = normalized
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(' ');

  if (firstTwoSentences.length <= 180) return firstTwoSentences;

  const shortened = firstTwoSentences.slice(0, 177);
  const lastSpace = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, Math.max(lastSpace, 1)).trim()}...`;
};

export const getWeatherImpactPresentation = (
  forecast?: WeatherForecast | null
): WeatherImpactPresentation => {
  const forecastDays =
    forecast?.days
      .filter((day) => Number.isFinite(day.rain_probability))
      .slice(0, 3) ?? [];

  if (forecastDays.length === 0) {
    return {
      headline: 'Forecast context unavailable',
      guidance: 'Check local conditions before harvest and transport.',
      rainLabel: 'No rain forecast available',
    };
  }

  const peakRainChance = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        Math.max(...forecastDays.map((day) => day.rain_probability))
      )
    )
  );
  const periodLabel =
    forecastDays.length === 1
      ? 'the next day'
      : `the next ${forecastDays.length} days`;

  if (peakRainChance >= 70) {
    return {
      headline: `High rain chance over ${periodLabel}`,
      guidance:
        'Allow extra time for transport and protect produce from wet conditions.',
      rainLabel: `Peak rain chance ${peakRainChance}%`,
    };
  }

  if (peakRainChance >= 40) {
    return {
      headline: `Some rain is possible over ${periodLabel}`,
      guidance: 'Keep transport and produce-protection plans flexible.',
      rainLabel: `Peak rain chance ${peakRainChance}%`,
    };
  }

  return {
    headline: `Lower rain chance over ${periodLabel}`,
    guidance: 'Continue checking conditions before harvest and transport.',
    rainLabel: `Peak rain chance ${peakRainChance}%`,
  };
};
