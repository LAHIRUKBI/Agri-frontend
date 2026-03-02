'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithGoogle } from '../../../utils/firebaseAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Define types
interface SignUpData {
  name: string;
  email?: string;
  phoneNumber?: string;
  password: string;
  firebaseUid?: string;
  photoURL?: string;
}

interface SignUpResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    role: string;
    photoURL?: string;
  };
  message?: string;
}

interface GoogleUser {
  name: string;
  email: string;
  photoURL: string;
  uid: string;
}

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const signupUser = async (userData: SignUpData): Promise<SignUpResponse> => {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to sign up');
    }

    return responseData;
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(value);
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      const result = await signInWithGoogle();

      if (!result.success) {
        setError(result.error || 'Google sign-up failed');
        setIsGoogleLoading(false);
        return;
      }

      // Type guard to ensure user exists when success is true
      if (!result.user) {
        setError('Failed to get user information from Google');
        setIsGoogleLoading(false);
        return;
      }

      const googleUser: GoogleUser = result.user;

      // Check if user exists in your backend
      try {
        const userData: SignUpData = {
          name: googleUser.name,
          email: googleUser.email,
          password: 'google-auth-' + Math.random().toString(36).substring(2),
          firebaseUid: googleUser.uid,
          photoURL: googleUser.photoURL
        };

        const response = await signupUser(userData);

        if (response.token) {
          localStorage.setItem('token', response.token);
          setSuccessMessage('Account created successfully with Google! Redirecting...');
          setSuccess(true);
          setTimeout(() => {
            router.push('/signin');
          }, 2000);
        }
      } catch (err: any) {
        // If user already exists, try to sign them in
        if (err.message.includes('already registered')) {
          setError('Account already exists. Please sign in instead.');
        } else {
          setError(err.message || 'Failed to create account with Google');
        }
      }
    } catch (err: any) {
      setError('Google sign-up failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate that at least one identifier is provided
    if (identifierType === 'email' && !email) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    if (identifierType === 'phone') {
      if (!phoneNumber) {
        setError('Phone number is required');
        setIsLoading(false);
        return;
      }
      if (phoneNumber.length !== 10) {
        setError('Phone number must be exactly 10 digits');
        setIsLoading(false);
        return;
      }
    }

    try {
      const userData: SignUpData = {
        name,
        password
      };

      // Add the appropriate identifier
      if (identifierType === 'email') {
        userData.email = email;
      } else {
        userData.phoneNumber = phoneNumber;
      }

      const response = await signupUser(userData);

      // If API returns token, auto-login the user
      if (response.token) {
        localStorage.setItem('token', response.token);
        setSuccessMessage('Account created successfully! Redirecting to dashboard...');
        setSuccess(true);
        setTimeout(() => {
          router.push('/signin');
        }, 2000);
      } else {
        setSuccessMessage('Account created successfully! Redirecting to login...');
        setSuccess(true);
        setTimeout(() => {
          router.push('/signin');
        }, 2000);
      }

    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleIdentifierType = () => {
    setIdentifierType(prev => prev === 'email' ? 'phone' : 'email');
    setEmail('');
    setPhoneNumber('');
    setError('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-green-100">
        <h2 className="text-2xl font-bold text-center text-green-800">Join Agri-Support</h2>
        <p className="text-center text-sm text-black">Create your farmer account to start planning.</p>

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md border border-green-200">
            ✓ {successMessage}
          </div>
        )}

        {/* Google Sign Up Button */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading || isLoading || success}
          className={`w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200 ${(isGoogleLoading || isLoading || success) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
          {isGoogleLoading ? (
            'Connecting to Google...'
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </>
          )}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="flex justify-center space-x-4 mb-4">
          <button
            type="button"
            onClick={() => toggleIdentifierType()}
            className={`px-4 py-2 text-sm font-medium rounded-md transition duration-200 ${identifierType === 'email'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Sign up with Email
          </button>
          <button
            type="button"
            onClick={() => toggleIdentifierType()}
            className={`px-4 py-2 text-sm font-medium rounded-md transition duration-200 ${identifierType === 'phone'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Sign up with Phone
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              className="w-full px-4 py-2 mt-1 border rounded-md focus:ring-green-500 focus:border-green-500 outline-none text-black"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading || success || isGoogleLoading}
              placeholder="e.g., Lahiru Bandara"
              autoComplete="name"
            />
          </div>

          {identifierType === 'email' ? (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-4 py-2 mt-1 border rounded-md focus:ring-green-500 focus:border-green-500 outline-none text-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={identifierType === 'email'}
                disabled={isLoading || success || isGoogleLoading}
                placeholder="farmer@example.com"
                autoComplete="email"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number (10 digits)
              </label>
              <input
                id="phoneNumber"
                type="tel"
                className="w-full px-4 py-2 mt-1 border rounded-md focus:ring-green-500 focus:border-green-500 outline-none text-black"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                required={identifierType === 'phone'}
                disabled={isLoading || success || isGoogleLoading}
                placeholder="0771234567"
                autoComplete="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
              />
              {phoneNumber && phoneNumber.length > 0 && (
                <p className="text-xs text-black mt-1">
                  {phoneNumber.length === 10
                    ? '✓ Valid phone number'
                    : `${phoneNumber.length}/10 digits`}
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full px-4 py-2 mt-1 border rounded-md focus:ring-green-500 focus:border-green-500 outline-none text-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={isLoading || success || isGoogleLoading}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <p className="text-xs text-black mt-1">
              {password.length === 0
                ? 'Minimum 6 characters'
                : password.length < 6
                  ? `${password.length}/6 characters - too short`
                  : `✓ ${password.length} characters`}
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || success || isGoogleLoading || password.length < 6 || (identifierType === 'phone' && phoneNumber.length !== 10)}
            className={`w-full px-4 py-2 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition duration-200 
              ${(isLoading || success || isGoogleLoading || password.length < 6 || (identifierType === 'phone' && phoneNumber.length !== 10)) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-sm text-center text-black">
          Already have an account?{' '}
          <Link href="/signin" className="text-green-600 hover:underline font-medium">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}