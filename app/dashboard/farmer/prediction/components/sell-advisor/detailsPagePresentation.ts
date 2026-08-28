import type { ActionDecision } from '../../recommendationContract';

export type DetailsDecisionPresentation = {
  label: 'Sell Now' | 'Wait' | 'Check the market';
  explanation: string;
};

const DETAILS_DECISION_PRESENTATIONS: Record<
  ActionDecision,
  DetailsDecisionPresentation
> = {
  SELL_NOW: {
    label: 'Sell Now',
    explanation:
      'The expected next-period price is lower than today\'s price, so selling now has the clearer price advantage.',
  },
  WAIT: {
    label: 'Wait',
    explanation:
      'The expected next-period price is higher than today\'s price, so waiting has the clearer price advantage.',
  },
  UNCERTAIN: {
    label: 'Check the market',
    explanation:
      'The price comparison does not show a clear enough advantage, so check current market conditions before deciding.',
  },
};

export const getDetailsDecisionPresentation = (
  decision: ActionDecision
): DetailsDecisionPresentation => DETAILS_DECISION_PRESENTATIONS[decision];

export const formatDetailsPrice = (
  value: number | null,
  unavailableText = 'Unavailable'
): string =>
  value === null || !Number.isFinite(value)
    ? unavailableText
    : `Rs. ${Math.round(value).toLocaleString()}/kg`;

export const formatDetailsPriceDifference = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return 'Not available';
  if (value === 0) return 'Rs. 0/kg';

  const sign = value > 0 ? '+' : '-';
  return `${sign}Rs. ${Math.round(Math.abs(value)).toLocaleString()}/kg`;
};

export const formatDetailsSignalLabel = (value: string): string => {
  const normalized = value.trim().toUpperCase();
  const labels: Record<string, string> = {
    UP: 'Upward',
    UPWARD: 'Upward',
    DOWN: 'Downward',
    DOWNWARD: 'Downward',
    STABLE: 'Stable',
    MIXED: 'Mixed',
  };

  if (labels[normalized]) return labels[normalized];
  if (!normalized || normalized === 'NOT AVAILABLE') return 'Not available';

  return value
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};
