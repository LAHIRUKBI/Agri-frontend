'use client';

import {
  RESULT_JOURNEY_PAGES,
  type ResultJourneyPage,
} from './resultJourney';

type ResultJourneyProgressProps = {
  activePage: ResultJourneyPage;
  onPageChange: (page: ResultJourneyPage) => void;
};

export default function ResultJourneyProgress({
  activePage,
  onPageChange,
}: ResultJourneyProgressProps) {
  const activeIndex = RESULT_JOURNEY_PAGES.findIndex(
    (page) => page.id === activePage
  );

  return (
    <nav
      aria-label="Recommendation result journey"
      className="mx-auto w-full max-w-3xl px-1"
    >
      <p className="sr-only">
        Recommendation
      </p>
      <ol className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center">
        {RESULT_JOURNEY_PAGES.map((page, index) => {
          const isActive = page.id === activePage;
          const isVisited = index <= activeIndex;

          return (
            <li key={page.id} className="contents">
              <button
                type="button"
                aria-current={isActive ? 'step' : undefined}
                aria-controls={`result-page-${page.id}`}
                onClick={() => onPageChange(page.id)}
                className="group flex min-w-20 items-center justify-center gap-2 rounded-xl px-2 py-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                <span
                  className={`flex size-7 items-center justify-center rounded-full border text-xs font-black transition-colors duration-200 motion-reduce:transition-none ${
                    isActive
                      ? 'border-emerald-700 bg-emerald-700 text-white shadow-sm'
                      : isVisited
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-500'
                  }`}
                >
                  {index + 1}
                </span>
                <span
                  className={`text-sm font-bold ${
                    isActive ? 'text-emerald-900' : 'text-slate-500'
                  }`}
                >
                  {page.label}
                </span>
              </button>

              {index < RESULT_JOURNEY_PAGES.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`h-0.5 min-w-4 rounded-full transition-colors duration-200 motion-reduce:transition-none ${
                    index < activeIndex ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
