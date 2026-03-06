'use client';

import { useState, useEffect } from 'react';
import FarmerSidebar from '@/app/navigation/farmer/page'; // adjust path if needed
// If you have a custom hook for the current user, import it, e.g.:
// import { useAuth } from '@/context/AuthContext';

// The 25 Districts of Sri Lanka
const DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha", 
  "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", 
  "Mannar", "Matale", "Matara", "Moneragala", "Mullaitivu", "Nuwara Eliya", 
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
];

export default function CultivationPage() {
  // Input States
  const [district, setDistrict] = useState('');
  const [language, setLanguage] = useState('English');
  const [currentDate, setCurrentDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState('');
  
  // Data States
  const [loading, setLoading] = useState(false);
  const [crops, setCrops] = useState<any[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<any>(null);
  
  // Simulation State for Novelty 1 (Stage-Aware Guidance)
  const [trackingStarted, setTrackingStarted] = useState(false);

  // Get current user – replace with your actual authentication logic
  // const { user } = useAuth();
  // For demo, we'll create a mock user
  const user = { name: 'Farmer', role: 'farmer' };

  // Auto-detect Date and Month on component mount
  useEffect(() => {
    const d = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    // Formats date like "March 6, 2026"
    setCurrentDate(d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    setCurrentMonth(monthNames[d.getMonth()]);
  }, []);

  const handleProcess = async () => {
    if (!district) return alert('Please select a district.');
    setLoading(true);
    setSelectedCrop(null); // Reset selection if searching again
    
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

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar – fixed width, white background */}
      <aside className="w-64 bg-white border-r border-gray-200 shadow-sm">
        <FarmerSidebar user={user} />
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto space-y-8">
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold text-green-800">Cultivation Guidance & Recommendation</h1>
          <p className="text-gray-600 mt-2">Get AI-powered, stage-by-stage cultivation plans tailored to your district and the current season.</p>
        </div>
        
        {/* --- INPUT PANEL --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-5 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Location (District)</label>
            <select 
              value={district} 
              onChange={(e) => setDistrict(e.target.value)} 
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="">Select District</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Detected Date</label>
            <input 
              type="text" 
              value={currentDate} 
              disabled 
              className="w-full border border-gray-200 p-2.5 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed" 
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)} 
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
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
            {loading ? 'Analyzing AI...' : 'Process'}
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
                      setTrackingStarted(false); // Reset tracking state for new crop
                    }} 
                    className="mt-6 w-full bg-green-50 text-green-700 font-semibold py-2.5 rounded-lg hover:bg-green-100 border border-green-200 transition-colors"
                  >
                    How Planting crops
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
              <button 
                onClick={() => setSelectedCrop(null)} 
                className="text-sm text-green-600 hover:text-green-800 font-semibold flex items-center gap-1"
              >
                &larr; Back to recommendations
              </button>
              
              {/* NOVELTY 1: Stage-Aware Guidance Tracker Simulation */}
              <button 
                onClick={() => setTrackingStarted(!trackingStarted)}
                className={`px-4 py-2 rounded-lg font-bold text-sm ${trackingStarted ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-green-600 text-white hover:bg-green-700'}`}
              >
                {trackingStarted ? 'Tracking Active (Day 1)' : 'Start Cultivation Tracker'}
              </button>
            </div>

            <h2 className="text-3xl font-extrabold mb-8 text-gray-900 border-b pb-4">
              {selectedCrop.cropName} <span className="text-xl font-normal text-gray-500">| Step-by-Step Guide</span>
            </h2>
            
            {/* NOVELTY 2: Visual Planning Timeline */}
            <div className="space-y-0">
              {selectedCrop.steps.map((step: any, idx: number) => {
                // Simulate current stage highlighting if tracking is started
                const isCurrentStage = trackingStarted && idx === 0; 
                
                return (
                  <div key={idx} className="flex gap-6 relative">
                    {/* Timeline Graphic */}
                    <div className="flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full border-4 z-10 ${isCurrentStage ? 'bg-blue-500 border-blue-200 animate-pulse' : 'bg-green-500 border-white shadow'}`}></div>
                      {/* Hide the line on the last item */}
                      {idx !== selectedCrop.steps.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-1 mb-1"></div>
                      )}
                    </div>
                    
                    {/* Content Container */}
                    <div className={`flex-1 pb-10 ${isCurrentStage ? 'opacity-100' : 'opacity-90'}`}>
                      <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
                        <h4 className={`font-bold text-xl ${isCurrentStage ? 'text-blue-700' : 'text-gray-800'}`}>
                          {step.stage} {isCurrentStage && " (Current Phase)"}
                        </h4>
                        <span className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full border">
                          Duration: ~{step.estimatedDays} days
                        </span>
                      </div>
                      
                      <p className="text-gray-700 text-base leading-relaxed mb-4">{step.instructions}</p>
                      
                      {/* NOVELTY 3: Stage-Based Alert System */}
                      {step.alert && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                          <div className="flex items-start gap-2 text-red-800">
                            <span className="text-lg">🚨</span>
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