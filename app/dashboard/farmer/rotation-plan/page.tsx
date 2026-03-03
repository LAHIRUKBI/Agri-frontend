'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface User {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  role: string;
}

interface Plot {
  id: string;
  name: string;
  size: number;
  soilType: string;
  currentCrop: string;
  location?: string;
}

interface Crop {
  id: string;
  name: string;
  category: string;
  growingSeason: string[];
  daysToMaturity: number;
  nitrogenFixer: boolean;
}

interface RotationPlan {
  year: number;
  season: string;
  crop: string;
  expectedYield?: number;
  plantingDate?: string;
  harvestDate?: string;
}

export default function FarmerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [rotationPlans, setRotationPlans] = useState<RotationPlan[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<string>('');
  const [rotationYears, setRotationYears] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'plots' | 'rotation' | 'history'>('dashboard');
  const [showAddPlotModal, setShowAddPlotModal] = useState(false);
  const [newPlot, setNewPlot] = useState({
    name: '',
    size: '',
    soilType: 'loamy',
    location: '',
    currentCrop: ''
  });
  
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/signin');
      return;
    }
    
    const userData = JSON.parse(userStr);
    if (userData.role !== 'farmer') {
      router.push('/dashboard/rotation-plan');
      return;
    }
    
    setUser(userData);
    fetchFarmerData(token);
  }, [router]);

  const fetchFarmerData = async (token: string) => {
    setIsLoading(true);
    try {
      // Fetch plots, crops, and rotation plans in parallel
      const [plotsRes, cropsRes] = await Promise.all([
        fetch(`${API_URL}/farmer/plots`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch(`${API_URL}/rotation/crops`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      if (plotsRes.ok) {
        const plotsData = await plotsRes.json();
        setPlots(plotsData.data || []);
      }

      if (cropsRes.ok) {
        const cropsData = await cropsRes.json();
        setCrops(cropsData.data || []);
      }

      // Fetch rotation plans if there are plots
      if (plots.length > 0) {
        const rotationRes = await fetch(`${API_URL}/farmer/rotations`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (rotationRes.ok) {
          const rotationData = await rotationRes.json();
          setRotationPlans(rotationData.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching farmer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlot = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_URL}/farmer/plots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newPlot.name,
          size: parseFloat(newPlot.size),
          soilType: newPlot.soilType,
          location: newPlot.location,
          currentCrop: newPlot.currentCrop
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPlots([...plots, data.data]);
        setShowAddPlotModal(false);
        setNewPlot({ name: '', size: '', soilType: 'loamy', location: '', currentCrop: '' });
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to add plot');
      }
    } catch (error) {
      console.error('Error adding plot:', error);
      alert('Failed to add plot');
    }
  };

  const handleGenerateRotation = async () => {
    if (!selectedPlot) {
      alert('Please select a plot');
      return;
    }

    const token = localStorage.getItem('token');
    setIsGenerating(true);

    try {
      const response = await fetch(`${API_URL}/rotation/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plotId: selectedPlot,
          years: rotationYears
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRotationPlans(data.data.rotation || []);
        setActiveTab('rotation');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to generate rotation plan');
      }
    } catch (error) {
      console.error('Error generating rotation:', error);
      alert('Failed to generate rotation plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/signin');
  };

  const soilTypeColors = {
    clay: 'bg-red-100 text-red-800',
    sandy: 'bg-yellow-100 text-yellow-800',
    loamy: 'bg-green-100 text-green-800',
    silty: 'bg-blue-100 text-blue-800',
    peaty: 'bg-brown-100 text-brown-800',
    chalky: 'bg-gray-100 text-gray-800'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-green-800">Agri-Support Farmer Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('plots')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'plots'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Plots
            </button>
            <button
              onClick={() => setActiveTab('rotation')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rotation'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Rotation Plans
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              History
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Plots</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{plots.length}</dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Land Area</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {plots.reduce((sum, plot) => sum + plot.size, 0).toFixed(1)} acres
                  </dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Rotations</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{rotationPlans.length}</dd>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowAddPlotModal(true)}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition duration-200"
                >
                  <svg className="h-8 w-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">Add New Plot</p>
                </button>
                <button
                  onClick={() => setActiveTab('rotation')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition duration-200"
                >
                  <svg className="h-8 w-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">Generate Rotation</p>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition duration-200"
                >
                  <svg className="h-8 w-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">View History</p>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              {rotationPlans.length > 0 ? (
                <div className="space-y-4">
                  {rotationPlans.slice(0, 5).map((plan, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-600 font-semibold">{plan.year}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {plan.crop} - {plan.season}
                        </p>
                        <p className="text-sm text-gray-500">
                          {plan.plantingDate ? new Date(plan.plantingDate).toLocaleDateString() : 'Pending'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>
        )}

        {/* Plots Tab */}
        {activeTab === 'plots' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">My Plots</h3>
              <button
                onClick={() => setShowAddPlotModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200"
              >
                + Add New Plot
              </button>
            </div>

            {plots.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-12 text-center">
                <svg className="h-12 w-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No plots yet</h3>
                <p className="mt-2 text-sm text-gray-500">Get started by adding your first plot.</p>
                <button
                  onClick={() => setShowAddPlotModal(true)}
                  className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Add Your First Plot
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plots.map((plot) => (
                  <div key={plot.id} className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{plot.name}</h4>
                          <p className="text-sm text-gray-500 mt-1">{plot.size} acres</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${soilTypeColors[plot.soilType as keyof typeof soilTypeColors] || 'bg-gray-100 text-gray-800'}`}>
                          {plot.soilType}
                        </span>
                      </div>
                      {plot.location && (
                        <p className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Location:</span> {plot.location}
                        </p>
                      )}
                      {plot.currentCrop && (
                        <p className="mt-1 text-sm text-gray-600">
                          <span className="font-medium">Current Crop:</span> {plot.currentCrop}
                        </p>
                      )}
                      <div className="mt-4 flex space-x-3">
                        <button
                          onClick={() => {
                            setSelectedPlot(plot.id);
                            setActiveTab('rotation');
                          }}
                          className="text-sm text-green-600 hover:text-green-700 font-medium"
                        >
                          Plan Rotation
                        </button>
                        <button className="text-sm text-gray-600 hover:text-gray-700 font-medium">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rotation Plans Tab */}
        {activeTab === 'rotation' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Rotation Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Select Plot</label>
                  <select
                    value={selectedPlot}
                    onChange={(e) => setSelectedPlot(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 rounded-md"
                  >
                    <option value="">Choose a plot</option>
                    {plots.map((plot) => (
                      <option key={plot.id} value={plot.id}>{plot.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rotation Years</label>
                  <select
                    value={rotationYears}
                    onChange={(e) => setRotationYears(parseInt(e.target.value))}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 rounded-md"
                  >
                    <option value={3}>3 Years</option>
                    <option value={4}>4 Years</option>
                    <option value={5}>5 Years</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleGenerateRotation}
                    disabled={!selectedPlot || isGenerating}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Plan'}
                  </button>
                </div>
              </div>
            </div>

            {rotationPlans.length > 0 && (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">Your Rotation Plan</h3>
                </div>
                <div className="border-t border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Season</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Yield</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planting Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harvest Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rotationPlans.map((plan, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{plan.year}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.season}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.crop}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.expectedYield || 'TBD'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {plan.plantingDate ? new Date(plan.plantingDate).toLocaleDateString() : 'TBD'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {plan.harvestDate ? new Date(plan.harvestDate).toLocaleDateString() : 'TBD'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Crop Rotation History</h3>
            {rotationPlans.length > 0 ? (
              <div className="space-y-8">
                {[1, 2, 3].map((year) => (
                  <div key={year} className="border-l-4 border-green-500 pl-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-2">Year {year}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {rotationPlans
                        .filter(plan => plan.year === year)
                        .map((plan, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <p className="font-medium text-gray-900">{plan.crop}</p>
                            <p className="text-sm text-gray-500">{plan.season}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No rotation history available</p>
            )}
          </div>
        )}
      </div>

      {/* Add Plot Modal */}
      {showAddPlotModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Plot</h3>
            <form onSubmit={handleAddPlot}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plot Name</label>
                  <input
                    type="text"
                    required
                    value={newPlot.name}
                    onChange={(e) => setNewPlot({...newPlot, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., North Field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Size (acres)</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min="0.1"
                    value={newPlot.size}
                    onChange={(e) => setNewPlot({...newPlot, size: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., 5.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Soil Type</label>
                  <select
                    value={newPlot.soilType}
                    onChange={(e) => setNewPlot({...newPlot, soilType: e.target.value})}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 rounded-md"
                  >
                    <option value="clay">Clay</option>
                    <option value="sandy">Sandy</option>
                    <option value="loamy">Loamy</option>
                    <option value="silty">Silty</option>
                    <option value="peaty">Peaty</option>
                    <option value="chalky">Chalky</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location (optional)</label>
                  <input
                    type="text"
                    value={newPlot.location}
                    onChange={(e) => setNewPlot({...newPlot, location: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., North side of farm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Crop (optional)</label>
                  <input
                    type="text"
                    value={newPlot.currentCrop}
                    onChange={(e) => setNewPlot({...newPlot, currentCrop: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Corn"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddPlotModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                >
                  Add Plot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}