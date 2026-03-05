'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  soilCondition: {
    status: string;
    details: string[];
  };
  targetEvaluation: {
    isSuitable: boolean;
    feedback: string[];
  };
  alternativeSuggestions: {
    cropName: string;
    reasons: string[];
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

  // Automatically detect and set the full current date on load
  useEffect(() => {
    const fullDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    setCurrentDate(fullDate);
  }, []);

  const handleInputChange = (index: number, field: keyof PastCropDetails, value: string) => {
    const updatedCrops = [...pastCrops];
    updatedCrops[index][field] = value;
    setPastCrops(updatedCrops);
  };

  const addCropField = () => {
    setPastCrops([...pastCrops, { cropName: '', startMonth: '', startYear: '', endMonth: '', endYear: '', fertilizers: '', pesticides: '' }]);
  };

  const removeCropField = (index: number) => {
    const updatedCrops = pastCrops.filter((_, i) => i !== index);
    setPastCrops(updatedCrops);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetCrop.trim()) {
      setError('Please specify the crop you wish to plant.');
      return;
    }

    if (pastCrops.some(c => !c.cropName || !c.startMonth || !c.startYear || !c.endMonth || !c.endYear)) {
      setError('Please enter a crop name and complete the full time period for all entries.');
      return;
    }

    setLoading(true);
    setError('');
    setEvaluation(null);

    try {
      const formattedCrops = pastCrops.map(crop => ({
        cropName: crop.cropName,
        timePeriod: `${crop.startMonth} ${crop.startYear} to ${crop.endMonth} ${crop.endYear}`,
        fertilizers: crop.fertilizers,
        pesticides: crop.pesticides
      }));

      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/rotation/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetCrop,
          currentMonth: currentDate,
          previousCrops: formattedCrops,
          language
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to get rotation plan');
      }

      const data = await res.json();
      setEvaluation(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-6 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6 text-center sm:text-left">
          <h1 className="text-2xl font-extrabold text-green-800 tracking-tight">Rotation Evaluator</h1>
          <p className="mt-1 text-xs text-gray-500 font-medium">
            Check soil health & get smart planting suggestions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Section 1: Target Crop & Current Time */}
          <div className="bg-white shadow-sm rounded-3xl border border-green-100 overflow-hidden">
            <div className="px-5 py-3 bg-green-500 flex flex-col sm:flex-row justify-between items-center gap-2">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">1. Intended Crop</h2>
              <span className="text-[10px] font-bold bg-green-800/40 px-3 py-1 rounded-full text-white tracking-widest">
                {currentDate}
              </span>
            </div>
            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label className="text-xs font-bold text-gray-600 whitespace-nowrap hidden sm:block">I want to plant:</label>
              <input
                type="text"
                required
                placeholder="e.g., Tomato, බඩඉරිගු"
                className="text-black w-full px-4 py-2 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-sm font-medium transition-all bg-gray-50 focus:bg-white"
                value={targetCrop}
                onChange={(e) => setTargetCrop(e.target.value)}
              />
            </div>
          </div>

          {/* Section 2: Historical Details */}
          <div className="bg-white shadow-sm rounded-3xl border border-green-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-green-100 bg-green-50">
              <h2 className="text-xs font-bold text-green-800 uppercase tracking-wider">2. Historical Crop Details</h2>
            </div>

            <div className="p-4">
              {pastCrops.map((crop, index) => (
                <div key={index} className="mb-4 p-4 border border-green-50 rounded-3xl relative bg-green-50/30 shadow-sm">
                  {pastCrops.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCropField(index)}
                      className="absolute -top-2 -right-2 text-red-500 hover:text-white hover:bg-red-400 text-xs font-bold bg-white border border-red-100 px-2 py-1 rounded-full transition-colors shadow-sm"
                    >
                      ✕
                    </button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Crop Grown</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Tomato, බඩඉරිගු"
                        className="text-black w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-400 text-sm font-medium bg-white transition-colors"
                        value={crop.cropName}
                        onChange={(e) => handleInputChange(index, 'cropName', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Time Period Grown</label>
                      <div className="flex flex-wrap items-center gap-1">
                        <select
                          required
                          className="text-black flex-1 min-w-[60px] px-1 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-400 bg-white text-xs font-medium cursor-pointer"
                          value={crop.startMonth}
                          onChange={(e) => handleInputChange(index, 'startMonth', e.target.value)}
                        >
                          <option value="" disabled>Mo</option>
                          {MONTHS.map(m => <option key={m} value={m}>{m.substring(0, 3)}</option>)}
                        </select>
                        <select
                          required
                          className="text-black flex-1 min-w-[55px] px-1 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-400 bg-white text-xs font-medium cursor-pointer"
                          value={crop.startYear}
                          onChange={(e) => handleInputChange(index, 'startYear', e.target.value)}
                        >
                          <option value="" disabled>Yr</option>
                          {YEARS.map(y => <option key={y} value={y}>{y.substring(2)}</option>)}
                        </select>
                        <span className="text-gray-400 text-xs font-bold px-0.5">-</span>
                        <select
                          required
                          className="text-black flex-1 min-w-[60px] px-1 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-400 bg-white text-xs font-medium cursor-pointer"
                          value={crop.endMonth}
                          onChange={(e) => handleInputChange(index, 'endMonth', e.target.value)}
                        >
                          <option value="" disabled>Mo</option>
                          {MONTHS.map(m => <option key={m} value={m}>{m.substring(0, 3)}</option>)}
                        </select>
                        <select
                          required
                          className="text-black flex-1 min-w-[55px] px-1 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-400 bg-white text-xs font-medium cursor-pointer"
                          value={crop.endYear}
                          onChange={(e) => handleInputChange(index, 'endYear', e.target.value)}
                        >
                          <option value="" disabled>Yr</option>
                          {YEARS.map(y => <option key={y} value={y}>{y.substring(2)}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Fertilizers Applied</label>
                      <input
                        type="text"
                        placeholder="e.g., යූරියා, Compost"
                        className="text-black w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-400 text-sm font-medium bg-white transition-colors"
                        value={crop.fertilizers}
                        onChange={(e) => handleInputChange(index, 'fertilizers', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Pesticides Used</label>
                      <input
                        type="text"
                        placeholder="e.g., Chlorpyrifos, Chemical sprays"
                        className="text-black w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-400 text-sm font-medium bg-white transition-colors"
                        value={crop.pesticides}
                        onChange={(e) => handleInputChange(index, 'pesticides', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={addCropField}
                  className="w-full sm:w-auto text-xs font-extrabold text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-4 py-2.5 rounded-full transition-colors flex justify-center items-center"
                >
                  + ADD PAST CROP
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  {/* Kept EXACTLY as requested */}
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-700 font-medium w-full sm:w-auto"
                  >
                    <option value="English">English</option>
                    <option value="Sinhala">සිංහල (Sinhala)</option>
                  </select>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-3 border border-transparent text-xs font-extrabold rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-all uppercase tracking-wide"
                  >
                    {loading ? 'Please wait...' : 'prosess'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-3 rounded-2xl shadow-sm text-center">
            {error}
          </div>
        )}

        {/* Results Section */}
        {evaluation && (
          <div className="mt-6 space-y-4 animate-fade-in-up">

            <div className="bg-white shadow-sm rounded-3xl p-4 border border-amber-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>
              <h3 className="text-xs font-extrabold text-gray-500 mb-2 uppercase tracking-widest">
                {language === 'Sinhala' ? 'වත්මන් පසෙහි තත්ත්වය' : 'Soil Estimate'}
              </h3>
              <p className="text-amber-800 text-sm font-bold mb-2 bg-amber-50 rounded-2xl p-3">
                {evaluation.soilCondition.status}
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 text-xs font-medium ml-1">
                {evaluation.soilCondition.details.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            </div>

            <div className={`bg-white shadow-sm rounded-3xl p-4 border relative overflow-hidden ${evaluation.targetEvaluation.isSuitable ? 'border-green-100' : 'border-red-100'}`}>
              <div className={`absolute top-0 left-0 w-1.5 h-full ${evaluation.targetEvaluation.isSuitable ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                <h3 className="text-xs font-extrabold text-gray-500 leading-snug uppercase tracking-widest">
                  {language === 'Sinhala' ? 'මෙම අවස්ථාවේ' : "Suitability:"} <span className={`underline decoration-2 ${evaluation.targetEvaluation.isSuitable ? 'decoration-green-400 text-green-700' : 'decoration-red-400 text-red-700'}`}>'{targetCrop}'</span>
                </h3>
                <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-extrabold text-white shadow-sm ${evaluation.targetEvaluation.isSuitable ? 'bg-green-500' : 'bg-red-500'}`}>
                  {evaluation.targetEvaluation.isSuitable
                    ? (language === 'Sinhala' ? 'සුදුසුයි' : 'SUITABLE')
                    : (language === 'Sinhala' ? 'නිර්දේශ නොකෙරේ' : 'NOT RECOMMENDED')}
                </span>
              </div>

              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                <p className="text-[10px] font-extrabold text-gray-400 mb-1.5 uppercase tracking-widest">
                  {language === 'Sinhala' ? 'කෘෂි විද්‍යාඥ ප්‍රතිචාරය:' : 'Feedback:'}
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 text-xs font-medium">
                  {evaluation.targetEvaluation.feedback.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-3xl p-4 border border-blue-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-400"></div>
              <h3 className="text-xs font-extrabold text-gray-500 mb-3 uppercase tracking-widest">
                {language === 'Sinhala' ? 'නිර්දේශිත විකල්ප වගාවන්' : 'Alternatives'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {evaluation.alternativeSuggestions.map((item, idx) => (
                  <div key={idx} className="bg-blue-50/50 rounded-2xl p-3 hover:bg-blue-50 transition-colors">
                    <h4 className="text-sm font-extrabold text-blue-900 mb-1">{item.cropName}</h4>
                    <ul className="list-disc list-inside text-xs text-blue-800/80 space-y-1 font-medium ml-1">
                      {item.reasons.map((reason, i) => (
                        <li key={i} className="leading-relaxed">{reason}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}