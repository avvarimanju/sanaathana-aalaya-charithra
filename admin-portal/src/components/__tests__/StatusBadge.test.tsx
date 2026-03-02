/**
 * Unit tests for StatusBadge component
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatusBadge } from '../StatusBadge';
import { DefectStatus } from '../../api/adminDefectApi';

describe('StatusBadge', () => {
  describe('Rendering', () => {
    it('should render with New status', () => {
      render(<StatusBadge status="New" />);
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('New');
    });

    it('should render with Acknowledged status', () => {
      render(<StatusBadge status="Acknowledged" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Acknowledged');
    });

    it('should render with In_Progress status and format text', () => {
      render(<StatusBadge status="In_Progress" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('In Progress');
    });

    it('should render with Resolved status', () => {
      render(<StatusBadge status="Resolved" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Resolved');
    });

    it('should render with Closed status', () => {
      render(<StatusBadge status="Closed" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Closed');
    });
  });

  describe('Color Mapping', () => {
    it('should apply blue color for New status', () => {
      render(<StatusBadge status="New" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveStyle({ backgroundColor: '#3b82f6' });
    });

    it('should apply purple color for Acknowledged status', () => {
      render(<StatusBadge status="Acknowledged" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveStyle({ backgroundColor: '#8b5cf6' });
    });

    it('should apply orange color for In_Progress status', () => {
      render(<StatusBadge status="In_Progress" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveStyle({ backgroundColor: '#f59e0b' });
    });

    it('should apply green color for Resolved status', () => {
      render(<StatusBadge status="Resolved" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveStyle({ backgroundColor: '#10b981' });
    });

    it('should apply gray color for Closed status', () => {
      render(<StatusBadge status="Closed" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveStyle({ backgroundColor: '#6b7280' });
    });
  });

  describe('Size Variants', () => {
    it('should apply small size styling', () => {
      render(<StatusBadge status="New" size="small" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveStyle({
        padding: '4px 10px',
        fontSize: '11px',
      });
    });

    it('should apply medium size styling by default', () => {
      render(<StatusBadge status="New" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveStyle({
        padding: '6px 14px',
        fontSize: '13px',
      });
    });

    it('should apply large size styling', () => {
      render(<StatusBadge status="New" size="large" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveStyle({
        padding: '8px 18px',
        fontSize: '15px',
      });
    });
  });

  describe('CSS Classes', () => {
    it('should apply base CSS class', () => {
      render(<StatusBadge status="New" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('status-badge');
    });

    it('should apply status-specific CSS class', () => {
      render(<StatusBadge status="In_Progress" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('status-badge-in_progress');
    });

    it('should apply custom CSS class', () => {
      render(<StatusBadge status="New" className="custom-class" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      render(<StatusBadge status="New" />);
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
    });

    it('should have aria-label with formatted status', () => {
      render(<StatusBadge status="In_Progress" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', 'Status: In Progress');
    });

    it('should have aria-label for all statuses', () => {
      const statuses: DefectStatus[] = ['New', 'Acknowledged', 'In_Progress', 'Resolved', 'Closed'];
      
      statuses.forEach((status) => {
        const { unmount } = render(<StatusBadge status={status} />);
        const badge = screen.getByRole('status');
        expect(badge).toHaveAttribute('aria-label');
        unmount();
      });
    });
  });

  describe('Text Formatting', () => {
    it('should replace underscores with spaces', () => {
      render(<StatusBadge status="In_Progress" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('In Progress');
      expect(badge).not.toHaveTextContent('In_Progress');
    });

    it('should capitalize status text', () => {
      render(<StatusBadge status="New" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveStyle({ textTransform: 'capitalize' });
    });
  });
});
