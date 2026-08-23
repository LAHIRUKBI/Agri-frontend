'use client';

import { useEffect, useState } from 'react';
import FarmerSidebar from '@/app/navigation/farmer/page';
import RecommendationForm from './components/RecommendationForm';
import RecommendationResult from './components/RecommendationResult';
import { buildPriceRecommendationRequest } from './recommendationContract';

type RecommendationPayload = {
  crop: string;
  district: string;
  price_rs_kg?: number;
  current_price_source: 'manual' | 'system';
  horizon: number;
  harvest_input_mode: 'range' | 'exact';
  quantity_kg: number;
  quantity_min_kg?: number;
  quantity_max_kg?: number;
  quantity_range_label?: string;
  exact_quantity_kg?: number;
};

type FarmerUser = {
  id?: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  photoURL?: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
};

export default function FarmerPredictionPage() {
  const [result, setResult] = useState<unknown>(null);
  const [submittedInput, setSubmittedInput] =
    useState<RecommendationPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<FarmerUser | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const handleSubmit = async (payload: RecommendationPayload) => {
    setLoading(true);
    setError('');
    setResult(null);
    setSubmittedInput(payload);

    const requestBody = buildPriceRecommendationRequest(payload);

    try {
      const response = await fetch(`${API_BASE}/api/recommend-market`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || data.success === false) {
        throw new Error(data?.message || 'Failed to get recommendation');
      }

      setResult({
        ...data,
        input: {
          ...(typeof data === 'object' && data && 'input' in data
            ? (data.input as Record<string, unknown>)
            : {}),
          ...payload,
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      setUser(userStr ? JSON.parse(userStr) : null);
    } catch {
      setUser(null);
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <FarmerSidebar user={user} />

      <main className="flex-1 p-6">
        <h1 className="mb-4 text-3xl font-bold text-green-700">
          Sri lankan Market Intelligence Engine - Crop Selling Recommendation
        </h1>

        <RecommendationForm onSubmit={handleSubmit} loading={loading} />

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        <RecommendationResult
          result={result}
          loading={loading}
          submittedInput={submittedInput}
        />
      </main>
    </div>
  );
}
