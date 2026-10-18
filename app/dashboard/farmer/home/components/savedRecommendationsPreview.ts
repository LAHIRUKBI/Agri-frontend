import type { SavedRecommendationSummary } from '../../recommendations/savedRecommendationsApi';

export const MAX_DASHBOARD_RECOMMENDATIONS = 2;

export const getSavedRecommendationsPreview = (
  recommendations: SavedRecommendationSummary[]
) => recommendations.slice(0, MAX_DASHBOARD_RECOMMENDATIONS);
