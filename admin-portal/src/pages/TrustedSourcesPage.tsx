// Trusted Sources Management Page
// Admin page for managing trusted sources

import React, { useState, useEffect } from 'react';
import {
  listTrustedSources,
  deleteTrustedSource,
  verifyTrustedSource,
  unverifyTrustedSource,
  updateTrustedSource,
  TrustedSource,
} from '../api/trustedSourcesApi';
import './TrustedSourcesPage.css';

export const TrustedSourcesPage: React.FC = () => {
  const [sources, setSources] = useState<TrustedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState<TrustedSource | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  useEffect(() => {
    loadSources();
  }, [filterType, filterStatus]);

  const loadSources = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (filterType !== 'all') params.sourceType = filterType;
      if (filterStatus !== 'all') params.verificationStatus = filterStatus;
      
      const response = await listTrustedSources(params);
      setSources(response.sources);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sources');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sourceId: string) => {
    if (!confirm('Are you sure you want to delete this source?')) return;

    try {
      await deleteTrustedSource(sourceId);
      await loadSources();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete source');
    }
  };

  const handleVerify = async (sourceId: string) => {
    try {
      await verifyTrustedSource(sourceId);
      await loadSources();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to verify source');
    }
  };

  const handleUnverify = async (sourceId: string) => {
    try {
      await unverifyTrustedSource(sourceId);
      await loadSources();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to unverify source');
    }
  };

  const handleEdit = (source: TrustedSource) => {
    setSelectedSource(source);
    setEditFormData({
      sourceName: source.sourceName,
      sourceUrl: source.sourceUrl,
      sourceType: source.sourceType,
      trustScore: source.trustScore,
      isActive: source.isActive,
      applicableStates: source.applicableStates?.join(', ') || '',
      description: source.metadata.description || '',
      contactEmail: source.metadata.contactEmail || '',
      managementBody: source.metadata.managementBody || '',
      notes: source.metadata.notes || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedSource) return;

    try {
      const updateData = {
        sourceName: editFormData.sourceName,
        sourceUrl: editFormData.sourceUrl,
        sourceType: editFormData.sourceType,
        trustScore: parseInt(editFormData.trustScore),
        isActive: editFormData.isActive,
        applicableStates: editFormData.applicableStates
          ? editFormData.applicableStates.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [],
        metadata: {
          description: editFormData.description,
          contactEmail: editFormData.contactEmail,
          managementBody: editFormData.managementBody,
          notes: editFormData.notes,
        },
      };

      await updateTrustedSource(selectedSource.sourceId, updateData);
      setShowEditModal(false);
      setSelectedSource(null);
      await loadSources();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update source');
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setSelectedSource(null);
    setEditFormData({});
  };

  const filteredSources = sources.filter((source) =>
    source.sourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    source.sourceUrl.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSourceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      temple_official: 'Temple Official',
      state_authority: 'State Authority',
      heritage_authority: 'Heritage Authority',
      custom: 'Custom',
    };
    return labels[type] || type;
  };

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      verified: 'status-verified',
      pending: 'status-pending',
      unverified: 'status-unverified',
    };
    return classes[status] || '';
  };

  if (loading) {
    return (
      <div className="trusted-sources-page">
        <div className="loading">Loading trusted sources...</div>
      </div>
    );
  }

  return (
    <div className="trusted-sources-page">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Trusted Sources Management</h1>
            <p>Manage trusted sources for temple content generation</p>
          </div>
          <div className="trust-score-legend">
            <div className="legend-title">📊 Trust Score Guide</div>
            <div className="legend-items">
              <div className="legend-item">
                <span className="score-badge">10/10</span>
                <span>State authorities, Official temples</span>
              </div>
              <div className="legend-item">
                <span className="score-badge">9/10</span>
                <span>Heritage authorities (ASI)</span>
              </div>
              <div className="legend-item">
                <span className="score-badge">8/10</span>
                <span>Tourism departments</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-actions">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search sources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="temple_official">Temple Official</option>
            <option value="state_authority">State Authority</option>
            <option value="heritage_authority">Heritage Authority</option>
            <option value="custom">Custom</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>

        <button
          onClick={() => alert('Add New Source functionality coming soon!')}
          className="btn-primary"
        >
          + New Source
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="sources-grid">
        {filteredSources.length === 0 ? (
          <div className="no-sources">
            <p>No trusted sources found</p>
            <button onClick={() => alert('Add New Source functionality coming soon!')} className="btn-primary">
              Add Source
            </button>
          </div>
        ) : (
          filteredSources.map((source) => (
            <div key={source.sourceId} className="source-card">
              <div className="source-header">
                <h3>{source.sourceName}</h3>
                <div className="source-badges">
                  <span className={`status-badge ${getStatusBadgeClass(source.verificationStatus)}`}>
                    {source.verificationStatus === 'verified' && '✓ '}
                    {source.verificationStatus.charAt(0).toUpperCase() + source.verificationStatus.slice(1)}
                  </span>
                  {!source.isActive && (
                    <span className="status-badge status-inactive">Inactive</span>
                  )}
                </div>
              </div>

              <div className="source-url">
                <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {source.sourceUrl}
                </a>
              </div>

              <div className="source-details">
                <div className="detail-row">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{getSourceTypeLabel(source.sourceType)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Trust Score:</span>
                  <span className="detail-value">
                    <span className="trust-score">{source.trustScore}/10</span>
                  </span>
                </div>
                {source.applicableTemples && source.applicableTemples.length > 0 && (
                  <div className="detail-row">
                    <span className="detail-label">Applicable:</span>
                    <span className="detail-value">
                      {source.applicableTemples.length} temple(s)
                    </span>
                  </div>
                )}
                {source.applicableStates && source.applicableStates.length > 0 && (
                  <div className="detail-row">
                    <span className="detail-label">States:</span>
                    <span className="detail-value">
                      {source.applicableStates.join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {source.metadata.description && (
                <div className="source-description">
                  {source.metadata.description}
                </div>
              )}

              <div className="source-actions">
                <button
                  onClick={() => handleEdit(source)}
                  className="btn-secondary"
                >
                  Edit
                </button>

                {source.verificationStatus !== 'verified' ? (
                  <button
                    onClick={() => handleVerify(source.sourceId)}
                    className="btn-success"
                  >
                    Verify
                  </button>
                ) : (
                  <button
                    onClick={() => handleUnverify(source.sourceId)}
                    className="btn-warning"
                  >
                    Unverify
                  </button>
                )}

                <button
                  onClick={() => handleDelete(source.sourceId)}
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>

              <div className="source-meta">
                <small>
                  Added by {source.addedBy} on {new Date(source.addedDate).toLocaleDateString()}
                </small>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="sources-summary">
        <p>
          Showing {filteredSources.length} of {sources.length} sources
        </p>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedSource && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Trusted Source</h2>
              <button className="modal-close" onClick={handleCancelEdit}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Source Name *</label>
                <input
                  type="text"
                  value={editFormData.sourceName || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, sourceName: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Tirumala Tirupati Devasthanams"
                />
              </div>

              <div className="form-group">
                <label>Source URL *</label>
                <input
                  type="url"
                  value={editFormData.sourceUrl || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, sourceUrl: e.target.value })}
                  className="form-input"
                  placeholder="https://..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Source Type *</label>
                  <select
                    value={editFormData.sourceType || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, sourceType: e.target.value })}
                    className="form-select"
                  >
                    <option value="temple_official">Temple Official</option>
                    <option value="state_authority">State Authority</option>
                    <option value="heritage_authority">Heritage Authority</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Trust Score (1-10) *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editFormData.trustScore || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, trustScore: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Applicable States (comma-separated)</label>
                <input
                  type="text"
                  value={editFormData.applicableStates || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, applicableStates: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Andhra Pradesh, Telangana"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editFormData.description || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="form-textarea"
                  rows={3}
                  placeholder="Brief description of the source..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    value={editFormData.contactEmail || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, contactEmail: e.target.value })}
                    className="form-input"
                    placeholder="contact@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Management Body</label>
                  <input
                    type="text"
                    value={editFormData.managementBody || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, managementBody: e.target.value })}
                    className="form-input"
                    placeholder="e.g., Government of Andhra Pradesh"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={editFormData.notes || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="form-textarea"
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editFormData.isActive !== false}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  />
                  <span>Active</span>
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={handleCancelEdit} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handleSaveEdit} className="btn-save">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrustedSourcesPage;
