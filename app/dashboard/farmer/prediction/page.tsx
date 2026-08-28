'use client';

import { useEffect, useRef, useState } from 'react';
import {
  getQuantityRangesForCrop,
  type CropValue,
  type FarmerDistrictValue,
} from '@/utils/prediction-options';
import CropSelectionStep from './components/sell-advisor/CropSelectionStep';
import LocationSelectionStep from './components/sell-advisor/LocationSelectionStep';
import ManualPriceStep from './components/sell-advisor/ManualPriceStep';
import MarketAnalysisError from './components/sell-advisor/MarketAnalysisError';
import MarketAnalysisLoading from './components/sell-advisor/MarketAnalysisLoading';
import MarketAnalysisPlaceholder from './components/sell-advisor/MarketAnalysisPlaceholder';
import PriceSourceStep from './components/sell-advisor/PriceSourceStep';
import QuantitySelectionStep from './components/sell-advisor/QuantitySelectionStep';
import SellAdvisorResultScreen from './components/sell-advisor/SellAdvisorResultScreen';
import SellAdvisorShell from './components/sell-advisor/SellAdvisorShell';
import {
  createFailedMarketOptionsState,
  createLoadingMarketOptionsState,
  createSuccessfulMarketOptionsState,
  fetchAvailableMarkets,
  hasAvailableMarketOptions,
  INITIAL_MARKET_OPTIONS_STATE,
  isLatestMarketOptionsRequest,
} from './marketOptions';
import {
  buildSellAdvisorSubmission,
  canSubmitSellAdvisorDraft,
  submitSellAdvisorRecommendation,
  type SellAdvisorSubmittedInput,
} from './sellAdvisorRequest';
import { createRecommendationTimestamp } from './saveRecommendation';
import {
  advanceFromCrop,
  advanceFromLocation,
  advanceFromManualPrice,
  advanceFromQuantity,
  chooseCurrentPriceSource,
  createSellAdvisorWizardState,
  getSellAdvisorSteps,
  goBackInSellAdvisor,
  selectCrop,
  selectFarmerDistrict,
  selectHarvestRange,
  selectQuantityMode,
  updateExactQuantity,
  updateCurrentPrice,
  type CurrentPriceSource,
  type SellAdvisorDraft,
} from './sellAdvisorState';

type RecommendationStatus = 'idle' | 'loading' | 'error' | 'success';

export default function FarmerPredictionPage() {
  const [wizardState, setWizardState] = useState(createSellAdvisorWizardState);
  const [marketOptionsState, setMarketOptionsState] = useState(
    INITIAL_MARKET_OPTIONS_STATE
  );
  const marketOptionsRequest = useRef<AbortController | null>(null);
  const marketOptionsRequestId = useRef(0);
  const recommendationRequest = useRef<AbortController | null>(null);
  const recommendationRequestId = useRef(0);
  const recommendationInFlight = useRef(false);
  const [recommendationStatus, setRecommendationStatus] =
    useState<RecommendationStatus>('idle');
  const [recommendationResult, setRecommendationResult] =
    useState<unknown>(null);
  const [submittedInput, setSubmittedInput] =
    useState<SellAdvisorSubmittedInput | null>(null);
  const [recommendationTimestamp, setRecommendationTimestamp] =
    useState<string | null>(null);
  const { currentStep, draft } = wizardState;
  const quantityRanges = getQuantityRangesForCrop(draft.crop);

  useEffect(
    () => () => {
      marketOptionsRequestId.current += 1;
      marketOptionsRequest.current?.abort();
      recommendationRequestId.current += 1;
      recommendationRequest.current?.abort();
      recommendationInFlight.current = false;
    },
    []
  );

  const loadAvailableMarkets = async (
    farmerDistrict: FarmerDistrictValue
  ) => {
    marketOptionsRequest.current?.abort();
    const controller = new AbortController();
    const requestId = marketOptionsRequestId.current + 1;
    marketOptionsRequest.current = controller;
    marketOptionsRequestId.current = requestId;

    setMarketOptionsState(createLoadingMarketOptionsState(farmerDistrict));

    try {
      const availableMarkets = await fetchAvailableMarkets(farmerDistrict, {
        signal: controller.signal,
      });

      if (
        !isLatestMarketOptionsRequest(
          requestId,
          marketOptionsRequestId.current
        )
      ) {
        return;
      }

      setMarketOptionsState(
        createSuccessfulMarketOptionsState(farmerDistrict, availableMarkets)
      );
    } catch {
      if (
        controller.signal.aborted ||
        !isLatestMarketOptionsRequest(
          requestId,
          marketOptionsRequestId.current
        )
      ) {
        return;
      }

      setMarketOptionsState(createFailedMarketOptionsState(farmerDistrict));
    }
  };

  const handlePriceSourceChange = (source: CurrentPriceSource) => {
    setWizardState((state) => chooseCurrentPriceSource(state, source));
  };

  const handlePriceChange = (currentPrice: string) => {
    setWizardState((state) => updateCurrentPrice(state, currentPrice));
  };

  const handleManualPriceContinue = () => {
    setWizardState(advanceFromManualPrice);
  };

  const handleBack = () => {
    setWizardState(goBackInSellAdvisor);
  };

  const handleCropChange = (crop: CropValue) => {
    setWizardState((state) => selectCrop(state, crop));
  };

  const handleCropContinue = () => {
    setWizardState(advanceFromCrop);
  };

  const handleFarmerDistrictChange = (
    farmerDistrict: FarmerDistrictValue
  ) => {
    setWizardState((state) =>
      selectFarmerDistrict(state, farmerDistrict)
    );
    void loadAvailableMarkets(farmerDistrict);
  };

  const handleMarketOptionsRetry = () => {
    if (!draft.farmerDistrict) return;

    void loadAvailableMarkets(draft.farmerDistrict);
  };

  const handleLocationContinue = () => {
    if (!hasAvailableMarketOptions(marketOptionsState, draft.farmerDistrict)) {
      return;
    }

    setWizardState(advanceFromLocation);
  };

  const canContinueFromLocation = hasAvailableMarketOptions(
    marketOptionsState,
    draft.farmerDistrict
  );

  const handleQuantityModeChange = (
    quantityMode: SellAdvisorDraft['quantityMode']
  ) => {
    setWizardState((state) => selectQuantityMode(state, quantityMode));
  };

  const handleExactQuantityChange = (exactQuantity: string) => {
    setWizardState((state) => updateExactQuantity(state, exactQuantity));
  };

  const handleHarvestRangeChange = (harvestRange: string) => {
    setWizardState((state) =>
      selectHarvestRange(
        state,
        harvestRange,
        getQuantityRangesForCrop(state.draft.crop).map((range) => range.label)
      )
    );
  };

  const handleQuantityContinue = () => {
    setWizardState((state) =>
      advanceFromQuantity(
        state,
        getQuantityRangesForCrop(state.draft.crop).map((range) => range.label)
      )
    );
  };

  const wizardDraftIsComplete = canSubmitSellAdvisorDraft(
    draft,
    quantityRanges
  );
  const canCheckMarket =
    wizardDraftIsComplete &&
    hasAvailableMarketOptions(marketOptionsState, draft.farmerDistrict);

  const handleCheckMarket = async () => {
    if (recommendationInFlight.current || !canCheckMarket) return;

    let submission: ReturnType<typeof buildSellAdvisorSubmission>;
    try {
      submission = buildSellAdvisorSubmission(draft, quantityRanges);
    } catch {
      return;
    }

    recommendationRequest.current?.abort();
    const controller = new AbortController();
    const requestId = recommendationRequestId.current + 1;
    recommendationRequest.current = controller;
    recommendationRequestId.current = requestId;
    recommendationInFlight.current = true;
    setRecommendationStatus('loading');

    try {
      const result = await submitSellAdvisorRecommendation(
        submission.request,
        { signal: controller.signal }
      );

      if (requestId !== recommendationRequestId.current) return;

      setSubmittedInput(submission.submittedInput);
      setRecommendationResult(result);
      setRecommendationTimestamp(createRecommendationTimestamp());
      setRecommendationStatus('success');
    } catch {
      if (
        controller.signal.aborted ||
        requestId !== recommendationRequestId.current
      ) {
        return;
      }

      setRecommendationStatus('error');
    } finally {
      if (requestId === recommendationRequestId.current) {
        recommendationInFlight.current = false;
        recommendationRequest.current = null;
      }
    }
  };

  const handleBackToReview = () => {
    setRecommendationStatus('idle');
  };

  const handleStartNewRecommendation = () => {
    marketOptionsRequestId.current += 1;
    marketOptionsRequest.current?.abort();
    recommendationRequestId.current += 1;
    recommendationRequest.current?.abort();
    recommendationInFlight.current = false;
    setWizardState(createSellAdvisorWizardState());
    setMarketOptionsState(INITIAL_MARKET_OPTIONS_STATE);
    setRecommendationStatus('idle');
    setRecommendationResult(null);
    setSubmittedInput(null);
    setRecommendationTimestamp(null);
  };

  const reviewContent =
    recommendationStatus === 'loading' ? (
      <MarketAnalysisLoading />
    ) : recommendationStatus === 'error' ? (
      <MarketAnalysisError
        onRetry={handleCheckMarket}
        onBackToReview={handleBackToReview}
      />
    ) : (
      <MarketAnalysisPlaceholder
        draft={draft}
        canSubmit={canCheckMarket}
        onCheckMarket={handleCheckMarket}
        onBack={handleBack}
      />
    );

  const stepContent = {
    'price-source': (
      <PriceSourceStep
        crop={draft.crop}
        value={draft.currentPriceSource}
        onChange={handlePriceSourceChange}
        onBack={handleBack}
      />
    ),
    'manual-price': (
      <ManualPriceStep
        crop={draft.crop}
        value={draft.currentPrice}
        onChange={handlePriceChange}
        onContinue={handleManualPriceContinue}
        onBack={handleBack}
      />
    ),
    crop: (
      <CropSelectionStep
        value={draft.crop}
        onChange={handleCropChange}
        onContinue={handleCropContinue}
      />
    ),
    location: (
      <LocationSelectionStep
        crop={draft.crop}
        value={draft.farmerDistrict}
        availableMarkets={marketOptionsState.availableMarkets}
        marketsLoading={marketOptionsState.marketsLoading}
        marketsError={marketOptionsState.marketsError}
        requestSucceeded={marketOptionsState.requestSucceeded}
        canContinue={canContinueFromLocation}
        onChange={handleFarmerDistrictChange}
        onRetry={handleMarketOptionsRetry}
        onContinue={handleLocationContinue}
        onBack={handleBack}
      />
    ),
    quantity: (
      <QuantitySelectionStep
        draft={draft}
        onModeChange={handleQuantityModeChange}
        onExactQuantityChange={handleExactQuantityChange}
        onHarvestRangeChange={handleHarvestRangeChange}
        onContinue={handleQuantityContinue}
        onBack={handleBack}
      />
    ),
    review: reviewContent,
  }[currentStep];

  if (
    recommendationStatus === 'success' &&
    recommendationResult &&
    submittedInput &&
    recommendationTimestamp
  ) {
    return (
      <SellAdvisorResultScreen
        key={recommendationTimestamp}
        result={recommendationResult}
        submittedInput={submittedInput}
        recommendationTimestamp={recommendationTimestamp}
        onStartNew={handleStartNewRecommendation}
      />
    );
  }

  return (
    <SellAdvisorShell
      currentStepId={currentStep}
      draft={draft}
      steps={getSellAdvisorSteps(draft)}
    >
      <div
        key={`${currentStep}-${recommendationStatus}`}
        className="transition-[opacity,transform] duration-200 starting:translate-y-1 starting:opacity-0 motion-reduce:transition-none"
      >
        {stepContent}
      </div>
    </SellAdvisorShell>
  );
}
