'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  // 🔥 toggle this (true = show prediction UI, false = normal redirect)
  const DEV_MODE = false;

  const [form, setForm] = useState({
    crop: '',
    district: '',
    market: '',
    season: '',
    year: 2024,
    month: 1,
    week_number: 1,
    price_rs_kg: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  // 👉 keep your original redirect (only when DEV_MODE false)
  useEffect(() => {
    if (DEV_MODE) return;

    const timer = setTimeout(() => {
      router.push('/signup');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]:
        name === 'year' ||
        name === 'month' ||
        name === 'week_number' ||
        name === 'price_rs_kg'
          ? Number(value)
          : value,
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // simple validation
    if (!form.crop || !form.district || !form.market || !form.season) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('http://localhost:5000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 🔥 DEV MODE UI
  // =========================
  if (DEV_MODE) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-green-700">
          Prediction Test UI
        </h1>

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Crop */}
          <select name="crop" onChange={handleChange} className="w-full border p-2">
            <option value="">Select Crop</option>
            <option value="tomatoes">Tomatoes</option>
            <option value="carrot">Carrot</option>
            <option value="leeks">Leeks</option>
          </select>

          {/* District */}
          <select name="district" onChange={handleChange} className="w-full border p-2">
            <option value="">Select District</option>
            <option value="dambulla">Dambulla</option>
            <option value="kandy">Kandy</option>
            <option value="colombo">Colombo</option>
          </select>

          {/* Market */}
          <select name="market" onChange={handleChange} className="w-full border p-2">
            <option value="">Select Market</option>
            <option value="dambulla">Dambulla</option>
            <option value="pettah">Pettah</option>
          </select>

          {/* Season */}
          <select name="season" onChange={handleChange} className="w-full border p-2">
            <option value="">Select Season</option>
            <option value="Yala">Yala</option>
            <option value="Maha">Maha</option>
          </select>

          <input type="number" name="year" placeholder="Year" onChange={handleChange} className="w-full border p-2" />
          <input type="number" name="month" placeholder="Month" onChange={handleChange} className="w-full border p-2" />
          <input type="number" name="week_number" placeholder="Week Number" onChange={handleChange} className="w-full border p-2" />
          <input type="number" name="price_rs_kg" placeholder="Price (Rs/kg)" onChange={handleChange} className="w-full border p-2" />

          <button className="bg-green-600 text-white px-4 py-2 rounded w-full">
            Predict
          </button>
        </form>

        {/* Loading */}
        {loading && <p className="mt-4">Loading...</p>}

        {/* Error */}
        {error && <p className="mt-4 text-red-500">{error}</p>}

        {/* Result */}
        {result && result.success && (
          <div className="mt-4 border p-4">
            <p><strong>Prediction:</strong> {result.data.prediction}</p>
            <p>UP: {(result.data.probabilities.UP * 100).toFixed(2)}%</p>
            <p>DOWN: {(result.data.probabilities.DOWN * 100).toFixed(2)}%</p>
          </div>
        )}
      </div>
    );
  }

  // =========================
  // ORIGINAL UI (unchanged)
  // =========================
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-green-700 mb-4 animate-pulse">
          Agri Supporter
        </h1>
        <p className="text-gray-600 text-lg">
          Redirecting...
        </p>
        <div className="mt-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
        </div>
      </div>
    </div>
  );
}