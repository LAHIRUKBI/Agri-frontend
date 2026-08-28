'use client';

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';
import {
  type FormEvent,
  type KeyboardEvent,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import {
  CROP_OPTIONS,
  FARMER_DISTRICT_OPTIONS,
  getQuantityRangesForCrop,
  getRangeEarningsQuantity,
} from '@/utils/prediction-options';
import {
  isValidExactQuantity,
  isValidSellAdvisorQuantity,
  type SellAdvisorDraft,
} from '../../sellAdvisorState';

type QuantitySelectionStepProps = {
  draft: SellAdvisorDraft;
  onModeChange: (mode: SellAdvisorDraft['quantityMode']) => void;
  onExactQuantityChange: (quantity: string) => void;
  onHarvestRangeChange: (range: string) => void;
  onContinue: () => void;
  onBack: () => void;
};

const BLOCKED_NUMBER_KEYS = new Set(['-', '+', 'e', 'E']);

const splitRangeLabel = (label: string) => {
  const detailStart = label.lastIndexOf(' (');
  if (detailStart === -1) return { title: label, detail: '' };

  return {
    title: label.slice(0, detailStart).replace(/\s+Harvest$/, ''),
    detail: label.slice(detailStart + 2, -1),
  };
};

const CRATE_LAYOUTS = [
  [{ x: 27, y: 20 }],
  [
    { x: 16, y: 20 },
    { x: 38, y: 20 },
  ],
  [
    { x: 16, y: 22 },
    { x: 38, y: 22 },
    { x: 27, y: 7 },
  ],
  [
    { x: 6, y: 22 },
    { x: 27, y: 22 },
    { x: 48, y: 22 },
    { x: 27, y: 7 },
  ],
] as const;

function HarvestRangeVisual({ index }: { index: number }) {
  if (index === 4) {
    return (
      <svg
        viewBox="0 0 72 48"
        fill="none"
        stroke="currentColor"
        className="h-9 w-13"
        aria-hidden="true"
      >
        <path
          d="M7 13h34v23H7zM41 21h12l10 10v5H41zM12 18h24M12 24h24M12 30h24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="19" cy="38" r="4" fill="white" strokeWidth="2" />
        <circle cx="53" cy="38" r="4" fill="white" strokeWidth="2" />
      </svg>
    );
  }

  const crates = CRATE_LAYOUTS[index] ?? CRATE_LAYOUTS[0];

  return (
    <svg
      viewBox="0 0 72 48"
      fill="none"
      stroke="currentColor"
      className="h-9 w-13"
      aria-hidden="true"
    >
      {crates.map(({ x, y }) => (
        <g key={`${x}-${y}`}>
          <rect
            x={x}
            y={y}
            width="18"
            height="14"
            rx="2"
            fill="currentColor"
            fillOpacity="0.1"
            strokeWidth="1.8"
          />
          <path
            d={`M${x + 3} ${y + 5}h12M${x + 3} ${y + 9}h12`}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </g>
      ))}
    </svg>
  );
}

export default function QuantitySelectionStep({
  draft,
  onModeChange,
  onExactQuantityChange,
  onHarvestRangeChange,
  onContinue,
  onBack,
}: QuantitySelectionStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const crop = CROP_OPTIONS.find((option) => option.value === draft.crop);
  const district = FARMER_DISTRICT_OPTIONS.find(
    (option) => option.value === draft.farmerDistrict
  );
  const quantityRanges = getQuantityRangesForCrop(draft.crop);
  const supportedHarvestRanges = quantityRanges.map((range) => range.label);
  const selectedRange = quantityRanges.find(
    (range) => range.label === draft.harvestRange
  );
  const exactQuantityValid = isValidExactQuantity(draft.exactQuantity);
  const quantityValid = isValidSellAdvisorQuantity(
    draft,
    supportedHarvestRanges
  );
  const showExactError =
    draft.quantityMode === 'exact' && hasInteracted && !exactQuantityValid;

  const handleModeChange = (mode: SellAdvisorDraft['quantityMode']) => {
    setHasInteracted(false);
    onModeChange(mode);
    if (mode === 'exact') {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasInteracted(true);
    if (quantityValid) onContinue();
  };

  const handleExactQuantityKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (BLOCKED_NUMBER_KEYS.has(event.key)) event.preventDefault();
    if (event.key === 'Enter' && !exactQuantityValid) {
      setHasInteracted(true);
    }
  };

  const priceContext =
    draft.currentPriceSource === 'manual' && draft.currentPrice
      ? `Manual price: Rs. ${draft.currentPrice}/kg`
      : 'System market price';

  return (
    <div className="rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-[0_24px_70px_-42px_rgba(15,118,80,0.32)] sm:p-7 lg:p-8">
      <form onSubmit={handleSubmit} noValidate>
        <div className="mx-auto max-w-2xl text-center">
          <span
            className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"
            aria-hidden="true"
          >
            <ScaleIcon className="size-6" />
          </span>
          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.65rem] lg:leading-tight">
            How much are you expecting to harvest?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Choose a range for a quick estimate, or enter the exact amount.
          </p>

          <div className="mt-4 inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3.5 py-2 text-sm">
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-950">
              {crop && (
                <Image
                  src={crop.imageSrc}
                  alt=""
                  width={24}
                  height={24}
                  className="size-6 object-contain"
                  aria-hidden="true"
                />
              )}
              <span>{crop?.label ?? 'Selected crop'}</span>
            </span>
            <span className="text-emerald-300" aria-hidden="true">
              •
            </span>
            <span className="font-semibold text-emerald-900">
              {district?.label ?? 'Selected district'}
            </span>
            <span className="basis-full text-xs font-medium text-emerald-700">
              {priceContext}
            </span>
          </div>
        </div>

        <fieldset className="mx-auto mt-5 max-w-md sm:mt-6">
          <legend className="sr-only">Choose how to enter harvest quantity</legend>
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1.5">
            {[
              { value: 'exact' as const, label: 'Exact quantity' },
              { value: 'range' as const, label: 'Choose a range' },
            ].map((option) => {
              const selected = draft.quantityMode === option.value;

              return (
                <label
                  key={option.value}
                  className={`relative flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition-[border-color,background-color,box-shadow] duration-200 motion-reduce:transition-none ${
                    selected
                      ? 'border-emerald-600 bg-white text-emerald-900 shadow-sm'
                      : 'border-transparent text-slate-600 hover:bg-white/70 hover:text-emerald-800'
                  } has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-600 has-[:focus-visible]:ring-offset-2`}
                >
                  <input
                    type="radio"
                    name="quantity-mode"
                    value={option.value}
                    checked={selected}
                    onChange={() => handleModeChange(option.value)}
                    className="sr-only"
                  />
                  {selected && (
                    <CheckIcon
                      className="size-4 text-emerald-700"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  )}
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {draft.quantityMode === 'exact' ? (
          <div className="mx-auto mt-6 max-w-xl sm:mt-7">
            <label
              htmlFor="exact-harvest-quantity"
              className="mb-3 block text-center text-sm font-bold text-slate-800"
            >
              Expected harvest
            </label>
            <div
              className={`grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border bg-slate-50 px-5 shadow-inner transition-[border-color,box-shadow] duration-200 focus-within:ring-4 motion-reduce:transition-none sm:px-8 ${
                showExactError
                  ? 'border-red-400 focus-within:border-red-500 focus-within:ring-red-100'
                  : 'border-slate-200 focus-within:border-emerald-600 focus-within:ring-emerald-100'
              }`}
            >
              <input
                ref={inputRef}
                id="exact-harvest-quantity"
                name="exact-harvest-quantity"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                placeholder="225"
                value={draft.exactQuantity}
                onChange={(event) => onExactQuantityChange(event.target.value)}
                onBlur={() => setHasInteracted(true)}
                onKeyDown={handleExactQuantityKeyDown}
                onWheel={(event) => event.currentTarget.blur()}
                aria-invalid={showExactError}
                aria-describedby="exact-quantity-help exact-quantity-error"
                className="min-w-0 appearance-none bg-transparent py-4 text-center text-3xl font-bold tracking-tight text-slate-950 outline-none placeholder:text-slate-300 sm:text-4xl"
              />
              <span className="text-xl font-bold text-emerald-800 sm:text-2xl">
                kg
              </span>
            </div>
            <p
              id="exact-quantity-help"
              className="mt-3 text-center text-sm text-slate-500"
            >
              Use this if you already know your expected harvest.
            </p>
            <p
              id="exact-quantity-error"
              className={`mt-2 text-center text-sm font-medium text-red-600 ${
                showExactError ? 'block' : 'sr-only'
              }`}
              role={showExactError ? 'alert' : undefined}
            >
              Enter a valid harvest quantity greater than 0 kg.
            </p>
          </div>
        ) : (
          <fieldset className="mx-auto mt-5 max-w-4xl sm:mt-6">
            <legend className="mb-3 text-center text-sm font-bold text-slate-800">
              Select the closest range
            </legend>
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
              {quantityRanges.map((range, rangeIndex) => {
                const selected = draft.harvestRange === range.label;
                const { title, detail } = splitRangeLabel(range.label);

                return (
                  <label
                    key={range.label}
                    className={`relative flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border px-3 py-2.5 text-center transition-[border-color,background-color,box-shadow,transform] duration-200 motion-reduce:transition-none ${
                      selected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                        : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md motion-reduce:hover:translate-y-0'
                    } ${rangeIndex === quantityRanges.length - 1 ? 'col-span-2 lg:col-span-1' : ''} has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-600 has-[:focus-visible]:ring-offset-2`}
                  >
                    <input
                      type="radio"
                      name="harvest-range"
                      value={range.label}
                      checked={selected}
                      onChange={() => onHarvestRangeChange(range.label)}
                      className="sr-only"
                    />
                    <span
                      className={`absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-full border ${
                        selected
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 bg-white text-transparent'
                      }`}
                      aria-hidden="true"
                    >
                      <CheckIcon className="size-3.5" strokeWidth={2.5} />
                    </span>
                    <span
                      className={`mb-1 flex h-9 items-center justify-center ${
                        selected ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                      aria-hidden="true"
                    >
                      <HarvestRangeVisual index={rangeIndex} />
                    </span>
                    <span className="font-bold text-slate-950">{title}</span>
                    <span className="mt-0.5 text-xs font-semibold text-slate-500 sm:text-sm">
                      {detail}
                    </span>
                  </label>
                );
              })}
            </div>

            {selectedRange && (
              <p className="mt-3 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-2.5 text-center text-sm leading-6 text-slate-600">
                Approx.{' '}
                <span className="font-bold text-slate-900">
                  {getRangeEarningsQuantity(selectedRange).toLocaleString()} kg
                </span>{' '}
                will be used for earnings estimates.
              </p>
            )}
          </fieldset>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:mt-7 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            <ArrowLeftIcon className="size-5" aria-hidden="true" />
            Back
          </button>
          <button
            type="submit"
            disabled={!quantityValid}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 text-base font-semibold text-white shadow-sm transition-[background-color,box-shadow] duration-200 hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none motion-reduce:transition-none"
          >
            Continue
            <ArrowRightIcon className="size-5" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}
