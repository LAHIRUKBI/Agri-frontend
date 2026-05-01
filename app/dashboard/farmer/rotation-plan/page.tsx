'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FarmerSidebar from '@/app/navigation/farmer/page';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// අඩුවී තිබූ ChemicalItem Interface එක මෙතැනට එක් කර ඇත
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

interface CalculatorDetails {
  requirements: {
    N: { min: number; max: number; mid: number };
    P: { min: number; max: number; mid: number };
    K: { min: number; max: number; mid: number };
  };
  differences: { diffN: number; diffP: number; diffK: number };
  statuses: { N: string; P: string; K: string };
}

interface PastCropDetails {
  cropName: string;
  landSize: number;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  fertilizers: ChemicalItem[];
  pesticides: ChemicalItem[];
}

interface EvaluationResult {
  targetEvaluation: {
    isSuitable: boolean;
    feedback: string[];
    aiSoilRemedy: string;
  };
  soilNutrientLevels: {
    nutrient: string;
    level: string;
    depletionPrediction: string;
    difference: number;
  }[];
  alternativeSuggestions?: {
    cropName: string;
    reasons: string[];
  }[];
  // අලුත් Fields
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
  { label: '100g', value: 100 }, { label: '200g', value: 200 },
  { label: '500g', value: 500 }, { label: '1kg', value: 1000 },
  { label: '2kg', value: 2000 }, { label: '5kg', value: 5000 },
  { label: '10kg', value: 10000 }
];

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

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));

    const fetchSoilData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/nutrients');
        if (!res.ok) {
          throw new Error('Could not load nutrient reference data.');
        }
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

  const handleAddChemical = (cropIndex: number, type: 'fertilizers' | 'pesticides') => {
    const updatedCrops = [...pastCrops];
    updatedCrops[cropIndex][type].push({ name: '', amount_g: 100 });
    setPastCrops(updatedCrops);
  };

  const handleRemoveChemical = (cropIndex: number, type: 'fertilizers' | 'pesticides', chemIndex: number) => {
    const updatedCrops = [...pastCrops];
    updatedCrops[cropIndex][type] = updatedCrops[cropIndex][type].filter((_, i) => i !== chemIndex);
    setPastCrops(updatedCrops);
  };

  const handleChemicalChange = (cropIndex: number, type: 'fertilizers' | 'pesticides', chemIndex: number, field: string, value: any) => {
    const updatedCrops = [...pastCrops];
    updatedCrops[cropIndex][type][chemIndex] = { ...updatedCrops[cropIndex][type][chemIndex], [field]: value };
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

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/rotation/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetCrop, targetLandSize, currentMonth: currentDate, previousCrops: pastCrops, language }),
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

  const chartData = evaluation?.soilNutrientLevels.map(item => {
    const currentVal = parseFloat(item.level);
    const requiredVal = Number((currentVal - item.difference).toFixed(2));
    return {
      name: item.nutrient.split(' ')[0],
      Current: currentVal,
      Required: requiredVal > 0 ? requiredVal : 0
    };
  }) || [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <FarmerSidebar user={user} />
      <main className="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-4">

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h1 className="text-xl font-semibold text-green-800">Crop Rotation & Soil Evaluator</h1>
            <p className="text-xs text-gray-500 mt-1">Analyze historical data for nutrient predictions and planting suggestions</p>
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
                  <h2 className="text-xs font-semibold text-blue-900">N-P-K levels in good soil</h2>
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
                  <label className="text-xs font-medium text-black">Land Size:</label>
                  <select
                    value={targetLandSize} onChange={(e) => setTargetLandSize(Number(e.target.value))}
                    className="text-black text-sm px-3 py-2 border border-gray-200 rounded bg-gray-50 focus:ring-1 focus:ring-green-400 outline-none"
                  >
                    {LAND_SIZES.map(size => <option key={size.value} value={size.value}>{size.label}</option>)}
                  </select>
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
                      <div className="w-full sm:w-32">
                        <label className="block text-[10px] font-medium text-black mb-1">Land Size</label>
                        <select
                          className="text-black w-full text-sm px-2 py-1.5 border border-gray-200 rounded bg-white"
                          value={crop.landSize} onChange={(e) => handleInputChange(index, 'landSize', Number(e.target.value))}
                        >
                          {LAND_SIZES.map(size => <option key={size.value} value={size.value}>{size.label}</option>)}
                        </select>
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
                        <span className="text-gray-400 text-xs">→</span>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-200 pt-3 mt-3">
                      {/* Fertilizers */}
                      <div>
                        <label className="block text-[10px] font-medium text-black mb-2">Fertilizers Applied</label>
                        {crop.fertilizers.map((fert, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-2 mb-2">
                            <input type="text" placeholder="Name (e.g., Urea)" className="text-black text-xs px-2 py-1 border rounded w-1/2"
                              value={fert.name} onChange={(e) => handleChemicalChange(index, 'fertilizers', fIdx, 'name', e.target.value)} />
                            <select className="text-black text-xs px-2 py-1 border rounded w-1/3"
                              value={fert.amount_g} onChange={(e) => handleChemicalChange(index, 'fertilizers', fIdx, 'amount_g', Number(e.target.value))}>
                              {AMOUNTS.map(amt => <option key={amt.value} value={amt.value}>{amt.label}</option>)}
                            </select>
                            <button type="button" onClick={() => handleRemoveChemical(index, 'fertilizers', fIdx)} className="text-red-500 text-xs hover:bg-red-50 p-1 rounded">×</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => handleAddChemical(index, 'fertilizers')} className="text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">+ Add Fertilizer</button>
                      </div>

                      {/* Pesticides */}
                      <div>
                        <label className="block text-[10px] font-medium text-black mb-2">Pesticides Applied</label>
                        {crop.pesticides.map((pest, pIdx) => (
                          <div key={pIdx} className="flex items-center gap-2 mb-2">
                            <input type="text" placeholder="Name (e.g., Captan)" className="text-black text-xs px-2 py-1 border rounded w-1/2"
                              value={pest.name} onChange={(e) => handleChemicalChange(index, 'pesticides', pIdx, 'name', e.target.value)} />
                            <select className="text-black text-xs px-2 py-1 border rounded w-1/3"
                              value={pest.amount_g} onChange={(e) => handleChemicalChange(index, 'pesticides', pIdx, 'amount_g', Number(e.target.value))}>
                              {AMOUNTS.map(amt => <option key={amt.value} value={amt.value}>{amt.label}</option>)}
                            </select>
                            <button type="button" onClick={() => handleRemoveChemical(index, 'pesticides', pIdx)} className="text-red-500 text-xs hover:bg-red-50 p-1 rounded">×</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => handleAddChemical(index, 'pesticides')} className="text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">+ Add Pesticide</button>
                      </div>
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
              {/* Suitability Banner & AI Remedy Section */}
              <div className={`p-4 rounded-lg border ${evaluation.targetEvaluation.isSuitable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-800">Target Crop Suitability</h3>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${evaluation.targetEvaluation.isSuitable ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {evaluation.targetEvaluation.isSuitable ? 'SUITABLE' : 'NOT RECOMMENDED'}
                  </span>
                </div>

                <div className="mt-3 bg-white p-4 rounded border border-gray-200 shadow-sm">
                  <h4 className="text-xs font-semibold mb-2 flex items-center gap-1 text-blue-700">
                    ✨ AI Soil Preparation Guide
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed mb-4">
                    {evaluation.targetEvaluation.aiSoilRemedy}
                  </p>

                  {!evaluation.targetEvaluation.isSuitable && evaluation.alternativeSuggestions && evaluation.alternativeSuggestions.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg shadow-sm">
                      <h3 className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
                        💡 Recommended Alternatives for Current Soil
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
                                  <span className="text-green-500 mt-0.5">✓</span>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Soil Nutrient Status Table */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-3 bg-indigo-50 border-b border-indigo-100">
                    <h3 className="text-xs font-medium text-indigo-800">Soil Nutrient Status</h3>
                  </div>
                  <div className="p-0">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="p-2 text-[10px] font-semibold text-gray-600">Nutrient</th>
                          <th className="p-2 text-[10px] font-semibold text-gray-600">Current Level</th>
                          <th className="p-2 text-[10px] font-semibold text-gray-600">Difference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evaluation.soilNutrientLevels.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-100 last:border-0">
                            <td className="p-2 text-xs text-gray-800 font-medium">{item.nutrient}</td>
                            <td className="p-2 text-xs text-gray-600">{item.level}</td>
                            <td className={`p-2 text-xs font-medium ${item.difference >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {item.difference > 0 ? '+' : ''}{item.difference.toFixed(2)} ppm
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Chart */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-700 mb-3">Current vs Required Nutrients</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '4px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="Required" fill="#9CA3AF" radius={[2, 2, 0, 0]} barSize={20} />
                        <Bar dataKey="Current" fill="#10B981" radius={[2, 2, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              {/* Detailed Calculation & Chemical Breakdown Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                
                {/* 1. Agrochemical N-P-K Contributions */}
                {evaluation.chemicalBreakdown && evaluation.chemicalBreakdown.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-3 bg-green-50 border-b border-green-100 flex justify-between items-center">
                      <h3 className="text-xs font-medium text-green-800">🧪 Agrochemical N-P-K Contributions</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-2 text-[10px] font-semibold text-gray-600">Chemical Name</th>
                            <th className="p-2 text-[10px] font-semibold text-gray-600 text-center">Amount</th>
                            <th className="p-2 text-[10px] font-semibold text-gray-600 text-center">Base (per 100g)</th>
                            <th className="p-2 text-[10px] font-semibold text-green-600 text-center">Total Added (N-P-K)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {evaluation.chemicalBreakdown.map((chem, idx) => (
                            <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                              <td className="p-2 text-xs text-gray-800 font-medium">{chem.name}</td>
                              <td className="p-2 text-xs text-gray-600 text-center">{chem.amount_g}g</td>
                              <td className="p-2 text-[10px] text-gray-500 text-center">
                                {chem.base_100g.N.toFixed(1)} / {chem.base_100g.P.toFixed(1)} / {chem.base_100g.K.toFixed(1)}
                              </td>
                              <td className="p-2 text-xs text-green-700 font-semibold text-center">
                                +{chem.added.N.toFixed(2)} / +{chem.added.P.toFixed(2)} / +{chem.added.K.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. Nutrient Calculator Internal Logic */}
                {evaluation.calculatorDetails && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-3 bg-blue-50 border-b border-blue-100">
                      <h3 className="text-xs font-medium text-blue-800">📊 Nutrient Gap Calculation Details</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-2 text-[10px] font-semibold text-gray-600">Nutrient</th>
                            <th className="p-2 text-[10px] font-semibold text-gray-600 text-center">Required (Min-Max)</th>
                            <th className="p-2 text-[10px] font-semibold text-blue-600 text-center">Target Midpoint</th>
                            <th className="p-2 text-[10px] font-semibold text-gray-600 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {['N', 'P', 'K'].map((nut, idx) => {
                            const req = evaluation.calculatorDetails!.requirements[nut as 'N'|'P'|'K'];
                            const status = evaluation.calculatorDetails!.statuses[nut as 'N'|'P'|'K'];
                            return (
                              <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                <td className="p-2 text-xs text-gray-800 font-bold">{nut}</td>
                                <td className="p-2 text-xs text-gray-600 text-center">
                                  {req.min.toFixed(1)} - {req.max === 999999 ? 'No Limit' : req.max.toFixed(1)}
                                </td>
                                <td className="p-2 text-xs text-blue-600 font-medium text-center">
                                  {req.mid.toFixed(2)} ppm
                                </td>
                                <td className="p-2 text-xs text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                    status === 'Deficit' ? 'bg-red-100 text-red-700' : 
                                    status === 'Surplus' ? 'bg-yellow-100 text-yellow-700' : 
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
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
