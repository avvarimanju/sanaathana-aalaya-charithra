/**
 * MetricsPanel Component
 * Feature: real-time-reports-dashboard
 * Task: 13.2
 * 
 * Displays aggregated metrics with star ratings and sentiment distribution
 * 
 * Validates: Requirements 1.2, 1.3, 1.4, 4.3, 4.5, 5.2, 5.3, 5.4
 */

import React from 'react';
import { AggregatedMetrics } from '../../types';

interface MetricsPanelProps {
  metrics: AggregatedMetrics;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="star full">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
    }

    return stars;
  };

  const isEmpty = metrics.totalReviews === 0 && metrics.totalComments === 0;

  if (isEmpty) {
    return (
      <div className="metrics-panel empty">
        <p>No data available for the selected filters</p>
      </div>
    );
  }

  return (
    <div className="metrics-panel">
      <div className="metric-card">
        <h3>Average Rating</h3>
        <div className="rating-display">
          <div className="stars">{renderStars(metrics.averageRating)}</div>
          <div className="rating-value">{metrics.averageRating.toFixed(2)}</div>
        </div>
      </div>

      <div className="metric-card">
        <h3>Total Reviews</h3>
        <div className="metric-value">{metrics.totalReviews.toLocaleString()}</div>
      </div>

      <div className="metric-card">
        <h3>Total Comments</h3>
        <div className="metric-value">{metrics.totalComments.toLocaleString()}</div>
      </div>

      <div className="metric-card sentiment">
        <h3>Sentiment Distribution</h3>
        <div className="sentiment-bars">
          <div className="sentiment-bar positive">
            <span className="label">Positive</span>
            <div className="bar" style={{ width: `${metrics.sentimentDistribution.positive}%` }} />
            <span className="value">{metrics.sentimentDistribution.positive.toFixed(1)}%</span>
          </div>
          <div className="sentiment-bar neutral">
            <span className="label">Neutral</span>
            <div className="bar" style={{ width: `${metrics.sentimentDistribution.neutral}%` }} />
            <span className="value">{metrics.sentimentDistribution.neutral.toFixed(1)}%</span>
          </div>
          <div className="sentiment-bar negative">
            <span className="label">Negative</span>
            <div className="bar" style={{ width: `${metrics.sentimentDistribution.negative}%` }} />
            <span className="value">{metrics.sentimentDistribution.negative.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
