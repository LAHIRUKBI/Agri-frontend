import {
  ArrowDownIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  CloudIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const analysisStages = [
  { label: 'Your crop', Icon: SparklesIcon },
  { label: 'Price patterns', Icon: ChartBarIcon },
  { label: 'Available markets', Icon: BuildingStorefrontIcon },
  { label: 'Weather context', Icon: CloudIcon },
  { label: 'Recommendation', Icon: SparklesIcon },
] as const;

export default function MarketAnalysisLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="rounded-[1.75rem] border border-white/80 bg-white p-6 shadow-[0_24px_70px_-42px_rgba(15,118,80,0.38)] sm:p-10 lg:p-12"
    >
      <div className="mx-auto max-w-2xl text-center">
        <span
          className="mx-auto flex size-14 items-center justify-center rounded-full border-4 border-emerald-100 border-t-emerald-600 motion-safe:animate-spin"
          aria-hidden="true"
        />
        <h1 className="mt-6 text-balance text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Checking the market...
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
          We&apos;re comparing your current selling option with the available
          market information.
        </p>

        <ol className="mx-auto mt-8 max-w-sm" aria-label="Analysis context">
          {analysisStages.map(({ label, Icon }, index) => (
            <li key={label} className="flex flex-col items-center">
              <span className="inline-flex min-h-11 items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-2.5 font-semibold text-emerald-950">
                <Icon className="size-5 text-emerald-700" aria-hidden="true" />
                {label}
              </span>
              {index < analysisStages.length - 1 && (
                <ArrowDownIcon
                  className="my-1.5 size-4 text-emerald-300 motion-safe:animate-pulse"
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
