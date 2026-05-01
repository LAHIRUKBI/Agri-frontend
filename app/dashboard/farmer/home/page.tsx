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

export default function FarmerHome() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [cropSteps, setCropSteps] = useState<Record<string, any[]>>({});
  const [loadingSteps, setLoadingSteps] = useState<Record<string, boolean>>({});
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
        
        // Fetch steps for active cultivations
        if (data.activeCultivations && data.activeCultivations.length > 0) {
          data.activeCultivations.forEach((cultivation: ActiveCultivation) => {
            fetchCropSteps(cultivation.cropName, cultivation._id);
          });
        }
      } else {
        setPageError('Could not load your dashboard details from the backend.');
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <FarmerSidebar user={user} />
      
      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {pageError && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {pageError}
          </div>
        )}
        {/* Welcome Section - Smaller */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {user?.name?.split(' ')[0] || 'Farmer'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Here's your farm activity overview</p>
        </div>

        {/* Stats Grid - Smaller and more compact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* Active Crops */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Total Crops</p>
            <p className="text-xl font-bold text-gray-800">{activeCultivations.length}</p>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-green-600">{trackedCultivations.length} tracking</span>
              <span className="text-gray-300">|</span>
              <span className="text-amber-600">{planningCultivations.length} planned</span>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">In Progress</p>
            <p className="text-xl font-bold text-gray-800">{trackedCultivations.length - completedCultivations.length}</p>
            <p className="text-xs text-gray-500 mt-1">{completedCultivations.length} completed</p>
          </div>

          {/* Average Progress */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Avg Progress</p>
            <p className="text-xl font-bold text-gray-800">
              {trackedCultivations.length > 0 
                ? Math.round(trackedCultivations.reduce((acc, c) => acc + calculateProgress(c), 0) / trackedCultivations.length) 
                : 0}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div 
                className="bg-green-600 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${trackedCultivations.length > 0 
                  ? Math.round(trackedCultivations.reduce((acc, c) => acc + calculateProgress(c), 0) / trackedCultivations.length) 
                  : 0}%` 
                }}
              ></div>
            </div>
          </div>

          {/* Latest Stage Day */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Latest Stage</p>
            <p className="text-xl font-bold text-gray-800">
              {trackedCultivations.length > 0 
                ? `Day ${Math.max(...trackedCultivations.map(c => getDaysInCurrentStage(c)))}` 
                : 'Day 0'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Current stage</p>
          </div>
        </div>

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
                    className="flex-none w-64 bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-sm text-gray-800">{cultivation.cropName}</h3>
                        <p className="text-xs text-gray-400">{cultivation.district}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        {cultivation.isTracking ? (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            isCompleted 
                              ? 'bg-yellow-100 text-yellow-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {isCompleted ? 'Done' : 'Active'}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
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
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-green-600 h-1 rounded-full transition-all duration-500" 
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
                      <div className="mt-1 p-2 bg-yellow-50 rounded border border-yellow-100">
                        <p className="text-xs font-medium text-yellow-700">Ready for Harvest</p>
                      </div>
                    )}

                    {!cultivation.isTracking && (
                      <div className="mt-1 p-2 bg-blue-50 rounded border border-blue-100">
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
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Active Tracking</h2>
            {trackedCultivations.length > 0 ? (
              <div className="space-y-2">
                {trackedCultivations.slice(0, 3).map((cultivation) => {
                  const currentStage = getCurrentStage(cultivation);
                  const isCompleted = cropSteps[cultivation._id] && 
                    (cultivation.currentStepIndex || 0) >= (cropSteps[cultivation._id]?.length || 0);
                  
                  if (isCompleted) return null;

                  return (
                    <div key={cultivation._id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {planningCultivations.length > 0 && (
                <div className="p-2 bg-blue-50 rounded border border-blue-100">
                  <p className="text-xs text-gray-700">
                    <span className="font-medium text-blue-700">Planning:</span> {planningCultivations.length} ready to track
                  </p>
                </div>
              )}
              
              {completedCultivations.length > 0 && (
                <div className="p-2 bg-yellow-50 rounded border border-yellow-100">
                  <p className="text-xs text-gray-700">
                    <span className="font-medium text-yellow-700">Harvest:</span> {completedCultivations.length} crop(s) ready
                  </p>
                </div>
              )}

              {trackedCultivations.length === 0 && activeCultivations.length === 0 && (
                <div className="p-2 bg-green-50 rounded border border-green-100">
                  <p className="text-xs text-gray-700">
                    <span className="font-medium text-green-700">Start:</span> Add your first crop
                  </p>
                </div>
              )}
            </div>

            <div className="mt-3 space-y-1.5">
              <button
                onClick={() => router.push('/navigation/farmer/cultivation')}
                className="w-full py-1.5 text-xs text-green-600 hover:text-green-700 font-medium border border-green-200 rounded hover:bg-green-50 transition-colors"
              >
                Find New Crops
              </button>
              <button
                onClick={() => router.push('/navigation/farmer/cultivation/view')}
                className="w-full py-1.5 text-xs text-gray-600 hover:text-gray-700 font-medium border border-gray-200 rounded hover:bg-gray-50 transition-colors"
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
