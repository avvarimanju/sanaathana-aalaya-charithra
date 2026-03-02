/**
 * Temple List Page - Example with Real API Integration
 * 
 * This is an example showing how to integrate the TempleListPage with real APIs.
 * Copy the relevant parts to your actual TempleListPage.tsx
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { templeApi, Temple } from '../api';
import './TempleListPage.css';

export default function TempleListPageWithApi() {
  const navigate = useNavigate();
  
  // State
  const [temples, setTemples] = useState<Temple[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | 'all'>('all');

  // Load temples from API
  useEffect(() => {
    loadTemples();
  }, [filterStatus]);

  async function loadTemples() {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = { limit: 100 };
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      const result = await templeApi.listTemples(params);
      setTemples(result.items);
    } catch (err: any) {
      console.error('Failed to load temples:', err);
      setError(err.message || 'Failed to load temples');
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete(templeId: string, templeName: string) {
    if (!confirm(`Are you sure you want to delete "${templeName}"?`)) {
      return;
    }

    try {
      await templeApi.deleteTemple(templeId);
      // Remove from local state
      setTemples(prev => prev.filter(t => t.templeId !== templeId));
      alert('Temple deleted successfully!');
    } catch (err: any) {
      console.error('Failed to delete temple:', err);
      alert(`Failed to delete temple: ${err.message}`);
    }
  }

  // Filter temples
  const filteredTemples = temples.filter(temple => {
    const matchesSearch = temple.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         temple.location.state.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = filterState === 'all' || temple.location.state === filterState;
    return matchesSearch && matchesState;
  });

  // Get unique states for filter
  const states = Array.from(new Set(temples.map(t => t.location.state))).sort();

  // Calculate statistics
  const stats = {
    total: temples.length,
    active: temples.filter(t => t.status === 'active').length,
    totalArtifacts: temples.reduce((sum, t) => sum + (t.activeArtifactCount || 0), 0),
    totalScans: temples.reduce((sum, t) => sum + (t.qrCodeCount || 0), 0),
  };

  // Render loading state
  if (loading) {
    return (
      <div className="temple-list-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading temples...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="temple-list-page">
        <div className="error-container">
          <h2>Error Loading Temples</h2>
          <p>{error}</p>
          <button onClick={loadTemples} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="temple-list-page">
      <div className="page-header">
        <h1>Temple Management</h1>
        <button 
          className="btn-primary"
          onClick={() => navigate('/temples/new')}
        >
          + Add Temple
        </button>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Temples</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Active Temples</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalArtifacts}</div>
          <div className="stat-label">Total Artifacts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalScans}</div>
          <div className="stat-label">QR Codes</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search temples..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          className="filter-select"
        >
          <option value="all">All States</option>
          {states.map(state => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button onClick={loadTemples} className="btn-secondary">
          🔄 Refresh
        </button>
      </div>

      {/* Temple Grid */}
      {filteredTemples.length === 0 ? (
        <div className="empty-state">
          <p>No temples found</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/temples/new')}
          >
            Add Your First Temple
          </button>
        </div>
      ) : (
        <div className="temple-grid">
          {filteredTemples.map(temple => (
            <div key={temple.templeId} className="temple-card">
              <div className="temple-header">
                <h3>{temple.name}</h3>
                <span className={`status-badge ${temple.status}`}>
                  {temple.status}
                </span>
              </div>

              <div className="temple-info">
                <p className="location">
                  📍 {temple.location.city}, {temple.location.state}
                </p>
                <p className="description">{temple.description}</p>
              </div>

              <div className="temple-stats">
                <div className="stat">
                  <span className="stat-label">Artifacts:</span>
                  <span className="stat-value">{temple.activeArtifactCount || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">QR Codes:</span>
                  <span className="stat-value">{temple.qrCodeCount || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Access:</span>
                  <span className="stat-value">{temple.accessMode}</span>
                </div>
              </div>

              <div className="temple-actions">
                <button
                  onClick={() => navigate(`/temples/${temple.templeId}`)}
                  className="btn-secondary"
                >
                  View
                </button>
                <button
                  onClick={() => navigate(`/temples/${temple.templeId}/edit`)}
                  className="btn-secondary"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(temple.templeId, temple.name)}
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>

              <div className="temple-footer">
                <small>Updated: {new Date(temple.updatedAt).toLocaleDateString()}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
