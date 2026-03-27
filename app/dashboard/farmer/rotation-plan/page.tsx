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
  
  const [initialSoilData, setInitialSoilData] = useState<any>(null);

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));

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

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get rotation plan');
      
      setEvaluation(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. අලුත් දත්ත මත පදනම්ව Chart එකට අවශ්‍ය Data ජනනය කර ගැනීම
  const chartData = evaluation?.soilNutrientLevels.map(item => {
    const currentVal = parseFloat(item.level); // "50 ppm" -> 50
    // Required = Current - Difference
    const requiredVal = Number((currentVal - item.difference).toFixed(2));
    
    return {
      name: item.nutrient.split(' ')[0], // "Nitrogen (N)" -> "Nitrogen"
      Current: currentVal,
      Required: requiredVal > 0 ? requiredVal : 0 // සෘණ අගයන් වළක්වා ගැනීම
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

          {initialSoilData && (
            <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xs font-semibold text-blue-900">Current Soil Baseline</h2>
                  <p className="text-[10px] text-blue-700">pH: {initialSoilData.phMin} - {initialSoilData.phMax}</p>
                </div>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {initialSoilData.nutrients.map((nut: any, i: number) => (
                    <div key={i} className="p-2 bg-gray-50 rounded border border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-gray-600">{nut.symbol}</span>
                        <span className={`text-[8px] px-1 py-0.5 rounded ${
                          nut.type === 'main' ? 'bg-green-100 text-green-700' : 
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
                    type="text" 
                    required 
                    placeholder="e.g., Tomato, Carrot" 
                    className="text-black flex-1 text-sm px-3 py-2 border border-gray-200 rounded bg-gray-50 focus:ring-1 focus:ring-green-400 outline-none" 
                    value={targetCrop} 
                    onChange={(e) => setTargetCrop(e.target.value)} 
                  />
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
                      <button 
                        type="button" 
                        onClick={() => removeCropField(index)} 
                        className="absolute -top-2 -right-2 text-red-500 hover:text-white hover:bg-red-500 text-xs bg-white border border-red-200 w-5 h-5 rounded-full flex items-center justify-center"
                      >
                        ×
                      </button>
                    )}
                    
                    <div className="mb-3">
                      <label className="block text-[10px] font-medium text-black mb-1">Crop Grown</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g., Cabbage" 
                        className="text-black w-full text-sm px-3 py-1.5 border border-gray-200 rounded bg-white" 
                        value={crop.cropName} 
                        onChange={(e) => handleInputChange(index, 'cropName', e.target.value)} 
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-[10px] font-medium text-black mb-1">Growing Period</label>
                      <div className="flex items-center gap-1">
                        <select 
                          required 
                          className="text-black flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded bg-white" 
                          value={crop.startMonth} 
                          onChange={(e) => handleInputChange(index, 'startMonth', e.target.value)}
                        >
                          <option value="" disabled>Month</option>
                          {MONTHS.map(m => <option key={m} value={m}>{m.substring(0, 3)}</option>)}
                        </select>
                        <select 
                          required 
                          className="text-black w-16 text-xs px-2 py-1.5 border border-gray-200 rounded bg-white" 
                          value={crop.startYear} 
                          onChange={(e) => handleInputChange(index, 'startYear', e.target.value)}
                        >
                          <option value="" disabled>Year</option>
                          {YEARS.map(y => <option key={y} value={y}>{y.substring(2)}</option>)}
                        </select>
                        <span className="text-gray-400 text-xs">→</span>
                        <select 
                          required 
                          className="text-black flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded bg-white" 
                          value={crop.endMonth} 
                          onChange={(e) => handleInputChange(index, 'endMonth', e.target.value)}
                        >
                          <option value="" disabled>Month</option>
                          {MONTHS.map(m => <option key={m} value={m}>{m.substring(0, 3)}</option>)}
                        </select>
                        <select 
                          required 
                          className="text-black w-16 text-xs px-2 py-1.5 border border-gray-200 rounded bg-white" 
                          value={crop.endYear} 
                          onChange={(e) => handleInputChange(index, 'endYear', e.target.value)}
                        >
                          <option value="" disabled>Year</option>
                          {YEARS.map(y => <option key={y} value={y}>{y.substring(2)}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-medium text-black mb-1">Fertilizers</label>
                        <input 
                          type="text" 
                          placeholder="e.g., Urea" 
                          className="text-black w-full text-xs px-2 py-1.5 border border-gray-200 rounded bg-white" 
                          value={crop.fertilizers} 
                          onChange={(e) => handleInputChange(index, 'fertilizers', e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-black mb-1">Pesticides</label>
                        <input 
                          type="text" 
                          placeholder="e.g., Neem oil" 
                          className="text-black w-full text-xs px-2 py-1.5 border border-gray-200 rounded bg-white" 
                          value={crop.pesticides} 
                          onChange={(e) => handleInputChange(index, 'pesticides', e.target.value)} 
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={addCropField} 
                    className="text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-4 py-2 rounded border border-green-200"
                  >
                    + Add Past Crop
                  </button>
                  <div className="flex items-center gap-2">
                    <select 
                      value={language} 
                      onChange={(e) => setLanguage(e.target.value)} 
                      className="text-xs px-3 py-2 border border-gray-300 rounded bg-white text-black"
                    >
                      <option value="English">English</option>
                      <option value="Sinhala">සිංහල</option>
                    </select>
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="px-5 py-2 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300"
                    >
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

              {/* 3. Suitability Banner & AI Remedy Section */}
              <div className={`p-4 rounded-lg border ${evaluation.targetEvaluation.isSuitable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-800">Target Crop Suitability</h3>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    evaluation.targetEvaluation.isSuitable ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {evaluation.targetEvaluation.isSuitable ? 'SUITABLE' : 'NOT RECOMMENDED'}
                  </span>
                </div>
                
                {/* AI Remedy Message */}
                <div className="mt-3 bg-white p-4 rounded border border-gray-200 shadow-sm">
                  <h4 className="text-xs font-semibold mb-2 flex items-center gap-1 text-blue-700">
                    ✨ AI Soil Preparation Guide
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                    {evaluation.targetEvaluation.aiSoilRemedy}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 4. Soil Nutrient Status Table */}
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

                {/* 5. Chart */}
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

            </div>
          )}
        </div>
      </main>
    </div>
  );
}