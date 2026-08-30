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
      <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold border border-green-300 text-center animate-pulse">
        Time is up for this stage! Please advance to the next step.
      </div>
    );
  }

  return (
    <div className="flex gap-2 text-center font-mono">
      <div className="bg-gray-800 text-green-400 rounded-md p-2 min-w-[60px] shadow-inner border border-gray-700">
        <span className="text-xl md:text-2xl font-bold block leading-none">{String(timeLeft.days).padStart(2, '0')}</span>
        <span className="text-[10px] text-gray-400 uppercase font-sans tracking-wider">Days</span>
      </div>
      <div className="text-gray-800 text-xl font-bold py-1">:</div>
      <div className="bg-gray-800 text-white rounded-md p-2 min-w-[60px] shadow-inner border border-gray-700">
        <span className="text-xl md:text-2xl font-bold block leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-[10px] text-gray-400 uppercase font-sans tracking-wider">Hrs</span>
      </div>
      <div className="text-gray-800 text-xl font-bold py-1">:</div>
      <div className="bg-gray-800 text-white rounded-md p-2 min-w-[60px] shadow-inner border border-gray-700">
        <span className="text-xl md:text-2xl font-bold block leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-[10px] text-gray-400 uppercase font-sans tracking-wider">Min</span>
      </div>
      <div className="text-gray-800 text-xl font-bold py-1">:</div>
      <div className="bg-gray-800 text-green-400 rounded-md p-2 min-w-[60px] shadow-inner border border-gray-700">
        <span className="text-xl md:text-2xl font-bold block leading-none">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="text-[10px] text-gray-400 uppercase font-sans tracking-wider">Sec</span>
      </div>
    </div>
  );
};

export default function CultivationViewPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      setUser(userData);
      await fetchUserDetails(userData.id, token);
    } catch (error) {
      console.error('Failed to parse user data:', error);
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
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
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
      console.error("Error fetching steps:", error);
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
      console.error("Error deleting crop:", error);
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
      console.error("Error starting tracking:", error);
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
      console.error("Error advancing step:", error);
      alert("Could not connect to the server.");
    } finally {
      setIsAdvancing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <div className="w-12 h-12 border-3 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading your crops...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 shrink-0">
        <FarmerSidebar user={user || { name: 'Farmer', role: 'farmer', id: '' }} />
      </aside>

      <main className="flex-1 p-4 md:p-5 lg:p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-4">

          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
            <h1 className="text-xl font-semibold text-gray-800">My Cultivation Journey</h1>
          </div>

          <div>
            {user?.activeCultivations && user.activeCultivations.length > 0 ? (
              <div className="space-y-4">
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
                      className={`bg-white rounded-lg p-4 border transition-all ${isExpanded ? 'border-green-400 shadow-md ring-1 ring-green-400 ring-opacity-20' : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                        <div className="flex items-start gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <h3 className="font-semibold text-gray-800">{cultivation.cropName}</h3>
                              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                                {cultivation.district}
                              </span>
                              {isTracking && !isCompleted && (
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded font-bold animate-pulse">
                                  ● Tracking Active
                                </span>
                              )}
                              {isCompleted && (
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                  Cultivation Complete
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">
                              Added: {new Date(cultivation.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewSteps(cultivation.cropName, idx)}
                            className={`shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-colors border ${isExpanded
                                ? 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                                : 'bg-white text-green-600 border-green-200 hover:bg-green-50'
                              }`}
                          >
                            {isExpanded ? 'Close Steps' : 'View Steps'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCrop(cultivation._id)}
                            disabled={isDeleting === cultivation._id}
                            className="shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-colors border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {isDeleting === cultivation._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Section */}
                      <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                        <div className="overflow-hidden">
                          <div className="pt-4 border-t border-gray-100">

                            {/* Tracking Controls */}
                            <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
                              {!isTracking ? (
                                <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-800">Ready to plant?</h4>
                                  </div>
                                  <button
                                    onClick={() => handleStartTracking(cultivation._id)}
                                    disabled={isStarting === cultivation._id}
                                    className="w-full md:w-auto bg-green-600 text-white font-bold py-2 px-5 rounded-md hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                                  >
                                    {isStarting === cultivation._id ? 'Starting...' : 'Start Tracking'}
                                  </button>
                                </div>
                              ) : (
                                isCompleted ? (
                                  <div className="text-center py-4">
                                    <h4 className="text-lg font-bold text-green-800 mb-1">Harvest Time!</h4>
                                    <p className="text-sm text-gray-600">You have successfully completed all stages for this crop.</p>
                                  </div>
                                ) : (
                                  cropSteps.length > 0 && (
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                      <div className="flex-1 w-full">
                                        <h4 className="text-sm font-bold text-gray-800 mb-0.5 flex items-center gap-2">
                                          Current Stage: <span className="text-green-600">{cropSteps[currentStepIndex].stage}</span>
                                        </h4>
                                        <p className="text-xs text-gray-500 mb-3">Time remaining until the next stage:</p>
                                        <DigitalCountdown targetDate={targetDate} />
                                      </div>

                                      <div className="w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6 flex flex-col items-center justify-center shrink-0">
                                        <p className="text-xs text-gray-500 mb-2 text-center">Finished this step early?</p>
                                        <button
                                          onClick={() => handleAdvanceStep(cultivation._id)}
                                          disabled={isAdvancing === cultivation._id}
                                          className="w-full bg-white border-2 border-green-600 text-green-700 font-bold py-2 px-4 rounded-md hover:bg-green-50 transition-colors disabled:opacity-50"
                                        >
                                          {isAdvancing === cultivation._id ? 'Updating...' : 'Complete Step Now'}
                                        </button>
                                      </div>
                                    </div>
                                  )
                                )
                              )}
                            </div>

                            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Step by Step Plan</h4>

                            {loadingSteps ? (
                              <div className="flex justify-center items-center py-6 text-gray-400 text-xs">
                                <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                                Loading steps...
                              </div>
                            ) : cropSteps.length > 0 ? (
                              <div className="space-y-0 pl-4 relative">
                                <div className="absolute top-2 bottom-2 left-[7px] w-px bg-gray-200"></div>

                                {cropSteps.map((step, stepIdx) => {
                                  const isActiveStep = isTracking && currentStepIndex === stepIdx;
                                  const isPastStep = (isTracking && currentStepIndex > stepIdx) || isCompleted;

                                  return (
                                    <div key={stepIdx} className="flex gap-4 relative pb-6 last:pb-0">
                                      <div className="relative z-10 flex flex-col items-center">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${isActiveStep ? 'border-green-600 bg-white ring-4 ring-green-100 scale-110' :
                                            isPastStep ? 'border-green-600 bg-green-600' : 'border-gray-300 bg-white'
                                          }`}>
                                          {/* Checkmark icon for completed steps */}
                                          {isPastStep && (
                                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                          )}
                                        </div>
                                      </div>

                                      <div className={`flex-1 p-3 rounded-lg border transition-all ${isActiveStep ? 'bg-green-50 border-green-200 shadow-sm' :
                                          isPastStep ? 'bg-white border-green-100 opacity-90' : 'bg-white border-gray-100'
                                        }`}>
                                        <div className="flex flex-wrap justify-between items-start gap-1 mb-1.5">
                                          <h5 className={`text-sm font-semibold flex items-center gap-2 ${isActiveStep ? 'text-green-800' :
                                              isPastStep ? 'text-green-700 line-through decoration-green-300' : 'text-gray-700'
                                            }`}>
                                            {step.stage}
                                            {isPastStep && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full not-line-through font-bold">Done</span>}
                                          </h5>
                                          <span className={`text-xs px-1.5 py-0.5 rounded border ${isPastStep ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-100 text-gray-500 border-gray-200'
                                            }`}>
                                            {step.estimatedDays} days
                                          </span>
                                        </div>
                                        <p className={`text-xs leading-relaxed ${isActiveStep ? 'text-green-900/80' :
                                            isPastStep ? 'text-gray-400' : 'text-gray-500'
                                          }`}>
                                          {step.instructions}
                                        </p>

                                        {/* Hide alerts on completed steps to keep the UI clean */}
                                        {step.alert && !isPastStep && (
                                          <div className={`mt-2 text-xs p-2 rounded border ${isActiveStep ? 'bg-red-50 text-red-800 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                            <strong className="block mb-0.5 text-xxs uppercase tracking-wider">Alert</strong>
                                            <p>{step.alert}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-4 bg-gray-50 rounded border border-gray-200 text-gray-400 text-xs">
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
              <div className="text-center py-12 px-4 bg-white rounded-lg border border-dashed border-gray-300 mt-4">
                <h2 className="text-base font-medium text-gray-700 mb-1">No Active Crops</h2>
                <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
                  Get AI recommendations and start tracking your first crop.
                </p>
                <button
                  onClick={() => router.push('/dashboard/farmer/cultivation')}
                  className="bg-green-600 text-white text-xs font-medium px-4 py-2 rounded hover:bg-green-700 transition-colors"
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
