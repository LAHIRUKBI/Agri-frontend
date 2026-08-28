'use client';

import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import { CROP_OPTIONS, type CropValue } from '@/utils/prediction-options';
import { isValidCurrentPrice } from '../../sellAdvisorState';

type ManualPriceStepProps = {
  crop: CropValue | '';
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
};

const BLOCKED_NUMBER_KEYS = new Set(['-', '+', 'e', 'E']);

export default function ManualPriceStep({
  crop,
  value,
  onChange,
  onContinue,
  onBack,
}: ManualPriceStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const selectedCrop = CROP_OPTIONS.find((option) => option.value === crop);
  const isValid = isValidCurrentPrice(value);
  const showError = hasInteracted && !isValid;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasInteracted(true);

    if (isValid) onContinue();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (BLOCKED_NUMBER_KEYS.has(event.key)) {
      event.preventDefault();
    }

    if (event.key === 'Enter' && !isValid) {
      setHasInteracted(true);
    }
  };

  return (
    <div className="rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-[0_24px_70px_-42px_rgba(15,118,80,0.32)] sm:p-7 lg:p-8">
      <form onSubmit={handleSubmit} noValidate>
        <div className="mx-auto max-w-2xl text-center">
          {selectedCrop && (
            <div className="mb-4 inline-flex items-center gap-2.5 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3.5 py-2 text-left">
              <Image
                src={selectedCrop.imageSrc}
                alt=""
                width={32}
                height={32}
                className="size-8 object-contain"
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
          <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.65rem] lg:leading-tight">
            Today&apos;s selling price
          </h1>
          <p className="mx-auto mt-2.5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Enter the price you can sell for today.
          </p>
        </div>

        <div className="mx-auto mt-6 max-w-2xl sm:mt-7">
          <label
            htmlFor="current-price"
            className="mb-2 block text-center text-sm font-semibold text-slate-700"
          >
            Price per kilogram
          </label>
          <div
            className={`grid min-h-20 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border bg-slate-50 px-4 shadow-inner transition-[border-color,box-shadow] duration-200 focus-within:ring-4 motion-reduce:transition-none sm:min-h-24 sm:gap-3 sm:px-6 ${
              showError
                ? 'border-red-400 focus-within:border-red-500 focus-within:ring-red-100'
                : 'border-slate-200 focus-within:border-emerald-600 focus-within:ring-emerald-100'
            }`}
          >
            <span className="text-xl font-bold text-emerald-800 sm:text-2xl">
              Rs.
            </span>
            <input
              ref={inputRef}
              id="current-price"
              name="current-price"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="300"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onBlur={() => setHasInteracted(true)}
              onKeyDown={handleKeyDown}
              onWheel={(event) => event.currentTarget.blur()}
              aria-invalid={showError}
              aria-describedby={
                showError
                  ? 'current-price-help current-price-error'
                  : 'current-price-help'
              }
              className="min-w-0 appearance-none bg-transparent py-4 text-center text-3xl font-bold tracking-tight text-slate-950 outline-none placeholder:text-slate-300 sm:text-4xl"
            />
            <span className="text-lg font-semibold text-slate-500 sm:text-xl">
              / kg
            </span>
          </div>
          <p id="current-price-help" className="mt-2 text-center text-sm text-slate-500">
            Decimals are accepted. Enter an amount greater than Rs. 0.
          </p>
          <p
            id="current-price-error"
            className={`mt-2 text-center text-sm font-medium text-red-600 ${
              showError ? 'block' : 'sr-only'
            }`}
            role={showError ? 'alert' : undefined}
          >
            Enter a valid price greater than Rs. 0.
          </p>
        </div>

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
            disabled={!isValid}
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
