'use client';

import React, { useEffect, useState } from 'react';
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
  role: string;
  photoURL?: string;
  activeCultivations?: ActiveCultivation[];
}

// Sub-component for the Live Digital Countdown Timer
const DigitalCountdown = ({ targetDate, onExpire }: { targetDate: Date, onExpire?: () => void }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        if (onExpire) onExpire();
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
  }, [targetDate, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <div className="bg-emerald-50 text-emerald-800 px-5 py-3 rounded-2xl font-bold border border-emerald-200 text-center shadow-sm animate-pulse">
        Time is up for this stage! Please advance to the next step.
      </div>
    );
  }

  return (
    <div className="flex gap-3 text-center font-mono">
      <div className="bg-stone-900 text-emerald-400 rounded-2xl p-3 min-w-[70px] shadow-inner border border-stone-700">
        <span className="text-2xl md:text-3xl font-bold block leading-none">{String(timeLeft.days).padStart(2, '0')}</span>
        <span className="text-[10px] text-stone-400 uppercase font-sans tracking-wider mt-1 block">Days</span>
      </div>
      <div className="text-stone-400 text-2xl font-bold py-2 flex items-center">:</div>
      <div className="bg-stone-900 text-white rounded-2xl p-3 min-w-[70px] shadow-inner border border-stone-700">
        <span className="text-2xl md:text-3xl font-bold block leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-[10px] text-stone-400 uppercase font-sans tracking-wider mt-1 block">Hrs</span>
      </div>
      <div className="text-stone-400 text-2xl font-bold py-2 flex items-center">:</div>
      <div className="bg-stone-900 text-white rounded-2xl p-3 min-w-[70px] shadow-inner border border-stone-700">
        <span className="text-2xl md:text-3xl font-bold block leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-[10px] text-stone-400 uppercase font-sans tracking-wider mt-1 block">Min</span>
      </div>
      <div className="text-stone-400 text-2xl font-bold py-2 flex items-center">:</div>
      <div className="bg-stone-900 text-emerald-400 rounded-2xl p-3 min-w-[70px] shadow-inner border border-stone-700">
        <span className="text-2xl md:text-3xl font-bold block leading-none">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="text-[10px] text-stone-400 uppercase font-sans tracking-wider mt-1 block">Sec</span>
      </div>
    </div>
  );
};

export default function CultivationViewPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [expandedCropIndex, setExpandedCropIndex] = useState<number | null>(null);
  const [cropSteps, setCropSteps] = useState<any[]>([]);
  const [loadingSteps, setLoadingSteps] = useState(false);

  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, [router]);

  const loadUserData = async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/signin');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      if (!userData.id) {
        throw new Error('User ID not found');
      }
      setPageError('');
      setUser(userData);
      await fetchUserDetails(userData.id, token);
    } catch (error) {
      setPageError('Could not load local user details. Please sign in again.');
      router.push('/signin');
    }
  };

  const fetchUserDetails = async (userId: string, token: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        router.push('/signin');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUser(prevUser => ({ ...prevUser, ...data }));
        localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), ...data }));
      } else {
        setPageError('Could not load your cultivation profile from the server.');
      }
    } catch (error) {
      setPageError('Backend server is unavailable right now. Please make sure the backend is running on port 5000.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewSteps = async (cropName: string, index: number) => {
    if (expandedCropIndex === index) {
      setExpandedCropIndex(null);
      return;
    }

    setExpandedCropIndex(index);
    setLoadingSteps(true);
    setCropSteps([]);

    try {
      const response = await fetch(`http://localhost:8000/get_crop_steps/${encodeURIComponent(cropName)}`);
      const data = await response.json();

      if (data.success) {
        setCropSteps(data.steps);
      } else {
        alert(data.error || "Failed to load cultivation steps.");
      }
    } catch (error) {
      alert("Could not connect to the Python backend.");
    } finally {
      setLoadingSteps(false);
    }
  };

  const handleDeleteCrop = async (cropId: string) => {
    if (!window.confirm("Are you sure you want to remove this crop from your profile?")) {
      return;
    }

    setIsDeleting(cropId);

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${API_URL}/users/${user?.id}/crop/${cropId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setUser(prevUser => {
          if (!prevUser) return null;
          const updatedCultivations = prevUser.activeCultivations?.filter((crop: any) => crop._id !== cropId);
          return { ...prevUser, activeCultivations: updatedCultivations };
        });

        setExpandedCropIndex(null);

        const currentLocalUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentLocalUser.activeCultivations) {
          currentLocalUser.activeCultivations = currentLocalUser.activeCultivations.filter((c: any) => c._id !== cropId);
          localStorage.setItem('user', JSON.stringify(currentLocalUser));
        }
      } else {
        const data = await response.json();
        alert(data.message || "Failed to delete crop");
      }
    } catch (error) {
      alert("Could not connect to the server.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleStartTracking = async (cropId: string) => {
    setIsStarting(cropId);

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${API_URL}/users/${user?.id}/crop/${cropId}/start`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(prevUser => ({ ...prevUser, ...data.data }));
        localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), ...data.data }));
      } else {
        const data = await response.json();
        alert(data.message || "Failed to start tracking");
      }
    } catch (error) {
      alert("Could not connect to the server.");
    } finally {
      setIsStarting(null);
    }
  };

  const handleAdvanceStep = async (cropId: string) => {
    setIsAdvancing(cropId);

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${API_URL}/users/${user?.id}/crop/${cropId}/advance`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(prevUser => ({ ...prevUser, ...data.data }));
        localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), ...data.data }));
      } else {
        const data = await response.json();
        alert(data.message || "Failed to advance step");
      }
    } catch (error) {
      alert("Could not connect to the server.");
    } finally {
      setIsAdvancing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-center px-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-sm"></div>
          <p className="text-stone-500 text-sm font-medium">Loading your crops...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-stone-50" style={{ zoom: 1.1 }}>
      <aside className="w-64 bg-white border-r border-stone-200 shrink-0">
        <FarmerSidebar user={user || { name: 'Farmer', role: 'farmer', id: '' }} />
      </aside>

      <main className="flex-1 p-4 md:p-5 lg:p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {pageError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
              {pageError}
            </div>
          )}

          {/* Hero Section styled like reference */}
          <section className="rounded-3xl border border-stone-200 bg-[radial-gradient(circle_at_top_left,_#f7fee7,_#fafaf9_55%)] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Track & Manage</p>
            <h1 className="mt-2 text-3xl font-bold text-stone-900">My Cultivation Journey</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              Monitor your active crops, track growth stages with precise countdowns, and follow AI-guided steps for an optimal harvest.
            </p>
          </section>

          <div>
            {user?.activeCultivations && user.activeCultivations.length > 0 ? (
              <div className="grid gap-6">
                {user.activeCultivations.map((cultivation: any, idx) => {
                  const isExpanded = expandedCropIndex === idx;
                  const isTracking = cultivation.isTracking;
                  const currentStepIndex = cultivation.currentStepIndex || 0;

                  // Calculate if the crop is fully grown
                  const isCompleted = isTracking && cropSteps.length > 0 && currentStepIndex >= cropSteps.length;

                  // Set Target Date for the current step
                  let targetDate = new Date();
                  if (isTracking && cropSteps.length > 0 && !isCompleted && cultivation.currentStepStartDate) {
                    const currentStepDays = cropSteps[currentStepIndex].estimatedDays || 0;
                    targetDate = new Date(cultivation.currentStepStartDate);
                    targetDate.setDate(targetDate.getDate() + currentStepDays);
                  }

                  return (
                    <div
                      key={cultivation._id || idx}
                      className={`bg-white rounded-3xl p-5 md:p-6 border transition-all shadow-sm ${
                        isExpanded ? 'border-emerald-300 ring-2 ring-emerald-100 ring-opacity-50 bg-[linear-gradient(180deg,_#fafaf9,_#ffffff)]' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                        <div className="flex items-start gap-4">
                          <div>
                            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                              <h3 className="text-xl font-bold text-stone-900">{cultivation.cropName}</h3>
                              <span className="bg-stone-100 text-stone-600 text-xs px-2.5 py-1 rounded-full font-medium">
                                {cultivation.district}
                              </span>
                              {isTracking && !isCompleted && (
                                <span className="bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold animate-pulse shadow-sm flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Tracking Active
                                </span>
                              )}
                              {isCompleted && (
                                <span className="bg-amber-100 border border-amber-200 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                  Cultivation Complete
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-stone-500">
                              Added: <span className="font-semibold text-stone-700">{new Date(cultivation.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2 md:pt-0">
                          <button
                            type="button"
                            onClick={() => handleViewSteps(cultivation.cropName, idx)}
                            className={`shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold transition-colors border shadow-sm ${
                              isExpanded
                                ? 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                                : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                            }`}
                          >
                            {isExpanded ? 'Close Steps' : 'View Steps'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCrop(cultivation._id)}
                            disabled={isDeleting === cultivation._id}
                            className="shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold transition-colors border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 shadow-sm"
                          >
                            {isDeleting === cultivation._id ? 'Deleting...' : 'Delete Crop'}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Section */}
                      <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                        <div className="overflow-hidden">
                          <div className="pt-5 border-t border-stone-200">

                            {/* Tracking Controls */}
                            <div className="mb-6 p-5 bg-white rounded-3xl border border-stone-200 shadow-sm">
                              {!isTracking ? (
                                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                  <div>
                                    <h4 className="text-base font-bold text-stone-900 mb-1">Ready to plant?</h4>
                                    <p className="text-sm text-stone-500">Start the timer to monitor your crop's growth stages.</p>
                                  </div>
                                  <button
                                    onClick={() => handleStartTracking(cultivation._id)}
                                    disabled={isStarting === cultivation._id}
                                    className="w-full md:w-auto bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-2xl hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50"
                                  >
                                    {isStarting === cultivation._id ? 'Starting...' : 'Start Tracking Now'}
                                  </button>
                                </div>
                              ) : (
                                isCompleted ? (
                                  <div className="text-center py-5 bg-[radial-gradient(circle_at_center,_#fefce8,_#fffbeb_100%)] rounded-2xl border border-amber-200">
                                    <h4 className="text-2xl font-bold text-amber-900 mb-2">🎉 Harvest Time!</h4>
                                    <p className="text-sm text-amber-700 font-medium">You have successfully completed all stages for this crop.</p>
                                  </div>
                                ) : (
                                  cropSteps.length > 0 && (
                                    <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
                                      <div className="flex-1 w-full flex flex-col items-center xl:items-start text-center xl:text-left">
                                        <h4 className="text-sm font-bold text-stone-600 uppercase tracking-wide mb-2">
                                          Current Stage
                                        </h4>
                                        <h3 className="text-xl font-bold text-emerald-800 mb-4 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 inline-block">
                                          {cropSteps[currentStepIndex].stage}
                                        </h3>
                                        <p className="text-xs text-stone-500 mb-3 font-medium uppercase tracking-wider">Time remaining until the next stage</p>
                                        <DigitalCountdown targetDate={targetDate} />
                                      </div>

                                      <div className="w-full xl:w-auto border-t xl:border-t-0 xl:border-l border-stone-200 pt-5 xl:pt-0 xl:pl-8 flex flex-col items-center justify-center shrink-0">
                                        <p className="text-xs text-stone-500 mb-3 text-center font-medium">Finished this step early?</p>
                                        <button
                                          onClick={() => handleAdvanceStep(cultivation._id)}
                                          disabled={isAdvancing === cultivation._id}
                                          className="w-full bg-white border-2 border-emerald-600 text-emerald-700 font-bold py-3 px-6 rounded-2xl hover:bg-emerald-50 transition-colors shadow-sm disabled:opacity-50"
                                        >
                                          {isAdvancing === cultivation._id ? 'Updating...' : 'Complete Step Now'}
                                        </button>
                                      </div>
                                    </div>
                                  )
                                )
                              )}
                            </div>

                            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-5 ml-2">Step by Step Guide</h4>

                            {loadingSteps ? (
                              <div className="flex justify-center items-center py-8 text-stone-500 text-sm font-medium">
                                <div className="w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                                Loading intelligent steps...
                              </div>
                            ) : cropSteps.length > 0 ? (
                              <div className="space-y-0 pl-6 relative">
                                {/* Vertical Timeline Line */}
                                <div className="absolute top-4 bottom-4 left-[15px] w-0.5 bg-stone-200"></div>

                                {cropSteps.map((step, stepIdx) => {
                                  const isActiveStep = isTracking && currentStepIndex === stepIdx;
                                  const isPastStep = (isTracking && currentStepIndex > stepIdx) || isCompleted;

                                  return (
                                    <div key={stepIdx} className="flex gap-6 relative pb-8 last:pb-0">
                                      <div className="relative z-10 flex flex-col items-center mt-2">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                          isActiveStep ? 'border-emerald-600 bg-white ring-4 ring-emerald-100 scale-125' :
                                          isPastStep ? 'border-emerald-600 bg-emerald-600' : 'border-stone-300 bg-white'
                                        }`}>
                                          {/* Checkmark icon for completed steps */}
                                          {isPastStep && (
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                          )}
                                        </div>
                                      </div>

                                      <div className={`flex-1 p-5 rounded-3xl border transition-all shadow-sm ${
                                        isActiveStep ? 'bg-[linear-gradient(180deg,_#ffffff,_#f0fdf4)] border-emerald-200 ring-1 ring-emerald-100' :
                                        isPastStep ? 'bg-white border-emerald-100 opacity-80' : 'bg-white border-stone-200'
                                      }`}>
                                        <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                                          <h5 className={`text-base font-bold flex items-center gap-2.5 ${
                                            isActiveStep ? 'text-emerald-900' :
                                            isPastStep ? 'text-emerald-700 line-through decoration-emerald-300' : 'text-stone-800'
                                          }`}>
                                            {step.stage}
                                            {isPastStep && <span className="text-[10px] uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full not-line-through font-bold">Done</span>}
                                          </h5>
                                          <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
                                            isPastStep ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                            isActiveStep ? 'bg-white text-emerald-700 border-emerald-200 shadow-sm' :
                                            'bg-stone-100 text-stone-600 border-stone-200'
                                          }`}>
                                            {step.estimatedDays} Days
                                          </span>
                                        </div>
                                        <p className={`text-sm leading-relaxed ${
                                          isActiveStep ? 'text-emerald-900/80 font-medium' :
                                          isPastStep ? 'text-stone-400' : 'text-stone-600'
                                        }`}>
                                          {step.instructions}
                                        </p>

                                        {/* Hide alerts on completed steps to keep the UI clean */}
                                        {step.alert && !isPastStep && (
                                          <div className={`mt-4 text-xs p-3 rounded-2xl border ${
                                            isActiveStep ? 'bg-red-50 text-red-800 border-red-200 shadow-sm' : 'bg-stone-50 text-stone-600 border-stone-200'
                                          }`}>
                                            <strong className="flex items-center gap-1.5 mb-1 text-[10px] uppercase tracking-widest">
                                              <span className="text-red-500">⚠️</span> Alert
                                            </strong>
                                            <p className="leading-relaxed">{step.alert}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-8 bg-stone-50 rounded-3xl border border-dashed border-stone-300 text-stone-500 text-sm font-medium">
                                <p>No detailed steps found for {cultivation.cropName}.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 px-6 bg-white rounded-3xl border border-dashed border-stone-300 mt-6 shadow-sm">
                <div className="bg-stone-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🌱</div>
                <h2 className="text-lg font-bold text-stone-900 mb-2">No Active Crops</h2>
                <p className="text-sm text-stone-500 max-w-sm mx-auto mb-6">
                  Get AI recommendations, plant a crop, and start tracking your cultivation journey.
                </p>
                <button
                  onClick={() => router.push('/navigation/farmer/cultivation')}
                  className="bg-emerald-600 text-white text-sm font-bold px-6 py-3 rounded-2xl hover:bg-emerald-700 transition-colors shadow-md"
                >
                  Find Crops to Plant
                </button>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}