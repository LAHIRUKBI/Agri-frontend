import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BanknotesIcon,
  CheckCircleIcon,
  MapPinIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import {
  CROP_OPTIONS,
  FARMER_DISTRICT_OPTIONS,
  getQuantityRangesForCrop,
  getRangeEarningsQuantity,
} from '@/utils/prediction-options';
import type { SellAdvisorDraft } from '../../sellAdvisorState';

type MarketAnalysisPlaceholderProps = {
  draft: SellAdvisorDraft;
  canSubmit: boolean;
  onCheckMarket: () => void;
  onBack: () => void;
};

const getCompactRangeLabel = (label: string) => {
  const detailStart = label.lastIndexOf(' (');
  if (detailStart === -1) return label.replace(/\s+Harvest$/, '');

  const name = label.slice(0, detailStart).replace(/\s+Harvest$/, '');
  const range = label.slice(detailStart + 2, -1);
  return `${name} · ${range}`;
};

function ProduceCrateIllustration() {
  return (
    <div
      className="relative hidden min-h-56 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 lg:flex"
      aria-hidden="true"
    >
      <span className="absolute -right-8 -top-8 size-28 rounded-full bg-amber-100/70" />
      <span className="absolute -bottom-12 -left-8 size-36 rounded-full bg-emerald-100" />
      <svg
        viewBox="0 0 260 220"
        fill="none"
        className="relative z-10 w-full max-w-[195px] text-emerald-800"
      >
        <path
          d="M38 180c28-17 156-17 184 0"
          stroke="#A7C7B4"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M66 105h128l-11 73H77l-11-73Z"
          fill="#FFF9ED"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path
          d="M75 126h110M72 151h115M104 106l3 72M156 106l-3 72"
          stroke="#C18A4B"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="101" cy="91" r="25" fill="#E7543D" />
        <circle cx="139" cy="83" r="28" fill="#F3B33E" />
        <path
          d="M101 70c2-10 11-15 20-14M140 56c6-10 18-12 27-6"
          stroke="#2F855A"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M164 97c6-29 35-40 48-23-1 24-21 38-48 23Z"
          fill="#59A96A"
          stroke="#2F855A"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="m166 96 31-17"
          stroke="#2F855A"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M78 98c-20-13-19-38 2-43 19 7 24 26-2 43Z"
          fill="#78B66A"
          stroke="#2F855A"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="m79 96-1-28"
          stroke="#2F855A"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default function MarketAnalysisPlaceholder({
  draft,
  canSubmit,
  onCheckMarket,
  onBack,
}: MarketAnalysisPlaceholderProps) {
  const crop = CROP_OPTIONS.find((option) => option.value === draft.crop);
  const district = FARMER_DISTRICT_OPTIONS.find(
    (option) => option.value === draft.farmerDistrict
  );
  const selectedRange = getQuantityRangesForCrop(draft.crop).find(
    (range) => range.label === draft.harvestRange
  );
  const quantityValue =
    draft.quantityMode === 'exact'
      ? `${draft.exactQuantity} kg`
      : selectedRange
        ? `~${getRangeEarningsQuantity(selectedRange).toLocaleString()} kg`
        : 'Not provided';
  const quantityDetail =
    draft.quantityMode === 'exact'
      ? 'Exact quantity'
      : selectedRange
        ? getCompactRangeLabel(selectedRange.label)
        : 'Choose a harvest range';
  const enteredPrice = draft.currentPrice.trim();
  const priceValue =
    draft.currentPriceSource === 'manual'
      ? enteredPrice
        ? `Rs. ${enteredPrice}/kg`
        : 'Not provided'
      : draft.currentPriceSource === 'system'
        ? 'Available during analysis'
        : 'Not provided';
  const priceDetail =
    draft.currentPriceSource === 'manual'
      ? enteredPrice
        ? 'Entered by you'
        : 'Price required'
      : draft.currentPriceSource === 'system'
        ? 'Current market price'
        : 'Choose a price source';

  return (
    <div className="rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-[0_24px_70px_-42px_rgba(15,118,80,0.32)] sm:p-6 lg:p-7">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(200px,0.75fr)] lg:items-center">
        <div>
          <div className="flex items-start gap-3.5">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"
              aria-hidden="true"
            >
              <CheckCircleIcon className="size-6" />
            </span>
            <div>
              <h1 className="text-balance text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-[2rem]">
                Ready to check the market
              </h1>
              <p className="mt-2 text-base leading-6 text-slate-600">
                Review your details before generating the recommendation.
              </p>
            </div>
          </div>

          <dl className="mt-5 grid gap-2.5 sm:grid-cols-2">
            <div className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                {crop ? (
                  <Image
                    src={crop.imageSrc}
                    alt=""
                    width={36}
                    height={36}
                    className="size-8 object-contain"
                    aria-hidden="true"
                  />
                ) : (
                  <CheckCircleIcon className="size-5" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Crop
                </dt>
                <dd className="mt-1 truncate text-base font-bold text-slate-950">
                  {crop?.label ?? 'Not provided'}
                </dd>
              </div>
            </div>

            <div className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                <MapPinIcon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  District
                </dt>
                <dd className="mt-1 truncate text-base font-bold text-slate-950">
                  {district?.label ?? 'Not provided'}
                </dd>
              </div>
            </div>

            <div className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                <ScaleIcon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Quantity
                </dt>
                <dd className="mt-1 text-base font-bold text-slate-950">
                  {quantityValue}
                </dd>
                <dd className="mt-0.5 text-xs font-medium text-slate-500">
                  {quantityDetail}
                </dd>
              </div>
            </div>

            <div className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                <BanknotesIcon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Today&apos;s price
                </dt>
                <dd className="mt-1 text-base font-bold leading-5 text-slate-950">
                  {priceValue}
                </dd>
                <dd className="mt-0.5 text-xs font-medium text-slate-500">
                  {priceDetail}
                </dd>
              </div>
            </div>
          </dl>
        </div>

        <ProduceCrateIllustration />
      </div>

      <div className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
        >
          <ArrowLeftIcon className="size-5" aria-hidden="true" />
          Edit details
        </button>
        <button
          type="button"
          onClick={onCheckMarket}
          disabled={!canSubmit}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-7 text-base font-bold text-white shadow-sm transition-[background-color,box-shadow] duration-200 hover:bg-emerald-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none motion-reduce:transition-none"
        >
          Check Market Recommendation
          <ArrowRightIcon className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
