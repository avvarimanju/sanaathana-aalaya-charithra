import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { templeApi, Temple } from '../api/templeApi';
import './TempleListPage.css';

const TempleListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [temples, setTemples] = useState<Temple[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch temples from API
  useEffect(() => {
    loadTemples();
  }, []);

  const loadTemples = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await templeApi.listTemples();
      setTemples(response.items);
    } catch (err) {
      setError('Failed to load temples. Please try again.');
      console.error('Error loading temples:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemples = temples.filter((temple) => {
    const matchesSearch =
      temple.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      temple.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      temple.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = filterState === 'all' || temple.location.state === filterState;
    const matchesStatus = filterStatus === 'all' || temple.status === filterStatus;
    return matchesSearch && matchesState && matchesStatus;
  });

  const totalArtifacts = temples.reduce((sum, t) => sum + (t.activeArtifactCount || 0), 0);
  const totalScans = temples.reduce((sum, t) => sum + (t.qrCodeCount || 0), 0);

  // Show loading state
  if (loading) {
    return (
      <div className="temple-list-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading temples...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="temple-list-page">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Temples</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={loadTemples}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="temple-list-page">
      <div className="page-header">
        <div className="header-left">
          <h1>🛕 Temple Management</h1>
          <p>Manage Hindu temples and their information</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/temples/new')}>
          ➕ Add New Temple
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">🛕</div>
          <div className="stat-content">
            <div className="stat-value">{temples.length}</div>
            <div className="stat-label">Total Temples</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📿</div>
          <div className="stat-content">
            <div className="stat-value">{totalArtifacts}</div>
            <div className="stat-label">Total Artifacts</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📱</div>
          <div className="stat-content">
            <div className="stat-value">{totalScans.toLocaleString()}</div>
            <div className="stat-label">Total QR Scans</div>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search temples by name, location, or deity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          <select value={filterState} onChange={(e) => setFilterState(e.target.value)}>
            <option value="all">All States</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Karnataka">Karnataka</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="temples-grid">
        {filteredTemples.map((temple) => (
          <div key={temple.templeId} className="temple-card">
            <div className="temple-image">
              {temple.imageUrl ? (
                <img src={temple.imageUrl} alt={temple.name} />
              ) : (
                <div className="placeholder-image">🛕</div>
              )}
              <span className={`status-badge ${temple.status}`}>
                {temple.status.toUpperCase()}
              </span>
            </div>
            <div className="temple-content">
              <h3>{temple.name}</h3>
              <p className="temple-location">
                📍 {temple.location.city}, {temple.location.district || temple.location.state}, {temple.location.state}
              </p>
              <p className="temple-deity">🙏 {temple.description}</p>
              <div className="temple-stats">
                <span>📿 {temple.activeArtifactCount || 0} artifacts</span>
                <span>📱 {temple.qrCodeCount || 0} QR codes</span>
              </div>
            </div>
            <div className="temple-actions">
              <button
                className="btn-secondary"
                onClick={() => navigate(`/temples/${temple.templeId}`)}
              >
                View Details
              </button>
              <button
                className="btn-icon"
                title="Edit"
                onClick={() => navigate(`/temples/${temple.templeId}/edit`)}
              >
                ✏️
              </button>
              <button
                className="btn-icon"
                title="View Artifacts"
                onClick={() => navigate(`/artifacts?temple=${temple.templeId}`)}
              >
                📿
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemples.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No temples found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default TempleListPage;
