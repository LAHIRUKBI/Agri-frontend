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

export default function FarmerHome() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [cropSteps, setCropSteps] = useState<Record<string, any[]>>({});
  const [loadingSteps, setLoadingSteps] = useState<Record<string, boolean>>({});
  const [soilHistory, setSoilHistory] = useState<SoilRecord[]>([]);
  const [soilRequests, setSoilRequests] = useState<SoilRequest[]>([]);
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is authenticated
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
      const [userResponse, historyResponse, requestsResponse] = await Promise.all([
        fetch(`${API_URL}/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch(`${API_URL}/soil-health/history`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch(`${API_URL}/soil-health/requests/my`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ]);

      if (userResponse.status === 401 || historyResponse.status === 401 || requestsResponse.status === 401) {
        router.push('/signin');
        return;
      }

      if (userResponse.ok) {
        const data = await userResponse.json();
        setUser(prevUser => ({ ...prevUser, ...data }));
        localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), ...data }));
        
        // Fetch steps for active cultivations
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
          <div className="w-12 h-12 border-3 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading your dashboard...</p>
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

  return (
    <div className="flex min-h-screen bg-[linear-gradient(180deg,_#f4f7f4_0%,_#f8faf8_48%,_#f3f6f4_100%)]">
      <FarmerSidebar user={user} />
      
      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {pageError && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {pageError}
          </div>
        )}
        {/* Welcome Section - Smaller */}
        <div className="mb-6 rounded-[28px] border border-white/70 bg-[linear-gradient(135deg,_rgba(255,255,255,0.9),_rgba(244,251,246,0.95))] px-5 py-5 shadow-[0_20px_45px_-32px_rgba(22,101,52,0.28)]">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'Farmer'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Here&apos;s your farm activity overview</p>
        </div>

        {/* Stats Grid - Smaller and more compact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* Active Crops */}
          <div className="rounded-[22px] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(247,250,248,0.98))] p-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)]">
            <p className="text-xs font-medium text-gray-500 mb-1">Total Crops</p>
            <p className="text-2xl font-bold tracking-tight text-gray-900">{activeCultivations.length}</p>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-green-600">{trackedCultivations.length} tracking</span>
              <span className="text-gray-300">|</span>
              <span className="text-amber-600">{planningCultivations.length} planned</span>
            </div>
          </div>

          {/* In Progress */}
          <div className="rounded-[22px] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(247,250,248,0.98))] p-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)]">
            <p className="text-xs font-medium text-gray-500 mb-1">In Progress</p>
            <p className="text-2xl font-bold tracking-tight text-gray-900">{trackedCultivations.length - completedCultivations.length}</p>
            <p className="text-xs text-gray-500 mt-1">{completedCultivations.length} completed</p>
          </div>

          {/* Average Progress */}
          <div className="rounded-[22px] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(247,250,248,0.98))] p-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)]">
            <p className="text-xs font-medium text-gray-500 mb-1">Avg Progress</p>
            <p className="text-2xl font-bold tracking-tight text-gray-900">
              {trackedCultivations.length > 0 
                ? Math.round(trackedCultivations.reduce((acc, c) => acc + calculateProgress(c), 0) / trackedCultivations.length) 
                : 0}%
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
              <div 
                className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 transition-all duration-500" 
                style={{ width: `${trackedCultivations.length > 0 
                  ? Math.round(trackedCultivations.reduce((acc, c) => acc + calculateProgress(c), 0) / trackedCultivations.length) 
                  : 0}%` 
                }}
              ></div>
            </div>
          </div>

          {/* Latest Stage Day */}
          <div className="rounded-[22px] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(247,250,248,0.98))] p-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)]">
            <p className="text-xs font-medium text-gray-500 mb-1">Latest Stage</p>
            <p className="text-2xl font-bold tracking-tight text-gray-900">
              {trackedCultivations.length > 0 
                ? `Day ${Math.max(...trackedCultivations.map(c => getDaysInCurrentStage(c)))}` 
                : 'Day 0'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Current stage</p>
          </div>
        </div>

        <section className="mb-6 rounded-[24px] border border-emerald-100 bg-[linear-gradient(135deg,_#f7fff8,_#ffffff_62%,_#f4fbf7)] p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-emerald-700">Soil Health Overview</p>
              <h2 className="mt-1 text-sm font-semibold text-gray-800">Latest score and request status</h2>
            </div>
            <button
              onClick={() => router.push('/dashboard/farmer/soil-health')}
              className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Open Soil Health
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-white/70 bg-white/90 p-3 shadow-sm">
              <p className="text-xs font-medium text-gray-500">Assessments</p>
              <p className="mt-1 text-xl font-bold text-gray-800">{completedSoilChecks}</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/90 p-3 shadow-sm">
              <p className="text-xs font-medium text-gray-500">Average soil score</p>
              <p className="mt-1 text-xl font-bold text-gray-800">{averageSoilScore}</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/90 p-3 shadow-sm">
              <p className="text-xs font-medium text-gray-500">Active requests</p>
              <p className="mt-1 text-xl font-bold text-gray-800">{pendingSoilRequests.length}</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/90 p-3 shadow-sm">
              <p className="text-xs font-medium text-gray-500">Latest soil type</p>
              <p className="mt-1 text-sm font-bold text-gray-800">{latestSoilRecord?.result.soilType || 'No data yet'}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.05fr,0.95fr]">
            <div className="rounded-[22px] border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-gray-800">Latest soil snapshot</h3>
                {latestSoilRecord && (
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${getSoilStatusTone(latestSoilRecord.result.classification)}`}>
                    {latestSoilRecord.result.classification}
                  </span>
                )}
              </div>

              {latestSoilRecord ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-[0.7fr,1fr,0.7fr]">
                  <div className="rounded-2xl bg-gray-900 px-4 py-4 text-white">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">Score</p>
                    <p className="mt-1 text-3xl font-bold">{latestSoilRecord.result.score}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                    <p className="text-[11px] text-gray-500">Field</p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {latestSoilRecord.district}
                      {latestSoilRecord.location ? ` | ${latestSoilRecord.location}` : ''}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                    <p className="text-[11px] text-gray-500">pH</p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">{latestSoilRecord.result.readings.ph}</p>
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                  No soil assessments yet.
                </div>
              )}
            </div>

            <div className="rounded-[22px] border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-gray-800">Latest request</h3>
                {soilRequests[0] && (
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getRequestTone(soilRequests[0].status)}`}>
                    {soilRequests[0].status === 'approved' ? 'Scheduled' : soilRequests[0].status}
                  </span>
                )}
              </div>

              {soilRequests[0] ? (
                <div className="mt-3 space-y-3">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
                    <p className="text-sm font-semibold text-gray-800">
                      {soilRequests[0].district}
                      {soilRequests[0].location ? ` | ${soilRequests[0].location}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{soilRequests[0].cropType || 'General field check'}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <p>Preferred: {soilRequests[0].preferredDate ? new Date(soilRequests[0].preferredDate).toLocaleDateString() : 'Not set'}</p>
                      <p>Visit: {soilRequests[0].scheduledDate ? new Date(soilRequests[0].scheduledDate).toLocaleDateString() : 'Pending'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {pendingSoilRequests.length > 0
                      ? 'You have active soil visit requests in progress.'
                      : 'Open Soil Health to create or review requests.'}
                  </p>
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                  No soil sensor requests yet.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Active Cultivations Section - Horizontal Scroll */}
        {activeCultivations.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800">Your Cultivation Journey</h2>
            </div>

            {/* Horizontal Scroll Container */}
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto gap-3 pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              style={{ scrollbarWidth: 'thin' }}
            >
              {activeCultivations.map((cultivation) => {
                const progress = calculateProgress(cultivation);
                const currentStage = getCurrentStage(cultivation);
                const daysInStage = getDaysInCurrentStage(cultivation);
                const isCompleted = cultivation.isTracking && 
                  cropSteps[cultivation._id] && 
                  (cultivation.currentStepIndex || 0) >= (cropSteps[cultivation._id]?.length || 0);

                return (
                  <div 
                    key={cultivation._id} 
                    className="flex-none w-64 rounded-[22px] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(246,249,247,0.98))] p-3 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_42px_-28px_rgba(22,101,52,0.25)]"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-sm text-gray-800">{cultivation.cropName}</h3>
                        <p className="text-xs text-gray-400">{cultivation.district}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        {cultivation.isTracking ? (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            isCompleted 
                              ? 'bg-yellow-100 text-yellow-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {isCompleted ? 'Done' : 'Active'}
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                            Plan
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    {cultivation.isTracking && !isCompleted && (
                      <div className="space-y-2">
                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                            <span>Progress</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <div className="h-1 w-full rounded-full bg-gray-200">
                            <div 
                              className="h-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 transition-all duration-500" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Stage Info */}
                        <div className="flex justify-between text-xs">
                          <div>
                            <p className="text-[10px] text-gray-400">Stage</p>
                            <p className="text-xs font-medium text-gray-700 truncate max-w-[100px]" title={currentStage}>
                              {currentStage.length > 15 ? currentStage.substring(0, 12) + '...' : currentStage}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400">Day</p>
                            <p className="text-xs font-medium text-gray-700">{daysInStage}</p>
                          </div>
                        </div>

                        {loadingSteps[cultivation._id] && (
                          <p className="text-[10px] text-gray-400 italic">Loading...</p>
                        )}
                      </div>
                    )}

                    {cultivation.isTracking && isCompleted && (
                      <div className="mt-1 rounded-2xl border border-yellow-100 bg-yellow-50 p-2">
                        <p className="text-xs font-medium text-yellow-700">Ready for Harvest</p>
                      </div>
                    )}

                    {!cultivation.isTracking && (
                      <div className="mt-1 rounded-2xl border border-blue-100 bg-blue-50 p-2">
                        <p className="text-xs font-medium text-blue-700">Ready to start</p>
                      </div>
                    )}

                    {/* Added Date - Small */}
                    <p className="text-[9px] text-gray-300 mt-2">
                      Added {new Date(cultivation.startDate).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Scroll Hint - Optional */}
            {activeCultivations.length > 3 && (
              <p className="text-[10px] text-gray-400 text-right mt-1">
                ← Scroll for more →
              </p>
            )}
          </div>
        )}

        {/* Bottom Grid - More Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Active Tracking Summary */}
          <div className="lg:col-span-2 rounded-[24px] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(246,249,247,0.98))] p-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)]">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Active Tracking</h2>
            {trackedCultivations.length > 0 ? (
              <div className="space-y-2">
                {trackedCultivations.slice(0, 3).map((cultivation) => {
                  const currentStage = getCurrentStage(cultivation);
                  const isCompleted = cropSteps[cultivation._id] && 
                    (cultivation.currentStepIndex || 0) >= (cropSteps[cultivation._id]?.length || 0);
                  
                  if (isCompleted) return null;

                  return (
                    <div key={cultivation._id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/90 p-3 text-xs">
                      <div>
                        <h3 className="font-medium text-gray-800 text-xs">{cultivation.cropName}</h3>
                        <p className="text-[10px] text-gray-500">Stage: {currentStage.length > 20 ? currentStage.substring(0, 17) + '...' : currentStage}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-green-600">{calculateProgress(cultivation)}%</p>
                        <p className="text-[10px] text-gray-400">Day {getDaysInCurrentStage(cultivation)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-xs py-2 text-center">No active tracking</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-[24px] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(246,249,247,0.98))] p-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)]">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {planningCultivations.length > 0 && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
                  <p className="text-xs text-gray-700">
                    <span className="font-medium text-blue-700">Planning:</span> {planningCultivations.length} ready to track
                  </p>
                </div>
              )}
              
              {completedCultivations.length > 0 && (
                <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-3">
                  <p className="text-xs text-gray-700">
                    <span className="font-medium text-yellow-700">Harvest:</span> {completedCultivations.length} crop(s) ready
                  </p>
                </div>
              )}

              {trackedCultivations.length === 0 && activeCultivations.length === 0 && (
                <div className="rounded-2xl border border-green-100 bg-green-50 p-3">
                  <p className="text-xs text-gray-700">
                    <span className="font-medium text-green-700">Start:</span> Add your first crop
                  </p>
                </div>
              )}
            </div>

            <div className="mt-3 space-y-1.5">
              <button
                onClick={() => router.push('/navigation/farmer/cultivation')}
                className="w-full rounded-2xl border border-green-200 py-2 text-xs font-medium text-green-600 transition-colors hover:bg-green-50 hover:text-green-700"
              >
                Find New Crops
              </button>
              <button
                onClick={() => router.push('/navigation/farmer/cultivation/view')}
                className="w-full rounded-2xl border border-gray-200 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-700"
              >
                Manage All
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
