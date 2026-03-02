import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { templeApi, Artifact as ApiArtifact, Temple } from '../api/templeApi';
import './ArtifactListPage.css';

interface Artifact extends ApiArtifact {
  temple?: string;
  type?: string;
  hasAudio?: boolean;
  hasVideo?: boolean;
  languages?: string[];
  scans?: number;
}

const ArtifactListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templeFilter = searchParams.get('temple');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTemple, setFilterTemple] = useState(templeFilter || 'all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [temples, setTemples] = useState<Temple[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load temples for filter dropdown
      const templesResponse = await templeApi.listTemples();
      setTemples(templesResponse.items);

      // Load artifacts
      const params: any = {};
      if (filterTemple && filterTemple !== 'all') {
        params.templeId = filterTemple;
      }
      if (filterStatus && filterStatus !== 'all') {
        params.status = filterStatus;
      }
      if (filterType && filterType !== 'all') {
        params.type = filterType;
      }

      const artifactsResponse = await templeApi.listArtifacts(params);
      
      // Enrich artifacts with temple names
      const enrichedArtifacts = artifactsResponse.items.map(artifact => {
        const temple = templesResponse.items.find(t => t.templeId === artifact.templeId);
        return {
          ...artifact,
          temple: temple?.name || 'Unknown Temple'
        };
      });
      
      setArtifacts(enrichedArtifacts);
    } catch (err: any) {
      setError(err.message || 'Failed to load artifacts');
      console.error('Error loading artifacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      loadData();
    }
  }, [filterTemple, filterStatus, filterType]);

  const filteredArtifacts = artifacts.filter((artifact) => {
    const matchesSearch =
      artifact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (artifact.temple && artifact.temple.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (artifact.type && artifact.type.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const totalScans = artifacts.reduce((sum, a) => sum + (a.scans || 0), 0);
  const activeCount = artifacts.filter(a => a.status === 'active').length;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return 'status-badge published';
      case 'inactive': return 'status-badge draft';
      default: return 'status-badge';
    }
  };

  const handleGenerateQR = (artifactId: string) => {
    console.log('Generate QR for:', artifactId);
    alert('QR Code generation coming soon!');
  };

  const handleGenerateContent = (artifactId: string) => {
    navigate(`/content/generate?artifact=${artifactId}`);
  };

  const handleDelete = async (artifactId: string, artifactName: string) => {
    if (!confirm(`Are you sure you want to delete "${artifactName}"?`)) {
      return;
    }

    try {
      await templeApi.deleteArtifact(artifactId);
      alert('Artifact deleted successfully!');
      loadData();
    } catch (err: any) {
      alert(`Failed to delete artifact: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="artifact-list-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading artifacts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="artifact-list-page">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Artifacts</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={loadData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="artifact-list-page">
      <div className="page-header">
        <div className="header-left">
          <h1>📿 Artifact Management</h1>
          <p>Manage temple artifacts and their content</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/artifacts/new')}>
          ➕ Add New Artifact
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">📿</div>
          <div className="stat-content">
            <div className="stat-value">{artifacts.length}</div>
            <div className="stat-label">Total Artifacts</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{activeCount}</div>
            <div className="stat-label">Active</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📱</div>
          <div className="stat-content">
            <div className="stat-value">{totalScans.toLocaleString()}</div>
            <div className="stat-label">Total Scans</div>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search artifacts by name, temple, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          <select value={filterTemple} onChange={(e) => setFilterTemple(e.target.value)}>
            <option value="all">All Temples</option>
            {temples.map(temple => (
              <option key={temple.templeId} value={temple.templeId}>
                {temple.name}
              </option>
            ))}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="Architecture">Architecture</option>
            <option value="Sculpture">Sculpture</option>
            <option value="Deity">Deity</option>
            <option value="Painting">Painting</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="artifacts-table">
        <table>
          <thead>
            <tr>
              <th>Artifact</th>
              <th>Temple</th>
              <th>Type</th>
              <th>QR Code</th>
              <th>Content</th>
              <th>Scans</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredArtifacts.map((artifact) => (
              <tr key={artifact.artifactId}>
                <td>
                  <div className="artifact-name">
                    <strong>{artifact.name}</strong>
                    <small>{artifact.description}</small>
                  </div>
                </td>
                <td>{artifact.temple}</td>
                <td>
                  <span className="type-badge">{artifact.type || 'General'}</span>
                </td>
                <td>
                  <div className="qr-code-cell">
                    <code>{artifact.qrCodeId}</code>
                    <button
                      className="btn-icon-small"
                      title="Download QR"
                      onClick={() => handleGenerateQR(artifact.artifactId)}
                    >
                      📥
                    </button>
                  </div>
                </td>
                <td>
                  <div className="content-indicators">
                    {artifact.hasAudio && <span title="Audio available">🔊</span>}
                    {artifact.hasVideo && <span title="Video available">🎥</span>}
                    {artifact.languages && artifact.languages.length > 0 && (
                      <span title={artifact.languages.join(', ')}>
                        🌐 {artifact.languages.length}
                      </span>
                    )}
                    {!artifact.hasAudio && !artifact.hasVideo && (
                      <span className="no-content">No content</span>
                    )}
                  </div>
                </td>
                <td>{artifact.scans || 0}</td>
                <td>
                  <span className={getStatusBadgeClass(artifact.status)}>
                    {artifact.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-icon"
                      title="Edit"
                      onClick={() => navigate(`/artifacts/${artifact.artifactId}/edit`)}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon"
                      title="Generate Content"
                      onClick={() => handleGenerateContent(artifact.artifactId)}
                    >
                      🤖
                    </button>
                    <button
                      className="btn-icon"
                      title="Delete"
                      onClick={() => handleDelete(artifact.artifactId, artifact.name)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredArtifacts.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No artifacts found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default ArtifactListPage;
