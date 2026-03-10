import React, { useState, useEffect } from 'react';
import './ContentGenerationPage.css';
import { getContentJobs, generateContent, updateContentJob, deleteContentJob, ContentJob } from '../api/contentApi';
import { getArtifacts } from '../api/templeApi';

interface ContentSource {
  id: string;
  name: string;
  category: string;
  selected: boolean;
}

const ContentGenerationPage: React.FC = () => {
  const [selectedArtifact, setSelectedArtifact] = useState('');
  const [contentType, setContentType] = useState('audio');
  const [language, setLanguage] = useState('english');
  const [sources, setSources] = useState<ContentSource[]>([
    { id: '1', name: 'Archaeological Survey of India (ASI)', category: 'Government', selected: true },
    { id: '2', name: 'Tirumala Tirupati Devasthanams (TTD)', category: 'Temple Authority', selected: true },
    { id: '3', name: 'Andhra Pradesh State Archaeology', category: 'Government', selected: false },
    { id: '4', name: 'Karnataka State Archaeology', category: 'Government', selected: false },
    { id: '5', name: 'Agama Shastras', category: 'Religious Text', selected: true },
    { id: '6', name: 'Sthala Puranas', category: 'Religious Text', selected: false },
    { id: '7', name: 'Vijayanagara Research Project', category: 'Academic', selected: false },
  ]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'generate' | 'jobs'>('generate');
  
  // API state
  const [jobs, setJobs] = useState<ContentJob[]>([]);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Fetch artifacts on mount
  useEffect(() => {
    fetchArtifacts();
  }, []);

  // Fetch jobs when jobs tab is active
  useEffect(() => {
    if (activeTab === 'jobs') {
      fetchJobs();
    }
  }, [activeTab]);

  const fetchArtifacts = async () => {
    try {
      setLoading(true);
      const response = await getArtifacts();
      setArtifacts(response.items);
      setError(null);
    } catch (err) {
      setError('Failed to load artifacts');
      console.error('Error fetching artifacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await getContentJobs();
      setJobs(response.items);
      setError(null);
    } catch (err) {
      setError('Failed to load content jobs');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSource = (sourceId: string) => {
    setSources(sources.map(s => 
      s.id === sourceId ? { ...s, selected: !s.selected } : s
    ));
  };

  const handleGenerate = async () => {
    const selectedSources = sources.filter(s => s.selected);
    if (!selectedArtifact) {
      alert('Please select an artifact');
      return;
    }
    if (selectedSources.length === 0) {
      alert('Please select at least one source');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      await generateContent({
        artifactId: selectedArtifact,
        contentType,
        language,
        sources: selectedSources.map(s => s.name),
        customPrompt: customPrompt || undefined
      });

      alert('Content generation started! Check the Jobs tab to monitor progress.');
      setActiveTab('jobs');
      
      // Reset form
      setSelectedArtifact('');
      setCustomPrompt('');
      
      // Refresh jobs list
      await fetchJobs();
    } catch (err) {
      setError('Failed to start content generation');
      console.error('Error generating content:', err);
      alert('Failed to start content generation. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) {
      return;
    }

    try {
      await deleteContentJob(jobId);
      await fetchJobs();
    } catch (err) {
      console.error('Error deleting job:', err);
      alert('Failed to delete job');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'status-badge completed';
      case 'processing': return 'status-badge processing';
      case 'failed': return 'status-badge failed';
      case 'pending': return 'status-badge pending';
      default: return 'status-badge';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="content-generation-page">
      <div className="page-header">
        <div className="header-left">
          <h1>🤖 AI Content Generation</h1>
          <p>Generate audio guides, videos, and content using trusted sources</p>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          ✨ Generate Content
        </button>
        <button
          className={`tab ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          📊 Generation Jobs ({jobs.length})
        </button>
      </div>

      {activeTab === 'generate' && (
        <div className="generation-form">
          <div className="form-section">
            <h2>1. Select Artifact</h2>
            {loading ? (
              <p>Loading artifacts...</p>
            ) : (
              <select
                value={selectedArtifact}
                onChange={(e) => setSelectedArtifact(e.target.value)}
                className="form-select"
                disabled={generating}
              >
                <option value="">Choose an artifact...</option>
                {artifacts.map((artifact) => (
                  <option key={artifact.artifactId} value={artifact.artifactId}>
                    {artifact.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-section">
            <h2>2. Content Type & Language</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Content Type</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="form-select"
                  disabled={generating}
                >
                  <option value="audio">🔊 Audio Guide</option>
                  <option value="video">🎥 Video Script</option>
                  <option value="infographic">📊 Infographic Content</option>
                  <option value="qa">❓ Q&A Content</option>
                </select>
              </div>
              <div className="form-group">
                <label>Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="form-select"
                  disabled={generating}
                >
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                  <option value="telugu">Telugu</option>
                  <option value="sanskrit">Sanskrit (संस्कृतम्)</option>
                  <option value="bengali">Bengali</option>
                  <option value="gujarati">Gujarati</option>
                  <option value="kannada">Kannada</option>
                  <option value="malayalam">Malayalam</option>
                  <option value="marathi">Marathi</option>
                  <option value="punjabi">Punjabi</option>
                  <option value="tamil">Tamil</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>3. Select Trusted Sources</h2>
            <p className="section-description">
              Choose the sources that AI should use to generate content. All sources are verified and trusted.
            </p>
            <div className="sources-grid">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className={`source-card ${source.selected ? 'selected' : ''}`}
                  onClick={() => !generating && toggleSource(source.id)}
                >
                  <div className="source-checkbox">
                    {source.selected ? '✅' : '⬜'}
                  </div>
                  <div className="source-info">
                    <div className="source-name">{source.name}</div>
                    <div className="source-category">{source.category}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="sources-summary">
              {sources.filter(s => s.selected).length} sources selected
            </div>
          </div>

          <div className="form-section">
            <h2>4. Custom Instructions (Optional)</h2>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Add any specific instructions for content generation...&#10;Example: Focus on architectural details, Include historical context from 14th century, Mention the Vijayanagara empire..."
              className="form-textarea"
              rows={4}
              disabled={generating}
            />
          </div>

          <div className="form-actions">
            <button className="btn-secondary" disabled={generating}>Save as Draft</button>
            <button 
              className="btn-primary" 
              onClick={handleGenerate}
              disabled={generating || !selectedArtifact}
            >
              {generating ? '⏳ Generating...' : '🚀 Generate'}
            </button>
          </div>

          <div className="info-box">
            <h3>ℹ️ How It Works</h3>
            <ol>
              <li>Select the artifact you want to create content for</li>
              <li>Choose content type (audio, video, etc.) and language</li>
              <li>Select trusted sources - AI will only use information from these sources</li>
              <li>Add custom instructions if needed</li>
              <li>Click Generate - AI will create content with proper citations</li>
              <li>Review and approve the generated content before publishing</li>
            </ol>
          </div>
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="jobs-section">
          <div className="section-header">
            <h2>Generation Jobs</h2>
            <p>Monitor the status of content generation tasks</p>
          </div>

          {loading ? (
            <div className="loading-state">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <p>No content generation jobs yet.</p>
              <p>Create your first job in the Generate tab.</p>
            </div>
          ) : (
            <div className="jobs-table">
              <table>
                <thead>
                  <tr>
                    <th>Artifact ID</th>
                    <th>Content Type</th>
                    <th>Language</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.jobId}>
                      <td>{job.artifactId}</td>
                      <td>{job.contentType}</td>
                      <td>{job.language}</td>
                      <td>
                        <span className={getStatusBadgeClass(job.status)}>
                          {job.status.toUpperCase()}
                        </span>
                        {job.error && (
                          <div className="error-message">{job.error}</div>
                        )}
                      </td>
                      <td>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="progress-text">{job.progress}%</span>
                      </td>
                      <td>{formatDate(job.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          {job.status === 'completed' && (
                            <>
                              <button className="btn-icon" title="View">👁️</button>
                              <button className="btn-icon" title="Download">📥</button>
                            </>
                          )}
                          {job.status === 'processing' && (
                            <button className="btn-icon" title="Cancel">🚫</button>
                          )}
                          {job.status === 'failed' && (
                            <button className="btn-icon" title="Retry">🔄</button>
                          )}
                          <button 
                            className="btn-icon" 
                            title="Delete"
                            onClick={() => handleDeleteJob(job.jobId)}
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
          )}
        </div>
      )}
    </div>
  );
};

export default ContentGenerationPage;
