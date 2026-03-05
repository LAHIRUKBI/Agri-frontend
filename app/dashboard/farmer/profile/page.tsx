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
  // Address Information
  address?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  // Additional Contact Information
  alternatePhone?: string;
  emergencyContact?: string;
  emergencyContactName?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const [activeTab, setActiveTab] = useState('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
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
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/signin');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
      setFormData(userData);
      fetchUserDetails(userData.id, token);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      router.push('/signin');
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
      
      if (response.ok) {
        const data = await response.json();
        setUser(prevUser => ({ ...prevUser, ...data }));
        setFormData(prevData => ({ ...prevData, ...data }));
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const token = localStorage.getItem('token');
      if (!token || !user?.id) return;

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'personal', name: 'Personal Info', icon: '👤' },
    { id: 'address', name: 'Address', icon: '📍' },
    { id: 'contact', name: 'Additional Contact', icon: '📞' },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-green-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <FarmerSidebar user={user} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
              <p className="text-gray-600 mt-2">Manage your personal information and contact details</p>
            </div>
            {saveSuccess && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Profile updated successfully!</span>
              </div>
            )}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(user || {});
                    setActiveTab('personal');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Profile Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-green-400 to-green-600"></div>
            
            <div className="px-8 pb-8">
              {/* Avatar */}
              <div className="flex justify-between items-end -mt-16 mb-6">
                <div className="flex items-end space-x-4">
                  <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                    <div className="w-full h-full rounded-full bg-green-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user?.name?.charAt(0).toUpperCase() || 'F'
                      )}
                    </div>
                  </div>
                  <div className="mb-1">
                    <h2 className="text-2xl font-bold text-gray-800">{user?.name}</h2>
                    <p className="text-gray-600 capitalize">{user?.role}</p>
                  </div>
                </div>
              </div>

              {/* Tabs (only show when editing) */}
              {isEditing && (
                <div className="flex space-x-1 border-b border-gray-200 mb-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors ${
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
                {(!isEditing || activeTab === 'personal') && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black"
                          />
                        ) : (
                          <p className="text-gray-900 py-2">{user?.name || 'Not provided'}</p>
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black"
                          />
                        ) : (
                          <p className="text-gray-900 py-2">{user?.email || 'Not provided'}</p>
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black"
                          />
                        ) : (
                          <p className="text-gray-900 py-2">{user?.phoneNumber || 'Not provided'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
                        <p className="text-gray-900 py-2">
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
                {isEditing && activeTab === 'address' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                      Address Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address || ''}
                          onChange={handleInputChange}
                          placeholder="123 Main St"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                        <select
                          name="country"
                          value={formData.country || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Contact Information */}
                {isEditing && activeTab === 'contact' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                      Additional Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Phone Number</label>
                        <input
                          type="tel"
                          name="alternatePhone"
                          value={formData.alternatePhone || ''}
                          onChange={handleInputChange}
                          placeholder="+1 234 567 8900"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
                        <input
                          type="text"
                          name="emergencyContactName"
                          value={formData.emergencyContactName || ''}
                          onChange={handleInputChange}
                          placeholder="John Doe"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Number</label>
                        <input
                          type="tel"
                          name="emergencyContact"
                          value={formData.emergencyContact || ''}
                          onChange={handleInputChange}
                          placeholder="+1 234 567 8900"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                        <input
                          type="url"
                          name="website"
                          value={formData.website || ''}
                          onChange={handleInputChange}
                          placeholder="https://mywebsite.com"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <h4 className="text-md font-medium text-gray-700 mb-3">Social Media</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Facebook</label>
                            <input
                              type="url"
                              placeholder="Facebook URL"
                              value={formData.socialMedia?.facebook || ''}
                              onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Twitter</label>
                            <input
                              type="url"
                              placeholder="Twitter URL"
                              value={formData.socialMedia?.twitter || ''}
                              onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Instagram</label>
                            <input
                              type="url"
                              placeholder="Instagram URL"
                              value={formData.socialMedia?.instagram || ''}
                              onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* View Mode - Show All Information */}
                {!isEditing && (
                  <>
                    {/* Address Information (View Mode) */}
                    {(user?.address || user?.addressLine2 || user?.city || user?.state || user?.country || user?.zipCode) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                          Address Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {user?.address && (
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                              <p className="text-gray-900 py-2">{user.address}</p>
                            </div>
                          )}
                          {user?.addressLine2 && (
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                              <p className="text-gray-900 py-2">{user.addressLine2}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                            {user?.city && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                <p className="text-gray-900 py-2">{user.city}</p>
                              </div>
                            )}
                            {user?.state && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                                <p className="text-gray-900 py-2">{user.state}</p>
                              </div>
                            )}
                            {user?.country && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                                <p className="text-gray-900 py-2">
                                  {countries.find(c => c.code === user.country)?.name || user.country}
                                </p>
                              </div>
                            )}
                            {user?.zipCode && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                                <p className="text-gray-900 py-2">{user.zipCode}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional Contact Information (View Mode) */}
                    {(user?.alternatePhone || user?.emergencyContact || user?.website || user?.socialMedia) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                          Additional Contact Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {user?.alternatePhone && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Phone</label>
                              <p className="text-gray-900 py-2">{user.alternatePhone}</p>
                            </div>
                          )}
                          {user?.emergencyContact && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
                              <p className="text-gray-900 py-2">
                                {user.emergencyContactName ? `${user.emergencyContactName}: ` : ''}{user.emergencyContact}
                              </p>
                            </div>
                          )}
                          {user?.website && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                              <p className="text-gray-900 py-2">
                                <a href={user.website} target="_blank" rel="noopener noreferrer" 
                                   className="text-green-600 hover:text-green-700">
                                  {user.website}
                                </a>
                              </p>
                            </div>
                          )}
                          {user?.socialMedia && Object.keys(user.socialMedia).length > 0 && (
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Social Media</label>
                              <div className="flex space-x-4 py-2">
                                {user.socialMedia.facebook && (
                                  <a href={user.socialMedia.facebook} target="_blank" rel="noopener noreferrer"
                                     className="text-blue-600 hover:text-blue-700">
                                    Facebook
                                  </a>
                                )}
                                {user.socialMedia.twitter && (
                                  <a href={user.socialMedia.twitter} target="_blank" rel="noopener noreferrer"
                                     className="text-blue-400 hover:text-blue-500">
                                    Twitter
                                  </a>
                                )}
                                {user.socialMedia.instagram && (
                                  <a href={user.socialMedia.instagram} target="_blank" rel="noopener noreferrer"
                                     className="text-pink-600 hover:text-pink-700">
                                    Instagram
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
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