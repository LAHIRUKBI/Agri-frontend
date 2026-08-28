import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  CheckIcon,
  InformationCircleIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import {
  CROP_OPTIONS,
  FARMER_DISTRICT_OPTIONS,
  type CropValue,
  type FarmerDistrictValue,
} from '@/utils/prediction-options';
import type { AvailableMarket } from '../../marketOptions';
import SriLankaDistrictMap from './SriLankaDistrictMap';

type LocationSelectionStepProps = {
  crop: CropValue | '';
  value: FarmerDistrictValue | '';
  availableMarkets: AvailableMarket[];
  marketsLoading: boolean;
  marketsError: boolean;
  requestSucceeded: boolean;
  canContinue: boolean;
  onChange: (farmerDistrict: FarmerDistrictValue) => void;
  onRetry: () => void;
  onContinue: () => void;
  onBack: () => void;
};

export default function LocationSelectionStep({
  crop,
  value,
  availableMarkets,
  marketsLoading,
  marketsError,
  requestSucceeded,
  canContinue,
  onChange,
  onRetry,
  onContinue,
  onBack,
}: LocationSelectionStepProps) {
  const selectedCrop = CROP_OPTIONS.find((option) => option.value === crop);
  const selectedDistrict = FARMER_DISTRICT_OPTIONS.find(
    (district) => district.value === value
  );

  return (
    <div className="rounded-[1.75rem] border border-white/80 bg-white p-4 shadow-[0_24px_70px_-42px_rgba(15,118,80,0.28)] sm:p-5">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-center lg:flex-row lg:text-left">
        <div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.35rem] lg:leading-tight">
            Where are you selling from?
          </h1>
          <p className="mt-1.5 text-base leading-6 text-slate-600 sm:text-lg">
            Select the district where your crop is currently located.
          </p>
        </div>

        {selectedCrop && (
          <div className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-1.5 text-left">
            <Image
              src={selectedCrop.imageSrc}
              alt=""
              width={32}
              height={32}
              className="size-7 object-contain"
              aria-hidden="true"
            />
            <span>
              <span className="block text-xs font-medium text-emerald-700">
                Selected crop
              </span>
              <span className="block text-sm font-bold text-emerald-950">
                {selectedCrop.label}
              </span>
            </span>
          </div>
        )}
      </div>

      <div className="mx-auto mt-4 max-w-[72rem]">
        <div className="grid items-stretch gap-3 md:grid-cols-[minmax(13rem,0.75fr)_minmax(0,1.25fr)] lg:gap-4">
          <SriLankaDistrictMap
            selectedDistrict={value}
            availableMarkets={availableMarkets}
            onSelectDistrict={onChange}
          />

          <section
            className="rounded-3xl border border-slate-200 bg-slate-50/70 p-3 sm:p-3.5"
            aria-labelledby="quick-select-title"
          >
            <div
              className={`flex min-h-12 items-center gap-2.5 rounded-2xl border px-3 py-2 ${
                selectedDistrict
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-slate-200 bg-white'
              }`}
              aria-live="polite"
            >
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                  selectedDistrict
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
                aria-hidden="true"
              >
                {selectedDistrict ? (
                  <CheckIcon className="size-4.5" strokeWidth={2.5} />
                ) : (
                  <MapPinIcon className="size-4.5" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Selling from
                </span>
                <span className="mt-0.5 block truncate text-base font-bold text-slate-950">
                  {selectedDistrict?.label ?? 'No district selected'}
                </span>
              </span>
            </div>

            <fieldset className="mt-3" aria-describedby="district-help">
              <legend
                id="quick-select-title"
                className="text-sm font-bold text-slate-950"
              >
                Quick select
              </legend>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                Choose a district here or tap a green map region.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
                {FARMER_DISTRICT_OPTIONS.map((district) => {
                  const selected = district.value === value;

                  return (
                    <button
                      key={district.value}
                      type="button"
                      onClick={() => {
                        if (!selected) onChange(district.value);
                      }}
                      aria-pressed={selected}
                      className={`relative inline-flex min-h-11 items-center justify-center rounded-xl border px-2.5 py-2 text-sm font-bold leading-tight transition-[border-color,background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none md:min-h-10 ${
                        selected
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-950'
                      }`}
                    >
                      <span className="min-w-0">{district.label}</span>
                      {selected && (
                        <CheckIcon
                          className="absolute right-1.5 top-1.5 size-3.5"
                          strokeWidth={2.5}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <p
              id="district-help"
              className="mt-2 text-xs leading-5 text-slate-500"
            >
              Select your farm&apos;s district to see which markets can be
              compared. No district is selected automatically.
            </p>
          </section>
        </div>

        <div id="market-options-status" className="mt-3" aria-live="polite">
          {marketsLoading && (
            <div
              className="flex min-h-11 items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-sm font-medium text-emerald-900"
              role="status"
            >
              <ArrowPathIcon
                className="size-5 shrink-0 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              Finding markets available for your district...
            </div>
          )}

          {marketsError && (
            <div
              className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5"
              role="alert"
            >
              <p className="text-sm font-semibold text-slate-900">
                We couldn&apos;t load the available markets right now.
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-4 text-sm font-bold text-slate-800 transition-[border-color,box-shadow] duration-200 hover:border-emerald-500 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
              >
                <ArrowPathIcon className="size-4" aria-hidden="true" />
                Try again
              </button>
            </div>
          )}

          {requestSucceeded && availableMarkets.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-sm font-semibold text-slate-800">
                No markets are currently available for comparison for this
                district.
              </p>
            </div>
          )}

          {requestSucceeded && availableMarkets.length > 0 && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2.5">
              <h2 className="text-sm font-bold text-slate-950">
                Available markets
              </h2>
              <ul
                className="mt-1.5 flex flex-wrap gap-1.5"
                aria-label="Available markets"
              >
                {availableMarkets.map((market) => (
                  <li
                    key={market.value}
                    className="min-w-28 flex-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-center shadow-sm sm:flex-none"
                  >
                    <span className="block text-sm font-bold text-emerald-950">
                      {market.label}
                    </span>
                    <span className="sr-only">
                      Available for comparison
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-xs leading-5 text-slate-600">
                These markets are available for comparison based on your
                district. The system will compare them when generating your
                recommendation.
              </p>
            </div>
          )}

          {!value && !marketsLoading && !marketsError && !requestSucceeded && (
            <div className="flex min-h-11 items-center gap-2.5 rounded-xl border border-sky-100 bg-sky-50/70 px-3 py-2">
              <InformationCircleIcon
                className="size-5 shrink-0 text-sky-700"
                aria-hidden="true"
              />
              <p className="text-sm leading-5 text-slate-600">
                <span className="font-bold text-slate-900">
                  Markets are loaded from the system.
                </span>{' '}
                Choose your district to see the markets available for
                comparison.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
        >
          <ArrowLeftIcon className="size-5" aria-hidden="true" />
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 text-base font-semibold text-white shadow-sm transition-[background-color,box-shadow] duration-200 hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none motion-reduce:transition-none"
        >
          Continue
          <ArrowRightIcon className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
