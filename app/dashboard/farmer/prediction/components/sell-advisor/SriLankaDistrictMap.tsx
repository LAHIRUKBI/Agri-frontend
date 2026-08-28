'use client';

import {
  ArrowsPointingOutIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  useEffect,
  useId,
  useMemo,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import {
  FARMER_DISTRICTS,
  FARMER_DISTRICT_OPTIONS,
} from '@/utils/prediction-options';
import type { FarmerDistrictValue } from '@/utils/prediction-options';
import type { AvailableMarket } from '../../marketOptions';
import {
  getSelectableDistrictValue,
  SRI_LANKA_DISTRICT_REGIONS,
  SRI_LANKA_ISLAND_OUTLINE,
  SRI_LANKA_MAP_VIEW_BOX,
} from './districtMapRegions';
import MarketMapPin from './MarketMapPin';
import {
  getAvailableMarketMapPins,
  type AvailableMarketMapPin,
} from './marketMapLocations';

type SriLankaDistrictMapProps = {
  selectedDistrict: FarmerDistrictValue | '';
  availableMarkets: readonly AvailableMarket[];
  onSelectDistrict: (district: FarmerDistrictValue) => void;
};

type DistrictMapGraphicProps = SriLankaDistrictMapProps & {
  marketPins: readonly AvailableMarketMapPin[];
  variant: 'compact' | 'expanded';
  activeMarketValue: string | null;
  onActivateMarket: (marketValue: string) => void;
};

const getDistrictLabel = (district: FarmerDistrictValue) =>
  FARMER_DISTRICT_OPTIONS.find((option) => option.value === district)?.label ??
  district;

function DistrictMapGraphic({
  selectedDistrict,
  onSelectDistrict,
  marketPins,
  variant,
  activeMarketValue,
  onActivateMarket,
}: DistrictMapGraphicProps) {
  const clipPathId = `sri-lanka-district-outline-${useId().replace(/:/g, '')}`;
  const selectedRegion = SRI_LANKA_DISTRICT_REGIONS.find(
    (region) => region.value === selectedDistrict
  );
  const expanded = variant === 'expanded';

  const selectRegion = (regionId: string) => {
    const district = getSelectableDistrictValue(regionId, FARMER_DISTRICTS);
    if (district && district !== selectedDistrict) onSelectDistrict(district);
  };

  const handleRegionKeyDown = (
    event: KeyboardEvent<SVGPathElement>,
    regionId: string
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    selectRegion(regionId);
  };

  return (
    <svg
      viewBox={SRI_LANKA_MAP_VIEW_BOX}
      className={
        expanded
          ? 'mx-auto h-[58vh] min-h-80 max-h-[38rem] w-full sm:h-[68vh]'
          : 'mx-auto mt-1 h-60 w-full'
      }
      preserveAspectRatio="xMidYMid meet"
      role="group"
      aria-label="Interactive map of supported Sri Lankan districts and available markets"
    >
      <defs>
        <clipPath id={clipPathId}>
          <path d={SRI_LANKA_ISLAND_OUTLINE} />
        </clipPath>
      </defs>

      <path
        d={SRI_LANKA_ISLAND_OUTLINE}
        className="fill-slate-100 stroke-slate-300"
        strokeWidth="2"
        aria-hidden="true"
      />

      <g clipPath={`url(#${clipPathId})`}>
        {SRI_LANKA_DISTRICT_REGIONS.map((region) => {
          const district = getSelectableDistrictValue(
            region.id,
            FARMER_DISTRICTS
          );
          const selectable = district !== null;
          const selected = district === selectedDistrict;

          return (
            <path
              key={region.id}
              id={`${variant}-district-region-${region.id}`}
              d={region.path}
              data-district-region={region.id}
              data-district-value={district ?? undefined}
              role={selectable ? 'button' : undefined}
              tabIndex={selectable ? 0 : undefined}
              aria-label={
                selectable ? `Select ${region.label} district` : undefined
              }
              aria-pressed={selectable ? selected : undefined}
              aria-hidden={selectable ? undefined : true}
              onClick={selectable ? () => selectRegion(region.id) : undefined}
              onKeyDown={
                selectable
                  ? (event) => handleRegionKeyDown(event, region.id)
                  : undefined
              }
              className={
                selectable
                  ? selected
                    ? 'cursor-pointer fill-emerald-500 stroke-emerald-800 stroke-[3] outline-none'
                    : 'cursor-pointer fill-emerald-100/90 stroke-white stroke-2 outline-none transition-colors duration-150 hover:fill-emerald-200 focus-visible:fill-emerald-200 focus-visible:stroke-emerald-700 focus-visible:stroke-[3] motion-reduce:transition-none'
                  : 'pointer-events-none fill-slate-200/90 stroke-white stroke-2'
              }
            >
              <title>
                {region.label}
                {selectable ? '' : ' — not available in Sell Advisor'}
              </title>
            </path>
          );
        })}
      </g>

      <path
        d={SRI_LANKA_ISLAND_OUTLINE}
        className="pointer-events-none fill-none stroke-slate-400"
        strokeWidth="2"
        aria-hidden="true"
      />

      {selectedRegion && (
        <g
          className="pointer-events-none"
          transform={`translate(${selectedRegion.marker[0]} ${selectedRegion.marker[1]})`}
          aria-hidden="true"
        >
          <circle
            r="7.5"
            className="fill-white stroke-emerald-700"
            strokeWidth="1.75"
          />
          <path
            d="M-4 0 L-1 4 L5 -4"
            className="fill-none stroke-emerald-700"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {marketPins.map((market) => (
        <MarketMapPin
          key={`${variant}-${market.value}`}
          market={market}
          districtLabel={getDistrictLabel(market.district)}
          variant={variant}
          active={activeMarketValue === market.value}
          onActivate={onActivateMarket}
        />
      ))}
    </svg>
  );
}

function MapLegend({ marketCount }: { marketCount: number }) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[0.68rem] font-semibold text-slate-600"
      aria-label="Map legend"
    >
      <span className="inline-flex items-center gap-1.5">
        <span
          className="size-2.5 rounded-sm border border-emerald-700 bg-emerald-500"
          aria-hidden="true"
        />
        Selected district
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="size-2.5 rounded-full border border-amber-900 bg-amber-400"
          aria-hidden="true"
        />
        Available market{marketCount > 1 ? 's' : ''}
      </span>
    </div>
  );
}

export default function SriLankaDistrictMap({
  selectedDistrict,
  availableMarkets,
  onSelectDistrict,
}: SriLankaDistrictMapProps) {
  const [activeMarketValue, setActiveMarketValue] = useState<string | null>(
    null
  );
  const [expanded, setExpanded] = useState(false);
  const dialogTitleId = `expanded-market-map-${useId().replace(/:/g, '')}`;
  const selectedLabel = FARMER_DISTRICT_OPTIONS.find(
    (district) => district.value === selectedDistrict
  )?.label;
  const marketPins = useMemo(
    () =>
      selectedDistrict ? getAvailableMarketMapPins(availableMarkets) : [],
    [availableMarkets, selectedDistrict]
  );
  const activeMarket = marketPins.find(
    (market) => market.value === activeMarketValue
  );
  const visibleActiveMarketValue = activeMarket?.value ?? null;

  useEffect(() => {
    if (!expanded) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [expanded]);

  const activateMarket = (marketValue: string) => {
    setActiveMarketValue((current) =>
      current === marketValue ? null : marketValue
    );
  };

  const selectDistrict = (district: FarmerDistrictValue) => {
    setActiveMarketValue(null);
    onSelectDistrict(district);
  };

  const closeFromBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) setExpanded(false);
  };

  return (
    <section
      className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50/60 p-3 shadow-sm sm:p-3.5"
      aria-labelledby="district-map-title"
    >
      <div className="relative text-center">
        <h2 id="district-map-title" className="text-sm font-bold text-slate-950">
          Select on the map
        </h2>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">
          Green regions are available in Sell Advisor.
        </p>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="absolute right-0 top-0 inline-flex size-8 items-center justify-center rounded-lg border border-emerald-100 bg-white text-emerald-800 shadow-sm transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          aria-label="Expand district and market map"
        >
          <ArrowsPointingOutIcon className="size-4" aria-hidden="true" />
        </button>
      </div>

      <DistrictMapGraphic
        selectedDistrict={selectedDistrict}
        availableMarkets={availableMarkets}
        onSelectDistrict={selectDistrict}
        marketPins={marketPins}
        variant="compact"
        activeMarketValue={visibleActiveMarketValue}
        onActivateMarket={activateMarket}
      />

      <MapLegend marketCount={marketPins.length} />

      <div
        className="mt-1 flex min-h-9 items-center justify-between gap-2 rounded-xl border border-white bg-white/90 px-2.5 py-1.5 shadow-sm"
        aria-live="polite"
      >
        {activeMarket ? (
          <>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-slate-950">
                {activeMarket.label}
              </span>
              <span className="block text-[0.68rem] font-semibold text-amber-800">
                Available market · {getDistrictLabel(activeMarket.district)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setActiveMarketValue(null)}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              aria-label="Close market information"
            >
              <XMarkIcon className="size-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-emerald-700">
              Map selection
            </span>
            <span className="text-right text-sm font-bold text-slate-950">
              {selectedLabel ?? 'Choose a green region'}
            </span>
          </>
        )}
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={closeFromBackdrop}
          role="presentation"
        >
          <section
            className="max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/70 bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:p-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id={dialogTitleId}
                  className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl"
                >
                  District and available markets
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Market pins show approximate locations for this Sell Advisor
                  search.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                aria-label="Close expanded map"
              >
                <XMarkIcon className="size-5" aria-hidden="true" />
              </button>
            </header>

            <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-2 sm:p-3">
              <DistrictMapGraphic
                selectedDistrict={selectedDistrict}
                availableMarkets={availableMarkets}
                onSelectDistrict={selectDistrict}
                marketPins={marketPins}
                variant="expanded"
                activeMarketValue={visibleActiveMarketValue}
                onActivateMarket={activateMarket}
              />
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <MapLegend marketCount={marketPins.length} />
              {activeMarket ? (
                <div
                  className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2"
                  aria-live="polite"
                >
                  <span>
                    <span className="block text-sm font-bold text-slate-950">
                      {activeMarket.label}
                    </span>
                    <span className="block text-xs font-medium text-slate-600">
                      {getDistrictLabel(activeMarket.district)} · Available in
                      this Sell Advisor search
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveMarketValue(null)}
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                    aria-label="Close market information"
                  >
                    <XMarkIcon className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <p className="text-xs font-medium text-slate-500">
                  Select an amber market pin to view its name and district.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
