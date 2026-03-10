/**
 * ExportPanel Component - Task 13.6
 * Export button with format selection and download handling
 */

import React, { useState } from 'react';
import { DashboardApiClient } from '../services/DashboardApiClient';
import { FilterState, ExportFormat } from '../../types';

interface ExportPanelProps {
  apiClient: DashboardApiClient;
  filters: FilterState;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ apiClient, filters }) => {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.exportData(filters, format);
      
      // Poll for completion or provide download link
      alert(`Export started. Job ID: ${result.jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-panel">
      <h3>Export Data</h3>
      <div className="export-controls">
        <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
          <option value="csv">CSV</option>
          <option value="pdf">PDF</option>
        </select>
        <button onClick={handleExport} disabled={loading}>
          {loading ? 'Exporting...' : 'Export'}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
};
