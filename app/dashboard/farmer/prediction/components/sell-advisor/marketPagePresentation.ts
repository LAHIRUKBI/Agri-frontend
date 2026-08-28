export type MarketPageMarket = {
  id: string;
  name: string;
  currentPrice: number | null;
  expectedPrice: number | null;
  harvestValue: number | null;
  direction: string;
  isRecommended: boolean;
};

export type MarketPageLayout = {
  primaryMarket: MarketPageMarket | null;
  alternativeMarkets: MarketPageMarket[];
  comparisonMarkets: MarketPageMarket[];
};

const isUsableMarket = (market: MarketPageMarket) =>
  Boolean(market.id.trim()) && Boolean(market.name.trim());

export const getMarketPageLayout = (
  markets: readonly MarketPageMarket[]
): MarketPageLayout => {
  const seenMarketIds = new Set<string>();
  const comparisonMarkets = markets.filter((market) => {
    if (!isUsableMarket(market) || seenMarketIds.has(market.id)) return false;
    seenMarketIds.add(market.id);
    return true;
  });
  const backendRecommendedMarket =
    comparisonMarkets.find((market) => market.isRecommended) ?? null;
  const primaryMarket = backendRecommendedMarket ?? comparisonMarkets[0] ?? null;
  const alternativeMarkets = primaryMarket
    ? comparisonMarkets.filter((market) => market.id !== primaryMarket.id)
    : [];

  return {
    primaryMarket,
    alternativeMarkets,
    comparisonMarkets,
  };
};

export const formatMarketPagePrice = (value: number | null): string | null =>
  value !== null && Number.isFinite(value)
    ? `Rs. ${Math.round(value).toLocaleString()}/kg`
    : null;

export const formatMarketPageCurrency = (
  value: number | null
): string | null =>
  value !== null && Number.isFinite(value)
    ? `Rs. ${Math.round(value).toLocaleString()}`
    : null;
