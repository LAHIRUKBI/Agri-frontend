import {
  getSellAdvisorProgress,
  type SellAdvisorDraft,
  type SellAdvisorStep,
} from '../../sellAdvisorState';

type WizardProgressProps = {
  currentStepId: string;
  draft: SellAdvisorDraft;
  steps: SellAdvisorStep[];
};

export default function WizardProgress({
  currentStepId,
  draft,
  steps,
}: WizardProgressProps) {
  const { availableSteps, currentStepNumber, totalSteps } =
    getSellAdvisorProgress(draft, currentStepId);
  const currentStepLabel =
    availableSteps.find((step) => step.id === currentStepId)?.label ??
    steps.find((step) => step.id === currentStepId)?.label ??
    'Getting started';
  const progress = (currentStepNumber / totalSteps) * 100;

  return (
    <div className="w-full" aria-label={`Step ${currentStepNumber}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold tracking-wide text-emerald-800">
          Step {currentStepNumber}
        </p>
        <p className="text-sm text-slate-500">{currentStepLabel}</p>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-emerald-100"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={currentStepNumber}
        aria-label="Sell Advisor progress"
      >
        <div
          className="h-full rounded-full bg-emerald-600 transition-[width] duration-200 motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
