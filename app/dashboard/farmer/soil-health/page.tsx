'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import FarmerSidebar from '@/app/navigation/farmer/page';

type Mode = 'quick' | 'request';

interface ImageMetrics {
  brightness: number;
  textureScore: number;
  redMean: number;
  greenMean: number;
  blueMean: number;
}

interface SoilRecord {
  _id: string;
  mode: 'image_only' | 'full_fusion';
  district: string;
  location?: string;
  cropType?: string;
  season?: string;
  createdAt: string;
  result: {
    score: number;
    classification: string;
    confidence: number;
    soilType: string;
    agroZone: string;
    readings: {
      ph: number;
      nitrogen: number;
      phosphorus: number;
      potassium: number;
      moisture: number;
      organicMatter: number;
    };
    levels: Record<string, string>;
    recommendations: string[];
  };
}

interface SoilRequest {
  _id: string;
  district: string;
  location?: string;
  cropType?: string;
  season?: string;
  preferredDate?: string;
  scheduledDate?: string;
  status: string;
  farmerNotes?: string;
  adminNotes?: string;
  assignedAdmin?: {
    name: string;
    phoneNumber?: string;
    email?: string;
  };
  imageAssessment?: {
    score: number;
    classification: string;
    confidence: number;
    soilType: string;
  };
  createdAt: string;
}

interface SidebarUser {
  id?: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  photoURL?: string;
}

const DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha',
  'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala',
  'Mannar', 'Matale', 'Matara', 'Moneragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'
];

const SEASONS = ['Maha', 'Yala', 'Inter-monsoon'];

const initialForm = {
  district: 'Anuradhapura',
  location: '',
  cropType: '',
  season: 'Maha',
  landSize: '1',
  preferredDate: '',
  farmerNotes: ''
};

function getStatusClasses(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'approved':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'rejected':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-amber-100 text-amber-700 border-amber-200';
  }
}

function getScoreClasses(classification: string) {
  switch (classification) {
    case 'Excellent':
      return 'text-green-700 bg-green-100 border-green-200';
    case 'Good':
      return 'text-sky-700 bg-sky-100 border-sky-200';
    case 'Fair':
      return 'text-amber-700 bg-amber-100 border-amber-200';
    default:
      return 'text-red-700 bg-red-100 border-red-200';
  }
}

async function extractImageMetrics(file: File): Promise<ImageMetrics> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas is not available in this browser.');
  }

  canvas.width = 224;
  canvas.height = 224;
  ctx.drawImage(image, 0, 0, 224, 224);
  const { data } = ctx.getImageData(0, 0, 224, 224);

  let r = 0;
  let g = 0;
  let b = 0;
  let brightness = 0;
  const brightnessValues: number[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    const pixelBrightness = 0.299 * red + 0.587 * green + 0.114 * blue;

    r += red;
    g += green;
    b += blue;
    brightness += pixelBrightness;
    brightnessValues.push(pixelBrightness);
  }

  const totalPixels = brightnessValues.length || 1;
  const avgBrightness = brightness / totalPixels;
  const variance =
    brightnessValues.reduce((sum, value) => sum + (value - avgBrightness) ** 2, 0) / totalPixels;

  return {
    brightness: Number(avgBrightness.toFixed(2)),
    textureScore: Number(Math.min(100, Math.sqrt(variance)).toFixed(2)),
    redMean: Number((r / totalPixels).toFixed(2)),
    greenMean: Number((g / totalPixels).toFixed(2)),
    blueMean: Number((b / totalPixels).toFixed(2))
  };
}

export default function SoilHealthPage() {
  const [user, setUser] = useState<SidebarUser | null>(null);
  const [form, setForm] = useState(initialForm);
  const [mode, setMode] = useState<Mode>('quick');
  const [imageMetrics, setImageMetrics] = useState<ImageMetrics | null>(null);
  const [metricsPreview, setMetricsPreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<SoilRecord[]>([]);
  const [requests, setRequests] = useState<SoilRequest[]>([]);
  const [latestResult, setLatestResult] = useState<SoilRecord | null>(null);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const token = useMemo(() => typeof window !== 'undefined' ? localStorage.getItem('token') : null, []);

  const loadData = useCallback(async () => {
    if (!token) {
      setError('Please sign in again to load soil-health history.');
      return;
    }

    try {
      const [historyRes, requestsRes] = await Promise.all([
        fetch(`${API_URL}/soil-health/history`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/soil-health/requests/my`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!historyRes.ok || !requestsRes.ok) {
        throw new Error('Could not load soil-health history because the backend server is unavailable.');
      }

      const historyData = await historyRes.json();
      const requestsData = await requestsRes.json();

      if (historyData.success) {
        setHistory(historyData.data);
      }
      if (requestsData.success) {
        setRequests(requestsData.data);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load soil-health data.');
    }
  }, [API_URL, token]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    if (token) {
      void loadData();
    }
  }, [loadData, token]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError('');
    setLatestResult(null);

    if (!file) {
      setImageMetrics(null);
      return;
    }

    setMetricsPreview(URL.createObjectURL(file));

    try {
      const metrics = await extractImageMetrics(file);
      setImageMetrics(metrics);
    } catch (extractError) {
      setError('Image analysis preview failed. Please try another photo.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      setError('Please sign in again.');
      return;
    }

    if (!imageMetrics) {
      setError('Please upload a soil photo first.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      district: form.district,
      location: form.location,
      cropType: form.cropType,
      season: form.season,
      landSize: Number(form.landSize),
      preferredDate: form.preferredDate || undefined,
      farmerNotes: form.farmerNotes,
      imageMetrics
    };

    try {
      const endpoint = mode === 'quick' ? 'analyze-image' : 'requests';
      const response = await fetch(`${API_URL}/soil-health/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Request failed.');
      }

      if (mode === 'quick') {
        setLatestResult(result.data);
      }

      await loadData();
    } catch (submitError: unknown) {
      const message = submitError instanceof Error ? submitError.message : 'Something went wrong.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      <FarmerSidebar user={user} />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <section className="rounded-3xl border border-stone-200 bg-[radial-gradient(circle_at_top_left,_#f7fee7,_#fafaf9_55%)] p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Soil Health Module</p>
                <h1 className="mt-2 text-3xl font-bold text-stone-900">Image-first soil check with admin-assisted sensor support</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                  Use a soil photo for an instant estimation now, or request a field officer visit for the full fusion result later.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3 text-sm text-stone-600">
                <p className="font-semibold text-stone-800">Current workflow</p>
                <p>Photo upload → image analysis → quick score or sensor request</p>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setMode('quick')}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${mode === 'quick' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-stone-300 text-stone-700 hover:border-emerald-300 hover:text-emerald-700'}`}
                >
                  Quick Image Check
                </button>
                <button
                  type="button"
                  onClick={() => setMode('request')}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${mode === 'request' ? 'border-amber-500 bg-amber-500 text-white' : 'border-stone-300 text-stone-700 hover:border-amber-300 hover:text-amber-700'}`}
                >
                  Request Sensor Visit
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">District</label>
                    <select
                      value={form.district}
                      onChange={(e) => setForm((current) => ({ ...current, district: e.target.value }))}
                      className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                    >
                      {DISTRICTS.map((district) => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">Season</label>
                    <select
                      value={form.season}
                      onChange={(e) => setForm((current) => ({ ...current, season: e.target.value }))}
                      className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                    >
                      {SEASONS.map((season) => (
                        <option key={season} value={season}>{season}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">Field location</label>
                    <input
                      value={form.location}
                      onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))}
                      placeholder="Village or field name"
                      className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">Crop type</label>
                    <input
                      value={form.cropType}
                      onChange={(e) => setForm((current) => ({ ...current, cropType: e.target.value }))}
                      placeholder="Paddy, maize, banana..."
                      className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">Land size (acres)</label>
                    <input
                      type="number"
                      min="0.25"
                      step="0.25"
                      value={form.landSize}
                      onChange={(e) => setForm((current) => ({ ...current, landSize: e.target.value }))}
                      className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                    />
                  </div>
                  {mode === 'request' && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">Preferred visit date</label>
                      <input
                        type="date"
                        value={form.preferredDate}
                        onChange={(e) => setForm((current) => ({ ...current, preferredDate: e.target.value }))}
                        className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Soil photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm text-stone-700"
                  />
                  <p className="mt-2 text-xs text-stone-500">Use a close-up soil photo with natural light and minimal leaves or stones.</p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    {mode === 'request' ? 'Farmer note for the field officer' : 'Optional note'}
                  </label>
                  <textarea
                    value={form.farmerNotes}
                    onChange={(e) => setForm((current) => ({ ...current, farmerNotes: e.target.value }))}
                    rows={3}
                    className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                    placeholder="Mention field access notes, visible issues, or what you want checked."
                  />
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${mode === 'quick' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {submitting ? 'Processing...' : mode === 'quick' ? 'Run quick image check' : 'Submit sensor request'}
                </button>
              </form>
            </section>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-stone-900">Image preview</h2>
                {metricsPreview ? (
                  <img src={metricsPreview} alt="Soil preview" className="mt-4 h-56 w-full rounded-2xl object-cover" />
                ) : (
                  <div className="mt-4 flex h-56 items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 text-sm text-stone-400">
                    Upload a soil image to preview it here
                  </div>
                )}
                {imageMetrics && (
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-2xl bg-stone-50 p-3">
                      <p className="text-stone-500">Brightness</p>
                      <p className="mt-1 text-lg font-semibold text-stone-900">{imageMetrics.brightness}</p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-3">
                      <p className="text-stone-500">Texture</p>
                      <p className="mt-1 text-lg font-semibold text-stone-900">{imageMetrics.textureScore}</p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-3">
                      <p className="text-stone-500">RGB mean</p>
                      <p className="mt-1 text-sm font-semibold text-stone-900">
                        {imageMetrics.redMean} / {imageMetrics.greenMean} / {imageMetrics.blueMean}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-3">
                      <p className="text-stone-500">Current mode</p>
                      <p className="mt-1 text-sm font-semibold text-stone-900">{mode === 'quick' ? 'Image-only estimate' : 'Admin-assisted fusion request'}</p>
                    </div>
                  </div>
                )}
              </section>

              {latestResult && (
                <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-stone-900">Latest result</h2>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getScoreClasses(latestResult.result.classification)}`}>
                      {latestResult.result.classification}
                    </span>
                  </div>
                  <div className="mt-4 rounded-3xl bg-stone-900 px-5 py-6 text-white">
                    <p className="text-xs uppercase tracking-[0.25em] text-stone-300">Soil health score</p>
                    <p className="mt-2 text-5xl font-bold">{latestResult.result.score}</p>
                    <p className="mt-2 text-sm text-stone-300">
                      Confidence {(latestResult.result.confidence * 100).toFixed(0)}% · {latestResult.result.soilType}
                    </p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    {Object.entries(latestResult.result.readings).map(([key, value]) => (
                      <div key={key} className="rounded-2xl bg-stone-50 p-3">
                        <p className="capitalize text-stone-500">{key}</p>
                        <p className="mt-1 font-semibold text-stone-900">{value}</p>
                        <p className="text-xs text-stone-500">{latestResult.result.levels[key]}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-stone-900">Recommendations</p>
                    <ul className="mt-2 space-y-2">
                      {latestResult.result.recommendations.map((recommendation, index) => (
                        <li key={index} className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}
            </aside>
          </div>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900">My sensor requests</h2>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">{requests.length}</span>
              </div>
              <div className="mt-4 space-y-3">
                {requests.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-500">
                    No sensor requests yet. Submit one when you want a field officer to collect pH and NPK readings.
                  </div>
                )}
                {requests.map((request) => (
                  <div key={request._id} className="rounded-2xl border border-stone-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-stone-900">{request.district}{request.location ? ` · ${request.location}` : ''}</p>
                        <p className="text-xs text-stone-500">
                          {request.cropType || 'General field check'} · {request.season || 'Season not set'}
                        </p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-stone-600 md:grid-cols-2">
                      <p>Preferred date: {request.preferredDate ? new Date(request.preferredDate).toLocaleDateString() : 'Not set'}</p>
                      <p>Scheduled date: {request.scheduledDate ? new Date(request.scheduledDate).toLocaleDateString() : 'Pending'}</p>
                      <p>Preview score: {request.imageAssessment?.score ?? '-'} ({request.imageAssessment?.classification ?? 'Pending'})</p>
                      <p>Assigned admin: {request.assignedAdmin?.name || 'Not assigned yet'}</p>
                    </div>
                    {request.adminNotes && (
                      <p className="mt-3 rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-700">Admin note: {request.adminNotes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900">Assessment history</h2>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">{history.length}</span>
              </div>
              <div className="mt-4 space-y-3">
                {history.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-500">
                    Your completed soil assessments will appear here.
                  </div>
                )}
                {history.map((record) => (
                  <div key={record._id} className="rounded-2xl border border-stone-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-stone-900">{record.district}{record.location ? ` · ${record.location}` : ''}</p>
                        <p className="text-xs text-stone-500">
                          {record.cropType || 'General check'} · {new Date(record.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                          {record.mode === 'full_fusion' ? 'Full fusion' : 'Image only'}
                        </span>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getScoreClasses(record.result.classification)}`}>
                          {record.result.score}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-xl bg-stone-50 p-3">
                        <p className="text-stone-500">pH</p>
                        <p className="mt-1 font-semibold text-stone-900">{record.result.readings.ph}</p>
                      </div>
                      <div className="rounded-xl bg-stone-50 p-3">
                        <p className="text-stone-500">NPK</p>
                        <p className="mt-1 font-semibold text-stone-900">
                          {record.result.readings.nitrogen}/{record.result.readings.phosphorus}/{record.result.readings.potassium}
                        </p>
                      </div>
                      <div className="rounded-xl bg-stone-50 p-3">
                        <p className="text-stone-500">Soil type</p>
                        <p className="mt-1 font-semibold text-stone-900">{record.result.soilType}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
