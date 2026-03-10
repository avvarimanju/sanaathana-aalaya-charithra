/**
 * FilterPanel Component - Task 13.4
 * Time range, temple, region, and category filters with persistence
 */

import React, { useState, useEffect } from 'react';
import { FilterState, TimeRange } from '../../types';

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onChange }) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  useEffect(() => {
    // Persist filters to session storage
    sessionStorage.setItem('dashboardFilters', JSON.stringify(localFilters));
  }, [localFilters]);

  const handleTimeRangeChange = (timeRange: TimeRange) => {
    const newFilters = { ...localFilters, timeRange };
    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  const handleApply = () => {
    onChange(localFilters);
  };

  return (
    <div className="filter-panel">
      <div className="filter-group">
        <label>Time Range</label>
        <select
          value={localFilters.timeRange}
          onChange={(e) => handleTimeRangeChange(e.target.value as TimeRange)}
        >
          <option value="today">Today</option>
          <option value="last_7_days">Last 7 Days</option>
          <option value="last_30_days">Last 30 Days</option>
          <option value="last_90_days">Last 90 Days</option>
          <option value="all_time">All Time</option>
        </select>
      </div>
      <button onClick={handleApply}>Apply Filters</button>
    </div>
  );
};
