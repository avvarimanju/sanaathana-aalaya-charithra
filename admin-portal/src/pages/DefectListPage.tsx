import React, { useState, useEffect } from 'react';
import './DefectListPage.css';
import { 
  getDefects, 
  createDefect, 
  updateDefect, 
  deleteDefect,
  addDefectComment,
  Defect 
} from '../api/defectApi';

const DefectListPage: React.FC = () => {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  
  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<'bug' | 'feature' | 'feedback'>('bug');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchDefects();
  }, [filterStatus, filterPriority, filterType]);

  const fetchDefects = async () => {
    try {
      setLoading(true);
      const response = await getDefects({
        status: filterStatus || undefined,
        priority: filterPriority || undefined,
        type: filterType || undefined
      });
      setDefects(response.items);
      setError(null);
    } catch (err) {
      setError('Failed to load defects');
      console.error('Error fetching defects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDefect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTitle || !newDescription) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await createDefect({
        title: newTitle,
        description: newDescription,
        type: newType,
        priority: newPriority,
        reportedBy: 'admin@local'
      });
      
      alert('Defect created successfully!');
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewType('bug');
      setNewPriority('medium');
      
      await fetchDefects();
    } catch (err) {
      console.error('Error creating defect:', err);
      alert('Failed to create defect. Please try again.');
    }
  };

  const handleUpdateStatus = async (defectId: string, newStatus: string) => {
    try {
      await updateDefect(defectId, { status: newStatus as any });
      await fetchDefects();
    } catch (err) {
      console.error('Error updating defect:', err);
      alert('Failed to update defect status');
    }
  };

  const handleAssign = async (defectId: string) => {
    const assignee = prompt('Enter assignee email:');
    if (!assignee) return;

    try {
      await updateDefect(defectId, { assignedTo: assignee });
      await fetchDefects();
    } catch (err) {
      console.error('Error assigning defect:', err);
      alert('Failed to assign defect');
    }
  };

  const handleAddComment = async (defectId: string) => {
    if (!newComment.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      await addDefectComment(defectId, {
        comment: newComment,
        author: 'admin@local'
      });
      
      setNewComment('');
      alert('Comment added successfully!');
      
      // Refresh the selected defect
      if (selectedDefect && selectedDefect.defectId === defectId) {
        const response = await getDefects();
        const updated = response.items.find(d => d.defectId === defectId);
        if (updated) {
          setSelectedDefect(updated);
        }
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment');
    }
  };

  const handleDeleteDefect = async (defectId: string) => {
    if (!confirm('Are you sure you want to delete this defect?')) {
      return;
    }

    try {
      await deleteDefect(defectId);
      await fetchDefects();
      if (selectedDefect?.defectId === defectId) {
        setSelectedDefect(null);
      }
    } catch (err) {
      console.error('Error deleting defect:', err);
      alert('Failed to delete defect');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'open': return 'status-badge open';
      case 'in-progress': return 'status-badge in-progress';
      case 'resolved': return 'status-badge resolved';
      case 'closed': return 'status-badge closed';
      default: return 'status-badge';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'high': return 'priority-badge high';
      case 'medium': return 'priority-badge medium';
      case 'low': return 'priority-badge low';
      default: return 'priority-badge';
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'bug': return 'type-badge bug';
      case 'feature': return 'type-badge feature';
      case 'feedback': return 'type-badge feedback';
      default: return 'type-badge';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="defect-list-page">
      <div className="page-header">
        <div className="header-left">
          <h1>🐛 Defect Tracking</h1>
          <p>Manage bugs, feature requests, and user feedback</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            ➕ Report Defect
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      <div className="filters">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="bug">Bug</option>
          <option value="feature">Feature Request</option>
          <option value="feedback">Feedback</option>
        </select>
      </div>

      <div className="defects-layout">
        <div className="defects-list">
          {loading ? (
            <div className="loading-state">Loading defects...</div>
          ) : defects.length === 0 ? (
            <div className="empty-state">
              <p>No defects found.</p>
              <p>Create your first defect report to get started.</p>
            </div>
          ) : (
            <div className="defects-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {defects.map((defect) => (
                    <tr 
                      key={defect.defectId}
                      className={selectedDefect?.defectId === defect.defectId ? 'selected' : ''}
                      onClick={() => setSelectedDefect(defect)}
                    >
                      <td>{defect.defectId}</td>
                      <td>{defect.title}</td>
                      <td>
                        <span className={getTypeBadgeClass(defect.type)}>
                          {defect.type.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={getPriorityBadgeClass(defect.priority)}>
                          {defect.priority.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(defect.status)}>
                          {defect.status.toUpperCase()}
                        </span>
                      </td>
                      <td>{defect.assignedTo || 'Unassigned'}</td>
                      <td>{formatDate(defect.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon"
                            title="View Details"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDefect(defect);
                            }}
                          >
                            👁️
                          </button>
                          <button
                            className="btn-icon"
                            title="Delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDefect(defect.defectId);
                            }}
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

        {selectedDefect && (
          <div className="defect-details">
            <div className="details-header">
              <h2>{selectedDefect.title}</h2>
              <button className="btn-close" onClick={() => setSelectedDefect(null)}>✕</button>
            </div>

            <div className="details-badges">
              <span className={getTypeBadgeClass(selectedDefect.type)}>
                {selectedDefect.type.toUpperCase()}
              </span>
              <span className={getPriorityBadgeClass(selectedDefect.priority)}>
                {selectedDefect.priority.toUpperCase()}
              </span>
              <span className={getStatusBadgeClass(selectedDefect.status)}>
                {selectedDefect.status.toUpperCase()}
              </span>
            </div>

            <div className="details-section">
              <h3>Description</h3>
              <p>{selectedDefect.description}</p>
            </div>

            <div className="details-section">
              <h3>Details</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <strong>Reported By:</strong> {selectedDefect.reportedBy}
                </div>
                <div className="detail-item">
                  <strong>Assigned To:</strong> {selectedDefect.assignedTo || 'Unassigned'}
                </div>
                <div className="detail-item">
                  <strong>Created:</strong> {formatDate(selectedDefect.createdAt)}
                </div>
                <div className="detail-item">
                  <strong>Updated:</strong> {formatDate(selectedDefect.updatedAt)}
                </div>
                {selectedDefect.resolvedAt && (
                  <div className="detail-item">
                    <strong>Resolved:</strong> {formatDate(selectedDefect.resolvedAt)}
                  </div>
                )}
              </div>
            </div>

            <div className="details-section">
              <h3>Actions</h3>
              <div className="action-buttons-group">
                {selectedDefect.status === 'open' && (
                  <button 
                    className="btn-secondary"
                    onClick={() => handleUpdateStatus(selectedDefect.defectId, 'in-progress')}
                  >
                    Start Working
                  </button>
                )}
                {selectedDefect.status === 'in-progress' && (
                  <button 
                    className="btn-secondary"
                    onClick={() => handleUpdateStatus(selectedDefect.defectId, 'resolved')}
                  >
                    Mark Resolved
                  </button>
                )}
                {selectedDefect.status === 'resolved' && (
                  <button 
                    className="btn-secondary"
                    onClick={() => handleUpdateStatus(selectedDefect.defectId, 'closed')}
                  >
                    Close Defect
                  </button>
                )}
                <button 
                  className="btn-secondary"
                  onClick={() => handleAssign(selectedDefect.defectId)}
                >
                  Assign
                </button>
              </div>
            </div>

            <div className="details-section">
              <h3>Comments ({selectedDefect.comments.length})</h3>
              <div className="comments-list">
                {selectedDefect.comments.map((comment) => (
                  <div key={comment.commentId} className="comment">
                    <div className="comment-header">
                      <strong>{comment.author}</strong>
                      <span className="comment-date">{formatDate(comment.createdAt)}</span>
                    </div>
                    <div className="comment-body">{comment.comment}</div>
                  </div>
                ))}
              </div>
              
              <div className="add-comment">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                />
                <button 
                  className="btn-primary"
                  onClick={() => handleAddComment(selectedDefect.defectId)}
                >
                  Add Comment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Report Defect</h2>
            <form onSubmit={handleCreateDefect}>
              <div className="form-group">
                <label>Title *</label>
                <input 
                  type="text" 
                  placeholder="Brief description of the issue" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description *</label>
                <textarea 
                  placeholder="Detailed description of the issue, steps to reproduce, expected vs actual behavior..." 
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={5}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Type *</label>
                  <select 
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as 'bug' | 'feature' | 'feedback')}
                  >
                    <option value="bug">🐛 Bug</option>
                    <option value="feature">✨ Feature Request</option>
                    <option value="feedback">💬 Feedback</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Priority *</label>
                  <select 
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Defect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefectListPage;
