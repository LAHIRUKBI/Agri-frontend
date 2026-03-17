'use client';

import { useState, useEffect } from 'react';
import FarmerSidebar from '@/app/navigation/farmer/page';

const DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha", 
  "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", 
  "Mannar", "Matale", "Matara", "Moneragala", "Mullaitivu", "Nuwara Eliya", 
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
];

export default function CultivationPage() {
  const [district, setDistrict] = useState('');
  const [language, setLanguage] = useState('English');
  const [currentDate, setCurrentDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [crops, setCrops] = useState<any[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<any>(null);
  
  // Tracking States
  const [activeTracking, setActiveTracking] = useState<any>(null);
  const [digitalTime, setDigitalTime] = useState<string>("Calculating...");

  const user = { id: 'farmer_001', name: 'Farmer', role: 'farmer' };

  useEffect(() => {
    const d = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    setCurrentDate(d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    setCurrentMonth(monthNames[d.getMonth()]);
  }, []);

  // --- LIVE DIGITAL COUNTDOWN TIMER ---
  useEffect(() => {
    if (!activeTracking || activeTracking.status === 'Completed') return;

    const currentStep = activeTracking.steps[activeTracking.currentStepIndex];
    if (!currentStep || !currentStep.endTime) return;

    const targetTime = new Date(currentStep.endTime).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetTime - now;

      if (distance < 0) {
        setDigitalTime("00:00:00:00 - Time to Complete!");
        clearInterval(interval);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Format as digital string: DD:HH:MM:SS
        setDigitalTime(
          `${days.toString().padStart(2, '0')}d : ${hours.toString().padStart(2, '0')}h : ${minutes.toString().padStart(2, '0')}m : ${seconds.toString().padStart(2, '0')}s`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTracking]);

  const handleProcess = async () => {
    if (!district) return alert('Please select a district.');
    setLoading(true);
    setSelectedCrop(null); 
    setActiveTracking(null);
    
    try {
      const res = await fetch('http://localhost:5000/api/guidance/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ district, date: currentDate, month: currentMonth, language })
      });
      
      const result = await res.json();
      if (result.success) {
        setCrops(result.data);
      } else {
        alert("Failed to fetch recommendations.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Could not connect to the backend server.");
    } finally {
      setLoading(false);
    }
  };

  // --- CONNECT TO NODE.JS START TRACKING API ---
  const handleStartTracking = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/tracking/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          cropName: selectedCrop.cropName,
          district: district,
          steps: selectedCrop.steps
        })
      });
      
      const result = await res.json();
      if (result.success) {
        setActiveTracking(result.data); // Store the returned DB object with real dates
        alert("Tracking started successfully!");
      }
    } catch (error) {
      alert("Failed to start tracking.");
    }
  };

  // --- CONNECT TO NODE.JS COMPLETE STEP API ---
  const handleCompleteStep = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/tracking/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          trackingId: activeTracking._id, 
          stepIndex: activeTracking.currentStepIndex 
        })
      });
      
      const result = await res.json();
      if (result.success) {
        setActiveTracking(result.tracking); // Update UI with next step
        if (result.tracking.status === 'Completed') {
          alert("Congratulations! All cultivation steps are complete.");
        }
      }
    } catch (error) {
      alert("Failed to update step.");
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-64 bg-white border-r border-gray-200 shadow-sm">
        <FarmerSidebar user={user} />
      </aside>

      <main className="flex-1 p-6 max-w-7xl mx-auto space-y-8">
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold text-green-800">Cultivation Guidance & Recommendation</h1>
          <p className="text-gray-600 mt-2">Get AI-powered, stage-by-stage cultivation plans tailored to your district and the current season.</p>
        </div>
        
        {/* --- INPUT PANEL --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-5 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-black block text-sm font-semibold text-gray-700 mb-2">Location (District)</label>
            <select value={district} onChange={(e) => setDistrict(e.target.value)} className="text-black w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
              <option value="">Select District</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Detected Date</label>
            <input type="text" value={currentDate} disabled className="w-full border border-gray-200 p-2.5 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed" />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="text-black w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
              <option value="English">English</option>
              <option value="Sinhala">Sinhala</option>
            </select>
          </div>

          <button onClick={handleProcess} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-8 rounded-lg transition-all shadow-md disabled:bg-gray-400">
            {loading ? 'Analyzing...' : 'Process'}
          </button>
        </div>

        {/* --- CROP RECOMMENDATIONS GRID --- */}
        {crops.length > 0 && !selectedCrop && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Recommended Crops for {district} ({currentMonth})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {crops.map((crop, idx) => (
                <div key={idx} className="bg-white p-5 rounded-xl border border-green-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-lg font-bold text-green-900">{crop.cropName}</h3>
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">{crop.reasoning}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedCrop(crop);
                      setActiveTracking(null);
                    }} 
                    className="mt-6 w-full bg-green-50 text-green-700 font-semibold py-2.5 rounded-lg hover:bg-green-100 border border-green-200 transition-colors"
                  >
                    View Planting Steps
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- DETAILED STEP-BY-STEP VIEW --- */}
        {selectedCrop && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => setSelectedCrop(null)} className="text-sm text-green-600 hover:text-green-800 font-semibold flex items-center gap-1">
                &larr; Back to recommendations
              </button>
              
              {!activeTracking ? (
                <button onClick={handleStartTracking} className="px-4 py-2 rounded-lg font-bold text-sm bg-green-600 text-white hover:bg-green-700">
                  Start Cultivation Tracker
                </button>
              ) : (
                <span className="px-4 py-2 rounded-lg font-bold text-sm bg-blue-100 text-blue-800 border border-blue-300">
                  {activeTracking.status === 'Completed' ? 'Cultivation Finished' : `Tracking Step ${activeTracking.currentStepIndex + 1}`}
                </span>
              )}
            </div>

            <h2 className="text-3xl font-extrabold mb-8 text-gray-900 border-b pb-4">
              {selectedCrop.cropName} <span className="text-xl font-normal text-gray-500">| Step-by-Step Guide</span>
            </h2>
            
            <div className="space-y-0">
              {selectedCrop.steps.map((step: any, idx: number) => {
                const isTrackingActive = activeTracking != null;
                const isCurrentStage = isTrackingActive && idx === activeTracking.currentStepIndex; 
                const isPastStage = isTrackingActive && idx < activeTracking.currentStepIndex;
                
                return (
                  <div key={idx} className={`flex gap-6 relative ${isPastStage ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full border-4 z-10 ${isCurrentStage ? 'bg-blue-500 border-blue-200 animate-pulse' : 'bg-green-500 border-white shadow'}`}></div>
                      {idx !== selectedCrop.steps.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-1 mb-1"></div>
                      )}
                    </div>
                    
                    <div className={`flex-1 pb-10 ${isCurrentStage ? 'opacity-100' : 'opacity-90'}`}>
                      <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
                        <h4 className={`font-bold text-xl ${isCurrentStage ? 'text-blue-700' : 'text-gray-800'}`}>
                          {step.stage || step.Stage} {isCurrentStage && " (Active)"}
                        </h4>
                        
                        {/* DIGITAL TIMER DISPLAY */}
                        {isCurrentStage ? (
                          <span className="text-sm font-bold bg-blue-600 text-white font-mono px-4 py-1.5 rounded-lg shadow-inner tracking-widest">
                            ⏱ {digitalTime}
                          </span>
                        ) : (
                          <span className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full border">
                            Duration: ~{step.estimatedDays || step.Estimated_Days} days
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-700 text-base leading-relaxed mb-4">{step.instructions || step.Instructions}</p>
                      
                      {(step.alert || step.Alert) && (step.alert !== "None" && step.Alert !== "None") && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-4">
                          <div className="flex items-start gap-2 text-red-800">
                            <span className="text-lg">🚨</span>
                            <div>
                              <span className="font-bold text-sm uppercase tracking-wide">Preventive Alert</span>
                              <p className="text-sm mt-1">{step.alert || step.Alert}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* MARK AS DONE BUTTON */}
                      {isCurrentStage && (
                        <button 
                          onClick={handleCompleteStep}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow transition-colors"
                        >
                          Complete Step & Move to Next
                        </button>
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