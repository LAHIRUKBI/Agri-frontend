// app/dashboard/admin/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import AdminSidebar from '@/app/navigation/admin/page';

interface Admin {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EditFormData {
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  password?: string;
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormData>({
    name: '',
    email: '',
    phoneNumber: '',
    role: 'admin',
    isActive: true,
    password: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${API_URL}/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }

      const data = await response.json();
      setAdmins(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admins');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (admin: Admin) => {
    setEditingId(admin._id);
    setEditForm({
      name: admin.name,
      email: admin.email,
      phoneNumber: admin.phoneNumber,
      role: admin.role,
      isActive: admin.isActive,
      password: ''
    });
    setShowPasswordField(false);
    setError(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({
      name: '',
      email: '',
      phoneNumber: '',
      role: 'admin',
      isActive: true,
      password: ''
    });
    setShowPasswordField(false);
    setError(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleUpdate = async (id: string) => {
    setIsSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

      // Only include password if it's provided
      const updateData: any = {
        name: editForm.name,
        email: editForm.email,
        phoneNumber: editForm.phoneNumber,
        role: editForm.role,
        isActive: editForm.isActive
      };

      if (editForm.password && editForm.password.trim() !== '') {
        if (editForm.password.length < 6) {
          setError('Password must be at least 6 characters long');
          setIsSaving(false);
          return;
        }
        updateData.password = editForm.password;
      }

      const response = await fetch(`${API_URL}/admin/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update admin');
      }

      // Update the admins list
      setAdmins(prev => prev.map(admin => 
        admin._id === id ? data.data : admin
      ));

      // Reset edit state
      setEditingId(null);
      setEditForm({
        name: '',
        email: '',
        phoneNumber: '',
        role: 'admin',
        isActive: true,
        password: ''
      });
      setShowPasswordField(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update admin');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
        Inactive
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    return role === 'superadmin' ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
        Super Admin
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        Admin
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = 
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.phoneNumber.includes(searchTerm);
    
    const matchesRole = selectedRole === 'all' || admin.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-white">
        <AdminSidebar />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading administrators...</p>
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
                Administrators
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage system administrators and their permissions
              </p>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white min-w-[150px]"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-red-600">⚠️</span>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Admins Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Administrator</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <p className="text-gray-500">No administrators found</p>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your search filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAdmins.map((admin) => (
                      <tr key={admin._id} className="hover:bg-gray-50 transition-colors">
                        {editingId === admin._id ? (
                          // Edit Mode
                          <>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 text-sm font-medium">
                                  {editForm.name.charAt(0).toUpperCase()}
                                </div>
                                <input
                                  type="text"
                                  name="name"
                                  value={editForm.name}
                                  onChange={handleEditChange}
                                  className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                  placeholder="Name"
                                />
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                <input
                                  type="email"
                                  name="email"
                                  value={editForm.email}
                                  onChange={handleEditChange}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                  placeholder="Email"
                                />
                                <input
                                  type="tel"
                                  name="phoneNumber"
                                  value={editForm.phoneNumber}
                                  onChange={handleEditChange}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                  placeholder="Phone"
                                />
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <select
                                name="role"
                                value={editForm.role}
                                onChange={handleEditChange}
                                className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                              >
                                <option value="admin">Admin</option>
                                <option value="superadmin">Super Admin</option>
                              </select>
                            </td>
                            <td className="py-3 px-4">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  name="isActive"
                                  checked={editForm.isActive}
                                  onChange={handleEditChange}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">Active</span>
                              </label>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm text-gray-600">{formatDate(admin.lastLogin)}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm text-gray-600">
                                {new Date(admin.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col items-end gap-2">
                                {showPasswordField && (
                                  <input
                                    type="password"
                                    name="password"
                                    value={editForm.password}
                                    onChange={handleEditChange}
                                    placeholder="New password"
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                  />
                                )}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setShowPasswordField(!showPasswordField)}
                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                    title={showPasswordField ? "Hide password" : "Change password"}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleUpdate(admin._id)}
                                    disabled={isSaving}
                                    className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                                    title="Save"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={handleCancel}
                                    className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                    title="Cancel"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </td>
                          </>
                        ) : (
                          // View Mode
                          <>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 text-sm font-medium">
                                  {admin.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{admin.name}</p>
                                  <p className="text-xs text-gray-500">ID: {admin._id.slice(-6)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                <p className="text-sm text-gray-600">{admin.email}</p>
                                <p className="text-sm text-gray-600">{admin.phoneNumber}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {getRoleBadge(admin.role)}
                            </td>
                            <td className="py-3 px-4">
                              {getStatusBadge(admin.isActive)}
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm text-gray-600">{formatDate(admin.lastLogin)}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm text-gray-600">
                                {new Date(admin.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(admin)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                  title="Edit"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Showing <span className="font-medium">{filteredAdmins.length}</span> of <span className="font-medium">{admins.length}</span> administrators
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Admins</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{admins.length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="text-green-600 font-medium">{admins.filter(a => a.isActive).length} active</span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500">{admins.filter(a => !a.isActive).length} inactive</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Role Distribution</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {admins.filter(a => a.role === 'admin').length} / {admins.filter(a => a.role === 'superadmin').length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="text-blue-600 font-medium">{admins.filter(a => a.role === 'admin').length} Admins</span>
                <span className="text-gray-300">•</span>
                <span className="text-purple-600">{admins.filter(a => a.role === 'superadmin').length} Super Admins</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Recent Activity</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {admins.filter(a => {
                      if (!a.lastLogin) return false;
                      const daysSince = Math.floor((Date.now() - new Date(a.lastLogin).getTime()) / (1000 * 60 * 60 * 24));
                      return daysSince < 7;
                    }).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">Active in last 7 days</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}