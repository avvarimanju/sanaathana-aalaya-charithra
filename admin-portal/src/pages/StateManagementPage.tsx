import React, { useState, useEffect } from 'react';
import { INDIAN_STATES } from '../../../mobile-app/src/constants/indianStates';
import './StateManagementPage.css';

interface StateVisibility {
  stateCode: string;
  stateName: string;
  isVisible: boolean;
  templeCount: number;
}

/**
 * StateManagementPage Component
 * 
 * Admin page to manage state visibility in the mobile app.
 * Allows admins to hide/show states based on temple availability.
 */
const StateManagementPage: React.FC = () => {
  const [states, setStates] = useState<StateVisibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Mock temple counts (replace with actual API call)
  const TEMPLE_COUNTS: Record<string, number> = {
    'Andhra Pradesh': 3,
    'Karnataka': 2,
  };

  useEffect(() => {
    loadStateVisibility();
  }, []);

  const loadStateVisibility = async () => {
    setLoading(true);
    try {
      // Fetch from backend API
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/states/visibility`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const visibilityMap = data.settings || {};

      const stateData: StateVisibility[] = INDIAN_STATES.map(state => ({
        stateCode: state.code,
        stateName: state.name,
        isVisible: visibilityMap[state.code] !== false, // Default to visible
        templeCount: TEMPLE_COUNTS[state.name] || 0,
      }));

      setStates(stateData);
    } catch (error) {
      console.error('Failed to load state visibility:', error);
      // Fallback to default (all visible)
      const stateData: StateVisibility[] = INDIAN_STATES.map(state => ({
        stateCode: state.code,
        stateName: state.name,
        isVisible: true,
        templeCount: TEMPLE_COUNTS[state.name] || 0,
      }));
      setStates(stateData);
    } finally {
      setLoading(false);
    }
  };

  const toggleStateVisibility = (stateCode: string) => {
    setStates(prev =>
      prev.map(state =>
        state.stateCode === stateCode
          ? { ...state, isVisible: !state.isVisible }
          : state
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Create visibility map
      const visibilityMap: Record<string, boolean> = {};
      states.forEach(state => {
        visibilityMap[state.stateCode] = state.isVisible;
      });

      // Save to backend API
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/states/visibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`, // Add auth token
        },
        body: JSON.stringify({ settings: visibilityMap }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      alert(`State visibility settings saved successfully!\n\nStatistics:\n- Total: ${result.statistics.total}\n- Visible: ${result.statistics.visible}\n- Hidden: ${result.statistics.hidden}\n\nVersion: ${result.version}`);
      
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save state visibility:', error);
      alert(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check your connection and try again.`);
    } finally {
      setSaving(false);
    }
  };

  const handleHideAllEmpty = () => {
    setStates(prev =>
      prev.map(state => ({
        ...state,
        isVisible: state.templeCount > 0,
      }))
    );
    setHasChanges(true);
  };

  const handleShowAll = () => {
    setStates(prev =>
      prev.map(state => ({
        ...state,
        isVisible: true,
      }))
    );
    setHasChanges(true);
  };

  const filteredStates = states.filter(state => {
    // Apply visibility filter
    if (filter === 'visible' && !state.isVisible) return false;
    if (filter === 'hidden' && state.isVisible) return false;

    // Apply search filter
    if (searchQuery && !state.stateName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  const visibleCount = states.filter(s => s.isVisible).length;
  const hiddenCount = states.filter(s => !s.isVisible).length;
  const statesWithTemples = states.filter(s => s.templeCount > 0).length;

  if (loading) {
    return (
      <div className="state-management-page">
        <div className="loading">Loading state data...</div>
      </div>
    );
  }

  return (
    <div className="state-management-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>State Visibility Management</h1>
          <p>Control which states are visible to mobile app users</p>
        </div>
        {hasChanges && (
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🗺️</div>
          <div className="stat-content">
            <div className="stat-value">{states.length}</div>
            <div className="stat-label">Total States</div>
          </div>
        </div>
        <div className="stat-card visible">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{visibleCount}</div>
            <div className="stat-label">Visible</div>
          </div>
        </div>
        <div className="stat-card hidden">
          <div className="stat-icon">🚫</div>
          <div className="stat-content">
            <div className="stat-value">{hiddenCount}</div>
            <div className="stat-label">Hidden</div>
          </div>
        </div>
        <div className="stat-card temples">
          <div className="stat-icon">🏛️</div>
          <div className="stat-content">
            <div className="stat-value">{statesWithTemples}</div>
            <div className="stat-label">With Temples</div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bulk-actions">
        <div className="action-buttons">
          <button
            className="bulk-btn hide-empty"
            onClick={handleHideAllEmpty}
          >
            🚫 Hide All Empty States
          </button>
          <button
            className="bulk-btn show-all"
            onClick={handleShowAll}
          >
            ✅ Show All States
          </button>
        </div>
        <div className="filters">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search states..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All States ({states.length})</option>
            <option value="visible">Visible ({visibleCount})</option>
            <option value="hidden">Hidden ({hiddenCount})</option>
          </select>
        </div>
      </div>

      {/* State List */}
      <div className="state-list">
        {filteredStates.length === 0 ? (
          <div className="empty-state">
            <p>No states found matching your filters</p>
          </div>
        ) : (
          filteredStates.map(state => (
            <div
              key={state.stateCode}
              className={`state-item ${state.isVisible ? 'visible' : 'hidden'}`}
            >
              <div className="state-info">
                <div className="state-header">
                  <h3>{state.stateName}</h3>
                  <span className="state-code">{state.stateCode}</span>
                </div>
                <div className="state-meta">
                  {state.templeCount > 0 ? (
                    <span className="temple-count">
                      🏛️ {state.templeCount} {state.templeCount === 1 ? 'temple' : 'temples'}
                    </span>
                  ) : (
                    <span className="no-temples">No temples added</span>
                  )}
                </div>
              </div>
              <div className="state-actions">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={state.isVisible}
                    onChange={() => toggleStateVisibility(state.stateCode)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className={`status-badge ${state.isVisible ? 'visible' : 'hidden'}`}>
                  {state.isVisible ? '✅ Visible' : '🚫 Hidden'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Save Reminder */}
      {hasChanges && (
        <div className="save-reminder">
          <div className="reminder-content">
            <span className="reminder-icon">⚠️</span>
            <span>You have unsaved changes</span>
          </div>
          <button
            className="save-btn-reminder"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
};

export default StateManagementPage;
