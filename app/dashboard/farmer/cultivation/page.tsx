'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FarmerSidebar from '@/app/navigation/farmer/page';
import SriLankaMap from '@/app/dashboard/farmer/components/SriLankaMap';
import AnalysisLoader from '@/app/dashboard/farmer/components/SearchLoader';
import SuccessPopup from '@/app/dashboard/farmer/components/SuccessPopup';
import StepsLoaderPopup from '@/app/dashboard/farmer/components/StepsLoaderPopup';

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
  const router = useRouter();
  
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
  
  // New state for Popup
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // States kept untouched as requested
  const [showMapModal, setShowMapModal] = useState(false);
  const [showMonthModal, setShowMonthModal] = useState(false);

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
    if (!district) return alert('Please select a district from the map.');
    if (!selectedMonth) return alert('Please select a target month.');

    setLoading(true);
    setSelectedCrop(null);
    setCrops([]);

    try {
      const [res] = await Promise.all([
        fetch('http://localhost:5000/api/guidance/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ district, date: currentDate, month: selectedMonth, language })
        }),
        new Promise(resolve => setTimeout(resolve, 4000))
      ]);

      const result = await res.json();
      if (result.success) {
        setCrops(result.data);
      } else {
        alert(result.message || "Failed to fetch recommendations.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Could not connect to the backend server.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewSteps = async (crop: any) => {
    setLoadingSteps(true);
    try {
      // It has been configured to ensure a wait time of exactly 3 seconds by using `Promise.all`.
      const [res] = await Promise.all([
        fetch('http://localhost:5000/api/guidance/steps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cropName: crop.cropName, language })
        }),
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);
      
      const data = await res.json();
      if (data.success) {
        setSelectedCrop({ ...crop, steps: data.steps });
        setAddSuccess(false);
      } else {
        alert("Failed to load cultivation steps.");
      }
    } catch (error) {
      console.error(error);
      alert("Error connecting to server to fetch steps.");
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
        setShowSuccessPopup(true);
        
        // Auto navigate to cultivation view after showing popup
        setTimeout(() => {
          setShowSuccessPopup(false);
          setAddSuccess(false);
          router.push('/dashboard/farmer/cultivation-view');
        }, 2500);
      } else {
        alert(result.message || "Failed to add crop to profile");
      }
    } catch (error) {
      console.error("Error adding crop:", error);
      alert("An error occurred while communicating with the server.");
    } finally {
      setIsAdding(false);
    }
  };

  const hasProcessedData = crops.length > 0 && !selectedCrop;

  return (
    // Changed to flex-col md:flex-row to stack the navigation on top for mobile
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans relative">
      
      {/* Show the popup component conditionally */}
      {showSuccessPopup && selectedCrop && (
        <SuccessPopup cropName={selectedCrop.cropName} />
      )}

      {/* Pass district to loader to show the animation on the selected map region */}
      {loading && <AnalysisLoader district={district} />}

      {/* Removed "hidden md:block" and added sticky classes for mobile responsiveness */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 shadow-sm z-30 shrink-0 sticky top-0 md:relative">
        <FarmerSidebar user={currentUser || { name: 'Guest', role: 'farmer' }} />
      </aside>

      <main className="flex-1 p-4 md:p-6 w-full max-w-7xl mx-auto space-y-4 md:space-y-6 overflow-y-auto flex flex-col">
        
        {/* Header Banner - Size reduced (paddings & text sizes) */}
        <div className="bg-gradient-to-r from-green-800 to-emerald-600 rounded-xl md:rounded-2xl p-4 md:p-5 shadow-md text-white shrink-0">
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Cultivation Guidance & Recommendation</h1>
          <p className="text-green-50 mt-1 text-sm font-medium opacity-90 max-w-2xl">
            Get AI-powered, stage-by-stage cultivation plans tailored to your district and chosen Month.
          </p>
        </div>

        {/* 1. INITIAL VIEW (Map Select + Form) */}
        {!hasProcessedData && !selectedCrop && (
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-center justify-center flex-1 animate-in fade-in duration-500">
            
            {/* Left Side: Big Interactive Map (Without Borders) */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
              <div className="text-center mb-2 md:mb-4">
                <h2 className="text-lg md:text-xl font-bold text-slate-800">Select Your District</h2>
                <p className="text-xs md:text-sm text-slate-500">Tap on the map to pinpoint your farm location</p>
              </div>
              <div className="w-full flex justify-center">
                <SriLankaMap 
                  selectedDistrict={district} 
                  onSelectDistrict={setDistrict} 
                  className="w-full max-w-[220px] sm:max-w-[280px] lg:max-w-[320px] drop-shadow-xl" 
                />
              </div>
            </div>

            {/* Right Side: Selection Controls */}
            <div className="w-full lg:w-1/2 max-w-md mt-4 lg:mt-0">
              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-xl border border-slate-100">
                
                {/* Chosen District Display - Compacted */}
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] md:text-xs font-bold text-emerald-600 uppercase tracking-widest mb-0.5">Selected Location</p>
                    <p className="text-lg md:text-xl font-extrabold text-emerald-900">{district ? `${district} District` : 'None Selected'}</p>
                  </div>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors ${district ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-200 text-slate-400'}`}>
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                </div>

                <h3 className="text-base md:text-lg font-bold text-slate-800 mb-3 border-b pb-2">2. Set Parameters</h3>
                
                {/* Target Season / Month Grid - Compacted */}
                <div className="mb-4">
                  <label className="text-[10px] md:text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-2">Target Season (Month)</label>
                  <div className="grid grid-cols-4 gap-1.5 md:gap-2">
                    {MONTHS.map((m, idx) => {
                      const isSelected = selectedMonth === m;
                      return (
                        <button
                          key={m}
                          onClick={() => setSelectedMonth(m)}
                          className={`p-1.5 md:p-2 rounded-lg text-center text-[10px] md:text-xs font-bold transition-all duration-200 ${
                            isSelected 
                              ? 'bg-emerald-600 text-white shadow-md scale-105 border border-emerald-600' 
                              : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50'
                          }`}
                        >
                          {m.substring(0, 3)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Language Selection - Compacted */}
                <div className="mb-5 flex flex-col">
                  <label className="text-[10px] md:text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Report Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2 md:p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm font-semibold cursor-pointer hover:border-emerald-400 text-sm"
                  >
                    <option value="English">English</option>
                    <option value="Sinhala">Sinhala (සිංහල)</option>
                  </select>
                </div>

                {/* Submit Button - Compacted */}
                <button
                  onClick={handleProcess}
                  disabled={loading || !district || !selectedMonth}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 md:py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-1 disabled:bg-slate-300 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed flex justify-center items-center gap-2 text-sm md:text-base"
                >
                  Generate Recommendations
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. PROCESSED VIEW (Small map in corner without border + Results Grid) */}
        {hasProcessedData && (
          <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            
            {/* Corner Summary Card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
              
              <div className="w-32 md:w-48 shrink-0 flex items-center justify-center">
                <SriLankaMap selectedDistrict={district} onSelectDistrict={setDistrict} className="w-full" />
              </div>
              
              <div className="flex-1 w-full space-y-4 text-center md:text-left mt-2 md:mt-0">
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">Analysis Complete</h2>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-sm px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-emerald-200">
                     {district} District
                  </span>
                  <span className="bg-blue-100 text-blue-800 font-bold text-sm px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-blue-200">
                     {selectedMonth}
                  </span>
                  <span className="bg-orange-100 text-orange-800 font-bold text-sm px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-orange-200">
                     {language}
                  </span>
                </div>
                
                <button 
                  onClick={() => setCrops([])} 
                  className="mt-4 text-sm md:text-base font-extrabold text-emerald-600 hover:text-emerald-800 flex items-center justify-center md:justify-start gap-1.5 underline underline-offset-4 transition-colors w-full md:w-auto"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Search
                </button>
              </div>
            </div>
            
            <hr className="border-slate-200" />

            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">Recommended Crops</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {crops.map((crop, idx) => (
                <div key={idx} className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 flex flex-col justify-between h-full group">
                  <div>
                    <h3 className="text-lg md:text-xl font-extrabold text-slate-800 group-hover:text-emerald-700 transition-colors">{crop.cropName}</h3>
                    <p className="text-xs md:text-sm text-slate-600 mt-2 md:mt-3 leading-relaxed">{crop.reasoning}</p>
                  </div>
                  <button
                    onClick={() => handleViewSteps(crop)}
                    className="mt-5 md:mt-6 w-full bg-emerald-50 text-emerald-700 font-bold py-2.5 md:py-3 rounded-2xl hover:bg-emerald-600 hover:text-white border-none transition-all duration-300 text-sm md:text-base"
                  >
                    View Cultivation Steps
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Steps Loading State - Changed to use the new imported Popup Component */}
        {loadingSteps && <StepsLoaderPopup />}

        {/* 3. FINAL VIEW (Step-by-Step Timeline) - COMPACT & FULL WIDTH UI */}
        {selectedCrop && !loadingSteps && (
          <div className="bg-white p-5 md:p-7 rounded-[1.5rem] shadow-lg border border-slate-100/60 animate-in slide-in-from-right-8 duration-500 w-full">
            
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-3 border-b border-slate-100 pb-5">
              <button
                onClick={() => setSelectedCrop(null)}
                className="text-slate-600 hover:text-emerald-800 font-semibold flex items-center gap-1.5 transition-all bg-slate-100 hover:bg-emerald-100/70 px-4 py-2 rounded-full text-xs md:text-sm w-full sm:w-auto justify-center"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back
              </button>

              <button
                onClick={handleAddCropToProfile}
                disabled={isAdding || addSuccess || showSuccessPopup}
                className={`flex items-center justify-center gap-1.5 px-5 py-2 rounded-full font-bold text-xs md:text-sm transition-all w-full sm:w-auto ${
                  addSuccess
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-800 text-white hover:bg-emerald-600 hover:shadow-md hover:-translate-y-0.5'
                  }`}
              >
                {isAdding ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Saving...
                  </>
                ) : addSuccess ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    Added
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    Add to Profile
                  </>
                )}
              </button>
            </div>

            {/* Title Section */}
            <div className="mb-8 md:mb-10 text-center sm:text-left">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 font-bold text-[10px] md:text-xs uppercase tracking-widest rounded-full mb-2">
                Cultivation Guide
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                {selectedCrop.cropName}
              </h2>
            </div>

            {/* Timeline - Compact Version */}
            <div className="relative border-l-2 border-dashed border-slate-200 ml-3 md:ml-4 space-y-4 md:space-y-6 my-4">
              {selectedCrop.steps && selectedCrop.steps.map((step: any, idx: number) => {
                return (
                  <div key={idx} className="relative pl-6 md:pl-8 group">
                    
                    {/* Timeline Dot */}
                    <div className="absolute -left-[13px] md:-left-[15px] top-2.5 md:top-3 flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-white border-[2px] border-emerald-500 shadow-sm group-hover:scale-110 group-hover:bg-emerald-50 transition-all duration-300 z-10">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 group-hover:bg-emerald-600"></div>
                    </div>

                    {/* Step Card */}
                    <div className="bg-white border border-slate-100 p-4 md:p-5 rounded-2xl shadow-sm group-hover:shadow-md group-hover:border-emerald-100 transition-all duration-300 relative overflow-hidden">
                      
                      {/* Decorative Top Accent */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-300 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2 md:mb-3">
                        <h4 className="font-extrabold text-base md:text-lg text-slate-800 leading-tight">
                          {step.stage}
                        </h4>
                        <div className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold border border-slate-100 shrink-0">
                          <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          ~{step.estimatedDays} Days
                        </div>
                      </div>
                      
                      <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                        {step.instructions}
                      </p>

                      {/* Alert / Warning Box */}
                      {step.alert && (
                        <div className="mt-3 md:mt-4 bg-rose-50/50 border border-rose-100/80 p-3 rounded-xl flex items-start gap-2.5">
                          <div className="bg-white p-1 rounded-full shadow-sm shrink-0 mt-0.5">
                            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          </div>
                          <div>
                            <span className="block font-bold text-[9px] md:text-[10px] text-rose-800 uppercase tracking-widest mb-0.5">
                              Important Notice
                            </span>
                            <p className="text-xs md:text-sm text-rose-700/90 leading-snug font-medium">
                              {step.alert}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* End Indicator */}
            <div className="flex justify-center mt-6 relative z-10">
               <div className="bg-slate-50 text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest px-4 py-1.5 rounded-full border border-slate-200">
                 End of Guide
               </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}