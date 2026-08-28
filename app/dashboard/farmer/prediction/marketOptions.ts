import type { FarmerDistrictValue } from '@/utils/prediction-options';

export type AvailableMarket = {
  value: string;
  label: string;
};

export type MarketOptionsState = {
  loadedForFarmerDistrict: FarmerDistrictValue | '';
  availableMarkets: AvailableMarket[];
  marketsLoading: boolean;
  marketsError: boolean;
  requestSucceeded: boolean;
};

type MarketOptionsResponse = {
  success: true;
  farmer_district: FarmerDistrictValue;
  available_markets: AvailableMarket[];
};

type FetchMarketOptionsConfig = {
  signal?: AbortSignal;
  fetcher?: typeof fetch;
  apiBaseUrl?: string;
};

const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const INITIAL_MARKET_OPTIONS_STATE: MarketOptionsState = {
  loadedForFarmerDistrict: '',
  availableMarkets: [],
  marketsLoading: false,
  marketsError: false,
  requestSucceeded: false,
};

export const createLoadingMarketOptionsState = (
  farmerDistrict: FarmerDistrictValue
): MarketOptionsState => ({
  loadedForFarmerDistrict: farmerDistrict,
  availableMarkets: [],
  marketsLoading: true,
  marketsError: false,
  requestSucceeded: false,
});

export const createSuccessfulMarketOptionsState = (
  farmerDistrict: FarmerDistrictValue,
  availableMarkets: AvailableMarket[]
): MarketOptionsState => ({
  loadedForFarmerDistrict: farmerDistrict,
  availableMarkets,
  marketsLoading: false,
  marketsError: false,
  requestSucceeded: true,
});

export const createFailedMarketOptionsState = (
  farmerDistrict: FarmerDistrictValue
): MarketOptionsState => ({
  loadedForFarmerDistrict: farmerDistrict,
  availableMarkets: [],
  marketsLoading: false,
  marketsError: true,
  requestSucceeded: false,
});

export const hasAvailableMarketOptions = (
  state: MarketOptionsState,
  farmerDistrict: FarmerDistrictValue | ''
): boolean =>
  Boolean(farmerDistrict) &&
  state.loadedForFarmerDistrict === farmerDistrict &&
  state.requestSucceeded &&
  !state.marketsLoading &&
  !state.marketsError &&
  state.availableMarkets.length > 0;

export const isLatestMarketOptionsRequest = (
  requestId: number,
  latestRequestId: number
): boolean => requestId === latestRequestId;

export const buildMarketOptionsUrl = (
  farmerDistrict: FarmerDistrictValue,
  apiBaseUrl = DEFAULT_API_BASE_URL
) =>
  `${apiBaseUrl.replace(/\/$/, '')}/recommend-market/options?farmer_district=${encodeURIComponent(farmerDistrict)}`;

const isAvailableMarket = (value: unknown): value is AvailableMarket => {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.value === 'string' &&
    candidate.value.trim().length > 0 &&
    typeof candidate.label === 'string' &&
    candidate.label.trim().length > 0
  );
};

export const fetchAvailableMarkets = async (
  farmerDistrict: FarmerDistrictValue,
  config: FetchMarketOptionsConfig = {}
): Promise<AvailableMarket[]> => {
  const response = await (config.fetcher ?? fetch)(
    buildMarketOptionsUrl(farmerDistrict, config.apiBaseUrl),
    {
      method: 'GET',
      signal: config.signal,
      headers: { Accept: 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error('Available markets request failed');
  }

  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object') {
    throw new Error('Available markets response was invalid');
  }

  const candidate = payload as Partial<MarketOptionsResponse>;
  if (
    candidate.success !== true ||
    candidate.farmer_district !== farmerDistrict ||
    !Array.isArray(candidate.available_markets) ||
    !candidate.available_markets.every(isAvailableMarket)
  ) {
    throw new Error('Available markets response was invalid');
  }

  return candidate.available_markets;
};
