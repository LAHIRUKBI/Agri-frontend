import type { ActionDecision } from '../../recommendationContract';

export type ResultJourneyPage = 'decision' | 'market' | 'details';

export const RESULT_JOURNEY_PAGES: ReadonlyArray<{
  id: ResultJourneyPage;
  label: string;
}> = [
  { id: 'decision', label: 'Decision' },
  { id: 'market', label: 'Market' },
  { id: 'details', label: 'Details' },
];

export const getNextResultPage = (
  page: ResultJourneyPage
): ResultJourneyPage => {
  if (page === 'decision') return 'market';
  return 'details';
};

export const getPreviousResultPage = (
  page: ResultJourneyPage
): ResultJourneyPage => {
  if (page === 'details') return 'market';
  return 'decision';
};

export const getFarmerTimingLabel = (
  decision: ActionDecision,
  actionAuthorized: boolean | undefined
): 'Sell Now' | 'Wait' | 'Timing Uncertain' => {
  if (actionAuthorized !== true) return 'Timing Uncertain';
  if (decision === 'SELL_NOW') return 'Sell Now';
  if (decision === 'WAIT') return 'Wait';
  return 'Timing Uncertain';
};

export const isAuthorizedTimingAction = (
  decision: ActionDecision,
  actionAuthorized: boolean | undefined
) =>
  actionAuthorized === true &&
  (decision === 'SELL_NOW' || decision === 'WAIT');
