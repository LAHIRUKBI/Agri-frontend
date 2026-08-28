'use client';

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useRef } from 'react';

type MarketAnalysisErrorProps = {
  onRetry: () => void;
  onBackToReview: () => void;
};

export default function MarketAnalysisError({
  onRetry,
  onBackToReview,
}: MarketAnalysisErrorProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div
      role="alert"
      className="rounded-[1.75rem] border border-amber-100 bg-white p-6 shadow-[0_24px_70px_-42px_rgba(15,118,80,0.38)] sm:p-10 lg:p-12"
    >
      <div className="mx-auto max-w-2xl text-center">
        <span
          className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"
          aria-hidden="true"
        >
          <ExclamationCircleIcon className="size-8" />
        </span>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-6 text-balance text-3xl font-bold tracking-tight text-slate-950 outline-none sm:text-4xl"
        >
          We couldn&apos;t generate the recommendation.
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
          Your information is still saved. Please try again.
        </p>
      </div>

      <div className="mt-9 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBackToReview}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
        >
          <ArrowLeftIcon className="size-5" aria-hidden="true" />
          Back to review
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-7 text-base font-bold text-white shadow-sm transition-[background-color,box-shadow] duration-200 hover:bg-emerald-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
        >
          <ArrowPathIcon className="size-5" aria-hidden="true" />
          Try again
        </button>
      </div>
    </div>
  );
}
