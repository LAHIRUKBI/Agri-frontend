// app/dashboard/farmer/rotation-plans/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FarmerSidebar from '@/app/navigation/farmer/page';

interface PastCrop {
  cropName: string;
  timePeriod: string;
  fertilizers: string;
  pesticides: string;
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
  soilCondition: {
    status: string;
    details: string[];
  };
  targetEvaluation: {
    isSuitable: boolean;
    feedback: string[];
  };
  alternativeSuggestions: {
    cropName: string;
    reasons: string[];
  }[];
  soilNutrientLevels: SoilNutrientLevel[];
  requiredNutrients: RequiredNutrient[];
  createdAt: string;
}

export default function RotationPlansPage() {
  const [plans, setPlans] = useState<RotationPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<RotationPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
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

    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return selectedSort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredPlans(result);
  }, [plans, searchTerm, selectedSort]);

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

  const getSuitabilityBadge = (isSuitable: boolean) => {
    return isSuitable ? (
      <span className="px-2 py-1 text-[10px] font-bold bg-green-100 text-green-700 rounded-full border border-green-200">
        Suitable
      </span>
    ) : (
      <span className="px-2 py-1 text-[10px] font-bold bg-red-100 text-red-700 rounded-full border border-red-200">
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
              <span className="text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">
                {plans.length} {plans.length === 1 ? 'Plan' : 'Plans'}
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by crop name or date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-black w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {plans.length === 0 && !isLoading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Rotation Plans Yet</h3>
              <p className="text-sm text-gray-500 mb-4">Start by evaluating your first crop rotation</p>
              <button
                onClick={() => router.push('/dashboard/farmer/rotation-plan')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Create New Plan
              </button>
            </div>
          )}

          {/* Plans Grid */}
          {filteredPlans.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlans.map((plan) => (
                <div
                  key={plan._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openPlanModal(plan)}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-gray-800 text-base">{plan.targetCrop}</h3>
                      {getSuitabilityBadge(plan.targetEvaluation.isSuitable)}
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {plan.currentMonth}
                    </p>
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    {/* Past Crops Summary */}
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Past Crops</p>
                      <div className="flex flex-wrap gap-1">
                        {plan.pastCrops.slice(0, 2).map((crop, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[9px] font-medium">
                            {crop.cropName}
                          </span>
                        ))}
                        {plan.pastCrops.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[9px] font-medium">
                            +{plan.pastCrops.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Soil Status */}
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Soil Health</p>
                      <p className="text-xs font-medium text-gray-700 line-clamp-1">{plan.soilCondition.status}</p>
                    </div>

                    {/* Nutrient Summary */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {plan.soilNutrientLevels?.slice(0, 2).map((nutrient, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-2">
                          <p className="text-[8px] font-bold text-gray-400 uppercase">{nutrient.nutrient}</p>
                          <p className="text-[10px] font-semibold text-gray-700">{nutrient.level}</p>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <p className="text-[9px] text-gray-400">
                        {formatDate(plan.createdAt)}
                      </p>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openPlanModal(plan)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {deleteConfirm === plan._id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeletePlan(plan._id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Confirm Delete"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="p-1 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                              title="Cancel"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(plan._id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
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
          )}

          {/* Detail Modal */}
          {isModalOpen && selectedPlan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800">Rotation Plan Details</h2>
                  <button
                    onClick={closePlanModal}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Plan Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">{selectedPlan.targetCrop}</h3>
                      <p className="text-sm text-gray-500">{selectedPlan.currentMonth}</p>
                    </div>
                    {getSuitabilityBadge(selectedPlan.targetEvaluation.isSuitable)}
                  </div>

                  {/* Suitability Feedback */}
                  <div className={`bg-${selectedPlan.targetEvaluation.isSuitable ? 'green' : 'red'}-50 rounded-xl p-4 border border-${selectedPlan.targetEvaluation.isSuitable ? 'green' : 'red'}-200`}>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Feedback</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {selectedPlan.targetEvaluation.feedback.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Soil Condition */}
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Soil Health Status</h4>
                    <p className="text-sm font-semibold text-amber-800 mb-2">{selectedPlan.soilCondition.status}</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {selectedPlan.soilCondition.details.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Past Crops */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Past Crops History</h4>
                    <div className="space-y-3">
                      {selectedPlan.pastCrops.map((crop, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 border border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-800">{crop.cropName}</span>
                            <span className="text-xs text-gray-500">{crop.timePeriod}</span>
                          </div>
                          {crop.fertilizers && (
                            <p className="text-xs text-gray-600 mb-1">
                              <span className="font-medium">Fertilizers:</span> {crop.fertilizers}
                            </p>
                          )}
                          {crop.pesticides && (
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Pesticides:</span> {crop.pesticides}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nutrient Tables */}
                  {selectedPlan.soilNutrientLevels && selectedPlan.soilNutrientLevels.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-amber-200">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Soil Nutrient Levels</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-amber-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-bold text-amber-800">Nutrient</th>
                              <th className="px-4 py-2 text-left text-xs font-bold text-amber-800">Level</th>
                              <th className="px-4 py-2 text-left text-xs font-bold text-amber-800">Depletion Prediction</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedPlan.soilNutrientLevels.map((item, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-2 font-medium text-black">{item.nutrient}</td>
                                <td className="px-4 py-2 text-black">{item.level}</td>
                                <td className="px-4 py-2 text-gray-600">{item.depletionPrediction}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {selectedPlan.requiredNutrients && selectedPlan.requiredNutrients.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-green-200">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Required Nutrients</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-green-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-bold text-green-800">Nutrient</th>
                              <th className="px-4 py-2 text-left text-xs font-bold text-green-800">Amount</th>
                              <th className="px-4 py-2 text-left text-xs font-bold text-green-800">Recommended Source</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedPlan.requiredNutrients.map((item, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-2 font-medium text-black">{item.nutrient}</td>
                                <td className="px-4 py-2 text-black">{item.amount}</td>
                                <td className="px-4 py-2 text-gray-600">{item.recommendedSource}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Alternatives */}
                  {!selectedPlan.targetEvaluation.isSuitable && selectedPlan.alternativeSuggestions.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Recommended Alternatives</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedPlan.alternativeSuggestions.map((item, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 border border-blue-100">
                            <h5 className="font-bold text-blue-800 mb-2">{item.cropName}</h5>
                            <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                              {item.reasons.map((reason, i) => (
                                <li key={i}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-400">
                      Created: {new Date(selectedPlan.createdAt).toLocaleString()}
                    </p>
                    <button
                      onClick={() => {
                        handleDeletePlan(selectedPlan._id);
                        closePlanModal();
                      }}
                      className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Delete Plan
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