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

const DigitalCountdown = ({ targetDate, onExpire }: { targetDate: Date, onExpire?: () => void }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const targetTime = targetDate.getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetTime - now;

      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        if (onExpire) onExpire();
        return true; 
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
          isExpired: false
        });
        return false;
      }
    };

    const isExpired = updateTimer();
    
    if (!isExpired) {
      const timer = setInterval(() => {
        const expired = updateTimer();
        if (expired) clearInterval(timer);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [targetDate.getTime(), onExpire]);

  if (!mounted) return null; 

  if (timeLeft.isExpired) {
    return (
      <div className="bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-semibold border border-emerald-200 text-center shadow-sm">
        Time is up for this stage! Ready for the next step.
      </div>
    );
  }

  return (
    <div className="flex gap-2 text-center font-mono justify-center md:justify-start items-center">
      <div className="bg-white rounded-xl p-2 min-w-[56px] shadow-sm border border-gray-200 flex flex-col items-center">
        <span className="text-xl font-bold text-gray-900 tracking-tight">{String(timeLeft.days).padStart(2, '0')}</span>
        <span className="text-[9px] text-gray-500 font-sans font-semibold uppercase tracking-wider mt-0.5">Days</span>
      </div>
      <div className="text-gray-400 text-lg font-bold animate-pulse mb-3">:</div>
      <div className="bg-white rounded-xl p-2 min-w-[56px] shadow-sm border border-gray-200 flex flex-col items-center">
        <span className="text-xl font-bold text-gray-900 tracking-tight">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-[9px] text-gray-500 font-sans font-semibold uppercase tracking-wider mt-0.5">Hrs</span>
      </div>
      <div className="text-gray-400 text-lg font-bold animate-pulse mb-3">:</div>
      <div className="bg-white rounded-xl p-2 min-w-[56px] shadow-sm border border-gray-200 flex flex-col items-center">
        <span className="text-xl font-bold text-gray-900 tracking-tight">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-[9px] text-gray-500 font-sans font-semibold uppercase tracking-wider mt-0.5">Min</span>
      </div>
      <div className="text-gray-400 text-lg font-bold animate-pulse mb-3">:</div>
      <div className="bg-white rounded-xl p-2 min-w-[56px] shadow-sm border border-gray-200 flex flex-col items-center">
        <span className="text-xl font-bold text-gray-900 tracking-tight">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="text-[9px] text-gray-500 font-sans font-semibold uppercase tracking-wider mt-0.5">Sec</span>
      </div>
    </div>
  );
};

const MiniDigitalCountdown = ({ targetDate }: { targetDate: Date }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const targetTime = targetDate.getTime();
    
    const updateTimer = () => {
      const distance = targetTime - new Date().getTime();
      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return true;
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
          isExpired: false
        });
        return false;
      }
    };

    if (!updateTimer()) {
      const timer = setInterval(updateTimer, 1000);
      return () => clearInterval(timer);
    }
  }, [targetDate.getTime()]);

  if (!mounted) return null;

  if (timeLeft.isExpired) return <span className="ml-1.5 font-bold text-gray-900">Ready!</span>;

  return (
    <span className="ml-1.5 px-1.5 py-0.5 bg-white/80 rounded-[4px] text-[10px] font-mono font-bold text-gray-900 border border-emerald-200 shadow-sm">
      {String(timeLeft.days).padStart(2, '0')}d {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
    </span>
  );
};

export default function CultivationViewPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCropIndex, setExpandedCropIndex] = useState<number | null>(null);
  const [cropSteps, setCropSteps] = useState<any[]>([]);
  const [loadingSteps, setLoadingSteps] = useState(false);
  
  const [cropStepsCache, setCropStepsCache] = useState<Record<string, any[]>>({});

  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState<string | null>(null);

  // Search, Filter and Pagination States
  const [search, setSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, [router]);

  useEffect(() => {
    if (user?.activeCultivations) {
      user.activeCultivations.forEach(crop => {
        if (crop.isTracking && !cropStepsCache[crop.cropName]) {
          fetch(`http://localhost:8000/get_crop_steps/${encodeURIComponent(crop.cropName)}`)
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                setCropStepsCache(prev => ({ ...prev, [crop.cropName]: data.steps }));
              }
            })
            .catch(err => console.error("Failed to auto-fetch steps for cache", err));
        }
      });
    }
  }, [user]);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
    setExpandedCropIndex(null);
  }, [search, selectedDistrict]);

  const loadUserData = async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/signin');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      if (!userData.id) throw new Error('User ID not found');
      
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
        headers: { 'Authorization': `Bearer ${token}` }
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
    setLoadingSteps(!cropStepsCache[cropName]); 
    setCropSteps(cropStepsCache[cropName] || []);

    try {
      const response = await fetch(`http://localhost:8000/get_crop_steps/${encodeURIComponent(cropName)}`);
      const data = await response.json();

      if (data.success) {
        setCropSteps(data.steps);
        setCropStepsCache(prev => ({ ...prev, [cropName]: data.steps }));
      } else {
        alert(data.error || "Failed to load cultivation steps.");
      }
    } catch (error) {
      console.error("Error fetching steps:", error);
      alert("Could not connect to backend.");
    } finally {
      setLoadingSteps(false);
    }
  };

  const handleDeleteCrop = async (cropId: string) => {
    if (!window.confirm("Are you sure you want to remove this crop from your profile?")) return;

    setIsDeleting(cropId);
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${API_URL}/users/${user?.id}/crop/${cropId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
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
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(prevUser => ({ ...prevUser, ...data.data }));
        localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), ...data.data }));
      }
    } catch (error) {
      console.error("Error starting tracking:", error);
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
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(prevUser => ({ ...prevUser, ...data.data }));
        localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), ...data.data }));
      }
    } catch (error) {
      console.error("Error advancing step:", error);
    } finally {
      setIsAdvancing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 font-medium text-xs tracking-wide animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Search, Filter and Pagination Logic
  const activeCrops = user?.activeCultivations || [];
  const uniqueDistricts = Array.from(new Set(activeCrops.map(c => c.district)));

  const filteredCultivations = activeCrops.filter((crop) => {
    const matchesSearch = crop.cropName.toLowerCase().includes(search.toLowerCase()) || 
                          crop.district.toLowerCase().includes(search.toLowerCase());
    const matchesDistrict = selectedDistrict === "all" || crop.district === selectedDistrict;
    
    return matchesSearch && matchesDistrict;
  });

  const totalPages = Math.ceil(filteredCultivations.length / itemsPerPage);
  const indexOfLastCrop = currentPage * itemsPerPage;
  const indexOfFirstCrop = indexOfLastCrop - itemsPerPage;
  const currentCrops = filteredCultivations.slice(indexOfFirstCrop, indexOfLastCrop);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <aside className="w-64 bg-white border-r border-gray-200 shrink-0 shadow-sm z-10">
        <FarmerSidebar user={user || { name: 'Farmer', role: 'farmer', id: '' }} />
      </aside>

      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-full mx-auto space-y-5">

          <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                My Cultivation Journey
              </h1>
              <p className="text-gray-500 mt-1 text-xs md:text-sm font-medium">Nurture and track your crops to a perfect harvest.</p>
            </div>
          </div>

          <div>
            {activeCrops.length > 0 ? (
              <>
                {/* Search & Filter Bar Section */}
                <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm mb-6 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Search & Filter Crops:</span>
                    </div>

                    <div className="relative w-full lg:w-80">
                      <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input 
                        type="text" 
                        placeholder="Search crop, district..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                      />
                    </div>
                  </div>

                  {uniqueDistricts.length > 0 && (
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-hide">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Districts:</span>
                      
                      <button
                        onClick={() => setSelectedDistrict("all")}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap capitalize transition-all ${
                          selectedDistrict === "all"
                            ? "bg-emerald-600 text-white shadow-md"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        All Districts
                      </button>

                      {uniqueDistricts.map((dist) => (
                        <button
                          key={dist}
                          onClick={() => setSelectedDistrict(dist)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap capitalize transition-all ${
                            selectedDistrict === dist
                              ? "bg-emerald-600 text-white shadow-md"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          {dist}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Paginated Crops List */}
                {currentCrops.length > 0 ? (
                  <div className="space-y-4">
                    {currentCrops.map((cultivation: any, idx) => {
                      const isExpanded = expandedCropIndex === idx;
                      const isTracking = cultivation.isTracking;
                      const currentStepIndex = cultivation.currentStepIndex || 0;

                      const currentCropSteps = isExpanded ? cropSteps : (cropStepsCache[cultivation.cropName] || []);
                      const isCompleted = isTracking && currentCropSteps.length > 0 && currentStepIndex >= currentCropSteps.length;

                      let targetDate: Date | null = null;
                      if (isTracking && currentCropSteps.length > 0 && !isCompleted) {
                        const baseDateStr = cultivation.currentStepStartDate || cultivation.trackingStartDate || cultivation.startDate;
                        if (baseDateStr) {
                          const currentStepDays = currentCropSteps[currentStepIndex]?.estimatedDays || 0;
                          targetDate = new Date(baseDateStr);
                          targetDate.setDate(targetDate.getDate() + currentStepDays);
                        }
                      }

                      return (
                        <div
                          key={cultivation._id || idx}
                          className={`bg-white rounded-2xl p-4 sm:p-5 transition-all duration-300 ${
                            isExpanded 
                              ? 'border-emerald-300 shadow-md ring-2 ring-emerald-50' 
                              : 'border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div className="flex items-start gap-3 w-full">
                              <div className="pt-0.5 w-full">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <h3 className="text-base font-bold text-gray-800">{cultivation.cropName}</h3>
                                  <span className="bg-gray-100 text-gray-500 text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                                    {cultivation.district}
                                  </span>
                                  
                                  {isTracking && !isCompleted && (
                                    <span className="bg-emerald-50 text-emerald-700 text-[10px] pl-2 pr-1.5 py-1 rounded-md font-bold flex items-center border border-emerald-100">
                                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1.5"></span>
                                      Tracking
                                      {targetDate && <MiniDigitalCountdown targetDate={targetDate} />}
                                    </span>
                                  )}
                                  {isCompleted && (
                                    <span className="bg-amber-50 text-amber-700 text-[10px] px-2 py-1 rounded-md font-bold flex items-center gap-1 border border-amber-100">
                                      Completed
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                                  Planted: {new Date(cultivation.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 md:pl-0 pt-3 md:pt-0 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleViewSteps(cultivation.cropName, idx)}
                                className={`shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
                                  isExpanded
                                    ? 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-slate-50 dark:hover:bg-slate-950'
                                }`}
                              >
                                {isExpanded ? 'Close Plan' : 'View Plan'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteCrop(cultivation._id)}
                                disabled={isDeleting === cultivation._id}
                                className="shrink-0 px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors disabled:opacity-50"
                              >
                                {isDeleting === cultivation._id ? '...' : 'Delete'}
                              </button>
                            </div>
                          </div>

                          <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                            <div className="overflow-hidden">
                              <div className="pt-4 border-t border-gray-100">

                                <div className="mb-5 p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-100">
                                  {!isTracking ? (
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                                      <div>
                                        <h4 className="text-sm font-bold text-gray-800">Ready to start?</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">Activate tracking to get real-time timers and guidance.</p>
                                      </div>
                                      <button
                                        onClick={() => handleStartTracking(cultivation._id)}
                                        disabled={isStarting === cultivation._id}
                                        className="w-full sm:w-auto bg-gray-800 text-white font-semibold text-xs py-2 px-5 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
                                      >
                                        {isStarting === cultivation._id ? 'Starting...' : 'Start Tracking'}
                                      </button>
                                    </div>
                                  ) : (
                                    isCompleted ? (
                                      <div className="text-center py-4">
                                        <h4 className="text-base font-bold text-gray-800">Harvest Time!</h4>
                                        <p className="text-xs text-gray-500 mt-1">You have successfully completed all stages.</p>
                                      </div>
                                    ) : (
                                      cropSteps.length > 0 && targetDate && (
                                        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                                          <div className="flex-1 w-full flex flex-col items-center lg:items-start">
                                            <div className="mb-3 text-center lg:text-left">
                                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Current Stage</span>
                                              <span className="text-sm font-bold text-gray-800">
                                                {cropSteps[currentStepIndex].stage}
                                              </span>
                                            </div>
                                            <DigitalCountdown targetDate={targetDate} />
                                          </div>

                                          <div className="w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-gray-200 pt-4 lg:pt-0 lg:pl-6 flex flex-col items-center justify-center shrink-0">
                                            <div className="text-center w-full max-w-[160px]">
                                              <p className="text-[10px] font-semibold text-gray-500 mb-2">Finished this step early?</p>
                                              <button
                                                onClick={() => handleAdvanceStep(cultivation._id)}
                                                disabled={isAdvancing === cultivation._id}
                                                className="w-full bg-white border border-gray-300 text-gray-700 font-semibold text-xs py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 shadow-sm"
                                              >
                                                {isAdvancing === cultivation._id ? 'Updating...' : 'Complete Stage'}
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    )
                                  )}
                                </div>

                                <div className="flex items-center gap-3 mb-4">
                                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Step-by-Step Plan</h4>
                                  <div className="h-px bg-gray-100 flex-1"></div>
                                </div>

                                {loadingSteps ? (
                                  <div className="flex justify-center items-center py-6 text-gray-400 text-xs font-medium">
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Loading plan...
                                  </div>
                                ) : cropSteps.length > 0 ? (
                                  <div className="space-y-0 pl-4 relative mt-2">
                                    <div className="absolute top-4 bottom-6 left-[23.5px] w-0.5 bg-gray-100 rounded-full"></div>

                                    {cropSteps.map((step, stepIdx) => {
                                      const isActiveStep = isTracking && currentStepIndex === stepIdx;
                                      const isPastStep = (isTracking && currentStepIndex > stepIdx) || isCompleted;

                                      return (
                                        <div key={stepIdx} className="flex gap-4 relative pb-6 last:pb-0 group">
                                          <div className="relative z-10 flex flex-col items-center pt-1.5">
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                              isActiveStep 
                                                ? 'border-gray-800 bg-white ring-4 ring-gray-100 scale-110' 
                                                : isPastStep 
                                                  ? 'border-gray-800 bg-gray-800' 
                                                  : 'border-gray-200 bg-white group-hover:border-gray-300'
                                            }`}>
                                              {isActiveStep && (
                                                <div className="w-1.5 h-1.5 bg-gray-800 rounded-full animate-pulse"></div>
                                              )}
                                            </div>
                                          </div>

                                          <div className={`flex-1 p-3.5 rounded-xl border transition-all duration-300 ${
                                            isActiveStep 
                                              ? 'bg-white border-gray-300 shadow-sm' 
                                              : isPastStep 
                                                ? 'bg-gray-50/50 border-transparent opacity-60' 
                                                : 'bg-white border-gray-100 hover:border-gray-200'
                                          }`}>
                                            <div className="flex flex-wrap justify-between items-start gap-2 mb-1.5">
                                              <h5 className={`text-sm font-bold flex items-center gap-2 ${
                                                isActiveStep ? 'text-gray-900' : isPastStep ? 'text-gray-400 line-through' : 'text-gray-700'
                                              }`}>
                                                {step.stage}
                                              </h5>
                                              <span className={`text-[9px] px-2 py-0.5 rounded font-bold tracking-wide ${
                                                isActiveStep ? 'bg-gray-100 text-gray-800' : isPastStep ? 'bg-transparent text-gray-400' : 'bg-gray-50 text-gray-500 border border-gray-100'
                                              }`}>
                                                {step.estimatedDays} days
                                              </span>
                                            </div>
                                            <p className={`text-xs leading-relaxed font-medium ${
                                              isActiveStep ? 'text-gray-600' : 'text-gray-400'
                                            }`}>
                                              {step.instructions}
                                            </p>

                                            {step.alert && !isPastStep && (
                                              <div className={`mt-3 text-[11px] p-2.5 rounded-lg border flex gap-2 items-start ${
                                                isActiveStep 
                                                  ? 'bg-red-50 text-red-800 border-red-100' 
                                                  : 'bg-amber-50 text-amber-800 border-amber-100'
                                              }`}>
                                                <div>
                                                  <strong className="block mb-0.5 text-[9px] uppercase tracking-widest opacity-70">Important Note</strong>
                                                  <p className="font-semibold">{step.alert}</p>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-3 pt-6 pb-2">
                        <button
                          onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); setExpandedCropIndex(null); }}
                          disabled={currentPage === 1}
                          className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm"
                        >
                          Previous
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }).map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => { setCurrentPage(idx + 1); setExpandedCropIndex(null); }}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                currentPage === idx + 1
                                  ? 'bg-emerald-600 text-white shadow-md'
                                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                              }`}
                            >
                              {idx + 1}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); setExpandedCropIndex(null); }}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 font-medium">
                    No matching crops found for your search.
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 px-4 bg-white rounded-2xl border border-gray-200 shadow-sm mt-4">
                <h2 className="text-lg font-bold text-gray-800 mb-1.5">Your field is empty</h2>
                <p className="text-xs text-gray-500 max-w-xs mx-auto mb-6 font-medium leading-relaxed">
                  Get AI-powered crop recommendations tailored to your exact district and season.
                </p>
                <button
                  onClick={() => router.push('/dashboard/farmer/cultivation')}
                  className="bg-gray-900 text-white text-xs font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
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