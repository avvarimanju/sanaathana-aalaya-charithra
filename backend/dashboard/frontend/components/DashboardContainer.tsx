/**
 * DashboardContainer Component
 * Feature: real-time-reports-dashboard
 * Task: 13.1
 * 
 * Main container component for the dashboard
 * Manages state for metrics, filters, and WebSocket connection
 * 
 * Validates: Requirements 1.1, 2.1, 4.1, 5.1, 6.1, 9.1, 9.2, 9.5, 10.5
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  DashboardData,
  FilterState,
  ConnectionStatus,
  AggregatedMetrics,
  Review,
  Comment,
  VisualizationData
} from '../../types';
import { DashboardApiClient } from '../services/DashboardApiClient';
import { WebSocketClient } from '../services/WebSocketClient';
import { MetricsPanel } from './MetricsPanel';
import { VisualizationPanel } from './VisualizationPanel';
import { FilterPanel } from './FilterPanel';
import { ReviewList } from './ReviewList';
import { ExportPanel } from './ExportPanel';

interface DashboardContainerProps {
  apiClient: DashboardApiClient;
  wsClient: WebSocketClient;
  initialFilters?: FilterState;
}

export const DashboardContainer: React.FC<DashboardContainerProps> = ({
  apiClient,
  wsClient,
  initialFilters
}) => {
  // State management
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  
  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
      timeRange: 'last_30_days',
      templeIds: [],
      regions: [],
      categories: []
    }
  );
  
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [visualizations, setVisualizations] = useState<VisualizationData | null>(null);


  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiClient.getDashboardData(filters);
      
      setMetrics(data.metrics);
      setReviews(data.reviews);
      setComments(data.comments);
      setVisualizations(data.visualizations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Dashboard load error', err);
    } finally {
      setLoading(false);
    }
  }, [apiClient, filters]);

  // Initialize dashboard
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // WebSocket connection management
  useEffect(() => {
    // Connect to WebSocket
    wsClient.connect();

    // Set up event listeners
    wsClient.on('connected', () => {
      setConnectionStatus('connected');
      wsClient.subscribe(filters);
    });

    wsClient.on('disconnected', () => {
      setConnectionStatus('disconnected');
    });

    wsClient.on('reconnecting', () => {
      setConnectionStatus('reconnecting');
    });

    wsClient.on('update', (update) => {
      handleRealtimeUpdate(update);
    });

    // Cleanup on unmount
    return () => {
      wsClient.disconnect();
    };
  }, [wsClient, filters]);

  // Handle real-time updates from WebSocket
  const handleRealtimeUpdate = (update: any) => {
    if (update.type === 'metrics') {
      setMetrics(update.data.metrics);
    } else if (update.type === 'new_review') {
      setReviews(prev => [update.data.reviews[0], ...prev]);
      loadDashboardData(); // Refresh all data
    } else if (update.type === 'new_comment') {
      setComments(prev => [update.data.comments[0], ...prev]);
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    wsClient.subscribe(newFilters);
  };

  // Render loading state
  if (loading && !metrics) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Render error state
  if (error && !metrics) {
    return (
      <div className="dashboard-error">
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={loadDashboardData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Real-Time Reports Dashboard</h1>
        <div className="connection-status">
          <span className={`status-indicator ${connectionStatus}`} />
          <span>{connectionStatus}</span>
        </div>
      </header>

      <FilterPanel
        filters={filters}
        onChange={handleFilterChange}
      />

      {metrics && (
        <MetricsPanel metrics={metrics} />
      )}

      {visualizations && (
        <VisualizationPanel visualizations={visualizations} />
      )}

      <div className="dashboard-content">
        <div className="reviews-section">
          <h2>Recent Reviews</h2>
          <ReviewList reviews={reviews} />
        </div>

        <div className="export-section">
          <ExportPanel
            apiClient={apiClient}
            filters={filters}
          />
        </div>
      </div>
    </div>
  );
};
