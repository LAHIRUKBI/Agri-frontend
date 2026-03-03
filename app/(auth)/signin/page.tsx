'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithGoogle } from '../../../utils/firebaseAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Define types
interface SignInCredentials {
  identifier: string;
  password: string;
  role?: string;
  firebaseUid?: string;
}

interface SignInResponse {
  success: boolean;
  token: string;
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

interface AdminLoginResponse {
  success: boolean;
  token: string;
  data: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    role: string;
  };
  message?: string;
}

interface GoogleUser {
  name: string;
  email: string;
  photoURL: string;
  uid: string;
}

export default function SignIn() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'farmer' | 'admin'>('farmer');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const signinUser = async (credentials: SignInCredentials): Promise<SignInResponse> => {
    const response = await fetch(`${API_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to sign in');
    }
    
    return responseData;
  };

  const adminLogin = async (credentials: { email?: string; phoneNumber?: string; password: string }) => {
    // Determine if identifier is email or phone number
    const isEmail = identifier.includes('@');
    
    // Prepare login data for admin
    const loginData: any = { password };
    
    if (isEmail) {
      loginData.email = identifier;
    } else {
      // For phone number, we need to clean it (remove spaces, +, etc) if needed
      // This depends on how you store phone numbers in your admin model
      loginData.phoneNumber = identifier;
    }
    
    const response = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });
    
    const responseData: AdminLoginResponse = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to sign in as admin');
    }
    
    return responseData;
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    
    try {
      const result = await signInWithGoogle();
      
      if (!result.success) {
        setError(result.error || 'Google sign-in failed');
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
      
      // Try to sign in with the Google email and firebaseUid
      try {
        const data = await signinUser({ 
          identifier: googleUser.email, 
          password: 'google-auth-placeholder',
          role,
          firebaseUid: googleUser.uid // Send the firebaseUid for verification
        });
        
        // Store JWT token securely
        localStorage.setItem('token', data.token);
        
        // Store user info if needed
        if (data.user) {
          localStorage.setItem('user', JSON.stringify({
            ...data.user,
            photoURL: googleUser.photoURL
          }));
        }
        
        // Redirect based on role
        if (data.user?.role === 'admin') {
          router.push('/dashboard/admin');
        } else {
          router.push('/dashboard/farmer/home');
        }
      } catch (err: any) {
        // If user doesn't exist, redirect to signup
        if (err.message.includes('not found')) {
          setError('No account found with this Google email. Please sign up first.');
        } else {
          setError(err.message || 'Failed to sign in with Google');
        }
      }
    } catch (err: any) {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (!identifier.trim()) {
      setError('Please enter your email or phone number');
      setIsLoading(false);
      return;
    }
    
    if (!password.trim()) {
      setError('Please enter your password');
      setIsLoading(false);
      return;
    }
    
    try {
      if (role === 'admin') {
        // Admin login using the admin endpoint
        const data = await adminLogin({ password });
        
        // Store JWT token securely
        localStorage.setItem('token', data.token);
        
        // Store admin info
        if (data.data) {
          localStorage.setItem('user', JSON.stringify({
            id: data.data.id,
            name: data.data.name,
            email: data.data.email,
            phoneNumber: data.data.phoneNumber,
            role: data.data.role
          }));
        }
        
        // Redirect admin to dashboard
        router.push('/dashboard/admin/home');
      } else {
        // Farmer login using existing auth endpoint
        const data = await signinUser({ identifier, password, role });
        
        // Store JWT token securely
        localStorage.setItem('token', data.token);
        
        // Store user info if needed
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        // Redirect farmer
        router.push('/dashboard/rotation-plan');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine input type based on identifier content
  const getInputType = () => {
    if (identifier.includes('@')) {
      return 'email';
    }
    if (/^[\d\s\+\-\(\)]+$/.test(identifier) && identifier.length > 0) {
      return 'tel';
    }
    return 'text';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-green-100">
        <h2 className="text-2xl font-bold text-center text-green-800">Agri-Support Sign In</h2>
        
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md border border-red-200">
            {error}
          </div>
        )}
        
        {/* Google Sign In Button - Only show for farmer role or remove completely */}
        {role === 'farmer' && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className={`w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200 ${
                (isGoogleLoading || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
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
                  Sign in with Google
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
          </>
        )}
        
        {/* Role Selection */}
        <div className="flex justify-center space-x-4 mb-2">
          <button
            type="button"
            onClick={() => setRole('farmer')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition duration-200 ${
              role === 'farmer' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Sign in as Farmer
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition duration-200 ${
              role === 'admin' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Sign in as Admin
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-black">
              {role === 'admin' ? 'Email or Phone Number' : 'Email or Phone Number'}
            </label>
            <input 
              id="identifier"
              type={getInputType()}
              className="w-full px-4 py-2 mt-1 border rounded-md focus:ring-green-500 focus:border-green-500 outline-none text-black"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              disabled={isLoading || isGoogleLoading}
              placeholder={role === 'admin' ? "admin@example.com or +94 77 123 4567" : "farmer@example.com or +94 77 123 4567"}
              autoComplete="username"
            />
            <p className="text-xs text-gray-500 mt-1">
              {role === 'admin' 
                ? 'Use your registered email or phone number as admin' 
                : 'Use your registered email or phone number'}
            </p>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-black">Password</label>
            <input 
              id="password"
              type="password" 
              className="w-full px-4 py-2 mt-1 border rounded-md focus:ring-green-500 focus:border-green-500 outline-none text-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading || isGoogleLoading}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading || isGoogleLoading}
            className={`w-full px-4 py-2 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition duration-200 ${(isLoading || isGoogleLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Signing In...' : `Sign In as ${role === 'farmer' ? 'Farmer' : 'Admin'}`}
          </button>
        </form>
        
        {/* Sign up link - Different based on role */}
        <div className="text-center text-sm text-black">
          {role === 'farmer' ? (
            <>
              Don't have an account?{' '}
              <Link href="/" className="font-medium text-green-600 hover:text-green-700 transition duration-200">
                Sign up here
              </Link>
            </>
          ) : (
            <>
              New admin?{' '}
              <Link href="/admin/register" className="font-medium text-green-600 hover:text-green-700 transition duration-200">
                Register as Admin
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}