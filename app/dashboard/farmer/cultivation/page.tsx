'use client';

import { useState, useEffect } from 'react';
import FarmerSidebar from '@/app/navigation/farmer/page';

const DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha",
  "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala",
  "Mannar", "Matale", "Matara", "Moneragala", "Mullaitivu", "Nuwara Eliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function CultivationPage() {
  const [district, setDistrict] = useState('');
  const [language, setLanguage] = useState('English');
  const [currentDate, setCurrentDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [crops, setCrops] = useState<any[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    const d = new Date();
    setCurrentDate(d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    setSelectedMonth(MONTHS[d.getMonth()]);

    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      setCurrentUser(JSON.parse(storedUser));
      setAuthToken(storedToken);
    }
  }, []);

  const handleProcess = async () => {
    if (!district) return alert('Please select a district.');
    if (!selectedMonth) return alert('Please select a target month.');

    setLoading(true);
    setSelectedCrop(null);
    setCrops([]);
    setPageError('');

    try {
      const res = await fetch('http://localhost:5000/api/guidance/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ district, date: currentDate, month: selectedMonth, language })
      });

      if (!res.ok) {
        throw new Error('Could not reach the backend recommendation service.');
      }

      const result = await res.json();
      if (result.success) {
        setCrops(result.data);
      } else {
        alert(result.message || "Failed to fetch recommendations.");
      }
    } catch (error) {
      setPageError('Backend server is unavailable right now. Please make sure the backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  // Importing steps via AI or CSV when clicking View Cultivation Steps
  const handleViewSteps = async (crop: any) => {
    setLoadingSteps(true);
    try {
      const res = await fetch('http://localhost:5000/api/guidance/steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cropName: crop.cropName, language })
      });
      if (!res.ok) {
        throw new Error('Could not load cultivation steps.');
      }
      const data = await res.json();
      if (data.success) {
        setSelectedCrop({ ...crop, steps: data.steps });
        setAddSuccess(false);
      } else {
        alert("Failed to load cultivation steps.");
      }
    } catch (error) {
      setPageError('Cultivation steps could not be loaded because the backend or Python service is unavailable.');
    } finally {
      setLoadingSteps(false);
    }
  };

  const handleAddCropToProfile = async () => {
    if (!currentUser || !currentUser.id || !authToken) {
      alert("Please sign in to add crops to your profile.");
      return;
    }

    if (!selectedCrop) return;

    setIsAdding(true);
    setAddSuccess(false);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/users/${currentUser.id}/add-crop`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          cropName: selectedCrop.cropName,
          district: district
        })
      });

      const result = await response.json();

      if (response.ok || result.success) {
        setAddSuccess(true);
        setTimeout(() => setAddSuccess(false), 3000);
      } else {
        alert(result.message || "Failed to add crop to profile");
      }
    } catch (error) {
      alert("An error occurred while communicating with the server.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-50" style={{ zoom: 1.1 }}>
      <aside className="w-64 bg-white border-r border-stone-200 shrink-0 shadow-sm z-10">
        <FarmerSidebar user={currentUser || { name: 'Guest', role: 'farmer' }} />
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          
          {pageError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
              {pageError}
            </div>
          )}

          {/* Hero Section */}
          <section className="rounded-3xl border border-stone-200 bg-[radial-gradient(circle_at_top_left,_#f7fee7,_#fafaf9_55%)] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Guidance</p>
            <h1 className="mt-2 text-3xl font-bold text-stone-900">Cultivation Recommendation</h1>
          </section>

          {/* Filter Section */}
          <div className="rounded-3xl border border-stone-200 bg-white p-5 md:p-6 shadow-sm flex flex-wrap gap-5 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Location (District)</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
              >
                <option value="">Select District</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Target Month / Season</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
              >
                {MONTHS.map(m => (
                  <option key={m} value={m}>
                    {m} {m === MONTHS[new Date().getMonth()] ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
              >
                <option value="English">English</option>
                <option value="Sinhala">Sinhala</option>
              </select>
            </div>

            <button
              onClick={handleProcess}
              disabled={loading}
              className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-md disabled:opacity-60 disabled:shadow-none"
            >
              {loading ? 'Analyzing AI Model...' : 'Process'}
            </button>
          </div>

          {loadingSteps && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mx-auto shadow-sm"></div>
              <p className="mt-4 text-emerald-800 font-semibold text-sm">preparing your cultivation steps...</p>
            </div>
          )}

          {/* Recommended Crops Grid */}
          {crops.length > 0 && !selectedCrop && !loadingSteps && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-stone-900 ml-2">Recommended Crops for {district} ({selectedMonth})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {crops.map((crop, idx) => (
                  <div key={idx} className="rounded-3xl border border-stone-200 bg-[linear-gradient(180deg,_#fafaf9,_#ffffff)] p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
                    <div>
                      <h3 className="text-lg font-bold text-emerald-900">{crop.cropName}</h3>
                    </div>
                    <button
                      onClick={() => handleViewSteps(crop)}
                      className="mt-6 w-full bg-emerald-50 text-emerald-700 font-semibold py-2.5 rounded-2xl hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-sm"
                    >
                      View Cultivation Steps
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Crop Steps View */}
          {selectedCrop && !loadingSteps && (
            <div className="rounded-3xl border border-stone-200 bg-white p-6 md:p-8 shadow-sm">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <button
                  onClick={() => setSelectedCrop(null)}
                  className="text-sm text-stone-500 hover:text-stone-800 font-semibold flex items-center gap-1.5 transition-colors bg-stone-100 px-4 py-2 rounded-full"
                >
                  &larr; Back to recommendations
                </button>

                <button
                  onClick={handleAddCropToProfile}
                  disabled={isAdding || addSuccess}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-sm transition-all shadow-sm ${addSuccess
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                >
                  {isAdding ? "Saving..." : addSuccess ? "✓ Added" : "+ Add to My Profile"}
                </button>
              </div>

              <h2 className="text-3xl font-extrabold mb-8 text-stone-900 border-b border-stone-100 pb-5">
                {selectedCrop.cropName} <span className="text-xl font-medium text-stone-400">| Step-by-Step Guide</span>
              </h2>

              <div className="space-y-0 pl-2">
                {selectedCrop.steps && selectedCrop.steps.map((step: any, idx: number) => {
                  return (
                    <div key={idx} className="flex gap-6 relative pb-8 last:pb-0">
                      <div className="flex flex-col items-center mt-1">
                        <div className="w-5 h-5 rounded-full border-4 z-10 bg-emerald-500 border-white shadow"></div>
                        {idx !== selectedCrop.steps.length - 1 && (
                          <div className="w-0.5 h-full bg-stone-200 mt-1 mb-1"></div>
                        )}
                      </div>

                      <div className="flex-1 opacity-90">
                        <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
                          <h4 className="font-bold text-xl text-stone-800">{step.stage}</h4>
                          <span className="text-xs font-bold bg-stone-100 text-stone-600 px-3 py-1.5 rounded-full border border-stone-200">
                            Duration: ~{step.estimatedDays} days
                          </span>
                        </div>
                        <p className="text-stone-700 text-base leading-relaxed mb-4">{step.instructions}</p>

                        {step.alert && (
                          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-2xl shadow-sm">
                            <div className="flex items-start gap-2 text-red-800">
                              <div>
                                <span className="font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                                  <span className="text-base leading-none">⚠️</span> Preventive Alert
                                </span>
                                <p className="text-sm mt-1.5">{step.alert}</p>
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
          )}
        </div>
      </main>
    </div>
  );
}