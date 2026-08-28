import {
  ArrowLeftIcon,
  BanknotesIcon,
  ChartBarSquareIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import type { ComponentType, SVGProps } from 'react';
import { CROP_OPTIONS, type CropValue } from '@/utils/prediction-options';
import type { CurrentPriceSource } from '../../sellAdvisorState';

type PriceSourceStepProps = {
  crop: CropValue | '';
  value: CurrentPriceSource | null;
  onChange: (source: CurrentPriceSource) => void;
  onBack: () => void;
};

type PriceSourceOption = {
  value: CurrentPriceSource;
  title: string;
  description: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const PRICE_SOURCE_OPTIONS: PriceSourceOption[] = [
  {
    value: 'manual',
    title: 'Yes, I know my price',
    description: "I'll enter the price I can get today",
    Icon: BanknotesIcon,
  },
  {
    value: 'system',
    title: 'No, use market price',
    description:
      'Use the latest recorded market price available in the system',
    Icon: ChartBarSquareIcon,
  },
];

export default function PriceSourceStep({
  crop,
  value,
  onChange,
  onBack,
}: PriceSourceStepProps) {
  const selectedCrop = CROP_OPTIONS.find((option) => option.value === crop);

  return (
    <div className="rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-[0_24px_70px_-42px_rgba(15,118,80,0.38)] sm:p-8 lg:p-10">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.65rem] lg:leading-tight">
          Do you know today&apos;s selling price?
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
          This helps us compare your current buyer price with the market
          recommendation.
        </p>

        {selectedCrop && (
          <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-2.5 text-left">
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
      </div>

      <fieldset className="mt-8 sm:mt-10">
        <legend className="sr-only">Choose your current price source</legend>
        <div className="grid gap-4 md:grid-cols-2 md:gap-5">
          {PRICE_SOURCE_OPTIONS.map((option) => {
            const selected = value === option.value;
            const Icon = option.Icon;

            return (
              <label
                key={option.value}
                className={`group relative flex min-h-44 cursor-pointer flex-col rounded-2xl border p-5 text-left transition-[border-color,background-color,box-shadow,transform] duration-200 motion-reduce:transition-none sm:min-h-48 sm:p-6 ${
                  selected
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-[0_14px_32px_-22px_rgba(5,150,105,0.7)]'
                    : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md motion-reduce:hover:translate-y-0'
                } has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-600 has-[:focus-visible]:ring-offset-2`}
              >
                <input
                  type="radio"
                  name="current-price-source"
                  value={option.value}
                  checked={selected}
                  onClick={() => {
                    if (selected) onChange(option.value);
                  }}
                  onChange={() => onChange(option.value)}
                  className="sr-only"
                />

                <span className="flex items-start justify-between gap-4">
                  <span
                    className={`flex size-12 items-center justify-center rounded-2xl transition-colors duration-200 motion-reduce:transition-none ${
                      selected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-700'
                    }`}
                  >
                    <Icon className="size-6" aria-hidden="true" />
                  </span>

                  <span
                    className={`flex size-7 items-center justify-center rounded-full border transition-colors duration-200 motion-reduce:transition-none ${
                      selected
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 bg-white text-transparent'
                    }`}
                    aria-hidden="true"
                  >
                    <CheckIcon className="size-4" strokeWidth={2.5} />
                  </span>
                </span>

                <span className="mt-6 block text-lg font-bold text-slate-900 sm:text-xl">
                  {option.title}
                </span>
                <span className="mt-2 block text-sm leading-6 text-slate-600 sm:text-base">
                  {option.description}
                </span>
                <span className="sr-only">
                  {selected ? 'Selected' : 'Not selected'}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-7 flex flex-col-reverse items-center gap-3 sm:mt-9 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
        >
          <ArrowLeftIcon className="size-5" aria-hidden="true" />
          Back
        </button>
        <p className="text-center text-sm text-slate-500">
          Choose an option to continue.
        </p>
      </div>
    </div>
  );
}
