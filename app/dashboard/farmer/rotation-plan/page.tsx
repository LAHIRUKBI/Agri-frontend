'use client';

import { useState, useEffect } from 'react';
import FarmerSidebar from '@/app/navigation/farmer/page';
import AnalysisLoader from '@/app/dashboard/farmer/components/AnalysisLoader';

interface ChemicalItem {
  name: string;
  amount_g: number;
}

interface ChemicalBreakdown {
  name: string;
  amount_g: number;
  base_100g: { N: number; P: number; K: number };
  added: { N: number; P: number; K: number };
}

interface MathBreakdown {
  base: number; ml: number; loss: number;
}

interface CalculatorDetails {
  requirements: {
    N: { min: number; max: number; mid: number };
    P: { min: number; max: number; mid: number };
    K: { min: number; max: number; mid: number };
  };
  differences: { diffN: number; diffP: number; diffK: number };
  statuses: { N: string; P: string; K: string };
  landCalculations: { cropName: string; acres: number; sqFt: number }[];
}

interface PastCropDetails {
  cropName: string;
  landSize: number;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  startDate?: string;
  endDate?: string;
  fertilizers: ChemicalItem[];
  pesticides?: ChemicalItem[];
}

interface EvaluationResult {
  planId?: string;
  targetEvaluation: {
    isSuitable: boolean;
    isFertile: boolean;
    feedback: string[];
    aiSoilRemedy: string;
  };
  soilNutrientLevels: {
    nutrient: string;
    level: string;
    depletionPrediction: string;
    difference: number;
    targetMin?: number;
    targetMax?: number;
    breakdown?: MathBreakdown;
  }[];
  alternativeSuggestions?: {
    cropName: string;
    reasons: string[];
  }[];
  chemicalBreakdown?: ChemicalBreakdown[];
  calculatorDetails?: CalculatorDetails;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = ['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'];

const LAND_SIZES = [
  { label: '¼ Acre', value: 0.25 }, { label: '½ Acre', value: 0.5 },
  { label: '1 Acre', value: 1 }, { label: '2 Acres', value: 2 },
  { label: '3 Acres', value: 3 }, { label: '5 Acres', value: 5 },
  { label: '10 Acres', value: 10 }, { label: '20 Acres', value: 20 },
  { label: '50 Acres', value: 50 }, { label: '100 Acres', value: 100 }
];

const AMOUNTS = [
  { label: '5kg', value: 5000 },
  { label: '10kg', value: 10000 },
  { label: '25kg', value: 25000 },
  { label: '50kg', value: 50000 },
  { label: '100kg', value: 100000 },
  { label: '150kg', value: 150000 },
  { label: '200kg', value: 200000 },
  { label: '250kg', value: 250000 },
  { label: '300kg', value: 300000 },
  { label: '400kg', value: 400000 },
  { label: '500kg', value: 500000 },
  { label: '750kg', value: 750000 },
  { label: '1000kg', value: 1000000 }
];

const FERTILIZER_OPTIONS = [
  'Urea', 'TSP (Triple Super Phosphate)', 'MOP (Muriate of Potash)', 'NPK 15-15-15', 'Dolomite', 'Compost / Organic', 'Ammonium Sulfate (SOA)', 'Eppawala Rock Phosphate (ERP)', 'NPK 12-12-17'
];

const CROP_OPTIONS = [
  { value: 'Rice', label: 'Rice (වී)' },
  { value: 'Tomato', label: 'Tomato (තක්කාලි)' },
  { value: 'Carrot', label: 'Carrot (කැරට්)' },
  { value: 'Potato', label: 'Potato (අර්තාපල්)' },
  { value: 'Cabbage', label: 'Cabbage (ගෝවා)' },
  { value: 'Chilli', label: 'Chilli (මිරිස්)' },
  { value: 'Onion', label: 'Onion (ලූනු)' },
  { value: 'Maize', label: 'Maize (බඩඉරිඟු)' },
  { value: 'Beans', label: 'Beans (බෝංචි)' },
  { value: 'Eggplant', label: 'Eggplant (වම්බටු)' },
];

const SQ_FT_PER_ACRE = 43560;

function formatAiRemedy(text: string): string[] {
  if (!text) return ['No specific recommendations.'];
  let cleaned = text.replace(/\*\*/g, '');
  let points = cleaned.split(/(?<=\.\s)\s+|\.\s+|\n+|(?:\d+\.\s*)|(?:\*\s*)|(?:-\s*)/);
  points = points.map(p => p.trim()).filter(p => p.length > 0 && p !== '.');
  if (points.length === 0) points = [cleaned];
  return points.slice(0, 8);
}

export default function RotationPlanPage() {
  const [currentDate, setCurrentDate] = useState('');
  const [currentDateYMD, setCurrentDateYMD] = useState('');
  const [targetCrop, setTargetCrop] = useState('');
  const [targetLandSize, setTargetLandSize] = useState<number>(1);
  const [language, setLanguage] = useState('English');
  const [pastCrops, setPastCrops] = useState<PastCropDetails[]>([
    { cropName: '', landSize: 1, startMonth: '', startYear: '', endMonth: '', endYear: '', startDate: '', endDate: '', fertilizers: [], pesticides: [] }
  ]);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [initialSoilData, setInitialSoilData] = useState<any>(null);
  const [showAIAssistance, setShowAIAssistance] = useState(false);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);

  useEffect(() => {
    const today = new Date();
    setCurrentDate(today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    setCurrentDateYMD(today.toISOString().split('T')[0]);
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));
    const fetchSoilData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/nutrients');
        if (!res.ok) throw new Error('Could not load nutrient reference data.');
        const data = await res.json();
        if (data.success) setInitialSoilData(data.data);
      } catch (err) {
        setInfoMessage('Initial soil reference data could not be loaded because the backend is unavailable.');
      }
    };
    fetchSoilData();
  }, []);

  const handleInputChange = (index: number, field: keyof PastCropDetails, value: any) => {
    const updatedCrops = [...pastCrops];
    (updatedCrops[index][field] as any) = value;
    setPastCrops(updatedCrops);
  };

  const handleDateChange = (index: number, field: 'startDate' | 'endDate', value: string) => {
    const updatedCrops = [...pastCrops];
    const dateObj = new Date(value);
    updatedCrops[index][field] = value;
    if (!isNaN(dateObj.getTime())) {
      if (field === 'startDate') {
        updatedCrops[index].startMonth = MONTHS[dateObj.getMonth()];
        updatedCrops[index].startYear = String(dateObj.getFullYear());
      } else {
        updatedCrops[index].endMonth = MONTHS[dateObj.getMonth()];
        updatedCrops[index].endYear = String(dateObj.getFullYear());
      }
    }
    setPastCrops(updatedCrops);
  };

  const handleAddFertilizer = (cropIndex: number) => {
    const updatedCrops = [...pastCrops];
    updatedCrops[cropIndex].fertilizers.push({ name: FERTILIZER_OPTIONS[0], amount_g: 5000 });
    setPastCrops(updatedCrops);
  };

  const handleRemoveFertilizer = (cropIndex: number, chemIndex: number) => {
    const updatedCrops = [...pastCrops];
    updatedCrops[cropIndex].fertilizers = updatedCrops[cropIndex].fertilizers.filter((_, i) => i !== chemIndex);
    setPastCrops(updatedCrops);
  };

  const handleFertilizerChange = (cropIndex: number, chemIndex: number, field: string, value: any) => {
    const updatedCrops = [...pastCrops];
    updatedCrops[cropIndex].fertilizers[chemIndex] = { ...updatedCrops[cropIndex].fertilizers[chemIndex], [field]: value };
    setPastCrops(updatedCrops);
  };

  const addCropField = () => setPastCrops([...pastCrops, { cropName: '', landSize: 1, startMonth: '', startYear: '', endMonth: '', endYear: '', startDate: '', endDate: '', fertilizers: [], pesticides: [] }]);
  const removeCropField = (index: number) => setPastCrops(pastCrops.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCrop.trim()) return setError('Please specify the crop you wish to plant.');
    if (pastCrops.some(c => !c.cropName || !c.startMonth || !c.startYear || !c.endMonth || !c.endYear)) {
      return setError('Please complete all historical details including full dates.');
    }
    setLoading(true); setError(''); setEvaluation(null); setShowResultPopup(false);
    setShowAIAssistance(false);
    try {
      const token = localStorage.getItem('token');
      const formattedPreviousCrops = pastCrops.map(crop => ({
        ...crop,
        pesticides: crop.pesticides || []
      }));
      const res = await fetch('http://localhost:5000/api/rotation/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          targetCrop,
          targetLandSize,
          currentMonth: currentDate,
          previousCrops: formattedPreviousCrops,
          language
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get rotation plan');
      setEvaluation(data);
      setShowResultPopup(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetAlternatives = async () => {
    if (!evaluation) return;
    if (evaluation.alternativeSuggestions && evaluation.alternativeSuggestions.length > 0) {
      setShowAIAssistance(true);
      return;
    }
    setLoadingAlternatives(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/rotation/alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          planId: evaluation.planId,
          targetCrop,
          language,
          currentN: evaluation.soilNutrientLevels[0].level.split(' ')[0],
          currentP: evaluation.soilNutrientLevels[1].level.split(' ')[0],
          currentK: evaluation.soilNutrientLevels[2].level.split(' ')[0]
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEvaluation({
        ...evaluation,
        alternativeSuggestions: data.alternativeSuggestions
      });
      setShowAIAssistance(true);
    } catch (err: any) {
      setError(err.message || "Failed to fetch AI alternatives.");
    } finally {
      setLoadingAlternatives(false);
    }
  };

  const getDisplayCropName = (val: string) => {
    const found = CROP_OPTIONS.find(c => c.value === val);
    return found ? found.label : val;
  };

  const fertileLimitIssues = evaluation
    ? evaluation.soilNutrientLevels
        .map((item) => {
          const symbol = item.nutrient.includes('Nitrogen')
            ? 'N'
            : item.nutrient.includes('Phosphorus')
              ? 'P'
              : 'K';
          const baseCurrentVal = parseFloat(item.level) || 0;
          const totalAddedAmount = (evaluation.chemicalBreakdown || []).reduce(
            (total, chem) => total + (chem.added[symbol as 'N' | 'P' | 'K'] || 0),
            0
          );
          const currentVal = baseCurrentVal + totalAddedAmount;
          const goodSoilNutrient = initialSoilData?.nutrients?.find(
            (nut: any) => nut.symbol === symbol
          );
          if (!goodSoilNutrient) return null;
          const goodMin = Number(goodSoilNutrient.min);
          const goodMax = Number(goodSoilNutrient.max);
          if (currentVal < goodMin) {
            return {
              symbol,
              name: item.nutrient,
              currentVal,
              limit: goodMin,
              type: 'below' as const,
            };
          }
          if (currentVal > goodMax) {
            return {
              symbol,
              name: item.nutrient,
              currentVal,
              limit: goodMax,
              type: 'above' as const,
            };
          }
          return null;
        })
        .filter((issue): issue is NonNullable<typeof issue> => issue !== null)
    : [];

  const effectiveSuitable = Boolean(
    evaluation?.targetEvaluation.isSuitable && fertileLimitIssues.length === 0
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-stone-50" style={{ zoom: 1.1 }}>
      <FarmerSidebar user={user} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 relative w-full">
        <div className="mx-auto max-w-7xl space-y-6">

          <section className="rounded-3xl border border-stone-200 bg-[radial-gradient(circle_at_top_left,_#f7fee7,_#fafaf9_55%)] p-5 sm:p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Predict & Analyze</p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-stone-900">Soil Evaluator and Crop Recommendation</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              Analyze your historical crop data and applied fertilizers to predict current soil nutrient levels and evaluate crop suitability.
            </p>
          </section>

          {infoMessage && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
              {infoMessage}
            </div>
          )}

          {initialSoilData && (
            <div className="rounded-3xl border border-emerald-100 bg-[linear-gradient(to_right,_#f0fdf4,_#ffffff)] p-5 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-5">
              <div className="shrink-0">
                <h2 className="text-sm font-bold text-emerald-900 flex items-center gap-2">Good Soil Reference Limits</h2>
                <p className="text-xs font-semibold text-emerald-700 mt-2 bg-emerald-100 px-3 py-1.5 rounded-full inline-flex flex-wrap items-center">
                  Ideal pH Range: <strong className="ml-1.5 text-emerald-900">{initialSoilData.phMin} - {initialSoilData.phMax}</strong>
                </p>
              </div>
              <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                {initialSoilData.nutrients.map((nut: any, i: number) => (
                  <div key={i} className="rounded-2xl bg-white p-3 border border-emerald-50 shadow-sm flex-1 min-w-[120px] flex flex-col justify-center transition-all hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-black text-stone-800">{nut.symbol}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          nut.type === 'main' ? 'bg-emerald-100 text-emerald-700' :
                          nut.type === 'secondary' ? 'bg-sky-100 text-sky-700' :
                          'bg-stone-200 text-stone-700'
                        }`}>
                        {nut.type}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-stone-800 flex flex-wrap items-baseline gap-x-1 mt-0.5">
                      <span>{nut.min}-{nut.max}</span>
                      <span className="text-[10px] font-medium text-stone-500 uppercase tracking-widest">{nut.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr,1.5fr]">
            
            <div className="rounded-3xl border border-stone-200 bg-white p-5 md:p-6 shadow-sm h-fit">
              <h2 className="text-lg font-semibold text-stone-900 mb-5">1. Target Crop Validation</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-4">
                <div className="w-full">
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">Crop to plant:</label>
                  <select
                    required
                    value={targetCrop}
                    onChange={(e) => {
                      setTargetCrop(e.target.value);
                      setEvaluation(null);
                      setError('');
                    }}
                    className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500 bg-stone-50 focus:bg-white"
                  >
                    <option value="">Select a crop</option>
                    {CROP_OPTIONS.map((crop) => (
                      <option key={crop.value} value={crop.value}>
                        {crop.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full">
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">Land Size:</label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <select
                      value={targetLandSize} onChange={(e) => setTargetLandSize(Number(e.target.value))}
                      className="flex-1 rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500 bg-stone-50 focus:bg-white"
                    >
                      {LAND_SIZES.map(size => <option key={size.value} value={size.value}>{size.label}</option>)}
                    </select>
                    <span className="text-[11px] sm:text-xs text-center font-semibold text-stone-500 bg-stone-100 px-3 py-3 rounded-2xl whitespace-nowrap border border-stone-200 shrink-0">
                      ={(targetLandSize * SQ_FT_PER_ACRE).toLocaleString()} Sq.Ft
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-white p-5 md:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-stone-900">2. Historical Crop Timeline</h2>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">{pastCrops.length} records</span>
              </div>
              <div className="space-y-6">
                {pastCrops.map((crop, index) => (
                  <div key={index} className="relative rounded-3xl border border-stone-200/70 bg-white p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                    {pastCrops.length > 1 && (
                      <button type="button" onClick={() => removeCropField(index)}
                        className="absolute -top-3 -right-3 h-8 w-8 rounded-full border border-red-200 bg-white text-red-500 shadow-sm flex items-center justify-center transition hover:bg-red-50 hover:text-red-700 z-10"
                        title="Remove record"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-5 items-start">
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">Crop Grown</label>
                        <input
                          type="text"
                          list={`crop-options-${index}`}
                          required
                          placeholder="Select crop"
                          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-emerald-500 bg-stone-50 focus:bg-white"
                          value={crop.cropName}
                          onChange={(e) => handleInputChange(index, 'cropName', e.target.value)}
                        />
                        <datalist id={`crop-options-${index}`}>
                          {CROP_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value} label={option.label} />
                          ))}
                        </datalist>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">Land Size</label>
                        <select
                          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-emerald-500 bg-stone-50 focus:bg-white"
                          value={crop.landSize} onChange={(e) => handleInputChange(index, 'landSize', Number(e.target.value))}
                        >
                          {LAND_SIZES.map(size => <option key={size.value} value={size.value}>{size.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">Start Date</label>
                        <input 
                          type="date" 
                          required 
                          max={crop.endDate || currentDateYMD}
                          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-emerald-500 bg-stone-50 focus:bg-white"
                          value={crop.startDate || ''} 
                          onChange={(e) => handleDateChange(index, 'startDate', e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">End Date</label>
                        <input 
                          type="date" 
                          required 
                          min={crop.startDate || ''}
                          max={currentDateYMD}
                          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-emerald-500 bg-stone-50 focus:bg-white"
                          value={crop.endDate || ''} 
                          onChange={(e) => handleDateChange(index, 'endDate', e.target.value)} 
                        />
                      </div>
                    </div>
                    <div className="border-t border-stone-100 pt-4 mt-2">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800">Fertilizers Applied</label>
                        <button type="button" onClick={() => handleAddFertilizer(index)} className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition shadow-sm border border-emerald-200 flex items-center gap-1">
                          <span>+</span> Add Fertilizer
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                        {crop.fertilizers.map((fert, fIdx) => (
                          <div key={fIdx} className="relative bg-[#f0fdf4] border border-[#bbf7d0] p-3 rounded-2xl shadow-sm flex flex-col gap-2 transition hover:shadow-md">
                            <button type="button" onClick={() => handleRemoveFertilizer(index, fIdx)} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center transition hover:bg-red-200 border border-red-200 z-10">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                            <div className="flex flex-col gap-1 w-full">
                              <label className="text-[9px] font-bold uppercase text-emerald-600">Type</label>
                              <select
                                className="w-full rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-xs text-stone-900 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                                value={fert.name}
                                onChange={(e) => handleFertilizerChange(index, fIdx, 'name', e.target.value)}
                              >
                                {FERTILIZER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            </div>
                            <div className="flex flex-col gap-1 w-full">
                              <label className="text-[9px] font-bold uppercase text-emerald-600">Amount</label>
                              <select className="w-full rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-xs text-stone-900 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                                value={fert.amount_g} onChange={(e) => handleFertilizerChange(index, fIdx, 'amount_g', Number(e.target.value))}>
                                {AMOUNTS.map(amt => <option key={amt.value} value={amt.value}>{amt.label}</option>)}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                      {crop.fertilizers.length === 0 && (
                        <div className="bg-stone-50 border border-stone-100 rounded-xl p-4 text-center">
                          <p className="text-xs text-stone-500 italic">No fertilizers added for this crop period yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-6 border-t border-stone-100 pt-5">
                <button type="button" onClick={addCropField} className="w-full sm:w-auto rounded-2xl border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 shadow-sm bg-white">
                  + Add Another Crop Period
                </button>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded-2xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-emerald-500 shadow-sm bg-white">
                    <option value="English">English</option>
                    <option value="Sinhala">සිංහල</option>
                  </select>
                  <button type="submit" disabled={loading} className="w-full sm:w-auto rounded-2xl px-6 py-2.5 text-sm font-semibold text-white transition bg-emerald-600 hover:bg-emerald-700 shadow-md disabled:cursor-not-allowed disabled:opacity-60">
                    {loading ? 'Analyzing...' : 'Run Analysis'}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
              {error}
            </div>
          )}

          {loading && (
            <AnalysisLoader />
          )}

          {showResultPopup && evaluation && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm px-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-[95%] sm:max-w-sm w-full p-6 sm:p-8 text-center transform transition-all scale-100 animate-in fade-in zoom-in duration-300">
                <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full mb-6 shadow-inner ${effectiveSuitable ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                  {effectiveSuitable ? (
                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  ) : (
                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  )}
                </div>
                <h3 className="text-2xl font-black text-stone-900 mb-2">
                  {effectiveSuitable ? 'Suitable!' : 'Not Recommended!'}
                </h3>
                <p className="text-sm text-stone-600 mb-8">
                  {effectiveSuitable 
                    ? `Your soil is ready to plant ${getDisplayCropName(targetCrop)}.` 
                    : `Your current soil conditions do not meet the requirements for ${getDisplayCropName(targetCrop)}.`}
                </p>
                <button
                  onClick={() => {
                    setShowResultPopup(false);
                    setTimeout(() => {
                      document.getElementById('results-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }}
                  className={`w-full rounded-2xl px-6 py-3.5 text-sm font-bold text-white transition shadow-md ${effectiveSuitable ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  View Full Analysis
                </button>
              </div>
            </div>
          )}

          {!loading && evaluation && !showResultPopup && (
            <div id="results-area" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className={`p-5 sm:p-6 rounded-3xl border shadow-sm ${effectiveSuitable ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">Target Crop Suitability</h3>
                    
                  </div>
                  <span className={`text-sm px-4 py-2 rounded-2xl font-bold uppercase tracking-wider text-center w-full md:w-auto ${effectiveSuitable ? 'bg-emerald-600 text-white shadow-sm' : 'bg-red-600 text-white shadow-sm'}`}>
                    {effectiveSuitable ? 'SUITABLE' : 'NOT RECOMMENDED'}
                  </span>
                </div>

                {!effectiveSuitable && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-white p-4 shadow-sm">
                    <h3 className="font-bold text-red-800 flex items-center gap-2">
                      Why is this crop not recommended?
                    </h3>
                    {fertileLimitIssues.length > 0 ? (
                      <ul className="mt-3 space-y-2 text-sm text-stone-700">
                        {fertileLimitIssues.map((issue) => (
                          <li key={issue.symbol} className="flex items-start gap-2">
                            <span className="font-bold text-red-600">•</span>
                            <span>
                              <strong>{issue.name}</strong>{' '}
                              {issue.type === 'above'
                                ? `is ABOVE the Good Soil range. Current level: ${issue.currentVal.toFixed(2)}; maximum limit: ${issue.limit}.`
                                : `is BELOW the Good Soil range. Current level: ${issue.currentVal.toFixed(2)}; minimum limit: ${issue.limit}.`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <ul className="mt-3 space-y-2 text-sm text-stone-700">
                        {(evaluation.targetEvaluation.feedback || []).map((reason, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="font-bold text-red-600">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                        {(!evaluation.targetEvaluation.feedback || evaluation.targetEvaluation.feedback.length === 0) && (
                          <li>The current soil nutrient levels do not meet the selected crop's requirements.</li>
                        )}
                      </ul>
                    )}
                  </div>
                )}

                {!effectiveSuitable && (!showAIAssistance ? (
                  <div className="mt-5 pt-4 border-t border-stone-200/50 flex justify-center">
                    <button
                      type="button"
                      onClick={handleGetAlternatives}
                      disabled={loadingAlternatives}
                      className="rounded-2xl border border-emerald-300 bg-white w-full sm:w-auto justify-center px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 shadow-sm disabled:opacity-60 flex items-center gap-2"
                    >
                      {loadingAlternatives ? (
                        <><span className="animate-spin text-lg">⏳</span> Getting Suitable Crops...</>
                      ) : (
                        "Ask Suitable Alternative Crops"
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 rounded-3xl border border-emerald-100 bg-[linear-gradient(180deg,_#ffffff_0%,_#f0fdf4_100%)] p-5 md:p-6 shadow-sm transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-sm font-bold flex items-center gap-1.5 text-emerald-900 uppercase tracking-wide">
                          ✨ AI Soil Preparation Guide
                        </h4>
                      </div>
                      <button onClick={() => setShowAIAssistance(false)} className="text-xs font-semibold text-stone-500 hover:text-stone-800 bg-stone-100 px-3 py-1.5 rounded-full transition shrink-0">
                        X
                      </button>
                    </div>
                    
                    <ul className="space-y-3 text-sm text-stone-700">
                      {formatAiRemedy(evaluation.targetEvaluation.aiSoilRemedy).map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="text-emerald-500 text-lg leading-none mt-0.5">•</span>
                          <span className="leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>

                    {!effectiveSuitable && evaluation.alternativeSuggestions && evaluation.alternativeSuggestions.length > 0 && (
                      <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-amber-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                          🌱 Recommended Alternatives for Current Soil
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {evaluation.alternativeSuggestions.map((alt, idx) => (
                            <div key={idx} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                              <h4 className="text-sm font-bold text-stone-900 mb-3 bg-amber-100 inline-block px-3 py-1 rounded-full">
                                {alt.cropName}
                              </h4>
                              <ul className="space-y-2">
                                {alt.reasons.map((reason, rIdx) => (
                                  <li key={rIdx} className="text-xs text-stone-600 flex items-start gap-2">
                                    <span className="text-amber-500 font-bold mt-0.5">›</span>
                                    <span className="leading-relaxed">{reason}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-stone-200 bg-white p-5 md:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 border-b border-stone-100 pb-4">
                  <h3 className="text-base font-bold text-stone-900">Current Soil Level vs Target Requirements</h3>
                </div>
                
                <div className="grid gap-5 xl:grid-cols-3">
                  {evaluation.soilNutrientLevels.map((item, idx) => {
                    const baseCurrentVal = parseFloat(item.level) || 0;
                    const symbol = item.nutrient.includes('Nitrogen') ? 'N' : item.nutrient.includes('Phosphorus') ? 'P' : 'K';
                    
                    let totalAddedAmount = 0;
                    if (evaluation.chemicalBreakdown) {
                      evaluation.chemicalBreakdown.forEach(chem => {
                        totalAddedAmount += (chem.added[symbol as 'N'|'P'|'K'] || 0);
                      });
                    }
                    
                    const currentVal = baseCurrentVal + totalAddedAmount;

                    const minVal = item.targetMin || 0;
                    const maxVal = item.targetMax === 999999 ? minVal * 1.5 : (item.targetMax || minVal * 1.5);
                    const displayMax = item.targetMax === 999999 ? 'No Limit' : item.targetMax;
                    
                    const status = item.depletionPrediction; 
                    const isDeficit = status === 'Deficit';
                    const isOptimal = status === 'Optimal';
                    
                    const goodSoilNutrient = initialSoilData?.nutrients?.find((n: any) => n.symbol === symbol);
                    const goodMin = goodSoilNutrient?.min || 0;
                    const goodMax = goodSoilNutrient?.max || 100;

                    const maxGraph = Math.max(currentVal, maxVal, goodMax) * 1.1; 
                    const currentPct = Math.min((currentVal / maxGraph) * 100, 100);
                    const minPct = Math.min((minVal / maxGraph) * 100, 100);
                    const maxPct = item.targetMax === 999999 ? 100 : Math.min((maxVal / maxGraph) * 100, 100);
                    
                    const goodMinPct = Math.min((goodMin / maxGraph) * 100, 100);
                    const rawGoodMaxPct = Math.min((goodMax / maxGraph) * 100, 100);
                    
                    let labelMinPct = goodMinPct;
                    let labelMaxPct = rawGoodMaxPct;
                    if (labelMaxPct - labelMinPct < 22) {
                      const midPct = (labelMinPct + labelMaxPct) / 2;
                      labelMinPct = Math.max(0, midPct - 11);
                      labelMaxPct = Math.min(100, midPct + 11);
                    }

                    const isBelowGood = currentVal < goodMin;
                    const isAboveGood = currentVal > goodMax;
                    const isWithinGood = currentVal >= goodMin && currentVal <= goodMax;

                    return (
                      <div key={idx} className={`rounded-3xl border p-4 sm:p-5 shadow-sm transition ${
                        isOptimal ? 'bg-[linear-gradient(180deg,_#ffffff,_#f0fdf4)] border-emerald-200' : 
                        isDeficit ? 'bg-[linear-gradient(180deg,_#ffffff,_#fef2f2)] border-red-200' : 
                        'bg-[linear-gradient(180deg,_#ffffff,_#fffbeb)] border-amber-200'
                      }`}>
                        
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-sm font-bold text-stone-900 uppercase flex items-center gap-2 tracking-wide">
                            {item.nutrient.split(' ')[0]}
                          </h4>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                          
                          {/* Good Soil Baseline Display */}
                          {goodSoilNutrient && (
                            <div className="flex items-center gap-2 mt-5 sm:mt-4">
                              <span className="text-[9px] sm:text-[10px] w-14 sm:w-20 text-emerald-600 font-bold uppercase tracking-wider shrink-0">Good Soil</span>
                              <div className="flex-1 relative h-3 sm:h-4 bg-stone-100 rounded-full shadow-inner flex items-center w-full">
                                
                                {/* Values with minimum gap to prevent overlap */}
                                <span 
                                  className="absolute -top-4 sm:-top-5 text-[9px] sm:text-[11px] font-black text-emerald-700 transform -translate-x-1/2 z-20" 
                                  style={{ left: `${labelMinPct}%` }}
                                >
                                  {goodMin}
                                </span>
                                <span 
                                  className="absolute -top-4 sm:-top-5 text-[9px] sm:text-[11px] font-black text-emerald-700 transform -translate-x-1/2 z-20" 
                                  style={{ left: `${labelMaxPct}%` }}
                                >
                                  {goodMax}
                                </span>
                                
                                {/* Soft Current overlay */}
                                <div 
                                  className={`absolute h-full rounded-full transition-all duration-1000 opacity-40 z-0 ${
                                    isOptimal ? 'bg-emerald-500' : isDeficit ? 'bg-red-500' : 'bg-amber-500'
                                  }`} 
                                  style={{ left: '0', width: `${currentPct}%` }}
                                ></div>

                                {/* Good Range Green Band */}
                                <div 
                                  className="absolute h-full bg-emerald-500 rounded-full transition-all duration-1000 z-10 shadow-sm" 
                                  style={{ 
                                    left: `calc(${goodMinPct}% - 8px)`, 
                                    width: `calc(${rawGoodMaxPct - goodMinPct}% + 16px)` 
                                  }}
                                ></div>
                                
                                {/* Prominent Marker for Current Value */}
                                <div 
                                  className="absolute h-6 sm:h-7 w-1 sm:w-1.5 bg-amber-500 rounded-full shadow-md z-20 border border-white transition-all duration-1000" 
                                  style={{ left: `calc(${currentPct}% - 2px)` }}
                                  title={`Current: ${currentVal.toFixed(2)}`}
                                ></div>
                              </div>
                              <div className="w-10 sm:w-14 shrink-0"></div> {/* Space balance for desktop & mobile */}
                            </div>
                          )}

                          {/* Current Value Display Standard Bar */}
                          <div className="flex items-center gap-2 mt-3 sm:mt-2">
                            <span className="text-[9px] sm:text-[10px] w-14 sm:w-20 text-stone-700 font-bold uppercase tracking-wider shrink-0">Current</span>
                            <div className="flex-1 w-full bg-stone-100 rounded-full h-2.5 sm:h-3 overflow-hidden shadow-inner relative">
                              <div className={`absolute h-full rounded-full transition-all duration-1000 ${
                                isOptimal ? 'bg-emerald-500' : isDeficit ? 'bg-red-500' : 'bg-amber-500'
                              }`} style={{ left: '0', width: `${currentPct}%` }}></div>
                            </div>
                            <span className="text-[10px] sm:text-sm font-extrabold text-stone-900 w-10 sm:w-14 shrink-0 text-right">
                              {currentVal.toFixed(2)}
                            </span>
                          </div>

                          {/* Target Min & Max Combined Bar */}
                          <div className="flex items-center gap-2 mt-2 sm:mt-1">
                            <span className="text-[9px] sm:text-[10px] w-14 sm:w-20 text-stone-500 font-semibold uppercase flex flex-col leading-tight shrink-0">
                              <span>Target</span>
                              {targetCrop && <span className="text-[7px] sm:text-[8px] text-emerald-600 font-bold max-w-full truncate" title={getDisplayCropName(targetCrop)}>({getDisplayCropName(targetCrop)})</span>}
                            </span>
                            <div className="flex-1 w-full bg-stone-100 rounded-full h-1.5 sm:h-2 overflow-visible relative flex items-center">
                              <div 
                                className="absolute h-full bg-stone-400 rounded-full transition-all duration-1000" 
                                style={{ 
                                  left: `${minPct}%`, 
                                  width: `${maxPct - minPct}%` 
                                }}
                              ></div>
                              <div className="absolute h-3 w-0.5 bg-stone-600 rounded-full z-10" style={{ left: `${minPct}%` }}></div>
                              {item.targetMax !== 999999 && (
                                <div className="absolute h-3 w-0.5 bg-stone-600 rounded-full z-10" style={{ left: `${maxPct}%` }}></div>
                              )}
                            </div>
                            <span className="text-[8px] sm:text-[10px] font-bold text-stone-600 w-10 sm:w-14 shrink-0 text-right whitespace-nowrap">
                              {minVal.toFixed(1)} {item.targetMax !== 999999 ? `- ${displayMax}` : '+'}
                            </span>
                          </div>

                          {/* Detail Comparison Boxes */}
                          {goodSoilNutrient && (
                            <div className="mt-4 pt-4 border-t border-stone-200/60 flex flex-col sm:flex-row gap-2">
                              <div className="flex-1 flex justify-between items-center bg-white p-2.5 rounded-2xl border border-stone-100 shadow-sm">
                                <span className="text-[10px] sm:text-xs text-stone-600 font-medium">Vs Fertile Limit:</span>
                                {isBelowGood && <span className="text-[8px] sm:text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-full">SHORT BY {(goodMin - currentVal).toFixed(2)}</span>}
                                {isWithinGood && <span className="text-[8px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">WITHIN RANGE</span>}
                                {isAboveGood && <span className="text-[8px] sm:text-[10px] font-bold text-sky-600 bg-sky-50 border border-sky-100 px-2 py-1 rounded-full">OVER BY {(currentVal - goodMax).toFixed(2)}</span>}
                              </div>
                              
                              <div className="flex-1 flex justify-between items-center bg-white p-2.5 rounded-2xl border border-stone-100 shadow-sm">
                                <span className="text-[10px] sm:text-xs text-stone-600 font-medium">Vs Crop Target:</span>
                                {isDeficit && <span className="text-[8px] sm:text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-100 px-2 py-1 rounded-full">NEEDS {(minVal - currentVal).toFixed(2)} MORE</span>}
                                {isOptimal && <span className="text-[8px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">OPTIMAL</span>}
                                {status === 'Surplus' && <span className="text-[8px] sm:text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-1 rounded-full">OVER BY {(currentVal - maxVal).toFixed(2)}</span>}
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fertilizer Impact Map Card Update */}
              <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-6">
                {evaluation.chemicalBreakdown && evaluation.chemicalBreakdown.length > 0 && (
                  <div className="rounded-3xl border border-stone-200 bg-white p-5 md:p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-5 border-b border-stone-100 pb-4">
                      <div>
                        <h3 className="text-base font-bold text-emerald-900 flex items-center gap-2">
                          Model Predicted Fertilizer Impact
                        </h3>
                        <p className="text-xs text-stone-500 mt-1">Estimated nutrient contributions per Sq.Ft from historical records.</p>
                      </div>
                    </div>
                    
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {evaluation.chemicalBreakdown.map((chem, idx) => (
                        <div key={idx} className="rounded-2xl border border-stone-200 bg-[linear-gradient(180deg,_#fafaf9,_#ffffff)] p-3 shadow-sm flex items-center gap-3">
                          <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-lg h-10 w-10 flex items-center justify-center rounded-xl shrink-0 shadow-inner">
                            🧪
                          </div>
                          <div className="flex-1 w-full min-w-0">
                            <div className="flex justify-between items-center mb-1.5">
                              <h4 className="text-xs font-bold text-stone-900 truncate pr-2" title={chem.name}>{chem.name}</h4>
                              <span className="bg-stone-200 text-stone-800 text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap shrink-0">{chem.amount_g}g</span>
                            </div>
                            <div className="flex gap-1.5 w-full">
                              <div className="bg-white border border-stone-100 rounded-lg px-2 py-1 flex-1 text-center shadow-sm flex items-center justify-center gap-1">
                                <span className="text-[8px] text-stone-500 font-bold uppercase tracking-wider shrink-0">N</span>
                                <span className="text-[10px] font-extrabold text-stone-900 truncate">+{chem.added.N.toFixed(2)}</span>
                              </div>
                              <div className="bg-white border border-stone-100 rounded-lg px-2 py-1 flex-1 text-center shadow-sm flex items-center justify-center gap-1">
                                <span className="text-[8px] text-stone-500 font-bold uppercase tracking-wider shrink-0">P</span>
                                <span className="text-[10px] font-extrabold text-stone-900 truncate">+{chem.added.P.toFixed(2)}</span>
                              </div>
                              <div className="bg-white border border-stone-100 rounded-lg px-2 py-1 flex-1 text-center shadow-sm flex items-center justify-center gap-1">
                                <span className="text-[8px] text-stone-500 font-bold uppercase tracking-wider shrink-0">K</span>
                                <span className="text-[10px] font-extrabold text-stone-900 truncate">+{chem.added.K.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {evaluation.calculatorDetails && evaluation.calculatorDetails.landCalculations && evaluation.calculatorDetails.landCalculations.length > 0 && (
                  <div className="rounded-3xl border border-stone-200 bg-white p-5 md:p-6 shadow-sm h-fit">
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-stone-900">Land Area Conversions</h3>
                      <p className="text-xs text-stone-500 mt-1">1 Acre = 43,560 Sq.Ft</p>
                    </div>
                    <div className="space-y-3">
                      {evaluation.calculatorDetails.landCalculations.map((lc, idx) => (
                        <div key={idx} className="rounded-2xl border border-stone-100 bg-stone-50 p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <span className="text-sm text-stone-700 font-medium">{lc.cropName} Field:</span>
                          <span className="text-xs sm:text-sm font-bold text-stone-900 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm self-start sm:self-auto">
                            {lc.acres} Ac = {lc.sqFt.toLocaleString()} Sq.Ft
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}