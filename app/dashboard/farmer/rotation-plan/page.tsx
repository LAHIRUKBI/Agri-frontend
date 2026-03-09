'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FarmerSidebar from '@/app/navigation/farmer/page';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PastCropDetails {
  cropName: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  fertilizers: string;
  pesticides: string;
}

interface EvaluationResult {
  soilCondition: { status: string; details: string[]; };
  targetEvaluation: { isSuitable: boolean; feedback: string[]; };
  alternativeSuggestions: { cropName: string; reasons: string[]; }[];
  baselineNutrients: { nutrient: string; level: number; }[];
  historyImpact: { nutrient: string; change: number; }[];
  graphData: { name: string; Current: number; Required: number; }[];
  soilNutrientLevels: { nutrient: string; level: string; depletionPrediction: string; }[];
  requiredNutrients: { nutrient: string; recommendedSource: string; amount: string; }[];
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = ['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'];

export default function RotationPlanPage() {
  const [currentDate, setCurrentDate] = useState('');
  const [targetCrop, setTargetCrop] = useState('');
  const [language, setLanguage] = useState('English');
  const [pastCrops, setPastCrops] = useState<PastCropDetails[]>([
    { cropName: '', startMonth: '', startYear: '', endMonth: '', endYear: '', fertilizers: '', pesticides: '' }
  ]);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  
  // NEW: State to hold the Initial Soil Configuration
  const [initialSoilData, setInitialSoilData] = useState<any>(null);

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));

    // NEW: Fetch Baseline Soil Data on Load
    const fetchSoilData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/nutrients');
        const data = await res.json();
        if (data.success) setInitialSoilData(data.data);
      } catch (err) {
        console.error("Failed to load initial soil data.");
      }
    };
    fetchSoilData();
  }, []);

  const handleInputChange = (index: number, field: keyof PastCropDetails, value: string) => {
    const updatedCrops = [...pastCrops];
    updatedCrops[index][field] = value;
    setPastCrops(updatedCrops);
  };

  const addCropField = () => setPastCrops([...pastCrops, { cropName: '', startMonth: '', startYear: '', endMonth: '', endYear: '', fertilizers: '', pesticides: '' }]);
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
        body: JSON.stringify({ targetCrop, currentMonth: currentDate, previousCrops: pastCrops, language }),
      });

      if (!res.ok) throw new Error((await res.json()).error || 'Failed to get rotation plan');
      setEvaluation(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <FarmerSidebar user={user} />
      <main className="flex-1 overflow-y-auto py-8 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="text-center sm:text-left bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h1 className="text-3xl font-extrabold text-green-800 tracking-tight">AI Rotation & Soil Evaluator</h1>
            <p className="mt-2 text-sm text-gray-500 font-medium">Analyze historical data to generate predictive soil nutrient graphs and planting suggestions.</p>
          </div>

          {/* Initial Soil Configuration Banner */}
          {initialSoilData && (
            <div className="bg-white shadow-sm rounded-3xl border border-blue-100 overflow-hidden">
              <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                   <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wider">Current Soil Baseline Configuration</h2>
                   <p className="text-xs text-blue-700 mt-1">Starting parameters loaded from administration.</p>
                </div>
                <div className="bg-blue-200 text-blue-900 px-4 py-1.5 rounded-xl text-xs font-extrabold shadow-sm">
                  pH Range: {initialSoilData.phMin} - {initialSoilData.phMax}
                </div>
              </div>
              <div className="p-5 bg-gradient-to-b from-blue-50/30 to-white">
                <div className="flex flex-wrap gap-3">
                   {initialSoilData.nutrients.map((nut:any, i:number) => (
                     <div key={i} className="flex-1 min-w-[130px] p-3 rounded-2xl bg-white border border-blue-50 shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-shadow">
                        <span className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">{nut.name} ({nut.symbol})</span>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-sm font-black text-gray-800">{nut.min} - {nut.max}</span>
                            <span className="text-[9px] font-bold text-gray-400">{nut.unit}</span>
                        </div>
                        <span className={`mt-2 text-[8px] px-2 py-0.5 rounded-md font-bold uppercase tracking-widest ${
                          nut.type === 'main' ? 'bg-green-100 text-green-700' : 
                          nut.type === 'secondary' ? 'bg-blue-100 text-blue-700' : 
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {nut.type}
                        </span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white shadow-sm rounded-3xl border border-green-100 overflow-hidden">
              <div className="px-6 py-4 bg-green-500 flex flex-col sm:flex-row justify-between items-center gap-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">1. Intended Crop Configuration</h2>
              </div>
              <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="text-sm font-bold text-gray-700 whitespace-nowrap">I want to plant:</label>
                <input type="text" required placeholder="e.g., Tomato, Carrot" className="text-black w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-400 bg-gray-50" value={targetCrop} onChange={(e) => setTargetCrop(e.target.value)} />
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-3xl border border-green-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-green-100 bg-green-50">
                <h2 className="text-sm font-bold text-green-800 uppercase tracking-wider">2. Historical Crop Timeline</h2>
              </div>
              <div className="p-6">
                {pastCrops.map((crop, index) => (
                  <div key={index} className="mb-6 p-5 border border-green-50 rounded-2xl relative bg-white shadow-md">
                    {pastCrops.length > 1 && (
                      <button type="button" onClick={() => removeCropField(index)} className="absolute -top-3 -right-3 text-red-500 hover:text-white hover:bg-red-500 text-sm font-bold bg-white border border-red-100 w-8 h-8 rounded-full shadow-sm flex items-center justify-center">✕</button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Crop Grown</label>
                        <input type="text" required placeholder="e.g., Cabbage" className="text-black w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50" value={crop.cropName} onChange={(e) => handleInputChange(index, 'cropName', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Time Period</label>
                        <div className="flex items-center gap-2">
                          <select required className="text-black flex-1 px-2 py-2 border border-gray-200 rounded-xl bg-gray-50 text-xs" value={crop.startMonth} onChange={(e) => handleInputChange(index, 'startMonth', e.target.value)}><option value="" disabled>Mo</option>{MONTHS.map(m => <option key={m} value={m}>{m.substring(0, 3)}</option>)}</select>
                          <select required className="text-black flex-1 px-2 py-2 border border-gray-200 rounded-xl bg-gray-50 text-xs" value={crop.startYear} onChange={(e) => handleInputChange(index, 'startYear', e.target.value)}><option value="" disabled>Yr</option>{YEARS.map(y => <option key={y} value={y}>{y.substring(2)}</option>)}</select>
                          <span className="text-gray-400 font-bold px-1">to</span>
                          <select required className="text-black flex-1 px-2 py-2 border border-gray-200 rounded-xl bg-gray-50 text-xs" value={crop.endMonth} onChange={(e) => handleInputChange(index, 'endMonth', e.target.value)}><option value="" disabled>Mo</option>{MONTHS.map(m => <option key={m} value={m}>{m.substring(0, 3)}</option>)}</select>
                          <select required className="text-black flex-1 px-2 py-2 border border-gray-200 rounded-xl bg-gray-50 text-xs" value={crop.endYear} onChange={(e) => handleInputChange(index, 'endYear', e.target.value)}><option value="" disabled>Yr</option>{YEARS.map(y => <option key={y} value={y}>{y.substring(2)}</option>)}</select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Fertilizers Used</label>
                        <input type="text" placeholder="e.g., Urea, Compost" className="text-black w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50" value={crop.fertilizers} onChange={(e) => handleInputChange(index, 'fertilizers', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Pesticides Used</label>
                        <input type="text" placeholder="e.g., Neem oil" className="text-black w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50" value={crop.pesticides} onChange={(e) => handleInputChange(index, 'pesticides', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                  <button type="button" onClick={addCropField} className="w-full sm:w-auto text-xs font-extrabold text-green-700 bg-green-100 hover:bg-green-200 px-5 py-3 rounded-xl transition-colors shadow-sm">+ ADD PAST CROP</button>
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-700 text-sm font-bold shadow-sm">
                      <option value="English">English</option>
                      <option value="Sinhala">සිංහල (Sinhala)</option>
                    </select>
                    <button type="submit" disabled={loading} className="w-full sm:w-auto px-8 py-3 border border-transparent text-sm font-extrabold rounded-xl shadow-md text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 transition-all uppercase">{loading ? 'Analyzing...' : 'Run ML Analysis'}</button>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm"><p className="text-red-700 font-bold text-sm">{error}</p></div>}

          {evaluation && (
            <div className="space-y-6 animate-fade-in-up">

              {/* Suitability Banner */}
              <div className={`p-6 rounded-3xl shadow-md border-l-8 ${evaluation.targetEvaluation.isSuitable ? 'border-green-500 bg-green-50/30' : 'border-red-500 bg-red-50/30'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-extrabold text-gray-800">Target Crop Suitability</h3>
                  <span className={`px-4 py-2 rounded-xl text-xs uppercase tracking-widest font-extrabold text-white shadow-sm ${evaluation.targetEvaluation.isSuitable ? 'bg-green-500' : 'bg-red-500'}`}>
                    {evaluation.targetEvaluation.isSuitable ? 'SUITABLE' : 'NOT RECOMMENDED'}
                  </span>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-2">
                  <h4 className="text-xs font-extrabold text-gray-500 mb-2 uppercase tracking-wider">Analysis Feedback:</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm font-medium">
                    {evaluation.targetEvaluation.feedback.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Display Baseline & Impact Side-by-Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Target Crop Requirements */}
                <div className="bg-white shadow-md rounded-3xl overflow-hidden border border-gray-100">
                  <div className="p-5 bg-indigo-50 border-b border-indigo-100">
                    <h3 className="text-sm font-extrabold text-indigo-900 uppercase tracking-wider">Target Crop Needs</h3>
                    <p className="text-xs text-indigo-600 mt-1">Minimum nutrients required to grow {targetCrop}.</p>
                  </div>
                  <div className="p-6 grid grid-cols-3 gap-2">
                    {evaluation.graphData.map((item, idx) => (
                      <div key={idx} className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="block text-[10px] font-bold text-gray-500 uppercase">{item.name.split(' ')[0]}</span>
                        <span className="block text-lg font-black text-gray-800 mt-1">{item.Required}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* History Impact */}
                <div className="bg-white shadow-md rounded-3xl overflow-hidden border border-gray-100">
                  <div className="p-5 bg-amber-50 border-b border-amber-100">
                    <h3 className="text-sm font-extrabold text-amber-900 uppercase tracking-wider">Historical Impact</h3>
                    <p className="text-xs text-amber-700 mt-1">Calculated nutrient change from history.</p>
                  </div>
                  <div className="p-6 grid grid-cols-3 gap-2">
                    {evaluation.historyImpact.map((item, idx) => (
                      <div key={idx} className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="block text-[10px] font-bold text-gray-500 uppercase">{item.nutrient.split(' ')[0]}</span>
                        <span className={`block text-lg font-black mt-1 ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {item.change > 0 ? '+' : ''}{item.change}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Data Visualization Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Visual Graph Section */}
                <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100 flex flex-col">
                  <h3 className="text-sm font-extrabold text-gray-800 mb-6 uppercase tracking-wider">Current vs Required Nutrients</h3>
                  <div className="flex-1 w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={evaluation.graphData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                        <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="Required" name="Required (Target)" fill="#94A3B8" radius={[4, 4, 0, 0]} barSize={30} />
                        <Bar dataKey="Current" name="Current (Actual)" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Problem / Solution Tables */}
                <div className="bg-white shadow-md rounded-3xl overflow-hidden border border-gray-100 flex flex-col">
                  <div className="p-6 bg-gray-50 border-b border-gray-100">
                     <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Required Actions</h3>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-center">
                    {evaluation.requiredNutrients.length > 0 ? (
                      <div className="space-y-4">
                        {evaluation.requiredNutrients.map((req, idx) => (
                          <div key={idx} className={`p-4 rounded-2xl border ${req.amount.includes('Add') ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-extrabold text-sm text-gray-800">{req.nutrient}</span>
                              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${req.amount.includes('Add') ? 'bg-amber-200 text-amber-800' : 'bg-blue-200 text-blue-800'}`}>
                                {req.amount}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 font-medium mt-2">
                              <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Action: </span>{req.recommendedSource}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-8 bg-green-50 rounded-2xl border border-green-100">
                        <span className="text-4xl block mb-2">🌱</span>
                        <h4 className="text-green-800 font-bold">Soil is perfectly balanced!</h4>
                        <p className="text-xs text-green-600 mt-1">No additional actions required for this crop.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Alternatives Section */}
              {!evaluation.targetEvaluation.isSuitable && (
                <div className="bg-blue-50/50 shadow-md rounded-3xl p-6 border border-blue-100">
                  <h3 className="text-sm font-extrabold text-blue-900 mb-4 uppercase tracking-wider">Recommended Alternatives</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {evaluation.alternativeSuggestions.map((item, idx) => (
                      <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-blue-50">
                        <h4 className="text-sm font-extrabold text-blue-800 mb-2">{item.cropName}</h4>
                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-1 font-medium">
                          {item.reasons.map((reason, i) => (<li key={i} className="leading-relaxed">{reason}</li>))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </main>
    </div>
  );
}