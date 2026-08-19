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
      // Payload prepared with past crops matching backend expectation
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
    <div className="flex min-h-screen bg-gray-50">
      <FarmerSidebar user={user} />
      <main className="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-4">

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h1 className="text-xl font-semibold text-green-800">Crop Rotation & Soil Evaluator</h1>
            <p className="text-xs text-gray-500 mt-1">Analyze historical crop data for nutrient predictions and suitability</p>
          </div>

          {infoMessage && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded">
              <p className="text-xs text-amber-800">{infoMessage}</p>
            </div>
          )}

          {initialSoilData && (
            <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xs font-semibold text-blue-900">N-P-K levels in good soil (Limits per Sq.Ft / ppm)</h2>
                  <p className="text-[10px] text-blue-700">pH: {initialSoilData.phMin} - {initialSoilData.phMax}</p>
                </div>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {initialSoilData.nutrients.map((nut: any, i: number) => (
                    <div key={i} className="p-2 bg-gray-50 rounded border border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-gray-600">{nut.symbol}</span>
                        <span className={`text-[8px] px-1 py-0.5 rounded ${nut.type === 'main' ? 'bg-green-100 text-green-700' :
                            nut.type === 'secondary' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'
                          }`}>
                          {nut.type}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-gray-800 mt-1">{nut.min}-{nut.max} {nut.unit}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-2 bg-green-600">
                <h2 className="text-xs font-semibold text-white">1. Target Crop</h2>
              </div>
              <div className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <label className="text-xs font-medium text-black w-24">Crop to plant:</label>
                  <input
                    type="text" required placeholder="e.g., Tomato, Carrot"
                    className="text-black flex-1 text-sm px-3 py-2 border border-gray-200 rounded bg-gray-50 focus:ring-1 focus:ring-green-400 outline-none"
                    value={targetCrop} onChange={(e) => setTargetCrop(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-black">Land Size:</label>
                    <select
                      value={targetLandSize} onChange={(e) => setTargetLandSize(Number(e.target.value))}
                      className="text-black text-sm px-3 py-2 border border-gray-200 rounded bg-gray-50 focus:ring-1 focus:ring-green-400 outline-none"
                    >
                      {LAND_SIZES.map(size => <option key={size.value} value={size.value}>{size.label}</option>)}
                    </select>
                    <span className="text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded">
                      ={(targetLandSize * SQ_FT_PER_ACRE).toLocaleString()} Sq.Ft
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-2 bg-green-50 border-b border-gray-200">
                <h2 className="text-xs font-semibold text-green-800">2. Historical Crop Timeline</h2>
              </div>
              <div className="p-4 space-y-3">
                {pastCrops.map((crop, index) => (
                  <div key={index} className="relative p-3 border border-gray-100 rounded bg-gray-50">
                    {pastCrops.length > 1 && (
                      <button type="button" onClick={() => removeCropField(index)}
                        className="absolute -top-2 -right-2 text-red-500 hover:text-white hover:bg-red-500 text-xs bg-white border border-red-200 w-5 h-5 rounded-full flex items-center justify-center"
                      >×</button>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 mb-3">
                      <div className="flex-1">
                        <label className="block text-[10px] font-medium text-black mb-1">Crop Grown</label>
                        <input type="text" required placeholder="e.g., Cabbage"
                          className="text-black w-full text-sm px-3 py-1.5 border border-gray-200 rounded bg-white"
                          value={crop.cropName} onChange={(e) => handleInputChange(index, 'cropName', e.target.value)} />
                      </div>
                      <div className="w-full sm:w-40">
                        <label className="block text-[10px] font-medium text-black mb-1">Land Size</label>
                        <select
                          className="text-black w-full text-sm px-2 py-1.5 border border-gray-200 rounded bg-white"
                          value={crop.landSize} onChange={(e) => handleInputChange(index, 'landSize', Number(e.target.value))}
                        >
                          {LAND_SIZES.map(size => <option key={size.value} value={size.value}>{size.label}</option>)}
                        </select>
                        <span className="block text-[9px] text-gray-500 mt-1 font-bold">
                          = {(crop.landSize * SQ_FT_PER_ACRE).toLocaleString()} Sq.Ft
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-[10px] font-medium text-black mb-1">Growing Period</label>
                      <div className="flex items-center gap-1">
                        <select required className="text-black flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded bg-white"
                          value={crop.startMonth} onChange={(e) => handleInputChange(index, 'startMonth', e.target.value)}>
                          <option value="" disabled>Month</option>
                          {MONTHS.map(m => <option key={m} value={m}>{m.substring(0, 3)}</option>)}
                        </select>
                        <select required className="text-black w-16 text-xs px-2 py-1.5 border border-gray-200 rounded bg-white"
                          value={crop.startYear} onChange={(e) => handleInputChange(index, 'startYear', e.target.value)}>
                          <option value="" disabled>Year</option>
                          {YEARS.map(y => <option key={y} value={y}>{y.substring(2)}</option>)}
                        </select>
                        <span className="text-gray-400 text-xs">to</span>
                        <select required className="text-black flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded bg-white"
                          value={crop.endMonth} onChange={(e) => handleInputChange(index, 'endMonth', e.target.value)}>
                          <option value="" disabled>Month</option>
                          {MONTHS.map(m => <option key={m} value={m}>{m.substring(0, 3)}</option>)}
                        </select>
                        <select required className="text-black w-16 text-xs px-2 py-1.5 border border-gray-200 rounded bg-white"
                          value={crop.endYear} onChange={(e) => handleInputChange(index, 'endYear', e.target.value)}>
                          <option value="" disabled>Year</option>
                          {YEARS.map(y => <option key={y} value={y}>{y.substring(2)}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <label className="block text-[10px] font-medium text-black mb-2">Fertilizers Applied (Total Amount)</label>
                      {crop.fertilizers.map((fert, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 mb-2 md:w-1/2">
                          <select
                            className="text-black text-xs px-2 py-1 border rounded w-1/2"
                            value={fert.name}
                            onChange={(e) => handleFertilizerChange(index, fIdx, 'name', e.target.value)}
                          >
                            {FERTILIZER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          <select className="text-black text-xs px-2 py-1 border rounded w-1/3"
                            value={fert.amount_g} onChange={(e) => handleFertilizerChange(index, fIdx, 'amount_g', Number(e.target.value))}>
                            {AMOUNTS.map(amt => <option key={amt.value} value={amt.value}>{amt.label}</option>)}
                          </select>
                          <button type="button" onClick={() => handleRemoveFertilizer(index, fIdx)} className="text-red-500 text-xs hover:bg-red-50 p-1 rounded">×</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => handleAddFertilizer(index)} className="text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">+ Add Fertilizer</button>
                    </div>
                  </div>
                ))}

                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                  <button type="button" onClick={addCropField} className="text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-4 py-2 rounded border border-green-200">
                    + Add Past Crop
                  </button>
                  <div className="flex items-center gap-2">
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="text-xs px-3 py-2 border border-gray-300 rounded bg-white text-black">
                      <option value="English">English</option>
                      <option value="Sinhala">සිංහල</option>
                    </select>
                    <button type="submit" disabled={loading} className="px-5 py-2 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300">
                      {loading ? 'Analyzing...' : 'Run Analysis'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {evaluation && (
            <div className="space-y-4">
              
              <div className={`p-4 rounded-lg border ${evaluation.targetEvaluation.isSuitable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-medium text-gray-800">Target Crop Suitability (Per Sq.Ft Evaluation)</h3>
                    <p className="text-[10px] mt-1 font-medium text-gray-600">
                      Overall Soil Fertility Level: 
                      <span className={`ml-1 px-2 py-0.5 rounded text-[10px] ${evaluation.targetEvaluation.isFertile ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {evaluation.targetEvaluation.isFertile ? 'FERTILE' : 'NEEDS IMPROVEMENT'}
                      </span>
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-bold ${evaluation.targetEvaluation.isSuitable ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {evaluation.targetEvaluation.isSuitable ? 'SUITABLE' : 'NOT RECOMMENDED'}
                  </span>
                </div>

                {!showAIAssistance ? (
                  <div className="mt-4 pt-3 border-t border-gray-200/60 flex justify-center">
                    <button
                      type="button"
                      onClick={handleGetAlternatives}
                      disabled={loadingAlternatives}
                      className="text-xs font-medium px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded shadow-sm hover:bg-blue-100 flex items-center gap-2 disabled:opacity-50"
                    >
                      {loadingAlternatives ? (
                        <>
                          <span className="animate-spin text-lg">⏳</span> Getting Suitable Crops...
                        </>
                      ) : (
                        "Ask AI for Suitable Alternative Crops"
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 bg-white p-4 rounded border border-gray-200 shadow-sm transition-all">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-semibold flex items-center gap-1 text-blue-700">
                        AI Soil Preparation Guide
                      </h4>
                      <button onClick={() => setShowAIAssistance(false)} className="text-[10px] text-gray-500 hover:text-gray-800 font-medium bg-gray-100 px-2 py-1 rounded">
                        Close AI Data
                      </button>
                    </div>
                    
                    <ul className="space-y-2 text-sm text-gray-700">
                      {formatAiRemedy(evaluation.targetEvaluation.aiSoilRemedy).map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-600 text-base leading-tight">•</span>
                          <span className="leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>

                    {!evaluation.targetEvaluation.isSuitable && evaluation.alternativeSuggestions && evaluation.alternativeSuggestions.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg shadow-sm mt-4">
                        <h3 className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
                          Recommended Alternatives for Current Soil
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {evaluation.alternativeSuggestions.map((alt, idx) => (
                            <div key={idx} className="bg-white p-3 rounded border border-orange-100 shadow-sm">
                              <h4 className="text-xs font-bold text-gray-800 mb-2 bg-orange-100 inline-block px-2 py-1 rounded">
                                {alt.cropName}
                              </h4>
                              <ul className="space-y-1">
                                {alt.reasons.map((reason, rIdx) => (
                                  <li key={rIdx} className="text-[11px] text-gray-700 flex items-start gap-1.5">
                                    <span className="text-green-500 mt-0.5">-</span>
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
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Current Soil Level vs Target Requirements</h3>
                  <span className="text-[9px] text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-200 font-medium">
                    💡 <span className="font-bold">Current</span> = Predicted by Crop Timeline
                  </span>
                </div>
                
                <div className="flex flex-col gap-3">
                  {evaluation.soilNutrientLevels.map((item, idx) => {
                    const currentVal = parseFloat(item.level) || 0;
                    const minVal = item.targetMin || 0;
                    const maxVal = item.targetMax === 999999 ? minVal * 1.5 : (item.targetMax || minVal * 1.5);
                    const displayMax = item.targetMax === 999999 ? 'No Limit' : item.targetMax;
                    
                    const status = item.depletionPrediction; 
                    const isDeficit = status === 'Deficit';
                    const isOptimal = status === 'Optimal';
                    
                    const icon = item.nutrient.includes('Nitrogen') ? '☁️' : item.nutrient.includes('Phosphorus') ? '🪨' : '🍌';

                    // Good Soil Limits Fetching
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
                      <div key={idx} className={`border p-3 rounded-lg flex flex-col gap-2 shadow-sm ${
                        isOptimal ? 'bg-green-50 border-green-200' : 
                        isDeficit ? 'bg-red-50 border-red-200' : 
                        'bg-yellow-50 border-yellow-200'
                      }`}>
                        
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="text-[11px] font-bold text-gray-800 uppercase flex items-center gap-1.5">
                            <span className="text-sm">{icon}</span> {item.nutrient}
                          </h4>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold border ${
                            isOptimal ? 'bg-green-200 text-green-800 border-green-300' :
                            isDeficit ? 'bg-red-200 text-red-800 border-red-300' :
                            'bg-yellow-200 text-yellow-800 border-yellow-300'
                          }`}>
                            {isOptimal ? '✅ TARGET OPTIMAL' : isDeficit ? `⚠️ TARGET DEFICIT` : `⚠️ TARGET SURPLUS`}
                          </span>
                        </div>
                        
                        <div className="flex flex-col gap-1.5 mt-2">
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] w-24 text-gray-700 font-bold uppercase tracking-wider">Current</span>
                            <div className="flex-1 bg-white border border-gray-300 rounded-full h-2.5 overflow-hidden shadow-inner">
                              <div className={`h-full rounded-full transition-all duration-1000 ${
                                isOptimal ? 'bg-green-500' : isDeficit ? 'bg-red-500' : 'bg-yellow-500'
                              }`} style={{ width: `${currentPct}%` }}></div>
                            </div>
                            <span className="text-[10px] font-extrabold text-gray-900 w-12 text-right">{currentVal.toFixed(1)}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[9px] w-24 text-gray-500 font-bold uppercase tracking-wider">{targetCrop} Target Min</span>
                            <div className="flex-1 bg-white border border-gray-200 rounded-full h-1.5 overflow-hidden opacity-70">
                              <div className="h-full rounded-full bg-blue-400 transition-all duration-1000" style={{ width: `${minPct}%` }}></div>
                            </div>
                            <span className="text-[9px] font-bold text-gray-600 w-12 text-right">{minVal.toFixed(1)}</span>
                          </div>
                          
                          {item.targetMax !== 999999 && (
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] w-24 text-gray-500 font-bold uppercase tracking-wider">{targetCrop} Target Max</span>
                              <div className="flex-1 bg-white border border-gray-200 rounded-full h-1.5 overflow-hidden opacity-70">
                                <div className="h-full rounded-full bg-blue-600 transition-all duration-1000" style={{ width: `${maxPct}%` }}></div>
                              </div>
                              <span className="text-[9px] font-bold text-gray-600 w-12 text-right">{displayMax}</span>
                            </div>
                          )}

                          {/* Good Soil (Fertile) Indicator & Detailed Status Box */}
                          {goodSoilNutrient && (
                            <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                              <h5 className="text-[10px] font-bold text-gray-700 mb-1.5 uppercase">Good Soil (Fertile) Analysis:</h5>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 relative h-4 bg-gray-100 rounded-full border border-gray-200 overflow-hidden flex items-center">
                                  <div 
                                    className="absolute h-full bg-teal-200 border-x border-teal-500 opacity-60" 
                                    style={{ 
                                      left: `${(goodMin / maxGraph) * 100}%`, 
                                      width: `${((goodMax - goodMin) / maxGraph) * 100}%` 
                                    }}
                                  ></div>
                                  <div 
                                    className="absolute h-full w-2 bg-gray-800 rounded shadow-md z-10" 
                                    style={{ left: `calc(${(currentVal / maxGraph) * 100}% - 4px)` }}
                                  ></div>
                                </div>
                                <div className="w-16 text-right">
                                  <span className="text-[10px] font-bold text-teal-800">{goodMin}-{goodMax}</span>
                                </div>
                              </div>
                              
                              <div className="mt-2 space-y-1">
                                <div className="flex justify-between items-center bg-white p-1.5 rounded border border-gray-100">
                                  <span className="text-[10px] text-gray-600 font-medium">Status vs Fertile Limits:</span>
                                  {isBelowGood && <span className="text-[9px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">BELOW MINIMUM (Short by {(goodMin - currentVal).toFixed(1)})</span>}
                                  {isWithinGood && <span className="text-[9px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">WITHIN FERTILE RANGE</span>}
                                  {isAboveGood && <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">EXCEEDS MAXIMUM (Over by {(currentVal - goodMax).toFixed(1)})</span>}
                                </div>
                                
                                <div className="flex justify-between items-center bg-white p-1.5 rounded border border-gray-100">
                                  <span className="text-[10px] text-gray-600 font-medium">Status vs Target Crop ({targetCrop}):</span>
                                  {isDeficit && <span className="text-[9px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">CROP DEFICIT (Needs {(minVal - currentVal).toFixed(1)} more)</span>}
                                  {isOptimal && <span className="text-[9px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">OPTIMAL FOR CROP</span>}
                                  {status === 'Surplus' && <span className="text-[9px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">CROP SURPLUS (Over by {(currentVal - maxVal).toFixed(1)})</span>}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {evaluation.chemicalBreakdown && evaluation.chemicalBreakdown.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-3 bg-green-50 border-b border-green-100 flex justify-between items-center">
                      <div>
                        <h3 className="text-xs font-medium text-green-800">Fertilizer Distribution Calculation</h3>
                        <p className="text-[9px] text-green-700 mt-0.5">Visual representation of nutrients added per Sq.Ft</p>
                      </div>
                    </div>
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50/50">
                      {evaluation.chemicalBreakdown.map((chem, idx) => (
                        <div key={idx} className="bg-white border border-green-100 rounded-lg p-3 shadow-sm flex items-center gap-3">
                          <div className="bg-green-100 text-xl h-10 w-10 flex items-center justify-center rounded-full shrink-0">
                            🧪
                          </div>
                          <div className="flex-1 w-full">
                            <div className="flex justify-between items-start mb-1.5">
                              <h4 className="text-[11px] font-bold text-gray-800">{chem.name}</h4>
                              <span className="bg-gray-100 text-gray-600 text-[9px] px-1.5 py-0.5 rounded font-bold border border-gray-200">{chem.amount_g}g</span>
                            </div>
                            <div className="flex gap-1.5 w-full">
                              <div className="bg-blue-50 border border-blue-100 rounded px-1 flex-1 text-center py-1">
                                <span className="block text-[8px] text-blue-500 font-semibold mb-0.5">N Added</span>
                                <span className="text-[9px] font-bold text-blue-700">+{chem.added.N.toFixed(4)}</span>
                              </div>
                              <div className="bg-purple-50 border border-purple-100 rounded px-1 flex-1 text-center py-1">
                                <span className="block text-[8px] text-purple-500 font-semibold mb-0.5">P Added</span>
                                <span className="text-[9px] font-bold text-purple-700">+{chem.added.P.toFixed(4)}</span>
                              </div>
                              <div className="bg-orange-50 border border-orange-100 rounded px-1 flex-1 text-center py-1">
                                <span className="block text-[8px] text-orange-500 font-semibold mb-0.5">K Added</span>
                                <span className="text-[9px] font-bold text-orange-700">+{chem.added.K.toFixed(4)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {evaluation.calculatorDetails && evaluation.calculatorDetails.landCalculations && evaluation.calculatorDetails.landCalculations.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-3 bg-blue-50 border-b border-blue-100">
                      <h3 className="text-xs font-medium text-blue-800">Land Area Conversion Viewer</h3>
                    </div>
                    <div className="p-3 space-y-3">
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-700 mb-2">Acre to Square Feet (1 Acre = 43,560 Sq.Ft)</h4>
                        {evaluation.calculatorDetails.landCalculations.map((lc, idx) => (
                          <div key={idx} className="text-[11px] text-gray-600 flex justify-between border-b border-dashed border-gray-200 pb-1 mb-1 last:border-0">
                            <span>{lc.cropName} Field Area:</span>
                            <span className="font-bold text-gray-800">{lc.acres} Acres = {lc.sqFt.toLocaleString()} Sq.Ft</span>
                          </div>
                        ))}
                      </div>
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