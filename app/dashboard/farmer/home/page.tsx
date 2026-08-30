// app/dashboard/farmer/home/page.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import FarmerSidebar from '@/app/navigation/farmer/page';

interface ActiveCultivation {
  _id: string;
  cropName: string;
  district: string;
  startDate: string;
  isTracking?: boolean;
  trackingStartDate?: string;
  currentStepIndex?: number;
  currentStepStartDate?: string;
}

interface UserData {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  role: string;
  photoURL?: string;
  activeCultivations?: ActiveCultivation[];
}

interface SoilRecord {
  _id: string;
  district: string;
  location?: string;
  cropType?: string;
  createdAt: string;
  mode: 'image_only' | 'full_fusion';
  result: {
    score: number;
    classification: string;
    soilType: string;
    recommendations: string[];
    readings: {
      ph: number;
      nitrogen: number;
      phosphorus: number;
      potassium: number;
      moisture: number;
      organicMatter: number;
    };
  };
}

interface SoilRequest {
  _id: string;
  district: string;
  location?: string;
  cropType?: string;
  preferredDate?: string;
  scheduledDate?: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  imageAssessment?: {
    score: number;
    classification: string;
  };
}

interface RotationPlan {
  _id: string;
  targetCrop: string;
  currentMonth: string;
  targetEvaluation?: {
    isSuitable: boolean;
    feedback: string[];
    aiSoilRemedy?: string;
  };
  createdAt: string;
}

function getSoilStatusTone(classification?: string) {
  switch (classification) {
    case 'Excellent':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'Good':
      return 'bg-sky-100 text-sky-700 border-sky-200';
    case 'Fair':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    default:
      return 'bg-red-100 text-red-700 border-red-200';
  }
}

function getRequestTone(status: SoilRequest['status']) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'approved':
      return 'bg-sky-100 text-sky-700 border-sky-200';
    case 'rejected':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-amber-100 text-amber-700 border-amber-200';
  }
}

// Enlarged Digital Countdown
const MiniDigitalCountdown = ({ targetDate }: { targetDate: Date }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
          isExpired: false
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isExpired) {
    return (
      <div className="bg-emerald-50 text-emerald-800 px-3 py-2 rounded-xl text-xs font-bold border border-emerald-200 text-center shadow-sm animate-pulse">
        Time is up! Advance stage.
      </div>
    );
  }

  return (
    <div className="flex gap-2 text-center font-mono justify-center items-center">
      <div className="bg-gray-900 text-emerald-400 rounded-xl p-2 min-w-[42px] shadow-inner border border-gray-700">
        <span className="text-base font-bold block leading-none">{String(timeLeft.days).padStart(2, '0')}</span>
        <span className="text-[9px] text-gray-400 uppercase font-sans tracking-widest mt-1 block">Day</span>
      </div>
      <div className="text-gray-400 text-sm font-bold flex items-center pb-2">:</div>
      <div className="bg-gray-900 text-white rounded-xl p-2 min-w-[42px] shadow-inner border border-gray-700">
        <span className="text-base font-bold block leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-[9px] text-gray-400 uppercase font-sans tracking-widest mt-1 block">Hrs</span>
      </div>
      <div className="text-gray-400 text-sm font-bold flex items-center pb-2">:</div>
      <div className="bg-gray-900 text-white rounded-xl p-2 min-w-[42px] shadow-inner border border-gray-700">
        <span className="text-base font-bold block leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-[9px] text-gray-400 uppercase font-sans tracking-widest mt-1 block">Min</span>
      </div>
    </div>
  );
};

export default function FarmerHome() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [cropSteps, setCropSteps] = useState<Record<string, any[]>>({});
  const [loadingSteps, setLoadingSteps] = useState<Record<string, boolean>>({});
  const [soilHistory, setSoilHistory] = useState<SoilRecord[]>([]);
  const [soilRequests, setSoilRequests] = useState<SoilRequest[]>([]);
  const [rotationPlans, setRotationPlans] = useState<RotationPlan[]>([]);
  
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/signin');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
      fetchUserDetails(userData.id, token);
    } catch (error) {
      setPageError('Could not read local sign-in data. Please sign in again.');
      router.push('/signin');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const fetchUserDetails = async (userId: string, token: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      const [userResponse, historyResponse, requestsResponse, rotationResponse] = await Promise.all([
        fetch(`${API_URL}/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/soil-health/history`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/soil-health/requests/my`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/rotation/history`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (userResponse.status === 401 || historyResponse.status === 401 || requestsResponse.status === 401 || rotationResponse.status === 401) {
        router.push('/signin');
        return;
      }

      if (userResponse.ok) {
        const data = await userResponse.json();
        setUser(prevUser => ({ ...prevUser, ...data }));
        localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), ...data }));
        
        if (data.activeCultivations && data.activeCultivations.length > 0) {
          data.activeCultivations.forEach((cultivation: ActiveCultivation) => {
            fetchCropSteps(cultivation.cropName, cultivation._id);
          });
        }
      } else {
        setPageError('Could not load your dashboard details from the backend.');
      }

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        if (historyData.success) {
          setSoilHistory(historyData.data);
        }
      }

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        if (requestsData.success) {
          setSoilRequests(requestsData.data);
        }
      }

      if (rotationResponse.ok) {
        const rotationData = await rotationResponse.json();
        if (Array.isArray(rotationData)) {
          setRotationPlans(rotationData);
        }
      }
    } catch (error) {
      setPageError('Backend server is unavailable right now. Please make sure the backend is running on port 5000.');
    }
  };

  const fetchCropSteps = async (cropName: string, cultivationId: string) => {
    setLoadingSteps(prev => ({ ...prev, [cultivationId]: true }));
    try {
      const response = await fetch(`http://localhost:8000/get_crop_steps/${encodeURIComponent(cropName)}`);
      const data = await response.json();

      if (data.success) {
        setCropSteps(prev => ({ ...prev, [cultivationId]: data.steps }));
      }
    } catch (error) {
      setPageError('Python cultivation service is unavailable, so stage details could not be loaded.');
    } finally {
      setLoadingSteps(prev => ({ ...prev, [cultivationId]: false }));
    }
  };

  const calculateProgress = (cultivation: ActiveCultivation) => {
    if (!cultivation.isTracking || !cropSteps[cultivation._id]) return 0;
    const steps = cropSteps[cultivation._id];
    const currentIndex = cultivation.currentStepIndex || 0;
    return Math.min(Math.round((currentIndex / steps.length) * 100), 100);
  };

  const getCurrentStage = (cultivation: ActiveCultivation) => {
    if (!cultivation.isTracking || !cropSteps[cultivation._id]) return 'Not started';
    const steps = cropSteps[cultivation._id];
    const currentIndex = cultivation.currentStepIndex || 0;
    if (currentIndex >= steps.length) return 'Completed';
    return steps[currentIndex]?.stage || 'In progress';
  };

  const getDaysInCurrentStage = (cultivation: ActiveCultivation) => {
    if (!cultivation.isTracking || !cultivation.currentStepStartDate) return 0;
    const startDate = new Date(cultivation.currentStepStartDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-green-50">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const activeCultivations = user?.activeCultivations || [];
  const trackedCultivations = activeCultivations.filter(c => c.isTracking);
  const completedCultivations = activeCultivations.filter(c => 
    c.isTracking && cropSteps[c._id] && (c.currentStepIndex || 0) >= (cropSteps[c._id]?.length || 0)
  );
  const planningCultivations = activeCultivations.filter(c => !c.isTracking);
  
  const latestSoilRecord = soilHistory[0];
  const pendingSoilRequests = soilRequests.filter(request => request.status === 'pending' || request.status === 'approved');
  const completedSoilChecks = soilHistory.length;
  const averageSoilScore = soilHistory.length > 0
    ? Math.round(soilHistory.reduce((sum, record) => sum + record.result.score, 0) / soilHistory.length)
    : 0;

  const latestRotationPlan = rotationPlans.length > 0 ? rotationPlans[0] : null;

  return (
    // Single Screen Container - no page scroll allowed
    <div className="flex h-screen bg-[linear-gradient(180deg,_#f4f7f4_0%,_#f8faf8_48%,_#f3f6f4_100%)] overflow-hidden">
      <FarmerSidebar user={user} />
      
      {/* Main Content Area - strictly controlled flex structure with enlarged gaps/paddings */}
      <main className="flex-1 p-5 md:p-6 flex flex-col gap-5 overflow-hidden">
        
        {/* Error Alert */}
        {pageError && (
          <div className="shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 font-medium shadow-sm">
            {pageError}
          </div>
        )}

        {/* 1. Header & Top Stats (Row 1) */}
        <div className="shrink-0 grid grid-cols-12 gap-5 h-[16%] min-h-[120px]">
          {/* Welcome Card */}
          <div className="col-span-12 xl:col-span-4 rounded-[24px] border border-white/70 bg-[linear-gradient(135deg,_rgba(255,255,255,0.9),_rgba(244,251,246,0.95))] px-6 py-5 shadow-sm flex flex-col justify-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 leading-tight">
              Welcome, {user?.name?.split(' ')[0] || 'Farmer'}
            </h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Your farm activity overview</p>
          </div>
          
          {/* 4 Stats Cards */}
          <div className="col-span-12 xl:col-span-8 grid grid-cols-4 gap-5">
            <div className="rounded-[24px] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(247,250,248,0.98))] p-5 shadow-sm flex flex-col justify-center">
              <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Total Crops</p>
              <div className="flex items-end gap-2 mt-1">
                <p className="text-4xl font-extrabold tracking-tight text-gray-900 leading-none">{activeCultivations.length}</p>
                <span className="text-sm font-semibold text-green-600 mb-1">{trackedCultivations.length} active</span>
              </div>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(247,250,248,0.98))] p-5 shadow-sm flex flex-col justify-center">
              <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">In Progress</p>
              <div className="flex items-end gap-2 mt-1">
                <p className="text-4xl font-extrabold tracking-tight text-gray-900 leading-none">{trackedCultivations.length - completedCultivations.length}</p>
                <span className="text-sm font-semibold text-gray-500 mb-1">{completedCultivations.length} done</span>
              </div>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(247,250,248,0.98))] p-5 shadow-sm flex flex-col justify-center">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg Progress</p>
                <p className="text-xl font-bold tracking-tight text-gray-900 leading-none">
                  {trackedCultivations.length > 0 ? Math.round(trackedCultivations.reduce((acc, c) => acc + calculateProgress(c), 0) / trackedCultivations.length) : 0}%
                </p>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-200 mt-2 shadow-inner">
                <div className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 shadow-sm transition-all" 
                  style={{ width: `${trackedCultivations.length > 0 ? Math.round(trackedCultivations.reduce((acc, c) => acc + calculateProgress(c), 0) / trackedCultivations.length) : 0}%` }}>
                </div>
              </div>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(247,250,248,0.98))] p-5 shadow-sm flex flex-col justify-center">
              <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Latest Stage</p>
              <p className="text-3xl font-extrabold tracking-tight text-gray-900 mt-1 leading-none">
                {trackedCultivations.length > 0 ? `Day ${Math.max(...trackedCultivations.map(c => getDaysInCurrentStage(c)))}` : 'Day 0'}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Soil & Rotation (Row 2 - Takes moderate height) */}
        <div className="shrink-0 grid grid-cols-12 gap-5 h-[28%] min-h-[200px]">
          {/* Soil Health */}
          <section className="col-span-12 xl:col-span-6 rounded-[28px] border border-emerald-100 bg-[linear-gradient(135deg,_#f7fff8,_#ffffff_62%,_#f4fbf7)] p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">Soil Health Overview</p>
              <button onClick={() => router.push('/dashboard/farmer/soil-health')} className="rounded-full bg-white border-2 border-emerald-200 px-5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 shadow-sm transition-colors">
                View Details
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4 flex-1">
              <div className="rounded-[20px] border border-white/70 bg-white/90 p-4 shadow-sm text-center flex flex-col justify-center items-center">
                <p className="text-xs font-semibold text-gray-500 mb-1">Total Checks</p>
                <p className="text-2xl font-bold text-gray-900">{completedSoilChecks}</p>
                <p className="text-[11px] font-medium text-gray-500 mt-1">Avg Score {averageSoilScore}</p>
              </div>
              <div className="rounded-[20px] border border-white/70 bg-white/90 p-4 shadow-sm text-center flex flex-col justify-center items-center">
                <p className="text-xs font-semibold text-gray-500 mb-1">Latest Type</p>
                <p className="text-lg font-bold text-gray-900 truncate w-full">{latestSoilRecord?.result.soilType || '--'}</p>
              </div>
              <div className="rounded-[20px] border border-white/70 bg-white/90 p-4 shadow-sm text-center flex flex-col justify-center items-center">
                <p className="text-xs font-semibold text-gray-500 mb-1">Latest pH</p>
                <p className="text-2xl font-bold text-gray-900">{latestSoilRecord?.result.readings.ph || '--'}</p>
              </div>
              <div className="rounded-[20px] border border-white/70 bg-white/90 p-4 shadow-sm text-center flex flex-col justify-center items-center">
                <p className="text-xs font-semibold text-gray-500 mb-1">Requests</p>
                <p className="text-2xl font-bold text-gray-900">{pendingSoilRequests.length}</p>
              </div>
            </div>
          </section>

          {/* Rotation Plans */}
          <section className="col-span-12 xl:col-span-6 rounded-[28px] border border-blue-100 bg-[linear-gradient(135deg,_#f0f9ff,_#ffffff_62%,_#f0fdfa)] p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">Crop Rotation</p>
              <button onClick={() => router.push('/dashboard/farmer/rotation-plan')} className="rounded-full bg-white border-2 border-blue-200 px-5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 shadow-sm transition-colors">
                View Plans
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4 flex-1">
              <div className="rounded-[20px] border border-white/70 bg-white/90 p-4 shadow-sm text-center flex flex-col justify-center items-center">
                <p className="text-xs font-semibold text-gray-500 mb-1">Total Plans</p>
                <p className="text-2xl font-bold text-gray-900">{rotationPlans.length}</p>
                <p className="text-[11px] font-semibold text-green-600 mt-1">{rotationPlans.filter(p => p.targetEvaluation?.isSuitable).length} Suitable</p>
              </div>
              <div className="rounded-[20px] border border-white/70 bg-white/90 p-4 shadow-sm text-center flex flex-col justify-center items-center">
                <p className="text-xs font-semibold text-gray-500 mb-1">Target Crop</p>
                <p className="text-lg font-bold text-gray-900 truncate w-full">{latestRotationPlan?.targetCrop || '--'}</p>
              </div>
              <div className="rounded-[20px] border border-white/70 bg-white/90 p-4 shadow-sm text-center flex flex-col justify-center items-center">
                <p className="text-xs font-semibold text-gray-500 mb-1">Target Season</p>
                <p className="text-lg font-bold text-gray-900 truncate w-full">{latestRotationPlan?.currentMonth || '--'}</p>
              </div>
              <div className="rounded-[20px] border border-white/70 bg-white/90 p-3 shadow-sm flex flex-col justify-center items-center overflow-hidden">
                <p className="text-xs font-semibold text-gray-500 mb-1">AI Soil Tip</p>
                {latestRotationPlan?.targetEvaluation?.aiSoilRemedy ? (
                  <p className="text-[11px] font-medium text-gray-800 line-clamp-3 leading-snug text-center">
                    {latestRotationPlan.targetEvaluation.aiSoilRemedy}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 font-medium">No tip found</p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* 3. Bottom Row: Journey + Tracking/Actions (Takes all remaining height dynamically) */}
        <div className="flex-1 grid grid-cols-12 gap-5 min-h-0">
          
          {/* Left Side: Journey Slider */}
          <div className="col-span-12 xl:col-span-8 flex flex-col bg-[linear-gradient(180deg,_#ffffff,_#fcfdfc)] rounded-[32px] border border-gray-200 p-5 shadow-sm min-h-0">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Your Cultivation Journey</h2>
              <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">Scroll horizontally →</span>
            </div>
            
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-x-auto overflow-y-hidden flex gap-5 pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent items-start"
            >
              {activeCultivations.length > 0 ? (
                activeCultivations.map((cultivation) => {
                  const progress = calculateProgress(cultivation);
                  const currentStage = getCurrentStage(cultivation);
                  const daysInStage = getDaysInCurrentStage(cultivation);
                  const isCompleted = cultivation.isTracking && cropSteps[cultivation._id] && 
                    (cultivation.currentStepIndex || 0) >= (cropSteps[cultivation._id]?.length || 0);

                  return (
                    <div key={cultivation._id} className="flex-none w-72 rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-extrabold text-lg text-gray-900 leading-tight">{cultivation.cropName}</h3>
                          <p className="text-xs font-medium text-gray-400 mt-1">{cultivation.district}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold shadow-sm ${
                          cultivation.isTracking 
                            ? (isCompleted ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 'bg-green-100 text-green-800 border border-green-200')
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {cultivation.isTracking ? (isCompleted ? 'Finished' : 'Active') : 'Planned'}
                        </span>
                      </div>

                      {cultivation.isTracking && !isCompleted && (
                        <div className="space-y-4 mt-auto">
                          <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1.5 font-medium">
                              <span>Progress</span>
                              <span className="font-bold text-gray-900">{progress}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-100 shadow-inner">
                              <div className="h-2 rounded-full bg-emerald-500 shadow-sm" style={{ width: `${progress}%` }}></div>
                            </div>
                          </div>
                          <div className="flex justify-between items-end bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <div className="w-[70%]">
                              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">Stage</p>
                              <p className="font-bold text-sm text-gray-800 truncate pr-2">{currentStage}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">Day</p>
                              <p className="font-extrabold text-lg text-emerald-700 leading-none">{daysInStage}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {cultivation.isTracking && isCompleted && (
                        <div className="mt-auto rounded-xl bg-yellow-50 p-4 border border-yellow-100 text-center"><p className="text-sm font-extrabold text-yellow-800">🎉 Ready for Harvest</p></div>
                      )}
                      {!cultivation.isTracking && (
                        <div className="mt-auto rounded-xl bg-blue-50 p-4 border border-blue-100 text-center"><p className="text-sm font-extrabold text-blue-800">Ready to start</p></div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="w-full flex items-center justify-center h-full text-sm font-medium text-gray-400">
                  No crops added yet.
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Tracking Grid + Quick Actions */}
          <div className="col-span-12 xl:col-span-4 flex flex-col gap-5 min-h-0">
            
            {/* Active Tracking Mini Grid */}
            <div className="flex-1 flex flex-col bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(246,249,247,0.98))] rounded-[32px] border border-gray-200 p-5 shadow-sm min-h-0">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-800 mb-4 shrink-0">Active Timers</h2>
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 flex flex-col gap-3">
                {trackedCultivations.length > 0 ? (
                  trackedCultivations.map((cultivation) => {
                    const currentStage = getCurrentStage(cultivation);
                    const isCompleted = cropSteps[cultivation._id] && (cultivation.currentStepIndex || 0) >= (cropSteps[cultivation._id]?.length || 0);
                    if (isCompleted) return null;

                    let targetDate = new Date();
                    const steps = cropSteps[cultivation._id];
                    if (steps && steps.length > 0 && cultivation.currentStepStartDate) {
                      const currentIndex = cultivation.currentStepIndex || 0;
                      targetDate = new Date(cultivation.currentStepStartDate);
                      targetDate.setDate(targetDate.getDate() + (steps[currentIndex]?.estimatedDays || 0));
                    }

                    return (
                      <div key={cultivation._id} className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between shrink-0 gap-3 transition-transform hover:scale-[1.02]">
                        <div className="w-full sm:w-1/2 pr-2 text-center sm:text-left">
                          <h3 className="font-extrabold text-gray-900 text-base truncate">{cultivation.cropName}</h3>
                          <p className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full mt-1.5 inline-block truncate max-w-full border border-emerald-100">
                            {currentStage}
                          </p>
                        </div>
                        <div className="w-full sm:w-1/2 sm:pl-3 sm:border-l border-gray-100 flex justify-center">
                          <MiniDigitalCountdown targetDate={targetDate} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center text-sm font-medium text-gray-400">No active tracking at the moment</div>
                )}
              </div>
            </div>

            {/* Quick Actions Enlarged */}
            <div className="shrink-0 bg-white rounded-[32px] border border-gray-200 p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => router.push('/dashboard/farmer/cultivation')}
                  className="rounded-2xl bg-emerald-50 border border-emerald-200 py-3 text-sm font-extrabold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-sm"
                >
                  + Add New Crop
                </button>
                <button
                  onClick={() => router.push('/dashboard/farmer/cultivation-view')}
                  className="rounded-2xl bg-gray-50 border border-gray-200 py-3 text-sm font-extrabold text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
                >
                  Manage Profile
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}