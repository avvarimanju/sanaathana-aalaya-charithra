/**
 * Date formatting utilities for consistent date display across the mobile application
 */

/**
 * Formats a date string or Date object to "DD-MMM-YYYY" format
 * Example: "31-Mar-2026"
 * 
 * @param date - Date string (ISO format) or Date object
 * @returns Formatted date string in "DD-MMM-YYYY" format
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  
  return `${day}-${month}-${year}`;
};

/**
 * Formats a date string or Date object to "DD-MMM-YYYY HH:MM" format
 * Example: "31-Mar-2026 14:30"
 * 
 * @param date - Date string (ISO format) or Date object
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  const dateStr = formatDate(dateObj);
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  return `${dateStr} ${hours}:${minutes}`;
};

/**
 * Formats a date to relative time (e.g., "2 days ago", "just now")
 * Falls back to DD-MMM-YYYY format for dates older than 7 days
 * 
 * @param date - Date string (ISO format) or Date object
 * @returns Relative time string or formatted date
 */
export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  
  // For dates older than 7 days, show formatted date
  return formatDate(dateObj);
};

/**
 * Formats a date for timeline display
 * Shows relative time for recent dates, formatted date for older dates
 * 
 * @param date - Date string (ISO format) or Date object
 * @returns Timeline-friendly date string
 */
export const formatTimelineDate = (date: string | Date): string => {
  return formatRelativeTime(date);
};
