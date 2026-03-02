import React, { useState, useEffect } from 'react';
import './UserManagementPage.css';
import { 
  getAdminUsers, 
  getMobileUsers, 
  createAdminUser, 
  updateAdminUser, 
  deleteAdminUser,
  updateMobileUserStatus,
  AdminUser,
  MobileUser
} from '../api/userApi';

const UserManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'admin' | 'mobile'>('admin');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // API state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [mobileUsers, setMobileUsers] = useState<MobileUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'moderator' | 'viewer'>('viewer');

  // Fetch users on mount and tab change
  useEffect(() => {
    if (activeTab === 'admin') {
      fetchAdminUsers();
    } else {
      fetchMobileUsers();
    }
  }, [activeTab]);

  const fetchAdminUsers = async () => {
    try {
      setLoading(true);
      const response = await getAdminUsers({ search: searchTerm || undefined });
      setAdminUsers(response.items);
      setError(null);
    } catch (err) {
      setError('Failed to load admin users');
      console.error('Error fetching admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMobileUsers = async () => {
    try {
      setLoading(true);
      const response = await getMobileUsers({ search: searchTerm || undefined });
      setMobileUsers(response.items);
      setError(null);
    } catch (err) {
      setError('Failed to load mobile users');
      console.error('Error fetching mobile users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (activeTab === 'admin') {
      fetchAdminUsers();
    } else {
      fetchMobileUsers();
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserName || !newUserEmail) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await createAdminUser({
        name: newUserName,
        email: newUserEmail,
        role: newUserRole
      });
      
      alert('User created successfully!');
      setShowAddModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('viewer');
      
      await fetchAdminUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      alert('Failed to create user. Please try again.');
    }
  };

  const handleSuspendAdminUser = async (userId: string) => {
    try {
      await updateAdminUser(userId, { status: 'suspended' });
      await fetchAdminUsers();
    } catch (err) {
      console.error('Error suspending user:', err);
      alert('Failed to suspend user');
    }
  };

  const handleActivateAdminUser = async (userId: string) => {
    try {
      await updateAdminUser(userId, { status: 'active' });
      await fetchAdminUsers();
    } catch (err) {
      console.error('Error activating user:', err);
      alert('Failed to activate user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await deleteAdminUser(userId);
      await fetchAdminUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  };

  const handleSuspendMobileUser = async (userId: string) => {
    try {
      await updateMobileUserStatus(userId, 'suspended');
      await fetchMobileUsers();
    } catch (err) {
      console.error('Error suspending mobile user:', err);
      alert('Failed to suspend user');
    }
  };

  const handleActivateMobileUser = async (userId: string) => {
    try {
      await updateMobileUserStatus(userId, 'active');
      await fetchMobileUsers();
    } catch (err) {
      console.error('Error activating mobile user:', err);
      alert('Failed to activate user');
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'role-badge admin';
      case 'moderator':
        return 'role-badge moderator';
      case 'viewer':
        return 'role-badge viewer';
      default:
        return 'role-badge';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    return status === 'active' ? 'status-badge active' : 'status-badge suspended';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="user-management-page">
      <div className="page-header">
        <div className="header-left">
          <h1>User Management (IAM)</h1>
          <p>Manage admin users and mobile app users</p>
        </div>
        <div className="header-actions">
          {activeTab === 'admin' && (
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              ➕ Add Dashboard User
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin')}
        >
          👤 Admin Users ({adminUsers.length})
        </button>
        <button
          className={`tab ${activeTab === 'mobile' ? 'active' : ''}`}
          onClick={() => setActiveTab('mobile')}
        >
          📱 Mobile Users ({mobileUsers.length})
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch}>🔍 Search</button>
      </div>

      {activeTab === 'admin' && (
        <div className="users-section">
          <div className="section-header">
            <h2>Admin Users</h2>
            <p>Users with access to this admin dashboard</p>
          </div>

          {loading ? (
            <div className="loading-state">Loading admin users...</div>
          ) : adminUsers.length === 0 ? (
            <div className="empty-state">
              <p>No admin users found.</p>
            </div>
          ) : (
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((user) => (
                    <tr key={user.userId}>
                      <td>
                        <div className="user-name">
                          <div className="user-avatar">{user.name.charAt(0)}</div>
                          {user.name}
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={getRoleBadgeClass(user.role)}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(user.status)}>
                          {user.status.toUpperCase()}
                        </span>
                      </td>
                      <td>{formatDate(user.lastLogin)}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          {user.status === 'active' ? (
                            <button
                              className="btn-icon"
                              title="Suspend"
                              onClick={() => handleSuspendAdminUser(user.userId)}
                            >
                              🚫
                            </button>
                          ) : (
                            <button
                              className="btn-icon"
                              title="Activate"
                              onClick={() => handleActivateAdminUser(user.userId)}
                            >
                              ✅
                            </button>
                          )}
                          <button
                            className="btn-icon danger"
                            title="Delete"
                            onClick={() => handleDeleteUser(user.userId)}
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

          <div className="permissions-info">
            <h3>Role Permissions</h3>
            <div className="permissions-grid">
              <div className="permission-card">
                <h4>👑 Admin</h4>
                <ul>
                  <li>Full system access</li>
                  <li>Manage all users</li>
                  <li>Configure system settings</li>
                  <li>View all analytics</li>
                </ul>
              </div>
              <div className="permission-card">
                <h4>🛡️ Moderator</h4>
                <ul>
                  <li>Manage content</li>
                  <li>Review AI-generated content</li>
                  <li>Manage temples & artifacts</li>
                  <li>View analytics</li>
                </ul>
              </div>
              <div className="permission-card">
                <h4>👁️ Viewer</h4>
                <ul>
                  <li>View-only access</li>
                  <li>View analytics</li>
                  <li>Export reports</li>
                  <li>No edit permissions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'mobile' && (
        <div className="users-section">
          <div className="section-header">
            <h2>Mobile App Users</h2>
            <p>Users of the Sanaathana Aalaya Charithra mobile application</p>
          </div>

          {loading ? (
            <div className="loading-state">Loading mobile users...</div>
          ) : mobileUsers.length === 0 ? (
            <div className="empty-state">
              <p>No mobile users yet.</p>
              <p>Users will appear here after they register through the mobile app.</p>
            </div>
          ) : (
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>QR Scans</th>
                    <th>Last Active</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mobileUsers.map((user) => (
                    <tr key={user.userId}>
                      <td>
                        <div className="user-name">
                          <div className="user-avatar">{user.name.charAt(0)}</div>
                          {user.name}
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={getStatusBadgeClass(user.status)}>
                          {user.status.toUpperCase()}
                        </span>
                      </td>
                      <td>{user.qrScans || 0}</td>
                      <td>{user.lastActive || 'N/A'}</td>
                      <td>{formatDate(user.joinedDate)}</td>
                      <td>
                        <div className="action-buttons">
                          {user.status === 'active' ? (
                            <button
                              className="btn-icon"
                              title="Suspend"
                              onClick={() => handleSuspendMobileUser(user.userId)}
                            >
                              🚫
                            </button>
                          ) : (
                            <button
                              className="btn-icon"
                              title="Activate"
                              onClick={() => handleActivateMobileUser(user.userId)}
                            >
                              ✅
                            </button>
                          )}
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

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Dashboard User</h2>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Name *</label>
                <input 
                  type="text" 
                  placeholder="Enter full name" 
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input 
                  type="email" 
                  placeholder="Enter email address" 
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select 
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'moderator' | 'viewer')}
                >
                  <option value="viewer">Viewer</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="iam-info">
        <h3>🔐 IAM Integration</h3>
        <p>
          User authentication and authorization is managed through the backend API.
          Admin users are stored with role-based access control (RBAC).
        </p>
        <div className="iam-features">
          <div className="feature">✅ Role-based permissions</div>
          <div className="feature">✅ User status management</div>
          <div className="feature">✅ Session tracking</div>
          <div className="feature">✅ Audit logging</div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
