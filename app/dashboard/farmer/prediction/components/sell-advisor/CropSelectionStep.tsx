import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { CROP_OPTIONS, type CropValue } from '@/utils/prediction-options';

type CropSelectionStepProps = {
  value: CropValue | '';
  onChange: (crop: CropValue) => void;
  onContinue: () => void;
  onBack?: () => void;
};

export default function CropSelectionStep({
  value,
  onChange,
  onContinue,
  onBack,
}: CropSelectionStepProps) {
  return (
    <div className="rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-[0_24px_70px_-42px_rgba(15,118,80,0.32)] sm:p-7 lg:p-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.65rem] lg:leading-tight">
          What are you selling?
        </h1>
        <p className="mx-auto mt-3 text-base leading-7 text-slate-600 sm:text-lg">
          Select your crop
        </p>
      </div>

      <fieldset className="mt-6 sm:mt-7">
        <legend className="sr-only">Choose one crop</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {CROP_OPTIONS.map((crop) => {
            const selected = value === crop.value;

            return (
              <label
                key={crop.value}
                className={`group relative flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border px-3 py-3.5 text-center shadow-sm transition-[border-color,background-color,box-shadow,transform] duration-200 motion-reduce:transition-none sm:min-h-32 sm:px-4 ${
                  selected
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-[0_12px_28px_-20px_rgba(5,150,105,0.75)]'
                    : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md motion-reduce:hover:translate-y-0'
                } has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-600 has-[:focus-visible]:ring-offset-2`}
              >
                <input
                  type="radio"
                  name="crop"
                  value={crop.value}
                  checked={selected}
                  onChange={() => onChange(crop.value)}
                  className="sr-only"
                />

                <span
                  className={`absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-full border transition-colors duration-200 motion-reduce:transition-none ${
                    selected
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 bg-white text-transparent'
                  }`}
                  aria-hidden="true"
                >
                  <CheckIcon className="size-3.5" strokeWidth={2.5} />
                </span>

                <span
                  className="flex size-16 items-center justify-center"
                  aria-hidden="true"
                >
                  <Image
                    src={crop.imageSrc}
                    alt=""
                    width={64}
                    height={64}
                    className="pointer-events-none size-14 object-contain sm:size-16"
                    draggable={false}
                  />
                </span>
                <span className="mt-2.5 text-sm font-bold text-slate-900 sm:text-base">
                  {crop.label}
                </span>
                <span className="sr-only">
                  {selected ? 'Selected' : 'Not selected'}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div
        className={`mt-6 flex flex-col-reverse gap-3 sm:mt-7 sm:flex-row sm:items-center ${
          onBack ? 'sm:justify-between' : 'sm:justify-end'
        }`}
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            <ArrowLeftIcon className="size-5" aria-hidden="true" />
            Back
          </button>
        )}
        <button
          type="button"
          onClick={onContinue}
          disabled={!value}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 text-base font-semibold text-white shadow-sm transition-[background-color,box-shadow] duration-200 hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none motion-reduce:transition-none"
        >
          Continue
          <ArrowRightIcon className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
