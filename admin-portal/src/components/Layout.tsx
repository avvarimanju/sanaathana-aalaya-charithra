import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../auth';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/temples', label: 'Temples', icon: '🛕' },
    { path: '/artifacts', label: 'Artifacts', icon: '🗿' },
    { path: '/states', label: 'State Management', icon: '🗺️' },
    { path: '/pricing', label: 'Pricing', icon: '💰' },
    { path: '/price-calculator', label: 'Price Calculator', icon: '🧮' },
    { path: '/content', label: 'Content Generation', icon: '✨' },
    { path: '/users', label: 'User Management', icon: '👥' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/defects', label: 'Defects', icon: '🐛' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>🛕 Sanaathana Aalaya</h2>
          <p>Admin Portal</p>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="top-header">
          <h1>{menuItems.find(item => item.path === location.pathname)?.label || 'Admin'}</h1>
          <div className="user-info">
            <span>👤 Admin User</span>
          </div>
        </header>
        
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
