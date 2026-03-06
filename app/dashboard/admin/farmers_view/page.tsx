'use client';

import React, { useEffect, useState } from 'react';
import AdminSidebar from '@/app/navigation/admin/page';

interface Farmer {
    _id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    role: string;
    photoURL?: string;
    address?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    createdAt: string;
    updatedAt: string;
}

export default function FarmersViewPage() {
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('all');

    useEffect(() => {
        fetchFarmers();
    }, []);

    const fetchFarmers = async () => {
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${API_URL}/users/farmers`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            setFarmers(data.data);

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch farmers');
            }

            // Filter to ensure only farmers are shown
            const farmersList = data.data.filter((user: Farmer) => user.role === 'farmer');
            setFarmers(farmersList);
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err instanceof Error ? err.message : 'Failed to load farmers');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getCountryName = (countryCode?: string) => {
        if (!countryCode) return '—';

        const countries: Record<string, string> = {
            'US': 'United States',
            'GB': 'United Kingdom',
            'CA': 'Canada',
            'AU': 'Australia',
            'IN': 'India',
            'LK': 'Sri Lanka',
            'PK': 'Pakistan',
            'BD': 'Bangladesh',
            'NP': 'Nepal',
            'AE': 'UAE'
        };

        return countries[countryCode] || countryCode;
    };

    // Get unique countries for filter
    const countries = ['all', ...new Set(farmers.map(f => f.country).filter(Boolean) as string[])];

    const filteredFarmers = farmers.filter(farmer => {
        const matchesSearch =
            farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (farmer.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (farmer.phoneNumber || '').includes(searchTerm);

        const matchesCountry = selectedCountry === 'all' || farmer.country === selectedCountry;

        return matchesSearch && matchesCountry;
    });

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-white">
                <AdminSidebar />
                <main className="flex-1 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-3 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading farmers...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-white">
            <AdminSidebar />

            <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900">
                                Farmers Directory
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                View all registered farmers in the system
                            </p>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <div className="bg-white rounded-md border border-gray-200 p-4 mb-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or phone..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Farmers Table */}
                    <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Farmer</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Contact</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Location</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Address</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Joined</th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredFarmers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center">
                                                <p className="text-gray-500 font-medium">No farmers found</p>
                                                <p className="text-sm text-gray-400 mt-1">Try adjusting your search filters</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredFarmers.map((farmer) => (
                                            <tr key={farmer._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-medium">
                                                            {farmer.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 text-sm">{farmer.name}</p>
                                                            <p className="text-xs text-gray-500">ID: {farmer._id.slice(-6)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="space-y-1">
                                                        {farmer.email && (
                                                            <p className="text-sm text-gray-600">{farmer.email}</p>
                                                        )}
                                                        {farmer.phoneNumber && (
                                                            <p className="text-sm text-gray-600">{farmer.phoneNumber}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="space-y-1">
                                                        {farmer.city && farmer.state ? (
                                                            <p className="text-sm text-gray-600">
                                                                {farmer.city}, {farmer.state}
                                                            </p>
                                                        ) : (
                                                            <p className="text-sm text-gray-400">—</p>
                                                        )}
                                                        {farmer.country && (
                                                            <p className="text-xs text-gray-500">
                                                                {getCountryName(farmer.country)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="space-y-1">
                                                        {farmer.address ? (
                                                            <>
                                                                <p className="text-sm text-gray-600">{farmer.address}</p>
                                                                {farmer.addressLine2 && (
                                                                    <p className="text-xs text-gray-500">{farmer.addressLine2}</p>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <p className="text-sm text-gray-400">—</p>
                                                        )}
                                                        {farmer.zipCode && (
                                                            <p className="text-xs text-gray-500">ZIP: {farmer.zipCode}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="text-sm text-gray-600">{formatDate(farmer.createdAt)}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                                                            View
                                                        </button>
                                                        <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors">
                                                            Contact
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Table Footer */}
                        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                                Showing {filteredFarmers.length} of {farmers.length} farmers
                            </p>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
                        <div className="bg-white rounded-md border border-gray-200 p-4">
                            <p className="text-xs text-gray-500 uppercase">Total Farmers</p>
                            <p className="text-2xl font-semibold text-gray-900 mt-1">{farmers.length}</p>
                        </div>

                        <div className="bg-white rounded-md border border-gray-200 p-4">
                            <p className="text-xs text-gray-500 uppercase">With Email</p>
                            <p className="text-2xl font-semibold text-gray-900 mt-1">
                                {farmers.filter(f => f.email).length}
                            </p>
                        </div>

                        <div className="bg-white rounded-md border border-gray-200 p-4">
                            <p className="text-xs text-gray-500 uppercase">With Phone</p>
                            <p className="text-2xl font-semibold text-gray-900 mt-1">
                                {farmers.filter(f => f.phoneNumber).length}
                            </p>
                        </div>

                        <div className="bg-white rounded-md border border-gray-200 p-4">
                            <p className="text-xs text-gray-500 uppercase">With Address</p>
                            <p className="text-2xl font-semibold text-gray-900 mt-1">
                                {farmers.filter(f => f.address).length}
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}