/* global chrome */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState([]);
  const selectAllRef = useRef(null);
  const [formData, setFormData] = useState({
    company_name: '',
    job_title: '',
    location: '',
    date_applied: new Date().toISOString().split('T')[0],
    status: 'Applied',
    platform: 'LinkedIn',
    job_link: '',
    notes: ''
  });

  const emptyForm = () => ({
    company_name: '',
    job_title: '',
    location: '',
    date_applied: new Date().toISOString().split('T')[0],
    status: 'Applied',
    platform: 'LinkedIn',
    job_link: '',
    notes: ''
  });

  const getUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    getUser();
  }, [getUser]);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user, fetchApplications]);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', user?.id)
      .order('date_applied', { ascending: false });
  
    if (error) {
      console.error('Error fetching applications:', error);
    } else {
      setApplications(data || []);
    }
    
    setLoading(false);
  }, [user?.id]);

  // Save auth token for extension
  useEffect(() => {
    const saveAuthForExtension = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && window.chrome?.runtime) {
        try {
          chrome.runtime.sendMessage(
            'gkobemhjaceoaldfcngmgiabmnnilici',
            {
              type: 'SAVE_AUTH',
              token: session.access_token,
              userId: session.user.id
            },
            (response) => {
              if (chrome.runtime.lastError) {
                console.log('⚠️ Extension not available');
              } else if (response && response.success) {
                console.log('✅ Auth synced with extension from dashboard');
              }
            }
          );
        } catch (err) {
          console.log('Extension not available');
        }
      }
    };
    
    if (user) {
      saveAuthForExtension();
    }
  }, [user]);

  // Auto-refresh when tab gets focus
  useEffect(() => {
    if (!user) return;
    
    const handleFocus = () => {
      console.log('Tab focused - refreshing jobs...');
      fetchApplications();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, fetchApplications]);

  const handleAddApplication = async (e) => {
    e.preventDefault();
    
    if (!formData.company_name.trim()) {
      alert('Company name is required');
      return;
    }
    if (!formData.job_title.trim()) {
      alert('Job title is required');
      return;
    }
    
    setLoading(true);

    const normalizedJobLink = (formData.job_link || '').trim().replace(/\/+$/, '');

    if (normalizedJobLink) {
      const { data: existing, error: existingError } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', user.id)
        .or(`job_link.eq.${normalizedJobLink},job_link.eq.${normalizedJobLink + '/'}`)
        .limit(1);

      if (existingError) {
        console.error('Error checking duplicates:', existingError);
      } else if (Array.isArray(existing) && existing.length > 0) {
        setSuccessMessage('✓ Already saved (duplicate skipped).');
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowAddModal(false);
        setLoading(false);
        return;
      }
    }

    const { data, error } = await supabase
      .from('applications')
      .insert([{
        ...formData,
        job_link: normalizedJobLink,
        user_id: user.id
      }])
      .select();

    if (error) {
      console.error('Error adding application:', error);
      alert('Error adding application. Please try again.');
      setLoading(false);
      return;
    }

    setApplications([data[0], ...applications]);
    setSuccessMessage('✅ Application added successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
    
    setFormData(emptyForm());

    setShowAddModal(false);
    setLoading(false);
  };

  const closeApplicationModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingApplication(null);
    setFormData(emptyForm());
  };

  const openAddModal = () => {
    setShowEditModal(false);
    setEditingApplication(null);
    setFormData(emptyForm());
    setShowAddModal(true);
  };

  const handleEditClick = (application) => {
    setShowAddModal(false);
    setEditingApplication(application);
    const rawDate = application.date_applied;
    const dateForInput =
      rawDate != null && String(rawDate).length >= 10
        ? String(rawDate).slice(0, 10)
        : new Date().toISOString().split('T')[0];
    setFormData({
      company_name: application.company_name,
      job_title: application.job_title,
      location: application.location || '',
      date_applied: dateForInput,
      status: application.status,
      platform: application.platform || 'LinkedIn',
      job_link: application.job_link || '',
      notes: application.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateApplication = async (e) => {
    e.preventDefault();
    if (!editingApplication?.id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('applications')
      .update(formData)
      .eq('id', editingApplication.id)
      .select();

    if (error) {
      console.error('Error updating application:', error);
      alert('Error updating application. Please try again.');
    } else {
      setApplications(applications.map(app => 
        app.id === editingApplication.id ? data[0] : app
      ));
      
      setSuccessMessage('✅ Application updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      setShowEditModal(false);
      setEditingApplication(null);
      setFormData(emptyForm());
    }

    setLoading(false);
  };

  const handleDeleteApplication = async (id) => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting application:', error);
      alert('Error deleting application. Please try again.');
    } else {
      setApplications(applications.filter(app => app.id !== id));
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      setSuccessMessage('✅ Application deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const filteredApplications = applications.filter(app => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const company = app.company_name?.toLowerCase() || '';
      const title = app.job_title?.toLowerCase() || '';
      
      if (!company.includes(query) && !title.includes(query)) {
        return false;
      }
    }
    
    if (statusFilter !== 'All' && app.status !== statusFilter) {
      return false;
    }
    
    return true;
  });

  const filteredIds = filteredApplications.map((a) => a.id);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));
  const someFilteredSelected = filteredIds.some((id) => selectedIds.includes(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someFilteredSelected && !allFilteredSelected;
    }
  }, [someFilteredSelected, allFilteredSelected]);

  useEffect(() => {
    setSelectedIds([]);
  }, [searchQuery, statusFilter]);

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0 || !user?.id) return;
    const n = selectedIds.length;
    if (
      !window.confirm(
        `Delete ${n} application${n === 1 ? '' : 's'}? This cannot be undone.`
      )
    ) {
      return;
    }

    setLoading(true);
    const idsToDelete = [...selectedIds];
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('user_id', user.id)
      .in('id', idsToDelete);

    if (error) {
      console.error('Error deleting applications:', error);
      alert('Error deleting applications. Please try again.');
    } else {
      setApplications((apps) => apps.filter((app) => !idsToDelete.includes(app.id)));
      setSelectedIds([]);
      setSuccessMessage(
        n === 1 ? '✅ Application deleted.' : `✅ ${n} applications deleted.`
      );
      setTimeout(() => setSuccessMessage(''), 3000);
    }
    setLoading(false);
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">JobTracker Pro</h1>
              <p className="text-emerald-100 mt-1">{user?.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/settings')}
                className="text-white hover:text-emerald-100 font-medium"
              >
                Settings
              </button>
              <button
                onClick={handleSignOut}
                className="bg-white text-emerald-600 px-4 py-2 rounded-lg font-semibold hover:bg-emerald-50 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {successMessage && (
        <div className="fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {successMessage}
        </div>
      )}

      {(showAddModal || showEditModal) && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="application-modal-title"
          onClick={closeApplicationModals}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2
                id="application-modal-title"
                className="text-xl font-bold text-gray-900"
              >
                {showEditModal ? 'Edit application' : 'Add application'}
              </h2>
              <button
                type="button"
                onClick={closeApplicationModals}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={showEditModal ? handleUpdateApplication : handleAddApplication}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Company <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Job title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.job_title}
                  onChange={(e) =>
                    setFormData({ ...formData, job_title: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Date applied
                </label>
                <input
                  type="date"
                  value={formData.date_applied}
                  onChange={(e) =>
                    setFormData({ ...formData, date_applied: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="Saved">Saved</option>
                  <option value="Applied">Applied</option>
                  <option value="Interview Scheduled">Interview Scheduled</option>
                  <option value="Interview Completed">Interview Completed</option>
                  <option value="Offer Received">Offer Received</option>
                  <option value="Rejected by Company">Rejected by Company</option>
                  <option value="Ghosted">Ghosted</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Platform
                </label>
                <input
                  type="text"
                  value={formData.platform}
                  onChange={(e) =>
                    setFormData({ ...formData, platform: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Job link
                </label>
                <input
                  type="url"
                  value={formData.job_link}
                  onChange={(e) =>
                    setFormData({ ...formData, job_link: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeApplicationModals}
                  className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {showEditModal ? 'Save changes' : 'Add application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Total</p>
            <p className="text-3xl font-bold text-gray-900">{filteredApplications.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Applied</p>
            <p className="text-3xl font-bold text-blue-600">
              {filteredApplications.filter(a => a.status === 'Applied').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Interview</p>
            <p className="text-3xl font-bold text-emerald-600">
              {filteredApplications.filter(a => a.status === 'Interview Scheduled' || a.status === 'Interview Completed').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Offers</p>
            <p className="text-3xl font-bold text-green-600">
              {filteredApplications.filter(a => a.status === 'Offer Received').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Rejected</p>
            <p className="text-3xl font-bold text-red-600">
              {filteredApplications.filter(a => a.status === 'Rejected by Company').length}
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
          <button 
            onClick={openAddModal}
            className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition whitespace-nowrap"
          >
            + Add New Application
          </button>
          
          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="Search by company or job title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white whitespace-nowrap"
          >
            <option value="All">All Statuses</option>
            <option value="Saved">Saved</option>
            <option value="Applied">Applied</option>
            <option value="Interview Scheduled">Interview</option>
            <option value="Offer Received">Offer</option>
            <option value="Rejected by Company">Rejected</option>
            <option value="Ghosted">Ghosted</option>
          </select>

          {(searchQuery || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>

        {selectedIds.length > 0 && (
          <div
            className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm"
            role="status"
            aria-live="polite"
          >
            <span className="font-medium text-emerald-900">
              {selectedIds.length} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="rounded-lg px-3 py-1.5 font-medium text-emerald-800 hover:bg-emerald-100"
            >
              Clear selection
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={loading}
              className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Delete selected
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery || statusFilter !== 'All' ? 'No matching applications' : 'No applications yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter !== 'All' 
                  ? 'Try adjusting your filters' 
                  : 'Add your first job application to get started'}
              </p>
              {!searchQuery && statusFilter === 'All' && (
                <button
                  onClick={openAddModal}
                  className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition"
                >
                  + Add First Application
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-3 py-3 text-left align-middle" scope="col">
                      <span className="sr-only">Select row</span>
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAllFiltered}
                        disabled={filteredApplications.length === 0}
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        aria-label="Select all visible rows"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Applied</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="w-12 px-3 py-4 align-middle">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(app.id)}
                          onChange={() => toggleSelectRow(app.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          aria-label={`Select ${app.company_name} — ${app.job_title}`}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{app.company_name}</div>
                        {app.location && <div className="text-sm text-gray-500">{app.location}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{app.job_title}</div>
                        {app.platform && <div className="text-sm text-gray-500">{app.platform}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(app.date_applied).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${app.status === 'Applied' ? 'bg-blue-100 text-blue-800' : ''}
                          ${app.status === 'Interview Scheduled' || app.status === 'Interview Completed' ? 'bg-emerald-100 text-emerald-800' : ''}
                          ${app.status === 'Offer Received' ? 'bg-green-100 text-green-800' : ''}
                          ${app.status === 'Rejected by Company' ? 'bg-red-100 text-red-800' : ''}
                          ${app.status === 'Saved' ? 'bg-gray-100 text-gray-800' : ''}
                          ${app.status === 'Ghosted' ? 'bg-yellow-100 text-yellow-800' : ''}
                        `}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          type="button"
                          onClick={() => handleEditClick(app)}
                          className="text-emerald-600 hover:text-emerald-800 mr-3 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteApplication(app.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;