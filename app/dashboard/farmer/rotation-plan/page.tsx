'use client';

import { useState, useEffect } from 'react';
import FarmerSidebar from '@/app/navigation/farmer/page';

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
  { label: '150kg', value: 150000 }
];

const FERTILIZER_OPTIONS = [
  'Urea', 'TSP (Triple Super Phosphate)', 'MOP (Muriate of Potash)', 'NPK 15-15-15', 'Dolomite', 'Compost / Organic', 'Ammonium Sulfate (SOA)', 'Eppawala Rock Phosphate (ERP)', 'NPK 12-12-17'
];

const SQ_FT_PER_ACRE = 43560;

function formatAiRemedy(text: string): string[] {
  if (!text) return ['No specific recommendations.'];
  let cleaned = text.replace(/\*\*/g, '');
  let points = cleaned.split(/(?<=\.)\s+|\.\s+|\n+|(?:\d+\.\s*)|(?:\*\s*)|(?:\-\s*)/);
  points = points.map(p => p.trim()).filter(p => p.length > 0 && p !== '.');
  if (points.length === 0) points = [cleaned];
  return points.slice(0, 8); 
}

export default function RotationPlanPage() {
  const [currentDate, setCurrentDate] = useState('');
  const [targetCrop, setTargetCrop] = useState('');
  const [targetLandSize, setTargetLandSize] = useState<number>(1);

  const [language, setLanguage] = useState('English');
  const [pastCrops, setPastCrops] = useState<PastCropDetails[]>([
    { cropName: '', landSize: 1, startMonth: '', startYear: '', endMonth: '', endYear: '', fertilizers: [], pesticides: [] }
  ]);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [initialSoilData, setInitialSoilData] = useState<any>(null);
  
  const [showAIAssistance, setShowAIAssistance] = useState(false);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
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

  const addCropField = () => setPastCrops([...pastCrops, { cropName: '', landSize: 1, startMonth: '', startYear: '', endMonth: '', endYear: '', fertilizers: [], pesticides: [] }]);
  const removeCropField = (index: number) => setPastCrops(pastCrops.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCrop.trim()) return setError('Please specify the crop you wish to plant.');
    if (pastCrops.some(c => !c.cropName || !c.startMonth || !c.startYear || !c.endMonth || !c.endYear)) {
      return setError('Please complete all historical details.');
    }

    setLoading(true); setError(''); setEvaluation(null); 
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

  return (
    <div className="flex min-h-screen bg-stone-50" style={{ zoom: 1.1 }}>
      <FarmerSidebar user={user} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          <section className="rounded-3xl border border-stone-200 bg-[radial-gradient(circle_at_top_left,_#f7fee7,_#fafaf9_55%)] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Predict & Analyze</p>
            <h1 className="mt-2 text-3xl font-bold text-stone-900">Soil Evaluator & Crop Rotation</h1>
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
            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-stone-900">N-P-K levels in good soil (Limits per Sq.Ft / ppm)</h2>
                  <p className="text-xs text-stone-500 mt-1">pH: {initialSoilData.phMin} - {initialSoilData.phMax}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {initialSoilData.nutrients.map((nut: any, i: number) => (
                  <div key={i} className="rounded-2xl bg-stone-50 p-4 border border-stone-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-stone-700">{nut.symbol}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          nut.type === 'main' ? 'bg-emerald-100 text-emerald-700' :
                          nut.type === 'secondary' ? 'bg-sky-100 text-sky-700' :
                          'bg-stone-200 text-stone-700'
                        }`}>
                        {nut.type}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-stone-900 mt-2">{nut.min}-{nut.max} <span className="text-[10px] font-normal text-stone-500">{nut.unit}</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr,1.5fr]">
            
            {/* 1. Target Crop Section */}
            <div className="rounded-3xl border border-stone-200 bg-white p-5 md:p-6 shadow-sm h-fit">
              <h2 className="text-lg font-semibold text-stone-900 mb-5">1. Target Crop Validation</h2>
              <div className="flex flex-col gap-4">
                <div className="w-full">
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">Crop to plant:</label>
                  <input
                    type="text" required placeholder="e.g., Tomato, Carrot"
                    className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                    value={targetCrop} onChange={(e) => setTargetCrop(e.target.value)}
                  />
                </div>
                <div className="w-full">
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">Land Size:</label>
                  <div className="flex items-center gap-3">
                    <select
                      value={targetLandSize} onChange={(e) => setTargetLandSize(Number(e.target.value))}
                      className="flex-1 rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                    >
                      {LAND_SIZES.map(size => <option key={size.value} value={size.value}>{size.label}</option>)}
                    </select>
                    <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-3 py-1.5 rounded-full whitespace-nowrap">
                      ={(targetLandSize * SQ_FT_PER_ACRE).toLocaleString()} Sq.Ft
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Historical Crop Timeline */}
            <div className="rounded-3xl border border-stone-200 bg-white p-5 md:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-stone-900">2. Historical Crop Timeline</h2>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">{pastCrops.length} records</span>
              </div>
              
              <div className="space-y-4">
                {pastCrops.map((crop, index) => (
                  <div key={index} className="relative rounded-3xl border border-stone-200 bg-[linear-gradient(180deg,_#fafaf9,_#ffffff)] p-5 shadow-sm">
                    {pastCrops.length > 1 && (
                      <button type="button" onClick={() => removeCropField(index)}
                        className="absolute -top-3 -right-3 h-8 w-8 rounded-full border border-red-200 bg-white text-red-500 shadow-sm flex items-center justify-center transition hover:bg-red-50 hover:text-red-700"
                        title="Remove record"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    )}

                    <div className="grid gap-4 md:grid-cols-2 mb-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-stone-700">Crop Grown</label>
                        <input type="text" required placeholder="e.g., Cabbage"
                          className="w-full rounded-2xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                          value={crop.cropName} onChange={(e) => handleInputChange(index, 'cropName', e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-stone-700">Land Size</label>
                        <div className="flex items-center gap-2">
                          <select
                            className="flex-1 rounded-2xl border border-stone-300 px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                            value={crop.landSize} onChange={(e) => handleInputChange(index, 'landSize', Number(e.target.value))}
                          >
                            {LAND_SIZES.map(size => <option key={size.value} value={size.value}>{size.label}</option>)}
                          </select>
                          <span className="text-[10px] text-stone-500 font-semibold bg-stone-200 px-2 py-1 rounded-full whitespace-nowrap">
                            = {(crop.landSize * SQ_FT_PER_ACRE).toLocaleString()} Sq.Ft
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-5">
                      <label className="mb-1.5 block text-xs font-medium text-stone-700">Growing Period</label>
                      <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                        <select required className="flex-1 rounded-2xl border border-stone-300 px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                          value={crop.startMonth} onChange={(e) => handleInputChange(index, 'startMonth', e.target.value)}>
                          <option value="" disabled>Month</option>
                          {MONTHS.map(m => <option key={m} value={m}>{m.substring(0, 3)}</option>)}
                        </select>
                        <select required className="w-24 rounded-2xl border border-stone-300 px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                          value={crop.startYear} onChange={(e) => handleInputChange(index, 'startYear', e.target.value)}>
                          <option value="" disabled>Year</option>
                          {YEARS.map(y => <option key={y} value={y}>{y.substring(2)}</option>)}
                        </select>
                        <span className="text-stone-400 text-sm px-1 font-medium">to</span>
                        <select required className="flex-1 rounded-2xl border border-stone-300 px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                          value={crop.endMonth} onChange={(e) => handleInputChange(index, 'endMonth', e.target.value)}>
                          <option value="" disabled>Month</option>
                          {MONTHS.map(m => <option key={m} value={m}>{m.substring(0, 3)}</option>)}
                        </select>
                        <select required className="w-24 rounded-2xl border border-stone-300 px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                          value={crop.endYear} onChange={(e) => handleInputChange(index, 'endYear', e.target.value)}>
                          <option value="" disabled>Year</option>
                          {YEARS.map(y => <option key={y} value={y}>{y.substring(2)}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="border-t border-stone-200 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">Fertilizers Applied</label>
                        <button type="button" onClick={() => handleAddFertilizer(index)} className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition">
                          + Add
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {crop.fertilizers.map((fert, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-2">
                            <select
                              className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                              value={fert.name}
                              onChange={(e) => handleFertilizerChange(index, fIdx, 'name', e.target.value)}
                            >
                              {FERTILIZER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <select className="w-28 rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                              value={fert.amount_g} onChange={(e) => handleFertilizerChange(index, fIdx, 'amount_g', Number(e.target.value))}>
                              {AMOUNTS.map(amt => <option key={amt.value} value={amt.value}>{amt.label}</option>)}
                            </select>
                            <button type="button" onClick={() => handleRemoveFertilizer(index, fIdx)} className="h-9 w-9 rounded-full border border-red-200 bg-red-50 text-red-500 flex items-center justify-center transition hover:bg-red-100 shrink-0">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                          </div>
                        ))}
                        {crop.fertilizers.length === 0 && (
                          <p className="text-xs text-stone-400 italic">No fertilizers added for this crop period.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 border-t border-stone-100 pt-5">
                <button type="button" onClick={addCropField} className="w-full sm:w-auto rounded-2xl border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50">
                  + Add Another Crop Period
                </button>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded-2xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-emerald-500">
                    <option value="English">English</option>
                    <option value="Sinhala">සිංහල</option>
                  </select>
                  <button type="submit" disabled={loading} className="w-full sm:w-auto rounded-2xl px-6 py-2.5 text-sm font-semibold text-white transition bg-emerald-600 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
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

          {evaluation && (
            <div className="space-y-6">
              
              {/* Suitability Banner */}
              <div className={`p-6 rounded-3xl border shadow-sm ${evaluation.targetEvaluation.isSuitable ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">Target Crop Suitability</h3>
                    <p className="text-sm mt-1 font-medium text-stone-600 flex items-center gap-2">
                      Overall Soil Fertility Level: 
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${evaluation.targetEvaluation.isFertile ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {evaluation.targetEvaluation.isFertile ? 'FERTILE' : 'NEEDS IMPROVEMENT'}
                      </span>
                    </p>
                  </div>
                  <span className={`text-sm px-4 py-2 rounded-2xl font-bold uppercase tracking-wider ${evaluation.targetEvaluation.isSuitable ? 'bg-emerald-600 text-white shadow-sm' : 'bg-red-600 text-white shadow-sm'}`}>
                    {evaluation.targetEvaluation.isSuitable ? 'SUITABLE' : 'NOT RECOMMENDED'}
                  </span>
                </div>

                {!showAIAssistance ? (
                  <div className="mt-5 pt-4 border-t border-stone-200/50 flex justify-center">
                    <button
                      type="button"
                      onClick={handleGetAlternatives}
                      disabled={loadingAlternatives}
                      className="rounded-2xl border border-emerald-300 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 shadow-sm disabled:opacity-60 flex items-center gap-2"
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
                      <button onClick={() => setShowAIAssistance(false)} className="text-xs font-semibold text-stone-500 hover:text-stone-800 bg-stone-100 px-3 py-1.5 rounded-full transition">
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

                    {!evaluation.targetEvaluation.isSuitable && evaluation.alternativeSuggestions && evaluation.alternativeSuggestions.length > 0 && (
                      <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
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
                )}
              </div>

              {/* Main Visual Indicator: Current Soil vs Target Requirements */}
              <div className="rounded-3xl border border-stone-200 bg-white p-5 md:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 border-b border-stone-100 pb-4">
                  <h3 className="text-base font-bold text-stone-900">Current Soil Level vs Target Requirements</h3>
                  <span className="text-xs text-stone-600 bg-stone-100 px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5">
                    💡 <span><strong className="text-stone-900">Current</strong> = Predicted by Timeline</span>
                  </span>
                </div>
                
                <div className="grid gap-5 xl:grid-cols-3">
                  {evaluation.soilNutrientLevels.map((item, idx) => {
                    const currentVal = parseFloat(item.level) || 0;
                    const minVal = item.targetMin || 0;
                    const maxVal = item.targetMax === 999999 ? minVal * 1.5 : (item.targetMax || minVal * 1.5);
                    const displayMax = item.targetMax === 999999 ? 'No Limit' : item.targetMax;
                    
                    const status = item.depletionPrediction; 
                    const isDeficit = status === 'Deficit';
                    const isOptimal = status === 'Optimal';
                    
                    const symbol = item.nutrient.includes('Nitrogen') ? 'N' : item.nutrient.includes('Phosphorus') ? 'P' : 'K';
                    const goodSoilNutrient = initialSoilData?.nutrients?.find((n: any) => n.symbol === symbol);
                    const goodMin = goodSoilNutrient?.min || 0;
                    const goodMax = goodSoilNutrient?.max || 100;

                    const maxGraph = Math.max(currentVal, maxVal, goodMax) * 1.1; 
                    const currentPct = (currentVal / maxGraph) * 100;
                    const minPct = (minVal / maxGraph) * 100;
                    const maxPct = (maxVal / maxGraph) * 100;
                    
                    const isBelowGood = currentVal < goodMin;
                    const isAboveGood = currentVal > goodMax;
                    const isWithinGood = currentVal >= goodMin && currentVal <= goodMax;

                    return (
                      <div key={idx} className={`rounded-3xl border p-5 shadow-sm transition ${
                        isOptimal ? 'bg-[linear-gradient(180deg,_#ffffff,_#f0fdf4)] border-emerald-200' : 
                        isDeficit ? 'bg-[linear-gradient(180deg,_#ffffff,_#fef2f2)] border-red-200' : 
                        'bg-[linear-gradient(180deg,_#ffffff,_#fffbeb)] border-amber-200'
                      }`}>
                        
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-sm font-bold text-stone-900 uppercase flex items-center gap-2 tracking-wide">
                            {item.nutrient.split(' ')[0]}
                          </h4>
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                            isOptimal ? 'bg-emerald-100 text-emerald-800' :
                            isDeficit ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {isOptimal ? '✅ Target Optimal' : isDeficit ? `⚠️ Target Deficit` : `⚠️ Target Surplus`}
                          </span>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs w-20 text-stone-700 font-bold uppercase tracking-wider">Current</span>
                            <div className="flex-1 bg-stone-100 rounded-full h-3 overflow-hidden shadow-inner">
                              <div className={`h-full rounded-full transition-all duration-1000 ${
                                isOptimal ? 'bg-emerald-500' : isDeficit ? 'bg-red-500' : 'bg-amber-500'
                              }`} style={{ width: `${currentPct}%` }}></div>
                            </div>
                            <span className="text-sm font-extrabold text-stone-900 w-12 text-right">{currentVal.toFixed(1)}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[10px] w-20 text-stone-500 font-semibold uppercase">Target Min</span>
                            <div className="flex-1 bg-stone-100 rounded-full h-1.5 overflow-hidden">
                              <div className="h-full rounded-full bg-stone-400 transition-all duration-1000" style={{ width: `${minPct}%` }}></div>
                            </div>
                            <span className="text-xs font-bold text-stone-600 w-12 text-right">{minVal.toFixed(1)}</span>
                          </div>
                          
                          {item.targetMax !== 999999 && (
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] w-20 text-stone-500 font-semibold uppercase">Target Max</span>
                              <div className="flex-1 bg-stone-100 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full rounded-full bg-stone-600 transition-all duration-1000" style={{ width: `${maxPct}%` }}></div>
                              </div>
                              <span className="text-xs font-bold text-stone-600 w-12 text-right">{displayMax}</span>
                            </div>
                          )}

                          {/* Good Soil (Fertile) Indicator & Detailed Status Box */}
                          {goodSoilNutrient && (
                            <div className="mt-4 pt-4 border-t border-stone-200/60">
                              <h5 className="text-[10px] font-bold text-stone-500 mb-2.5 uppercase tracking-widest">Good Soil Baseline:</h5>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 relative h-4 bg-stone-100 rounded-full overflow-hidden flex items-center shadow-inner">
                                  <div 
                                    className="absolute h-full bg-emerald-200/50" 
                                    style={{ 
                                      left: `${(goodMin / maxGraph) * 100}%`, 
                                      width: `${((goodMax - goodMin) / maxGraph) * 100}%` 
                                    }}
                                  ></div>
                                  <div 
                                    className="absolute h-full w-2.5 bg-stone-800 rounded shadow-md z-10 border border-white" 
                                    style={{ left: `calc(${(currentVal / maxGraph) * 100}% - 5px)` }}
                                  ></div>
                                </div>
                                <div className="w-16 text-right">
                                  <span className="text-xs font-bold text-emerald-800">{goodMin}-{goodMax}</span>
                                </div>
                              </div>
                              
                              <div className="mt-4 space-y-2">
                                <div className="flex justify-between items-center bg-white p-2.5 rounded-2xl border border-stone-100 shadow-sm">
                                  <span className="text-xs text-stone-600 font-medium">Vs Fertile Limit:</span>
                                  {isBelowGood && <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">SHORT BY {(goodMin - currentVal).toFixed(1)}</span>}
                                  {isWithinGood && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">WITHIN RANGE</span>}
                                  {isAboveGood && <span className="text-[10px] font-bold text-sky-600 bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-full">OVER BY {(currentVal - goodMax).toFixed(1)}</span>}
                                </div>
                                
                                <div className="flex justify-between items-center bg-white p-2.5 rounded-2xl border border-stone-100 shadow-sm">
                                  <span className="text-xs text-stone-600 font-medium">Vs Crop Target:</span>
                                  {isDeficit && <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full">NEEDS {(minVal - currentVal).toFixed(1)} MORE</span>}
                                  {isOptimal && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">OPTIMAL</span>}
                                  {status === 'Surplus' && <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full">OVER BY {(currentVal - maxVal).toFixed(1)}</span>}
                                </div>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-6">
                {/* Fertilizer Impact Map - Now wider */}
                {evaluation.chemicalBreakdown && evaluation.chemicalBreakdown.length > 0 && (
                  <div className="rounded-3xl border border-stone-200 bg-white p-5 md:p-6 shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-stone-900">Fertilizer Impact Map</h3>
                      <p className="text-xs text-stone-500 mt-1">Nutrients added per Sq.Ft from historical records</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {evaluation.chemicalBreakdown.map((chem, idx) => (
                        <div key={idx} className="rounded-3xl border border-stone-200 bg-[linear-gradient(180deg,_#fafaf9,_#ffffff)] p-4 shadow-sm flex items-center gap-4">
                          <div className="bg-emerald-100 text-emerald-700 text-xl h-12 w-12 flex items-center justify-center rounded-2xl shrink-0 shadow-inner">
                            🧪
                          </div>
                          <div className="flex-1 w-full min-w-0">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-bold text-stone-900 truncate pr-2" title={chem.name}>{chem.name}</h4>
                              <span className="bg-stone-200 text-stone-800 text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap">{chem.amount_g}g</span>
                            </div>
                            <div className="flex gap-2 w-full">
                              <div className="bg-white border border-stone-200 rounded-xl px-2 py-1.5 flex-1 text-center shadow-sm">
                                <span className="block text-[9px] text-stone-500 font-bold uppercase tracking-wider mb-0.5">N</span>
                                <span className="text-xs font-extrabold text-stone-900">+{chem.added.N.toFixed(2)}</span>
                              </div>
                              <div className="bg-white border border-stone-200 rounded-xl px-2 py-1.5 flex-1 text-center shadow-sm">
                                <span className="block text-[9px] text-stone-500 font-bold uppercase tracking-wider mb-0.5">P</span>
                                <span className="text-xs font-extrabold text-stone-900">+{chem.added.P.toFixed(2)}</span>
                              </div>
                              <div className="bg-white border border-stone-200 rounded-xl px-2 py-1.5 flex-1 text-center shadow-sm">
                                <span className="block text-[9px] text-stone-500 font-bold uppercase tracking-wider mb-0.5">K</span>
                                <span className="text-xs font-extrabold text-stone-900">+{chem.added.K.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Land Area Conversions */}
                {evaluation.calculatorDetails && evaluation.calculatorDetails.landCalculations && evaluation.calculatorDetails.landCalculations.length > 0 && (
                  <div className="rounded-3xl border border-stone-200 bg-white p-5 md:p-6 shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-stone-900">Land Area Conversions</h3>
                      <p className="text-xs text-stone-500 mt-1">1 Acre = 43,560 Sq.Ft</p>
                    </div>
                    <div className="space-y-3">
                      {evaluation.calculatorDetails.landCalculations.map((lc, idx) => (
                        <div key={idx} className="rounded-2xl border border-stone-100 bg-stone-50 p-4 flex justify-between items-center">
                          <span className="text-sm text-stone-700 font-medium">{lc.cropName} Field:</span>
                          <span className="text-sm font-bold text-stone-900 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm">
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