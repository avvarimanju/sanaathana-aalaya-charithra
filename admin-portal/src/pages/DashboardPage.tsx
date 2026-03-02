import React from 'react';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  // Mock data - in production, fetch from API
  const stats = {
    temples: 25,
    artifacts: 150,
    qrScans: 1250,
    activeUsers: 450,
  };

  const recentActivity = [
    { id: 1, action: 'New artifact added', item: 'Hanging Pillar', time: '2 hours ago' },
    { id: 2, action: 'Content generated', item: 'Audio Guide - Lepakshi', time: '5 hours ago' },
    { id: 3, action: 'Temple updated', item: 'Tirumala Temple', time: '1 day ago' },
    { id: 4, action: 'QR Code scanned', item: 'Monolithic Nandi', time: '1 day ago' },
  ];

  const topArtifacts = [
    { name: 'Hanging Pillar', scans: 245, temple: 'Lepakshi' },
    { name: 'Monolithic Nandi', scans: 198, temple: 'Lepakshi' },
    { name: 'Golden Gopuram', scans: 187, temple: 'Tirumala' },
    { name: 'Vayu Linga', scans: 156, temple: 'Sri Kalahasti' },
  ];

  return (
    <div className="dashboard-page">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🛕</div>
          <div className="stat-info">
            <h3>{stats.temples}</h3>
            <p>Total Temples</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🗿</div>
          <div className="stat-info">
            <h3>{stats.artifacts}</h3>
            <p>Total Artifacts</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📱</div>
          <div className="stat-info">
            <h3>{stats.qrScans}</h3>
            <p>QR Scans (30 days)</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.activeUsers}</h3>
            <p>Active Users</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-info">
                  <strong>{activity.action}</strong>
                  <span className="activity-item-name">{activity.item}</span>
                </div>
                <span className="activity-time">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Top Artifacts</h2>
          <div className="top-artifacts-list">
            {topArtifacts.map((artifact, index) => (
              <div key={index} className="artifact-item">
                <div className="artifact-rank">{index + 1}</div>
                <div className="artifact-info">
                  <strong>{artifact.name}</strong>
                  <span className="artifact-temple">{artifact.temple}</span>
                </div>
                <div className="artifact-scans">{artifact.scans} scans</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-btn">➕ Add Temple</button>
          <button className="action-btn">🗿 Add Artifact</button>
          <button className="action-btn">✨ Generate Content</button>
          <button className="action-btn">📊 View Analytics</button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
