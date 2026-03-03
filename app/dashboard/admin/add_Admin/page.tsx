'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import axios, { AxiosError } from 'axios';
import AdminSidebar from '@/app/navigation/admin/page';

// Define types for form data
interface FormData {
    name: string;
    email: string;
    phoneNumber: string;
    password: string;
}

// Define type for message state
interface Message {
    type: 'success' | 'error' | '';
    text: string;
}

// Define type for API error response
interface ApiError {
    message: string;
    success: boolean;
    errors?: string[];
}

export default function AdminRegistrationPage() {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        phoneNumber: '',
        password: ''
    });
    
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<Message>({ type: '', text: '' });
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear message when user starts typing
        setMessage({ type: '', text: '' });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        // Validate password length
        if (formData.password.length < 6) {
            setMessage({
                type: 'error',
                text: 'Password must be at least 6 characters long'
            });
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/admin/register', formData);
            
            setMessage({
                type: 'success',
                text: 'Admin registered successfully!'
            });
            
            // Clear form on success
            setFormData({
                name: '',
                email: '',
                phoneNumber: '',
                password: ''
            });
            
            console.log('Admin registered:', response.data);
            
        } catch (error: unknown) {
            // Handle axios error
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError<ApiError>;
                setMessage({
                    type: 'error',
                    text: axiosError.response?.data?.message || 'Error registering admin. Please try again.'
                });
                console.error('Registration error:', axiosError.response?.data || axiosError.message);
            } else {
                // Handle non-axios errors
                setMessage({
                    type: 'error',
                    text: 'An unexpected error occurred'
                });
                console.error('Unexpected error:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content */}
            <main className="flex-1 bg-white overflow-auto">
                <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="px-6 py-8">
                            <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
                                Admin Register
                            </h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Name Input */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="text-black black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter full name"
                                        disabled={loading}
                                    />
                                </div>

                                {/* Email Input */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter email address"
                                        disabled={loading}
                                    />
                                </div>

                                {/* Phone Number Input */}
                                <div>
                                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        required
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter phone number"
                                        disabled={loading}
                                    />
                                </div>

                                {/* Password Input */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            minLength={6}
                                            className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter password (min. 6 characters)"
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                                        >
                                            {showPassword ? (
                                                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            ) : (
                                                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Password must be at least 6 characters long
                                    </p>
                                </div>

                                {/* Message Display */}
                                {message.text && (
                                    <div className={`p-3 rounded-md ${
                                        message.type === 'success' 
                                            ? 'bg-green-100 text-green-700 border border-green-400' 
                                            : 'bg-red-100 text-red-700 border border-red-400'
                                    }`}>
                                        {message.text}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                                            ${loading 
                                                ? 'bg-blue-400 cursor-not-allowed' 
                                                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                            }`}
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Registering...
                                            </>
                                        ) : (
                                            'Add Admin'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}