'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Automatically navigate to /signup after 2 seconds
    const timer = setTimeout(() => {
      router.push('/signup');
    }, 2000);

    // Cleanup timeout on component unmount
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-green-700 mb-4 animate-pulse">
          Agri Supporter
        </h1>
        <p className="text-gray-600 text-lg">
          Redirecting to sign up...
        </p>
        <div className="mt-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
        </div>
      </div>
    </div>
  );
}