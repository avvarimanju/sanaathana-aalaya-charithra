import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { templeApi, Temple } from '../api/templeApi';
import './TempleDetailPage.css';

const TempleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [temple, setTemple] = useState<Temple | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'artifacts' | 'analytics'>('overview');

  useEffect(() => {
    if (id) {
      loadTempleData(id);
    }
  }, [id]);

  const loadTempleData = async (templeId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const templeData = await templeApi.getTemple(templeId);
      setTemple(templeData);
    } catch (err: any) {
      setError(err.message || 'Failed to load temple data');
      console.error('Failed to load temple data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="temple-detail-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading temple details...</p>
        </div>
      </div>
    );
  }

  if (error || !temple) {
    return (
      <div className="temple-detail-page">
        <div className="error-state">
          <div className="error-icon">❌</div>
          <h2>Temple Not Found</h2>
          <p>{error || "The temple you're looking for doesn't exist."}</p>
          <button className="btn-primary" onClick={() => navigate('/temples')}>
            Back to Temples
          </button>
        </div>
      </div>
    );
  }

  const templeData = temple as any; // Type assertion for additional fields

  return (
    <div className="temple-detail-page">
      {/* Header */}
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/temples')}>
          ← Back to Temples
        </button>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => navigate(`/temples/${id}/edit`)}>
            ✏️ Edit Temple
          </button>
          <button className="btn-secondary" onClick={() => navigate(`/artifacts?temple=${id}`)}>
            📿 Manage Artifacts
          </button>
        </div>
      </div>

      {/* Temple Header */}
      <div className="temple-header">
        <div className="temple-image-large">
          {templeData.imageUrl ? (
            <img src={templeData.imageUrl} alt={temple.name} />
          ) : (
            <div className="placeholder-image-large">🛕</div>
          )}
        </div>
        <div className="temple-header-info">
          <div className="temple-title-row">
            <h1>{temple.name}</h1>
            <span className={`status-badge-large ${temple.status}`}>
              {temple.status.toUpperCase()}
            </span>
          </div>
          <p className="temple-location-large">
            📍 {temple.location.city}, {(temple.location as any).district || temple.location.state}, {temple.location.state}
          </p>
          <p className="temple-deity-large">🙏 {temple.description}</p>
          
          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="quick-stat">
              <div className="stat-value">{temple.activeArtifactCount || 0}</div>
              <div className="stat-label">Artifacts</div>
            </div>
            <div className="quick-stat">
              <div className="stat-value">{temple.qrCodeCount || 0}</div>
              <div className="stat-label">QR Codes</div>
            </div>
            <div className="quick-stat">
              <div className="stat-value">{temple.accessMode}</div>
              <div className="stat-label">Access Mode</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📋 Overview
        </button>
        <button
          className={`tab ${activeTab === 'artifacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('artifacts')}
        >
          📿 Artifacts ({temple.activeArtifactCount || 0})
        </button>
        <button
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="info-section">
              <h2>Description</h2>
              <p>{temple.description}</p>
            </div>

            <div className="info-grid">
              <div className="info-card">
                <h3>📍 Location Details</h3>
                <div className="info-row">
                  <span className="info-label">City:</span>
                  <span className="info-value">{temple.location.city}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">District:</span>
                  <span className="info-value">{(temple.location as any).district || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">State:</span>
                  <span className="info-value">{temple.location.state}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Address:</span>
                  <span className="info-value">{temple.location.address || 'N/A'}</span>
                </div>
              </div>

              <div className="info-card">
                <h3>🏛️ Temple Information</h3>
                <div className="info-row">
                  <span className="info-label">Access Mode:</span>
                  <span className="info-value">{temple.accessMode}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Status:</span>
                  <span className="info-value">{temple.status}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Artifacts:</span>
                  <span className="info-value">{temple.activeArtifactCount || 0}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">QR Codes:</span>
                  <span className="info-value">{temple.qrCodeCount || 0}</span>
                </div>
              </div>
            </div>

            {(templeData as any).specialFeatures && (templeData as any).specialFeatures.length > 0 && (
              <div className="info-section">
                <h2>✨ Special Features</h2>
                <div className="features-grid">
                  {(templeData as any).specialFeatures.map((feature: string, index: number) => (
                    <div key={index} className="feature-tag">
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="info-section">
              <h2>📅 Timeline</h2>
              <div className="timeline">
                <div className="timeline-item">
                  <span className="timeline-label">Created:</span>
                  <span className="timeline-value">{new Date(temple.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="timeline-item">
                  <span className="timeline-label">Last Updated:</span>
                  <span className="timeline-value">{new Date(temple.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'artifacts' && (
          <div className="artifacts-tab">
            <div className="empty-state">
              <div className="empty-icon">📿</div>
              <h3>Artifacts Coming Soon</h3>
              <p>Artifact management will be integrated in the next phase</p>
              <button className="btn-primary" onClick={() => navigate(`/artifacts?temple=${id}`)}>
                Manage Artifacts
              </button>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-tab">
            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>📊 QR Code Count</h3>
                <div className="analytics-value">{temple.qrCodeCount || 0}</div>
                <p className="analytics-label">Total QR codes generated</p>
              </div>
              <div className="analytics-card">
                <h3>📿 Active Artifacts</h3>
                <div className="analytics-value">{temple.activeArtifactCount || 0}</div>
                <p className="analytics-label">Currently active</p>
              </div>
              <div className="analytics-card">
                <h3>🔓 Access Mode</h3>
                <div className="analytics-value">{temple.accessMode}</div>
                <p className="analytics-label">Temple access type</p>
              </div>
            </div>
            <div className="analytics-note">
              <p>💡 Detailed analytics coming soon!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TempleDetailPage;
