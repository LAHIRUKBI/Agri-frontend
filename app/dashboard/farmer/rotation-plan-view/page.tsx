// app/dashboard/farmer/rotation-plans/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FarmerSidebar from '@/app/navigation/farmer/page';

interface PastCrop {
  cropName: string;
  timePeriod: string;
  fertilizers: any;
  pesticides: any;
}

interface SoilNutrientLevel {
  nutrient: string;
  level: string;
  depletionPrediction: string;
}

interface RequiredNutrient {
  nutrient: string;
  recommendedSource: string;
  amount: string;
}

interface RotationPlan {
  _id: string;
  targetCrop: string;
  currentMonth: string;
  pastCrops: PastCrop[];
  soilCondition?: {
    status: string;
    details: string[];
  };
  targetEvaluation?: {
    isSuitable: boolean;
    feedback: string[];
    aiSoilRemedy?: string;
  };
  alternativeSuggestions?: {
    cropName: string;
    reasons: string[];
  }[];
  soilNutrientLevels: SoilNutrientLevel[];
  requiredNutrients?: RequiredNutrient[];
  createdAt: string;
}

// Helper function to format objects/arrays into readable strings safely
const formatAgriInput = (input: any): string => {
  if (!input) return '';
  if (typeof input === 'string') return input;
  
  if (Array.isArray(input)) {
    return input.map(item => {
      if (item?.name) return `${item.name}${item.amount_g ? ` (${item.amount_g}g)` : ''}`;
      return typeof item === 'object' ? JSON.stringify(item) : String(item);
    }).join(', ');
  }
  
  if (typeof input === 'object') {
    if (input.name) return `${input.name}${input.amount_g ? ` (${input.amount_g}g)` : ''}`;
    return JSON.stringify(input);
  }
  
  return String(input);
};

export default function RotationPlansPage() {
  const [plans, setPlans] = useState<RotationPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<RotationPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // Search, Filter & Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('all');
  const [selectedSuitability, setSelectedSuitability] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  
  const [selectedSort, setSelectedSort] = useState('newest');
  const [selectedPlan, setSelectedPlan] = useState<RotationPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [language, setLanguage] = useState('English');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/signin');
      return;
    }
    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (error) {
      console.error('Failed to parse user data:', error);
    }
  }, [router]);

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    // Apply filters and sorting
    let result = [...plans];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(plan =>
        plan.targetCrop.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.currentMonth.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply month filter
    if (selectedMonthFilter !== 'all') {
      result = result.filter(plan => plan.currentMonth === selectedMonthFilter);
    }

    // Apply suitability filter
    if (selectedSuitability !== 'all') {
      const isSuitableTarget = selectedSuitability === 'suitable';
      result = result.filter(plan => plan.targetEvaluation?.isSuitable === isSuitableTarget);
    }

    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return selectedSort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredPlans(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [plans, searchTerm, selectedMonthFilter, selectedSuitability, selectedSort]);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${API_URL}/rotation/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch rotation plans');
      }

      const data = await response.json();
      setPlans(data);
      setFilteredPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${API_URL}/rotation/history/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete plan');
      }

      // Remove from state
      setPlans(plans.filter(p => p._id !== planId));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete plan');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSuitabilityBadge = (isSuitable?: boolean) => {
    return isSuitable ? (
      <span className="px-2 py-1 text-[10px] font-bold bg-green-100 text-green-700 rounded-full border border-green-200 shadow-sm">
        Suitable
      </span>
    ) : (
      <span className="px-2 py-1 text-[10px] font-bold bg-red-100 text-red-700 rounded-full border border-red-200 shadow-sm">
        Not Recommended
      </span>
    );
  };

  const openPlanModal = (plan: RotationPlan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const closePlanModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-white">
        <FarmerSidebar user={user} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your rotation plans...</p>
          </div>
        </main>
      </div>
    );
  }

  // Pagination Logic
  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
  const indexOfLastPlan = currentPage * itemsPerPage;
  const indexOfFirstPlan = indexOfLastPlan - itemsPerPage;
  const currentPlans = filteredPlans.slice(indexOfFirstPlan, indexOfLastPlan);

  // Extract unique months for filter pills
  const uniqueMonths = Array.from(new Set(plans.map(p => p.currentMonth)));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <FarmerSidebar user={user} />
      
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">My Rotation Plans</h1>
              <p className="text-sm text-gray-500 mt-1">
                View and manage all your saved crop rotation evaluations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium shadow-sm">
                {plans.length} {plans.length === 1 ? 'Plan' : 'Plans'}
              </span>
            </div>
          </div>

          {/* Search & Filter Bar Section */}
          {plans.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm mb-8 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Search & Filter Plans:</span>
                </div>

                {/* Search Box */}
                <div className="relative w-full lg:w-80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search by crop name or date..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-green-500/50 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-hide">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Status:</span>
                
                <button
                  onClick={() => setSelectedSuitability("all")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap capitalize transition-all ${
                    selectedSuitability === "all"
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  All Status
                </button>
                <button
                  onClick={() => setSelectedSuitability("suitable")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap capitalize transition-all ${
                    selectedSuitability === "suitable"
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  Suitable
                </button>
                <button
                  onClick={() => setSelectedSuitability("not_recommended")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap capitalize transition-all ${
                    selectedSuitability === "not_recommended"
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  Not Recommended
                </button>
              </div>

              {/* Month Filter Pills */}
              {uniqueMonths.length > 0 && (
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-hide">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Months:</span>
                  
                  <button
                    onClick={() => setSelectedMonthFilter("all")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap capitalize transition-all ${
                      selectedMonthFilter === "all"
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    All Months
                  </button>

                  {uniqueMonths.map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedMonthFilter(m)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedMonthFilter === m
                          ? "bg-green-600 text-white shadow-md"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {plans.length === 0 && !isLoading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center mt-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Rotation Plans Yet</h3>
              <p className="text-sm text-gray-500 mb-4">Start by evaluating your first crop rotation</p>
              <button
                onClick={() => router.push('/dashboard/farmer/rotation-plan')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
              >
                Create New Plan
              </button>
            </div>
          )}

          {/* Plans Grid */}
          {currentPlans.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {currentPlans.map((plan) => (
                  <div
                    key={plan._id}
                    className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-200 overflow-hidden hover:shadow-lg hover:border-green-300 transition-all cursor-pointer flex flex-col justify-between"
                    onClick={() => openPlanModal(plan)}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-green-50/50 to-white">
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <h3 className="font-bold text-gray-800 text-base leading-tight">{plan.targetCrop}</h3>
                          {getSuitabilityBadge(plan.targetEvaluation?.isSuitable)}
                        </div>
                        <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {plan.currentMonth}
                        </p>
                      </div>

                      {/* Card Body */}
                      <div className="p-4">
                        {/* Past Crops Summary */}
                        <div className="mb-3.5">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Past Crops</p>
                          <div className="flex flex-wrap gap-1.5">
                            {plan.pastCrops?.slice(0, 2).map((crop, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold border border-slate-200">
                                {crop.cropName}
                              </span>
                            ))}
                            {plan.pastCrops?.length > 2 && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold border border-slate-200">
                                +{plan.pastCrops.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Soil Status */}
                        <div className="mb-4">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Soil Health Status</p>
                          <p className="text-xs font-semibold text-gray-700 line-clamp-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                            {plan.soilCondition?.status || plan.targetEvaluation?.aiSoilRemedy || "Evaluation Complete"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 pt-0">
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <p className="text-[10px] font-medium text-gray-400">
                          {formatDate(plan.createdAt)}
                        </p>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {deleteConfirm === plan._id ? (
                            <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded-lg border border-red-100">
                              <button
                                onClick={() => handleDeletePlan(plan._id)}
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                                title="Confirm Delete"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md transition-colors"
                                title="Cancel"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(plan._id)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                              title="Delete Plan"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4 pb-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all shadow-sm"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx + 1)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          currentPage === idx + 1
                            ? 'bg-green-600 text-white shadow-md'
                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all shadow-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : plans.length > 0 ? (
            <div className="text-center py-12 text-gray-500 font-medium">
              No matching plans found for your search.
            </div>
          ) : null}

          {/* Detail Modal */}
          {isModalOpen && selectedPlan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-[2rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 sm:px-8 py-5 flex items-center justify-between z-10">
                  <h2 className="text-xl font-bold text-gray-800 tracking-tight">Rotation Plan Details</h2>
                  <button
                    onClick={closePlanModal}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
                  {/* Plan Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-1">{selectedPlan.targetCrop}</h3>
                      <p className="text-sm font-semibold text-green-600 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Target Month: {selectedPlan.currentMonth}
                      </p>
                    </div>
                    <div className="transform scale-125 origin-right">
                      {getSuitabilityBadge(selectedPlan.targetEvaluation?.isSuitable)}
                    </div>
                  </div>

                  {/* Suitability Feedback */}
                  {selectedPlan.targetEvaluation && (
                    <div className={`bg-${selectedPlan.targetEvaluation.isSuitable ? 'green' : 'red'}-50 rounded-2xl p-5 border border-${selectedPlan.targetEvaluation.isSuitable ? 'green' : 'red'}-200/60`}>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <svg className={`w-4 h-4 text-${selectedPlan.targetEvaluation.isSuitable ? 'green' : 'red'}-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Expert Feedback
                      </h4>
                      <ul className="list-none space-y-2 text-sm text-gray-700 font-medium">
                        {selectedPlan.targetEvaluation.feedback?.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className={`text-${selectedPlan.targetEvaluation!.isSuitable ? 'green' : 'red'}-500 mt-0.5`}>•</span>
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Soil Condition  */}
                  {selectedPlan.soilCondition && (
                    <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200/60">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Soil Health Analysis
                      </h4>
                      <p className="text-sm font-bold text-amber-900 mb-3 bg-amber-100/50 inline-block px-3 py-1 rounded-lg">{selectedPlan.soilCondition.status}</p>
                      <ul className="list-none space-y-2 text-sm text-gray-700 font-medium">
                        {selectedPlan.soilCondition.details?.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-500 mt-0.5">•</span>
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Past Crops */}
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200/60">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Field History
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedPlan.pastCrops?.map((crop, idx) => (
                        <div key={idx} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                          <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
                            <span className="font-bold text-gray-800 text-base">{crop.cropName}</span>
                            <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{crop.timePeriod}</span>
                          </div>
                          <div className="space-y-2">
                            {crop.fertilizers && (
                              <p className="text-xs text-gray-600">
                                <span className="font-bold text-gray-700 block mb-0.5">Fertilizers Used:</span> 
                                <span className="text-gray-500 font-medium leading-relaxed">{formatAgriInput(crop.fertilizers)}</span>
                              </p>
                            )}
                            {crop.pesticides && (
                              <p className="text-xs text-gray-600">
                                <span className="font-bold text-gray-700 block mb-0.5">Pesticides Used:</span> 
                                <span className="text-gray-500 font-medium leading-relaxed">{formatAgriInput(crop.pesticides)}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nutrient Tables */}
                  {selectedPlan.soilNutrientLevels && selectedPlan.soilNutrientLevels.length > 0 && (
                    <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
                      <div className="bg-amber-50 p-4 border-b border-amber-200">
                        <h4 className="text-xs font-bold text-amber-800 uppercase tracking-widest flex items-center gap-2">
                          Current Soil Nutrients
                        </h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50/50">
                            <tr>
                              <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nutrient</th>
                              <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Level</th>
                              <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Depletion Prediction</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedPlan.soilNutrientLevels.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-5 py-3.5 font-bold text-gray-800">{item.nutrient}</td>
                                <td className="px-5 py-3.5 font-medium text-gray-600">
                                  <span className="bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-sm">{item.level}</span>
                                </td>
                                <td className="px-5 py-3.5 text-gray-500 font-medium">{item.depletionPrediction}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {selectedPlan.requiredNutrients && selectedPlan.requiredNutrients.length > 0 && (
                    <div className="bg-white rounded-2xl border border-green-200 overflow-hidden">
                      <div className="bg-green-50 p-4 border-b border-green-200">
                        <h4 className="text-xs font-bold text-green-800 uppercase tracking-widest flex items-center gap-2">
                          Requirements for Next Crop
                        </h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50/50">
                            <tr>
                              <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nutrient</th>
                              <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount Required</th>
                              <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Recommended Source</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedPlan.requiredNutrients.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-5 py-3.5 font-bold text-gray-800">{item.nutrient}</td>
                                <td className="px-5 py-3.5 font-medium text-green-600">
                                  <span className="bg-green-50 px-2.5 py-1 rounded-lg font-bold">{item.amount}</span>
                                </td>
                                <td className="px-5 py-3.5 text-gray-600 font-medium">{item.recommendedSource}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Alternatives */}
                  {!selectedPlan.targetEvaluation?.isSuitable && selectedPlan.alternativeSuggestions && selectedPlan.alternativeSuggestions.length > 0 && (
                    <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200/60">
                      <h4 className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        Better Alternatives to Consider
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedPlan.alternativeSuggestions.map((item, idx) => (
                          <div key={idx} className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
                            <h5 className="font-extrabold text-blue-900 mb-2.5 text-base border-b border-blue-50 pb-2">{item.cropName}</h5>
                            <ul className="list-none text-xs text-gray-600 space-y-1.5 font-medium">
                              {item.reasons.map((reason, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-blue-400 mt-[1px]">›</span>
                                  <span className="leading-relaxed">{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-8">
                    <p className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Evaluated on: {new Date(selectedPlan.createdAt).toLocaleString()}
                    </p>
                    <button
                      onClick={() => {
                        handleDeletePlan(selectedPlan._id);
                        closePlanModal();
                      }}
                      className="px-5 py-2 text-sm text-red-600 hover:text-white font-bold border border-red-200 rounded-xl hover:bg-red-500 transition-all shadow-sm"
                    >
                      Delete Evaluation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}