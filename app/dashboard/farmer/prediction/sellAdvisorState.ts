import type {
  CropValue,
  FarmerDistrictValue,
} from '@/utils/prediction-options';

export type CurrentPriceSource = 'manual' | 'system';
export type SellAdvisorStage =
  | 'price-source'
  | 'manual-price'
  | 'crop'
  | 'location'
  | 'quantity'
  | 'review';

export type SellAdvisorDraft = {
  currentPriceSource: CurrentPriceSource | null;
  currentPrice: string;
  crop: CropValue | '';
  farmerDistrict: FarmerDistrictValue | '';
  quantityMode: 'exact' | 'range';
  exactQuantity: string;
  harvestRange: string;
};

export type SellAdvisorStep = {
  id: string;
  label: string;
  isAvailable: boolean;
};

export type SellAdvisorWizardState = {
  draft: SellAdvisorDraft;
  currentStep: SellAdvisorStage;
};

export const createSellAdvisorDraft = (): SellAdvisorDraft => ({
  currentPriceSource: null,
  currentPrice: '',
  crop: '',
  farmerDistrict: '',
  quantityMode: 'range',
  exactQuantity: '',
  harvestRange: '',
});

export const selectCurrentPriceSource = (
  draft: SellAdvisorDraft,
  source: CurrentPriceSource
): SellAdvisorDraft => ({
  ...draft,
  currentPriceSource: source,
  currentPrice: source === 'system' ? '' : draft.currentPrice,
});

export const isValidCurrentPrice = (price: string): boolean => {
  if (!price.trim()) return false;

  const numericPrice = Number(price);
  return Number.isFinite(numericPrice) && numericPrice > 0;
};

export const isValidExactQuantity = (quantity: string): boolean => {
  if (!quantity.trim()) return false;

  const numericQuantity = Number(quantity);
  return Number.isFinite(numericQuantity) && numericQuantity > 0;
};

export const isSupportedHarvestRange = (
  harvestRange: string,
  supportedHarvestRanges: readonly string[]
): boolean =>
  Boolean(harvestRange) &&
  supportedHarvestRanges.includes(harvestRange);

export const isValidSellAdvisorQuantity = (
  draft: SellAdvisorDraft,
  supportedHarvestRanges: readonly string[] = []
): boolean =>
  draft.quantityMode === 'exact'
    ? isValidExactQuantity(draft.exactQuantity)
    : isSupportedHarvestRange(draft.harvestRange, supportedHarvestRanges);

export const createSellAdvisorWizardState = (): SellAdvisorWizardState => ({
  draft: createSellAdvisorDraft(),
  currentStep: 'crop',
});

export const chooseCurrentPriceSource = (
  state: SellAdvisorWizardState,
  source: CurrentPriceSource
): SellAdvisorWizardState => {
  if (state.currentStep !== 'price-source') return state;

  return {
    draft: selectCurrentPriceSource(state.draft, source),
    currentStep: source === 'manual' ? 'manual-price' : 'location',
  };
};

export const updateCurrentPrice = (
  state: SellAdvisorWizardState,
  currentPrice: string
): SellAdvisorWizardState => ({
  ...state,
  draft: {
    ...state.draft,
    currentPrice,
  },
});

export const advanceFromManualPrice = (
  state: SellAdvisorWizardState
): SellAdvisorWizardState => {
  if (
    state.currentStep !== 'manual-price' ||
    state.draft.currentPriceSource !== 'manual' ||
    !isValidCurrentPrice(state.draft.currentPrice)
  ) {
    return state;
  }

  return { ...state, currentStep: 'location' };
};

export const selectCrop = (
  state: SellAdvisorWizardState,
  crop: CropValue
): SellAdvisorWizardState => ({
  ...state,
  draft: {
    ...state.draft,
    crop,
    harvestRange:
      state.draft.crop === crop ? state.draft.harvestRange : '',
  },
});

export const advanceFromCrop = (
  state: SellAdvisorWizardState
): SellAdvisorWizardState => {
  if (state.currentStep !== 'crop' || !state.draft.crop) return state;

  return { ...state, currentStep: 'price-source' };
};

export const selectFarmerDistrict = (
  state: SellAdvisorWizardState,
  farmerDistrict: FarmerDistrictValue
): SellAdvisorWizardState => ({
  ...state,
  draft: {
    ...state.draft,
    farmerDistrict,
  },
});

export const advanceFromLocation = (
  state: SellAdvisorWizardState
): SellAdvisorWizardState => {
  if (state.currentStep !== 'location' || !state.draft.farmerDistrict) {
    return state;
  }

  return { ...state, currentStep: 'quantity' };
};

export const selectQuantityMode = (
  state: SellAdvisorWizardState,
  quantityMode: SellAdvisorDraft['quantityMode']
): SellAdvisorWizardState => ({
  ...state,
  draft: {
    ...state.draft,
    quantityMode,
  },
});

export const updateExactQuantity = (
  state: SellAdvisorWizardState,
  exactQuantity: string
): SellAdvisorWizardState => ({
  ...state,
  draft: {
    ...state.draft,
    exactQuantity,
  },
});

export const selectHarvestRange = (
  state: SellAdvisorWizardState,
  harvestRange: string,
  supportedHarvestRanges: readonly string[]
): SellAdvisorWizardState => {
  if (!isSupportedHarvestRange(harvestRange, supportedHarvestRanges)) {
    return state;
  }

  return {
    ...state,
    draft: {
      ...state.draft,
      harvestRange,
    },
  };
};

export const advanceFromQuantity = (
  state: SellAdvisorWizardState,
  supportedHarvestRanges: readonly string[] = []
): SellAdvisorWizardState => {
  if (
    state.currentStep !== 'quantity' ||
    !isValidSellAdvisorQuantity(state.draft, supportedHarvestRanges)
  ) {
    return state;
  }

  return { ...state, currentStep: 'review' };
};

export const goBackInSellAdvisor = (
  state: SellAdvisorWizardState
): SellAdvisorWizardState => {
  if (state.currentStep === 'price-source') {
    return { ...state, currentStep: 'crop' };
  }

  if (state.currentStep === 'manual-price') {
    return { ...state, currentStep: 'price-source' };
  }

  if (state.currentStep === 'crop') {
    return state;
  }

  if (state.currentStep === 'location') {
    return {
      ...state,
      currentStep:
        state.draft.currentPriceSource === 'manual'
          ? 'manual-price'
          : 'price-source',
    };
  }

  if (state.currentStep === 'quantity') {
    return { ...state, currentStep: 'location' };
  }

  if (state.currentStep === 'review') {
    return { ...state, currentStep: 'quantity' };
  }

  return state;
};

export const getSellAdvisorSteps = (
  draft: SellAdvisorDraft
): SellAdvisorStep[] => [
  { id: 'crop', label: 'Crop', isAvailable: true },
  { id: 'price-source', label: 'Price source', isAvailable: true },
  {
    id: 'manual-price',
    label: 'Current price',
    isAvailable: draft.currentPriceSource === 'manual',
  },
  { id: 'location', label: 'Location', isAvailable: true },
  { id: 'quantity', label: 'Quantity', isAvailable: true },
  { id: 'review', label: 'Recommendation', isAvailable: true },
];

export const getSellAdvisorProgress = (
  draft: SellAdvisorDraft,
  currentStepId: string
) => {
  const availableSteps = getSellAdvisorSteps(draft).filter(
    (step) => step.isAvailable
  );
  const currentStepIndex = Math.max(
    availableSteps.findIndex((step) => step.id === currentStepId),
    0
  );

  return {
    availableSteps,
    currentStepNumber: currentStepIndex + 1,
    totalSteps: availableSteps.length,
  };
};
