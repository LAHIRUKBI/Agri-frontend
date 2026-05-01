'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminSidebar from '@/app/navigation/admin/page';

interface SoilRequest {
  _id: string;
  district: string;
  location?: string;
  cropType?: string;
  season?: string;
  preferredDate?: string;
  scheduledDate?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  farmerNotes?: string;
  adminNotes?: string;
  imageAssessment?: {
    score: number;
    classification: string;
    soilType: string;
  };
  sensorReadings?: {
    ph?: number;
    nitrogen?: number;
    phosphorus?: number;
    potassium?: number;
    moisture?: number;
    organicMatter?: number;
  };
  farmer?: {
    name: string;
    email?: string;
    phoneNumber?: string;
  };
  finalRecord?: {
    result?: {
      score: number;
      classification: string;
    };
  };
}

const initialSensorReadings = {
  ph: '6.5',
  nitrogen: '120',
  phosphorus: '35',
  potassium: '90',
  moisture: '28',
  organicMatter: '3.1'
};

export default function AdminSoilHealthRequestsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const [requests, setRequests] = useState<SoilRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SoilRequest | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [sensorReadings, setSensorReadings] = useState(initialSensorReadings);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const loadRequests = useCallback(async () => {
    if (!token) {
      setMessage('Admin token not found. Please sign in again before loading soil-health requests.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/soil-health/admin/requests`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const fallbackMessage =
          response.status === 401 || response.status === 403
            ? 'You are not authorized to view soil-health requests. Please sign in as an admin.'
            : `Failed to load requests from the server (HTTP ${response.status}).`;

        throw new Error(fallbackMessage);
      }

      const result = await response.json();
      if (result.success) {
        setRequests(result.data);
        if (result.data.length === 0) {
          setSelectedRequest(null);
        }
      } else {
        throw new Error(result.message || 'Server returned an unexpected response.');
      }
    } catch (error) {
      const nextMessage =
        error instanceof Error
          ? error.message
          : 'Could not connect to the backend. Make sure the Node server is running on http://localhost:5000.';
      setRequests([]);
      setSelectedRequest(null);
      setMessage(nextMessage);
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const openRequest = (request: SoilRequest) => {
    setSelectedRequest(request);
    setScheduledDate(request.scheduledDate ? request.scheduledDate.slice(0, 10) : '');
    setAdminNotes(request.adminNotes || '');
    setSensorReadings({
      ph: String(request.sensorReadings?.ph ?? initialSensorReadings.ph),
      nitrogen: String(request.sensorReadings?.nitrogen ?? initialSensorReadings.nitrogen),
      phosphorus: String(request.sensorReadings?.phosphorus ?? initialSensorReadings.phosphorus),
      potassium: String(request.sensorReadings?.potassium ?? initialSensorReadings.potassium),
      moisture: String(request.sensorReadings?.moisture ?? initialSensorReadings.moisture),
      organicMatter: String(request.sensorReadings?.organicMatter ?? initialSensorReadings.organicMatter)
    });
    setMessage('');
  };

  const patchRequest = async (action: 'approve' | 'reject' | 'complete') => {
    if (!selectedRequest || !token) return;

    setSubmitting(true);
    setMessage('');

    const payload: {
      adminNotes: string;
      scheduledDate?: string;
      sensorReadings?: {
        ph: number;
        nitrogen: number;
        phosphorus: number;
        potassium: number;
        moisture: number;
        organicMatter: number;
      };
    } = { adminNotes };
    if (action === 'approve') {
      payload.scheduledDate = scheduledDate;
    }
    if (action === 'complete') {
      payload.sensorReadings = {
        ph: Number(sensorReadings.ph),
        nitrogen: Number(sensorReadings.nitrogen),
        phosphorus: Number(sensorReadings.phosphorus),
        potassium: Number(sensorReadings.potassium),
        moisture: Number(sensorReadings.moisture),
        organicMatter: Number(sensorReadings.organicMatter)
      };
    }

    try {
      const response = await fetch(`${API_URL}/soil-health/admin/requests/${selectedRequest._id}/${action}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Update failed.');
      }
      setMessage(`Request ${action}d successfully.`);
      await loadRequests();
    } catch (error: unknown) {
      const nextMessage = error instanceof Error ? error.message : 'Something went wrong.';
      setMessage(nextMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-3xl border border-stone-200 bg-[linear-gradient(135deg,_#eff6ff,_#fafaf9_70%)] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">Field Officer Console</p>
            <h1 className="mt-2 text-3xl font-bold text-stone-900">Soil health sensor requests</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              Approve farmer requests, schedule a field visit, and enter pH / NPK / moisture values until the real IoT connection is ready.
            </p>
          </section>

          <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900">Incoming requests</h2>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">{requests.length}</span>
              </div>
              <div className="mt-4 space-y-3">
                {message && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {message}
                  </div>
                )}
                {loading && (
                  <div className="rounded-2xl bg-stone-50 px-4 py-6 text-sm text-stone-500">Loading requests...</div>
                )}
                {!loading && requests.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-500">
                    No soil-health requests are waiting right now.
                  </div>
                )}
                {requests.map((request) => (
                  <button
                    key={request._id}
                    type="button"
                    onClick={() => openRequest(request)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${selectedRequest?._id === request._id ? 'border-sky-500 bg-sky-50' : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-stone-900">{request.farmer?.name || 'Farmer'} · {request.district}</p>
                        <p className="text-xs text-stone-500">{request.cropType || 'General soil check'}{request.location ? ` · ${request.location}` : ''}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-stone-700 border border-stone-200">
                        {request.status}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-stone-600">
                      <p>Preview score: {request.imageAssessment?.score ?? '-'} </p>
                      <p>Preferred: {request.preferredDate ? new Date(request.preferredDate).toLocaleDateString() : 'Not set'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              {!selectedRequest ? (
                <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 text-center text-sm text-stone-500">
                  Select a request on the left to approve, reject, or complete it.
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-stone-900">{selectedRequest.farmer?.name || 'Farmer request'}</h2>
                      <p className="mt-1 text-sm text-stone-600">
                        {selectedRequest.district}{selectedRequest.location ? ` · ${selectedRequest.location}` : ''} · {selectedRequest.cropType || 'General soil check'}
                      </p>
                    </div>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold capitalize text-stone-700">
                      {selectedRequest.status}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Farmer note</p>
                      <p className="mt-2">{selectedRequest.farmerNotes || 'No note added.'}</p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Image preview assessment</p>
                      <p className="mt-2">
                        Score {selectedRequest.imageAssessment?.score ?? '-'} · {selectedRequest.imageAssessment?.classification ?? 'Pending'} · {selectedRequest.imageAssessment?.soilType ?? 'Unknown'}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">Scheduled visit date</label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">Admin note</label>
                      <input
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none focus:border-sky-500"
                        placeholder="Visit confirmation or follow-up note"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-stone-900">Manual sensor entry placeholder</p>
                    <p className="mt-1 text-xs text-stone-500">
                      Replace these fields later with live ESP32 / BLE readings. The rest of the flow can stay the same.
                    </p>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      {Object.entries(sensorReadings).map(([key, value]) => (
                        <div key={key}>
                          <label className="mb-1 block text-xs font-medium uppercase tracking-[0.15em] text-stone-500">{key}</label>
                          <input
                            type="number"
                            step="0.1"
                            value={value}
                            onChange={(e) => setSensorReadings((current) => ({ ...current, [key]: e.target.value }))}
                            className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none focus:border-sky-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {message && !loading && (
                    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">{message}</div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => patchRequest('approve')}
                      className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                    >
                      Approve & schedule
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => patchRequest('complete')}
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Complete with readings
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => patchRequest('reject')}
                      className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
