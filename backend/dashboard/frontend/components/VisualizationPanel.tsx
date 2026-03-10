/**
 * VisualizationPanel Component
 * Feature: real-time-reports-dashboard
 * Task: 13.3
 * 
 * Displays charts for rating trends, sentiment distribution, and reviews by temple
 * Uses Recharts library for visualizations
 * 
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */

import React from 'react';
import {
  LineChart, Line, PieChart, Pie, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer
} from 'recharts';
import { VisualizationData } from '../../types';

interface VisualizationPanelProps {
  visualizations: VisualizationData;
}

const SENTIMENT_COLORS = {
  positive: '#4CAF50',
  neutral: '#FFC107',
  negative: '#F44336'
};

export const VisualizationPanel: React.FC<VisualizationPanelProps> = ({ visualizations }) => {
  // Prepare sentiment pie chart data
  const sentimentData = [
    { name: 'Positive', value: visualizations.sentimentPie.positive, color: SENTIMENT_COLORS.positive },
    { name: 'Neutral', value: visualizations.sentimentPie.neutral, color: SENTIMENT_COLORS.neutral },
    { name: 'Negative', value: visualizations.sentimentPie.negative, color: SENTIMENT_COLORS.negative }
  ];

  return (
    <div className="visualization-panel">
      <div className="chart-container">
        <h3>Rating Trend Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={visualizations.ratingTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis domain={[0, 5]} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2196F3"
              strokeWidth={2}
              name="Average Rating"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h3>Sentiment Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={sentimentData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={(entry) => `${entry.name}: ${entry.value.toFixed(1)}%`}
            >
              {sentimentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h3>Reviews by Temple</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={visualizations.reviewsByTemple}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#9C27B0" name="Review Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h3>Rating Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={visualizations.ratingHistogram}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bin" label={{ value: 'Rating', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#FF9800" name="Number of Reviews" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
