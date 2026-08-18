'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminSidebar from '@/app/navigation/admin/page';

type RequestStatus = 'pending' | 'approved' | 'completed' | 'rejected';
type RequestFilter = 'all' | 'pending' | 'completed' | 'rejected';

interface SoilRequest {
  _id: string;
  district: string;
  location?: string;
  visitAddress?: string;
  addressSource?: 'profile' | 'manual';
  cropType?: string;
  season?: string;
  preferredDate?: string;
  scheduledDate?: string;
  status: RequestStatus;
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
      soilType?: string;
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

const requestFilters: Array<{ key: RequestFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Rejected' }
];

function matchesFilter(status: RequestStatus, filter: RequestFilter) {
  if (filter === 'all') return true;
  if (filter === 'pending') return status === 'pending' || status === 'approved';
  return status === filter;
}

function getStatusClasses(status: RequestStatus) {
  switch (status) {
    case 'completed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'approved':
      return 'border-sky-200 bg-sky-50 text-sky-700';
    case 'rejected':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-amber-200 bg-amber-50 text-amber-700';
  }
}

function getStatusLabel(status: RequestStatus) {
  if (status === 'approved') return 'Scheduled';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

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
  const [requestFilter, setRequestFilter] = useState<RequestFilter>('all');
  const [listActionLoading, setListActionLoading] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const hydrateEditor = useCallback((request: SoilRequest | null) => {
    if (!request) {
      setScheduledDate('');
      setAdminNotes('');
      setSensorReadings(initialSensorReadings);
      return;
    }

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
  }, []);

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
      if (!result.success) {
        throw new Error(result.message || 'Server returned an unexpected response.');
      }

      const nextRequests = result.data as SoilRequest[];
      setRequests(nextRequests);
      setSelectedRequest((current) => {
        if (!current) {
          const firstRequest = nextRequests[0] || null;
          hydrateEditor(firstRequest);
          return firstRequest;
        }

        const refreshed = nextRequests.find((request) => request._id === current._id) || null;
        hydrateEditor(refreshed);
        return refreshed;
      });
    } catch (error) {
      const nextMessage =
        error instanceof Error
          ? error.message
          : 'Could not connect to the backend. Make sure the Node server is running on http://localhost:5000.';
      setRequests([]);
      setSelectedRequest(null);
      hydrateEditor(null);
      setMessage(nextMessage);
    } finally {
      setLoading(false);
    }
  }, [API_URL, hydrateEditor, token]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const filteredRequests = useMemo(
    () => requests.filter((request) => matchesFilter(request.status, requestFilter)),
    [requestFilter, requests]
  );

  const openRequest = (request: SoilRequest) => {
    setSelectedRequest(request);
    hydrateEditor(request);
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

      const successMessageMap = {
        approve: 'Request scheduled successfully.',
        reject: 'Request rejected successfully.',
        complete: 'Request completed successfully.'
      } as const;

      setMessage(successMessageMap[action]);
      await loadRequests();
    } catch (error: unknown) {
      const nextMessage = error instanceof Error ? error.message : 'Something went wrong.';
      setMessage(nextMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (!token || !window.confirm('Delete this sensor request?')) {
      return;
    }

    try {
      setListActionLoading(requestId);
      setMessage('');
      const response = await fetch(`${API_URL}/soil-health/admin/requests/${requestId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Could not delete request.');
      }

      if (selectedRequest?._id === requestId) {
        setSelectedRequest(null);
        hydrateEditor(null);
      }
      setMessage('Request deleted successfully.');
      await loadRequests();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setListActionLoading(null);
    }
  };

  const clearRequests = async () => {
    if (!token || requests.length === 0 || !window.confirm('Clear all incoming sensor requests?')) {
      return;
    }

    try {
      setListActionLoading('all');
      setMessage('');
      const response = await fetch(`${API_URL}/soil-health/admin/requests`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Could not clear requests.');
      }

      setSelectedRequest(null);
      hydrateEditor(null);
      setMessage('All incoming requests cleared.');
      await loadRequests();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setListActionLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-3xl border border-stone-200 bg-[linear-gradient(135deg,_#eff6ff,_#fafaf9_70%)] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">Field Officer Console</p>
            <h1 className="mt-2 text-3xl font-bold text-stone-900">Soil health sensor requests</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              Review farmer requests, confirm visit schedules, record soil readings, and keep the full request flow tidy until the live IoT device integration is ready.
            </p>
          </section>

          <div className="grid gap-6 xl:grid-cols-[0.92fr,1.08fr]">
            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-stone-900">Incoming requests</h2>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">{filteredRequests.length}</span>
                </div>
                <button
                  type="button"
                  onClick={clearRequests}
                  disabled={requests.length === 0 || listActionLoading === 'all'}
                  className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {listActionLoading === 'all' ? 'Clearing...' : 'Clear all'}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {requestFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setRequestFilter(filter.key)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      requestFilter === filter.key
                        ? 'border-sky-500 bg-sky-600 text-white'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
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

                {!loading && filteredRequests.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-500">
                    No requests found for this filter.
                  </div>
                )}

                {filteredRequests.map((request) => (
                  <div
                    key={request._id}
                    className={`rounded-2xl border p-4 transition ${
                      selectedRequest?._id === request._id
                        ? 'border-sky-400 bg-sky-50'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <button type="button" onClick={() => openRequest(request)} className="w-full text-left">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-stone-900">{request.farmer?.name || 'Farmer'} · {request.district}</p>
                          <p className="text-xs text-stone-500">
                            {request.cropType || 'General soil check'}
                            {request.location ? ` · ${request.location}` : ''}
                          </p>
                          {request.visitAddress && (
                            <p className="mt-1 text-[11px] text-stone-500">Visit: {request.visitAddress}</p>
                          )}
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(request.status)}`}>
                          {getStatusLabel(request.status)}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-stone-600">
                        <p>Preview score: {request.imageAssessment?.score ?? '-'}</p>
                        <p>Preferred: {request.preferredDate ? new Date(request.preferredDate).toLocaleDateString() : 'Not set'}</p>
                      </div>
                    </button>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openRequest(request)}
                        className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteRequest(request._id)}
                        disabled={listActionLoading === request._id}
                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {listActionLoading === request._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              {!selectedRequest ? (
                <div className="flex h-full min-h-[460px] items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 text-center text-sm text-stone-500">
                  Select a request on the left to view details and manage its next step.
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-stone-900">{selectedRequest.farmer?.name || 'Farmer request'}</h2>
                      <p className="mt-1 text-sm text-stone-600">
                        {selectedRequest.district}
                        {selectedRequest.location ? ` · ${selectedRequest.location}` : ''}
                        {' · '}
                        {selectedRequest.cropType || 'General soil check'}
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(selectedRequest.status)}`}>
                      {getStatusLabel(selectedRequest.status)}
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
                    <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Farmer details</p>
                      <div className="mt-3 space-y-2 text-sm text-stone-700">
                        <p>Email: {selectedRequest.farmer?.email || 'Not provided'}</p>
                        <p>Phone: {selectedRequest.farmer?.phoneNumber || 'Not provided'}</p>
                        <p>Visit address: {selectedRequest.visitAddress || 'Not provided'}</p>
                        <p>Preferred date: {selectedRequest.preferredDate ? new Date(selectedRequest.preferredDate).toLocaleDateString() : 'Not set'}</p>
                        <p>Scheduled date: {selectedRequest.scheduledDate ? new Date(selectedRequest.scheduledDate).toLocaleDateString() : 'Not scheduled yet'}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-stone-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Admin workspace</p>
                      <div className="mt-3 grid gap-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-stone-700">Scheduled visit date</label>
                          <input
                            type="date"
                            value={scheduledDate}
                            onChange={(event) => setScheduledDate(event.target.value)}
                            className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none focus:border-sky-500"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-stone-700">Admin note</label>
                          <textarea
                            value={adminNotes}
                            onChange={(event) => setAdminNotes(event.target.value)}
                            rows={3}
                            className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none focus:border-sky-500"
                            placeholder="Add visit confirmation, update, or rejection reason"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {(selectedRequest.status === 'pending' || selectedRequest.status === 'approved') && (
                    <div className="rounded-3xl border border-stone-200 bg-stone-50/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-stone-900">Sensor readings workspace</p>
                          <p className="mt-1 text-xs text-stone-500">
                            Use this section once the visit is done. Until the real IoT stream is ready, these manual values simulate the device output.
                          </p>
                        </div>
                        {selectedRequest.status === 'approved' && (
                          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                            Ready for completion
                          </span>
                        )}
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {Object.entries(sensorReadings).map(([key, value]) => (
                          <div key={key}>
                            <label className="mb-1 block text-xs font-medium uppercase tracking-[0.15em] text-stone-500">{key}</label>
                            <input
                              type="number"
                              step="0.1"
                              value={value}
                              onChange={(event) => setSensorReadings((current) => ({ ...current, [key]: event.target.value }))}
                              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none focus:border-sky-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRequest.status === 'completed' && (
                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-4">
                      <p className="text-sm font-semibold text-emerald-900">Completed result summary</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm text-emerald-900">
                        <p>Final score: {selectedRequest.finalRecord?.result?.score ?? selectedRequest.imageAssessment?.score ?? '-'}</p>
                        <p>Classification: {selectedRequest.finalRecord?.result?.classification || 'Completed'}</p>
                      </div>
                    </div>
                  )}

                  {selectedRequest.status === 'rejected' && (
                    <div className="rounded-3xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800">
                      This request has been rejected. Keep the note updated so the farmer understands why the visit was not scheduled.
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {selectedRequest.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => patchRequest('approve')}
                          className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                        >
                          {submitting ? 'Saving...' : 'Confirm schedule'}
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => patchRequest('reject')}
                          className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {submitting ? 'Saving...' : 'Reject request'}
                        </button>
                      </>
                    )}

                    {selectedRequest.status === 'approved' && (
                      <>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => patchRequest('approve')}
                          className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                        >
                          {submitting ? 'Saving...' : 'Update schedule'}
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => patchRequest('complete')}
                          className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {submitting ? 'Saving...' : 'Mark completed'}
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => patchRequest('reject')}
                          className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {submitting ? 'Saving...' : 'Reject request'}
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      disabled={listActionLoading === selectedRequest._id}
                      onClick={() => void deleteRequest(selectedRequest._id)}
                      className="rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {listActionLoading === selectedRequest._id ? 'Deleting...' : 'Delete request'}
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
