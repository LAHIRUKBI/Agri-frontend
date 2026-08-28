export const CROP_OPTIONS = [
  {
    value: "tomatoes",
    label: "Tomatoes",
    imageSrc: "/images/vegetables/tomatoes.png",
  },
  {
    value: "beans",
    label: "Beans",
    imageSrc: "/images/vegetables/beans.png",
  },
  {
    value: "cabbage",
    label: "Cabbage",
    imageSrc: "/images/vegetables/cabbage.png",
  },
  {
    value: "carrots",
    label: "Carrots",
    imageSrc: "/images/vegetables/carrots.png",
  },
  {
    value: "chili",
    label: "Chili",
    imageSrc: "/images/vegetables/chili.png",
  },
  {
    value: "eggplants",
    label: "Eggplants",
    imageSrc: "/images/vegetables/eggplants.png",
  },
  {
    value: "pumpkin",
    label: "Pumpkin",
    imageSrc: "/images/vegetables/pumpkin.png",
  },
  {
    value: "snake gourd",
    label: "Snake Gourd",
    imageSrc: "/images/vegetables/snake-gourd.png",
  },
] as const;

export type CropValue = (typeof CROP_OPTIONS)[number]["value"];

export const CROPS: CropValue[] = CROP_OPTIONS.map((crop) => crop.value);

export type QuantityRange = {
  label: string;
  value: number;
  min: number;
  max?: number;
};

const LIGHT_HARVEST_RANGES = [
  { label: "Small Harvest (25–75 kg)", value: 50, min: 25, max: 75 },
  { label: "Medium Harvest (75–150 kg)", value: 112.5, min: 75, max: 150 },
  { label: "Large Harvest (150–300 kg)", value: 225, min: 150, max: 300 },
  {
    label: "Very Large Harvest (300–500 kg)",
    value: 400,
    min: 300,
    max: 500,
  },
  { label: "Bulk Harvest (500+ kg)", value: 600, min: 500 },
] as const satisfies readonly QuantityRange[];

const STANDARD_HARVEST_RANGES = [
  { label: "Small Harvest (50–150 kg)", value: 100, min: 50, max: 150 },
  { label: "Medium Harvest (150–300 kg)", value: 225, min: 150, max: 300 },
  { label: "Large Harvest (300–600 kg)", value: 450, min: 300, max: 600 },
  {
    label: "Very Large Harvest (600–1000 kg)",
    value: 800,
    min: 600,
    max: 1000,
  },
  { label: "Bulk Harvest (1000+ kg)", value: 1200, min: 1000 },
] as const satisfies readonly QuantityRange[];

const BULKY_HARVEST_RANGES = [
  { label: "Small Harvest (100–300 kg)", value: 200, min: 100, max: 300 },
  { label: "Medium Harvest (300–700 kg)", value: 500, min: 300, max: 700 },
  { label: "Large Harvest (700–1200 kg)", value: 950, min: 700, max: 1200 },
  {
    label: "Very Large Harvest (1200–2000 kg)",
    value: 1600,
    min: 1200,
    max: 2000,
  },
  { label: "Bulk Harvest (2000+ kg)", value: 2200, min: 2000 },
] as const satisfies readonly QuantityRange[];

export const QUANTITY_RANGES: Record<
  CropValue,
  readonly QuantityRange[]
> = {
  beans: LIGHT_HARVEST_RANGES,
  chili: LIGHT_HARVEST_RANGES,
  eggplants: STANDARD_HARVEST_RANGES,
  "snake gourd": STANDARD_HARVEST_RANGES,
  tomatoes: STANDARD_HARVEST_RANGES,
  cabbage: STANDARD_HARVEST_RANGES,
  carrots: STANDARD_HARVEST_RANGES,
  pumpkin: BULKY_HARVEST_RANGES,
};

export const getQuantityRangesForCrop = (
  crop: string
): readonly QuantityRange[] =>
  QUANTITY_RANGES[crop as CropValue] ?? [];

export const getRangeEarningsQuantity = (range: QuantityRange): number =>
  (range.min + (range.max ?? range.value)) / 2;

export const FARMER_DISTRICT_OPTIONS = [
  { value: "colombo", label: "Colombo" },
  { value: "gampaha", label: "Gampaha" },
  { value: "kalutara", label: "Kalutara" },
  { value: "kandy", label: "Kandy" },
  { value: "matale", label: "Matale" },
  { value: "nuwara eliya", label: "Nuwara Eliya" },
  { value: "galle", label: "Galle" },
  { value: "matara", label: "Matara" },
  { value: "kurunegala", label: "Kurunegala" },
  { value: "puttalam", label: "Puttalam" },
  { value: "badulla", label: "Badulla" },
  { value: "kegalle", label: "Kegalle" },
  { value: "ratnapura", label: "Ratnapura" },
] as const;

export type FarmerDistrictValue =
  (typeof FARMER_DISTRICT_OPTIONS)[number]["value"];

export const FARMER_DISTRICTS: FarmerDistrictValue[] =
  FARMER_DISTRICT_OPTIONS.map((district) => district.value);

// Legacy options retained for the existing RecommendationForm until its
// request contract is migrated to farmer_district in the submission phase.
export const DISTRICT_OPTIONS = [
  ...FARMER_DISTRICT_OPTIONS,
  { value: "dambulla", label: "Dambulla" },
  { value: "meegoda", label: "Meegoda" },
] as const;

export type DistrictValue = (typeof DISTRICT_OPTIONS)[number]["value"];

export const DISTRICTS: DistrictValue[] = DISTRICT_OPTIONS.map(
  (district) => district.value
);

export const MARKETS = [
  "dambulla",
  "kandy",
  "nuwaraeliya",
  "meegoda",
];

export const SEASONS = [
  "Yala",
  "Maha",
];
