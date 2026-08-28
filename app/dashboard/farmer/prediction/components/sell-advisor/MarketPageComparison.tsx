'use client';

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BanknotesIcon,
  ChevronDownIcon,
  MapPinIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';
import {
  formatMarketPageCurrency,
  formatMarketPagePrice,
  getMarketPageLayout,
  type MarketPageMarket,
} from './marketPagePresentation';

type MarketPageComparisonProps = {
  cropName: string;
  districtName: string;
  markets: readonly MarketPageMarket[];
  onBack: () => void;
  onViewDetails: () => void;
};

const MarketIllustration = ({ compact = false }: { compact?: boolean }) => (
  <svg
    viewBox="0 0 240 150"
    className={`market-illustration w-full transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none ${
      compact ? 'max-w-28' : 'max-w-44'
    }`}
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M27 123c7-18 23-29 42-30 11-27 38-46 70-46 40 0 72 29 76 67 9 1 16 4 21 9H27Z"
      className="fill-emerald-100/80"
    />
    <path
      d="M58 67h111l22 23H39l19-23Z"
      className="fill-emerald-700"
    />
    <path d="M48 89h134v45H48V89Z" className="fill-[#fffaf0]" />
    <path
      d="M48 89h134v13H48V89Z"
      className="fill-amber-200"
    />
    <path
      d="M48 89h22v13H48V89Zm44 0h22v13H92V89Zm44 0h22v13h-22V89Z"
      className="fill-emerald-500"
    />
    <path
      d="M62 107h38v27H62v-27Zm55 0h49v27h-49v-27Z"
      className="fill-white stroke-emerald-200"
      strokeWidth="2"
    />
    <path
      d="M72 122h34v14H72v-14Zm51 2h36v12h-36v-12Z"
      className="fill-amber-700"
    />
    <path
      d="M76 120c0-7 5-11 10-11 4 0 7 2 9 5 2-2 4-3 7-3 6 0 10 4 10 9H76Z"
      className="fill-emerald-500"
    />
    <circle cx="132" cy="117" r="6" className="fill-amber-400" />
    <circle cx="145" cy="116" r="7" className="fill-emerald-500" />
    <circle cx="157" cy="118" r="5" className="fill-orange-400" />
    <path
      d="M194 39c-12 0-22 9-22 21 0 17 22 35 22 35s22-18 22-35c0-12-10-21-22-21Z"
      className="fill-amber-400 stroke-white"
      strokeWidth="4"
    />
    <circle cx="194" cy="60" r="7" className="fill-white" />
    <path
      d="M34 135h177"
      className="stroke-emerald-800/25"
      strokeLinecap="round"
      strokeWidth="4"
    />
  </svg>
);

const MarketPriceDetails = ({ market }: { market: MarketPageMarket }) => {
  const currentPrice = formatMarketPagePrice(market.currentPrice);
  const expectedPrice = formatMarketPagePrice(market.expectedPrice);
  const harvestValue = formatMarketPageCurrency(market.harvestValue);
  const hasPriceEvidence = Boolean(currentPrice || expectedPrice || harvestValue);

  if (!hasPriceEvidence) {
    return (
      <p className="text-sm font-normal leading-5 text-slate-500">
        Comparable price values were not included for this market.
      </p>
    );
  }

  return (
    <dl className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
      {currentPrice && (
        <div className="rounded-xl bg-white/75 px-3 py-2.5">
          <dt className="text-[13px] font-medium text-slate-600">
            Current market price
          </dt>
          <dd className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950">
            {currentPrice}
          </dd>
        </div>
      )}
      {expectedPrice && (
        <div className="rounded-xl bg-white/75 px-3 py-2.5">
          <dt className="text-[13px] font-medium text-emerald-700">
            Expected next-period
          </dt>
          <dd className="mt-0.5 text-xl font-semibold tracking-tight text-emerald-950">
            {expectedPrice}
          </dd>
        </div>
      )}
      {harvestValue && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-xl border border-emerald-100/80 bg-white/75 px-3 py-2.5 sm:col-span-2 xl:col-span-1 xl:flex-col xl:items-start xl:justify-center">
          <dt className="text-[13px] font-normal text-slate-600">
            Model-implied harvest value
          </dt>
          <dd className="text-[15px] font-semibold text-slate-900">
            {harvestValue}
          </dd>
        </div>
      )}
    </dl>
  );
};

const AlternativeMarketCard = ({
  market,
  index,
  wide = false,
}: {
  market: MarketPageMarket;
  index: number;
  wide?: boolean;
}) => {
  const currentPrice = formatMarketPagePrice(market.currentPrice);
  const expectedPrice = formatMarketPagePrice(market.expectedPrice);
  const harvestValue = formatMarketPageCurrency(market.harvestValue);
  const hasDirection =
    market.direction.trim() && market.direction !== 'Not available';

  return (
    <article
      aria-label={`${market.name} alternative market`}
      data-testid="alternative-market-card"
      className="market-card-enter group relative overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_14px_32px_-30px_rgba(15,23,42,0.45)] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_18px_38px_-28px_rgba(5,100,70,0.35)] motion-reduce:transform-none motion-reduce:transition-none"
      style={{ animationDelay: `${120 + index * 55}ms` }}
    >
      <div
        className={`grid gap-3 ${
          wide
            ? 'sm:grid-cols-[minmax(150px,0.72fr)_minmax(0,1.35fr)_7rem] sm:items-center'
            : 'grid-cols-[minmax(0,1fr)_7rem] items-start'
        }`}
      >
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-600">
            Alternative market
          </p>
          <h3 className="mt-0.5 truncate text-xl font-semibold tracking-tight text-slate-950">
            {market.name}
          </h3>
        </div>

        <dl
          className={`grid grid-cols-2 gap-x-4 gap-y-2.5 border-slate-100 ${
            wide
              ? 'border-t pt-3 sm:col-start-2 sm:row-start-1 sm:border-l sm:border-t-0 sm:py-1 sm:pl-4 lg:grid-cols-4'
              : 'col-span-2 border-t pt-3'
          }`}
        >
          {currentPrice && (
            <div className="min-w-0">
              <dt className="text-[13px] font-normal text-slate-600">
                Current
              </dt>
              <dd className="truncate text-[15px] font-semibold text-slate-900">
                {currentPrice}
              </dd>
            </div>
          )}
          {expectedPrice && (
            <div className="min-w-0">
              <dt className="text-[13px] font-normal text-emerald-700">
                Expected
              </dt>
              <dd className="truncate text-[15px] font-semibold text-emerald-900">
                {expectedPrice}
              </dd>
            </div>
          )}
          {harvestValue && (
            <div className="min-w-0">
              <dt className="text-[13px] font-normal text-slate-600">
                Harvest value
              </dt>
              <dd className="truncate text-[15px] font-medium text-slate-800">
                {harvestValue}
              </dd>
            </div>
          )}
          {hasDirection && (
            <div className="min-w-0">
              <dt className="text-[13px] font-normal text-slate-600">
                Market signal
              </dt>
              <dd className="truncate text-[15px] font-medium text-teal-800">
                {market.direction}
              </dd>
            </div>
          )}
        </dl>

        <div
          className={`flex justify-end ${
            wide ? 'hidden sm:col-start-3 sm:row-start-1 sm:flex' : 'col-start-2 row-start-1'
          }`}
        >
          <MarketIllustration compact />
        </div>
      </div>

      {!currentPrice && !expectedPrice && !harvestValue && !hasDirection && (
        <p className="mt-3 border-t border-slate-100 pt-3 text-[13px] font-normal leading-5 text-slate-600">
          No additional comparison values were included for this market.
        </p>
      )}
    </article>
  );
};

export default function MarketPageComparison({
  cropName,
  districtName,
  markets,
  onBack,
  onViewDetails,
}: MarketPageComparisonProps) {
  const { primaryMarket, alternativeMarkets, comparisonMarkets } =
    getMarketPageLayout(markets);
  const pricedComparisonMarkets = comparisonMarkets.filter((market) =>
    Boolean(formatMarketPagePrice(market.expectedPrice))
  );

  return (
    <section className="space-y-3.5" data-testid="market-comparison-page">
      <header className="market-card-enter rounded-[1.55rem] border border-emerald-100 bg-[linear-gradient(120deg,#f1faf4_0%,#fffdf7_100%)] px-4 py-3 shadow-[0_16px_38px_-34px_rgba(5,100,70,0.45)] sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2.5">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Market comparison
            </p>
            <h1
              id="market-page-heading"
              className="mt-0.5 text-3xl font-bold tracking-tight text-emerald-950 sm:text-[2.15rem]"
            >
              Where should I sell?
            </h1>
            <p className="mt-1 text-[15px] font-normal leading-5 text-slate-600">
              Compare the available markets for your recommendation.
            </p>
          </div>
          <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium text-slate-600">
            <span className="rounded-full border border-emerald-100 bg-white/80 px-2.5 py-1">
              {cropName}
            </span>
            <span className="rounded-full border border-emerald-100 bg-white/80 px-2.5 py-1">
              Selling from {districtName}
            </span>
          </p>
        </div>
      </header>

      {primaryMarket ? (
        <>
          <div className="grid items-start gap-3.5 lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
            <div className="grid min-w-0 gap-3.5">
              <article
                aria-label={`${primaryMarket.name} ${
                  primaryMarket.isRecommended ? 'recommended' : 'available'
                } market`}
                data-testid="primary-market-card"
                data-recommended={primaryMarket.isRecommended}
                className="market-card-enter market-delay-1 group relative overflow-hidden rounded-[1.5rem] border border-emerald-200 bg-emerald-50/65 p-4 shadow-[0_18px_42px_-34px_rgba(5,100,70,0.5)] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[0_22px_48px_-32px_rgba(5,100,70,0.42)] motion-reduce:transform-none motion-reduce:transition-none"
              >
                <div className="relative grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-medium text-emerald-700">
                        {primaryMarket.isRecommended
                          ? 'Recommended market'
                          : 'Available market'}
                      </p>
                      {primaryMarket.isRecommended && (
                        <span className="rounded-full border border-emerald-300 bg-emerald-700 px-2.5 py-1 text-xs font-medium text-white shadow-[0_0_18px_-8px_rgba(5,150,105,0.9)] transition-colors duration-200 group-hover:bg-emerald-800 motion-reduce:transition-none">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                        <MapPinIcon className="size-5" aria-hidden="true" />
                      </span>
                      <h2 className="truncate text-2xl font-semibold tracking-tight text-slate-950 sm:text-[1.7rem]">
                        {primaryMarket.name}
                      </h2>
                    </div>
                    <p className="mt-2 max-w-2xl text-sm font-normal leading-5 text-slate-600">
                      {primaryMarket.isRecommended
                        ? 'Selected by the current market recommendation policy.'
                        : 'Shown as an available market without a recommendation claim.'}
                    </p>
                    <div className="mt-3">
                      <MarketPriceDetails market={primaryMarket} />
                    </div>
                  </div>
                  <div className="hidden items-center justify-end pr-1 sm:flex">
                    <MarketIllustration />
                  </div>
                </div>
              </article>

              <section aria-labelledby="alternative-markets-heading">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2
                      id="alternative-markets-heading"
                      className="text-lg font-semibold text-slate-950"
                    >
                      Alternative markets
                    </h2>
                    <p className="text-[13px] font-normal leading-5 text-slate-600">
                      Other markets included in the current result
                    </p>
                  </div>
                  {alternativeMarkets.length > 0 && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[13px] font-medium text-slate-600">
                      {alternativeMarkets.length}{' '}
                      {alternativeMarkets.length === 1
                        ? 'alternative'
                        : 'alternatives'}
                    </span>
                  )}
                </div>

                {alternativeMarkets.length > 0 ? (
                  <div
                    aria-label="Alternative markets returned by the recommendation"
                    className={`mt-2 grid gap-3 ${
                      alternativeMarkets.length === 1
                        ? 'grid-cols-1'
                        : 'md:grid-cols-2 2xl:grid-cols-3'
                    }`}
                  >
                    {alternativeMarkets.map((market, index) => (
                      <AlternativeMarketCard
                        key={market.id}
                        market={market}
                        index={index}
                        wide={alternativeMarkets.length === 1}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm font-normal leading-5 text-slate-600 shadow-[0_14px_32px_-30px_rgba(15,23,42,0.35)]">
                    No alternative market comparison is available in this response.
                  </p>
                )}
              </section>
            </div>

            <aside
              aria-labelledby="quick-market-comparison-heading"
              className="market-card-enter market-delay-2 self-start rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_14px_34px_-32px_rgba(15,23,42,0.42)]"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <ScaleIcon className="size-[18px]" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2
                    id="quick-market-comparison-heading"
                    className="text-base font-semibold text-slate-950"
                  >
                    Quick comparison
                  </h2>
                  <p className="text-[13px] font-normal leading-5 text-slate-600">
                    Expected next-period prices returned in this result
                  </p>
                </div>
              </div>

              {pricedComparisonMarkets.length > 0 ? (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  {pricedComparisonMarkets.map((market) => (
                    <li
                      key={market.id}
                      className={`flex min-h-11 min-w-0 items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                        market.isRecommended
                          ? 'border-emerald-100 bg-emerald-50/65'
                          : 'border-transparent bg-slate-50/90'
                      }`}
                    >
                      <span className="inline-flex min-w-0 items-center gap-2 text-[13px] font-medium text-slate-700">
                        <span
                          className={`size-2 shrink-0 rounded-full ${
                            market.isRecommended
                              ? 'bg-emerald-600'
                              : 'bg-amber-400'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="truncate">{market.name}</span>
                      </span>
                      <span className="shrink-0 text-[13px] font-semibold text-slate-900">
                        {formatMarketPagePrice(market.expectedPrice)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-[13px] font-normal leading-5 text-slate-600">
                  Comparable expected-price values were not included in this
                  recommendation.
                </p>
              )}
            </aside>
          </div>

          <div className="grid items-start gap-3.5 lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
            <details className="group min-h-16 rounded-2xl border border-amber-100 bg-amber-50/55 px-4 py-3 shadow-[0_14px_32px_-30px_rgba(15,23,42,0.3)]">
              <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2">
                  <BanknotesIcon
                    className="size-4 text-amber-700"
                    aria-hidden="true"
                  />
                  Why this market?
                </span>
                <ChevronDownIcon
                  className="size-4 text-slate-500 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </summary>
              <div className="border-t border-amber-100 pt-2 text-sm font-normal leading-5 text-slate-700">
                {primaryMarket.isRecommended ? (
                  <p>
                    {primaryMarket.name} is the market selected by the backend
                    recommendation policy. The alternatives above retain the order
                    returned with this recommendation; this page does not rerank
                    them.
                  </p>
                ) : (
                  <p>
                    This response did not identify a recommended market, so the
                    first available market is shown without a recommendation badge.
                  </p>
                )}
              </div>
            </details>

            <aside className="flex min-h-16 items-center rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-normal leading-5 text-slate-600 shadow-[0_14px_32px_-30px_rgba(15,23,42,0.3)]">
              Compare actual buyer offers and selling costs before making the final
              sale.
            </aside>
          </div>
        </>
      ) : (
        <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 text-sm font-normal leading-6 text-slate-600">
          No market comparison is available for this recommendation.
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 pt-0.5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:border-emerald-200 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          Back
        </button>
        <button
          type="button"
          onClick={onViewDetails}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
        >
          View Details
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </button>
      </div>

      <style jsx>{`
        @keyframes market-card-enter {
          from {
            opacity: 0;
            transform: translateY(7px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .market-card-enter {
          animation: market-card-enter 360ms cubic-bezier(0.22, 1, 0.36, 1)
            both;
        }

        .market-delay-1 {
          animation-delay: 60ms;
        }

        .market-delay-2 {
          animation-delay: 105ms;
        }

        @media (prefers-reduced-motion: reduce) {
          .market-card-enter {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
