import type { FarmerDistrictValue } from '@/utils/prediction-options';
import type { AvailableMarket } from '../../marketOptions';

export type MarketMapLocation = {
  marketValue: string;
  district: FarmerDistrictValue;
  x: number;
  y: number;
};

export type AvailableMarketMapPin = AvailableMarket & MarketMapLocation;

// Approximate presentation coordinates in the local 474 x 797 SVG viewBox.
// This metadata never determines market availability or recommendation order.
export const MARKET_MAP_LOCATIONS: readonly MarketMapLocation[] = [
  { marketValue: 'meegoda', district: 'colombo', x: 107, y: 605 },
  { marketValue: 'kandy', district: 'kandy', x: 224, y: 516 },
  { marketValue: 'dambulla', district: 'matale', x: 227, y: 399 },
  {
    marketValue: 'nuwaraeliya',
    district: 'nuwara eliya',
    x: 255,
    y: 583,
  },
  { marketValue: 'puttalam', district: 'puttalam', x: 65, y: 366 },
  { marketValue: 'bandarawela', district: 'badulla', x: 294, y: 607 },
] as const;

const MARKET_LOCATION_BY_VALUE = new Map(
  MARKET_MAP_LOCATIONS.map((location) => [location.marketValue, location])
);

export const getAvailableMarketMapPins = (
  availableMarkets: readonly AvailableMarket[]
): AvailableMarketMapPin[] =>
  availableMarkets.flatMap((market) => {
    const location = MARKET_LOCATION_BY_VALUE.get(market.value);
    return location ? [{ ...market, ...location }] : [];
  });
