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
    <div className="flex min-h-screen bg-white">
      <aside className="w-64 bg-white border-r border-gray-200 shadow-sm">
        <FarmerSidebar user={currentUser || { name: 'Guest', role: 'farmer' }} />
      </aside>

      <main className="flex-1 p-6 max-w-7xl mx-auto space-y-8">
        {pageError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {pageError}
          </div>
        )}
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold text-green-800">Cultivation Guidance & Recommendation</h1>
          <p className="text-gray-600 mt-2">Get AI-powered, stage-by-stage cultivation plans tailored to your district and chosen season.</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-5 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-black block text-sm font-semibold text-gray-700 mb-2">Location (District)</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="text-black w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="">Select District</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Target Month / Season</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-black w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            >
              {MONTHS.map(m => (
                <option key={m} value={m}>
                  {m} {m === MONTHS[new Date().getMonth()] ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-black w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="English">English</option>
              <option value="Sinhala">Sinhala</option>
            </select>
          </div>

          <button
            onClick={handleProcess}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-8 rounded-lg transition-all shadow-md disabled:bg-gray-400 disabled:shadow-none"
          >
            {loading ? 'Analyzing AI Model...' : 'Process'}
          </button>
        </div>

        {loadingSteps && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700 mx-auto"></div>
            <p className="mt-4 text-green-800 font-semibold text-lg">AI is preparing your cultivation steps...</p>
          </div>
        )}

        {crops.length > 0 && !selectedCrop && !loadingSteps && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Recommended Crops for {district} ({selectedMonth})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {crops.map((crop, idx) => (
                <div key={idx} className="bg-white p-5 rounded-xl border border-green-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-lg font-bold text-green-900">{crop.cropName}</h3>
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">{crop.reasoning}</p>
                  </div>
                  <button
                    onClick={() => handleViewSteps(crop)}
                    className="mt-6 w-full bg-green-50 text-green-700 font-semibold py-2.5 rounded-lg hover:bg-green-100 border border-green-200 transition-colors"
                  >
                    View Cultivation Steps
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedCrop && !loadingSteps && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setSelectedCrop(null)}
                className="text-sm text-green-600 hover:text-green-800 font-semibold flex items-center gap-1"
              >
                &larr; Back to recommendations
              </button>

              <button
                onClick={handleAddCropToProfile}
                disabled={isAdding || addSuccess}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${addSuccess
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                  }`}
              >
                {isAdding ? "Saving..." : addSuccess ? "✓ Added" : "+ Add to My Profile"}
              </button>
            </div>

            <h2 className="text-3xl font-extrabold mb-8 text-gray-900 border-b pb-4">
              {selectedCrop.cropName} <span className="text-xl font-normal text-gray-500">| Step-by-Step Guide</span>
            </h2>

            <div className="space-y-0">
              {selectedCrop.steps && selectedCrop.steps.map((step: any, idx: number) => {
                return (
                  <div key={idx} className="flex gap-6 relative">
                    <div className="flex flex-col items-center">
                      <div className="w-5 h-5 rounded-full border-4 z-10 bg-green-500 border-white shadow"></div>
                      {idx !== selectedCrop.steps.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-1 mb-1"></div>
                      )}
                    </div>

                    <div className="flex-1 pb-10 opacity-90">
                      <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
                        <h4 className="font-bold text-xl text-gray-800">{step.stage}</h4>
                        <span className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full border">
                          Duration: ~{step.estimatedDays} days
                        </span>
                      </div>
                      <p className="text-gray-700 text-base leading-relaxed mb-4">{step.instructions}</p>

                      {step.alert && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                          <div className="flex items-start gap-2 text-red-800">
                            <div>
                              <span className="font-bold text-sm uppercase tracking-wide">Preventive Alert</span>
                              <p className="text-sm mt-1">{step.alert}</p>
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
      </main>
    </div>
  );
}
