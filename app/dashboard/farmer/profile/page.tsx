'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FarmerSidebar from '@/app/navigation/farmer/page';

interface UserData {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  role: string;
  photoURL?: string;
  // Address Information only
  address?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'IN', name: 'India' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'NP', name: 'Nepal' },
    { code: 'AE', name: 'UAE' },
  ];

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
      setFormData(userData);
      await fetchUserDetails(userData.id, token);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      handleAuthError();
    }
  };

  const handleAuthError = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/signin');
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
        // Token expired - try to refresh or redirect to login
        handleAuthError();
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setUser(prevUser => ({ ...prevUser, ...data }));
        setFormData(prevData => ({ ...prevData, ...data }));
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), ...data }));
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch user details');
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token || !user?.id) {
        handleAuthError();
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/users/${user.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.status === 401) {
        setError('Current password is incorrect');
        return;
      }

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Failed to update password:', error);
      setError('Failed to connect to server');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token || !user?.id) {
        handleAuthError();
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.status === 401) {
        // Token might be expired, try to refresh or redirect
        handleAuthError();
        return;
      }

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        // Update localStorage with new user data
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...currentUser, ...updatedUser }));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        setIsEditing(false);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError('Failed to connect to server');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'personal', name: 'Personal Info', icon: '👤' },
    { id: 'address', name: 'Address', icon: '📍' },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-green-50">
        <div className="text-center px-4">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <FarmerSidebar user={user} />
      
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Profile</h1>
              <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Manage your personal information and address</p>
            </div>
            
            {/* Success/Error Messages - Mobile Responsive */}
            <div className="order-first md:order-none mb-2 md:mb-0">
              {saveSuccess && (
                <div className="flex items-center space-x-2 px-3 py-2 md:px-4 md:py-2 bg-green-100 text-green-700 rounded-lg text-sm md:text-base">
                  <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Profile updated successfully!</span>
                </div>
              )}
              {error && (
                <div className="flex items-center space-x-2 px-3 py-2 md:px-4 md:py-2 bg-red-100 text-red-700 rounded-lg text-sm md:text-base">
                  <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="break-words">{error}</span>
                </div>
              )}
            </div>

            {/* Action Buttons - Mobile Responsive */}
            {!isEditing && !isChangingPassword ? (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="flex items-center justify-center space-x-2 px-3 py-2 md:px-4 md:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span>Change Password</span>
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center space-x-2 px-3 py-2 md:px-4 md:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Profile</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setIsChangingPassword(false);
                    setFormData(user || {});
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                    setActiveTab('personal');
                    setError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base"
                >
                  Cancel
                </button>
                {isEditing && (
                  <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm md:text-base"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                )}
                {isChangingPassword && (
                  <button
                    onClick={handlePasswordSubmit}
                    disabled={isSaving}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm md:text-base"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Profile Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-24 md:h-32 bg-gradient-to-r from-green-400 to-green-600"></div>
            
            <div className="px-4 md:px-6 lg:px-8 pb-6 md:pb-8">
              {/* Avatar */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end -mt-12 md:-mt-16 mb-4 md:mb-6">
                <div className="flex items-end space-x-3 md:space-x-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-white p-1 shadow-lg flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-green-600 flex items-center justify-center text-white text-xl md:text-2xl lg:text-3xl font-bold overflow-hidden">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user?.name?.charAt(0).toUpperCase() || 'F'
                      )}
                    </div>
                  </div>
                  <div className="mb-1">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 break-words">{user?.name}</h2>
                    <p className="text-sm md:text-base text-gray-600 capitalize">{user?.role}</p>
                  </div>
                </div>
              </div>

              {/* Password Change Form */}
              {isChangingPassword && (
                <div className="mb-6 p-4 md:p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black text-sm md:text-base"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black text-sm md:text-base"
                        required
                        minLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black text-sm md:text-base"
                        required
                      />
                    </div>
                    <p className="text-xs md:text-sm text-gray-500 mt-2">
                      Password must be at least 6 characters long
                    </p>
                  </div>
                </div>
              )}

              {/* Tabs (only show when editing) - Mobile Responsive */}
              {isEditing && !isChangingPassword && (
                <div className="flex space-x-1 border-b border-gray-200 mb-6 overflow-x-auto pb-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-1 md:space-x-2 px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-medium whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? 'text-green-600 border-b-2 border-green-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                {(!isEditing || activeTab === 'personal') && !isChangingPassword && (
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black text-sm md:text-base"
                          />
                        ) : (
                          <p className="text-sm md:text-base text-gray-900 py-2 break-words">{user?.name || 'Not provided'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        {isEditing ? (
                          <input
                            type="email"
                            name="email"
                            value={formData.email || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black text-sm md:text-base"
                          />
                        ) : (
                          <p className="text-sm md:text-base text-gray-900 py-2 break-words">{user?.email || 'Not provided'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black text-sm md:text-base"
                          />
                        ) : (
                          <p className="text-sm md:text-base text-gray-900 py-2 break-words">{user?.phoneNumber || 'Not provided'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
                        <p className="text-sm md:text-base text-gray-900 py-2">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Not available'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Address Information */}
                {isEditing && activeTab === 'address' && !isChangingPassword && (
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                      Address Information
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address || ''}
                          onChange={handleInputChange}
                          placeholder="123 Main St"
                          className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black text-sm md:text-base"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2 (Optional)</label>
                        <input
                          type="text"
                          name="addressLine2"
                          value={formData.addressLine2 || ''}
                          onChange={handleInputChange}
                          placeholder="Apt, Suite, Building"
                          className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black text-sm md:text-base"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city || ''}
                          onChange={handleInputChange}
                          placeholder="New York"
                          className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black text-sm md:text-base"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state || ''}
                          onChange={handleInputChange}
                          placeholder="NY"
                          className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black text-sm md:text-base"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                        <select
                          name="country"
                          value={formData.country || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black text-sm md:text-base"
                        >
                          <option value="">Select country</option>
                          {countries.map(country => (
                            <option key={country.code} value={country.code}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ZIP/Postal Code</label>
                        <input
                          type="text"
                          name="zipCode"
                          value={formData.zipCode || ''}
                          onChange={handleInputChange}
                          placeholder="10001"
                          className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black text-sm md:text-base"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* View Mode - Show Address Information Only */}
                {!isEditing && !isChangingPassword && (
                  <>
                    {/* Address Information (View Mode) */}
                    {(user?.address || user?.addressLine2 || user?.city || user?.state || user?.country || user?.zipCode) && (
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                          Address Information
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                          {user?.address && (
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                              <p className="text-sm md:text-base text-gray-900 py-2 break-words">{user.address}</p>
                            </div>
                          )}
                          {user?.addressLine2 && (
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                              <p className="text-sm md:text-base text-gray-900 py-2 break-words">{user.addressLine2}</p>
                            </div>
                          )}
                          
                          {/* Responsive grid for address details */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 w-full">
                            {user?.city && (
                              <div className="col-span-1">
                                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">City</label>
                                <p className="text-sm md:text-base text-gray-900 break-words">{user.city}</p>
                              </div>
                            )}
                            {user?.state && (
                              <div className="col-span-1">
                                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">State</label>
                                <p className="text-sm md:text-base text-gray-900 break-words">{user.state}</p>
                              </div>
                            )}
                            {user?.country && (
                              <div className="col-span-1">
                                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Country</label>
                                <p className="text-sm md:text-base text-gray-900 break-words">
                                  {countries.find(c => c.code === user.country)?.name || user.country}
                                </p>
                              </div>
                            )}
                            {user?.zipCode && (
                              <div className="col-span-1">
                                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                                <p className="text-sm md:text-base text-gray-900 break-words">{user.zipCode}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}