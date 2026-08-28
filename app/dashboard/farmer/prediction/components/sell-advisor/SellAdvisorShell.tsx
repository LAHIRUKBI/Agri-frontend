import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type {
  SellAdvisorDraft,
  SellAdvisorStep,
} from '../../sellAdvisorState';
import WizardProgress from './WizardProgress';

type SellAdvisorShellProps = {
  children: ReactNode;
  currentStepId: string;
  draft: SellAdvisorDraft;
  steps: SellAdvisorStep[];
};

function SellAdvisorMark() {
  return (
    <span
      className="flex size-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm shadow-emerald-900/10"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="size-6"
      >
        <path
          d="M12 20v-9m0 0c0-4 3-6 7-6 0 4-2 7-7 7m0-1C12 7 9 5 5 5c0 4 2 7 7 7"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function SellAdvisorShell({
  children,
  currentStepId,
  draft,
  steps,
}: SellAdvisorShellProps) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[linear-gradient(145deg,#f8fcf9_0%,#f7fbfd_48%,#ffffff_100%)] text-slate-950">
      <div
        className="pointer-events-none absolute -left-28 top-24 size-80 rounded-full bg-emerald-100/50 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-28 bottom-12 size-72 rounded-full bg-sky-100/60 blur-3xl"
        aria-hidden="true"
      />

      <div
        className={`relative mx-auto flex min-h-dvh w-full flex-col px-4 py-4 sm:px-7 sm:py-5 lg:px-10 lg:py-6 ${
          currentStepId === 'location' ? 'max-w-[82rem]' : 'max-w-6xl'
        }`}
      >
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <SellAdvisorMark />
            <div>
              <p className="text-xl font-bold tracking-tight text-emerald-950 sm:text-2xl">
                Sell Advisor
              </p>
              <p className="mt-0.5 hidden text-sm text-slate-500 sm:block">
                Your crop. Your price. Your best selling option.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/farmer/home"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:bg-white hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none sm:px-4"
          >
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
          </Link>
        </header>

        <p className="mt-4 text-sm leading-6 text-slate-500 sm:hidden">
          Your crop. Your price. Your best selling option.
        </p>

        <section
          className={`mx-auto flex w-full flex-1 flex-col justify-center ${
            currentStepId === 'location'
              ? 'max-w-[76.25rem] py-3 sm:py-4 lg:py-4'
              : 'max-w-4xl py-5 sm:py-7 lg:py-8'
          }`}
        >
          <div
            className={`mx-auto w-full max-w-2xl ${
              currentStepId === 'location' ? 'mb-4' : 'mb-5 sm:mb-6'
            }`}
          >
            <WizardProgress
              currentStepId={currentStepId}
              draft={draft}
              steps={steps}
            />
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
