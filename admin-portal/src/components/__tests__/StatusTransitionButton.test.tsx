/**
 * Unit tests for StatusTransitionButton component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatusTransitionButton } from '../StatusTransitionButton';

describe('StatusTransitionButton', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  describe('Rendering', () => {
    it('should render button with correct text', () => {
      render(
        <StatusTransitionButton
          currentStatus="New"
          targetStatus="Acknowledged"
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Mark as Acknowledged');
    });

    it('should format status text with spaces', () => {
      render(
        <StatusTransitionButton
          currentStatus="Acknowledged"
          targetStatus="In_Progress"
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Mark as In Progress');
    });

    it('should show loading text when loading', () => {
      render(
        <StatusTransitionButton
          currentStatus="New"
          targetStatus="Acknowledged"
          onClick={mockOnClick}
          loading={true}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Updating...');
    });
  });

  describe('Click Handling', () => {
    it('should call onClick with target status when clicked', () => {
      render(
        <StatusTransitionButton
          currentStatus="New"
          targetStatus="Acknowledged"
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockOnClick).toHaveBeenCalledWith('Acknowledged');
    });

    it('should not call onClick when loading', () => {
      render(
        <StatusTransitionButton
          currentStatus="New"
          targetStatus="Acknowledged"
          onClick={mockOnClick}
          loading={true}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when disabled', () => {
      render(
        <StatusTransitionButton
          currentStatus="New"
          targetStatus="Acknowledged"
          onClick={mockOnClick}
          disabled={true}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Color Mapping', () => {
    it('should apply blue color for New target status', () => {
      render(
        <StatusTransitionButton
          currentStatus="Closed"
          targetStatus="New"
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ backgroundColor: '#3b82f6' });
    });

    it('should apply purple color for Acknowledged target status', () => {
      render(
        <StatusTransitionButton
          currentStatus="New"
          targetStatus="Acknowledged"
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ backgroundColor: '#8b5cf6' });
    });

    it('should apply orange color for In_Progress target status', () => {
      render(
        <StatusTransitionButton
          currentStatus="Acknowledged"
          targetStatus="In_Progress"
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ backgroundColor: '#f59e0b' });
    });

    it('should apply green color for Resolved target status', () => {
      render(
        <StatusTransitionButton
          currentStatus="In_Progress"
          targetStatus="Resolved"
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ backgroundColor: '#10b981' });
    });

    it('should apply gray color for Closed target status', () => {
      render(
        <StatusTransitionButton
          currentStatus="Resolved"
          targetStatus="Closed"
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ backgroundColor: '#6b7280' });
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when loading', () => {
      render(
        <StatusTransitionButton
          currentStatus="New"
          targetStatus="Acknowledged"
          onClick={mockOnClick}
          loading={true}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <StatusTransitionButton
          currentStatus="New"
          targetStatus="Acknowledged"
          onClick={mockOnClick}
          disabled={true}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should apply reduced opacity when disabled', () => {
      render(
        <StatusTransitionButton
          currentStatus="New"
          targetStatus="Acknowledged"
          onClick={mockOnClick}
          disabled={true}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ opacity: 0.5 });
    });

    it('should have not-allowed cursor when disabled', () => {
      render(
        <StatusTransitionButton
          currentStatus="New"
          targetStatus="Acknowledged"
          onClick={mockOnClick}
          disabled={true}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ cursor: 'not-allowed' });
    });
  });

  describe('CSS Classes', () => {
    it('should apply base CSS class', () => {
      render(
        <StatusTransitionButton
          currentStatus="New"
          targetStatus="Acknowledged"
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('status-transition-button');
    });

    it('should apply custom CSS class', () => {
      render(
        <StatusTransitionButton
          currentStatus="New"
          targetStatus="Acknowledged"
          onClick={mockOnClick}
          className="custom-class"
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive aria-label', () => {
      render(
        <StatusTransitionButton
          currentStatus="New"
          targetStatus="Acknowledged"
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-label',
        'Change status from New to Acknowledged'
      );
    });

    it('should have aria-busy when loading', () => {
      render(
        <StatusTransitionButton
          currentStatus="New"
          targetStatus="Acknowledged"
          onClick={mockOnClick}
          loading={true}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should not have aria-busy when not loading', () => {
      render(
        <StatusTransitionButton
          currentStatus="New"
          targetStatus="Acknowledged"
          onClick={mockOnClick}
          loading={false}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'false');
    });
  });

  describe('Hover Effects', () => {
    it('should change color on mouse enter', () => {
      render(
        <StatusTransitionButton
          currentStatus="New"
          targetStatus="Acknowledged"
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      const originalColor = '#8b5cf6'; // Purple
      const hoverColor = '#7c3aed'; // Darker purple
      
      expect(button).toHaveStyle({ backgroundColor: originalColor });
      
      fireEvent.mouseEnter(button);
      expect(button).toHaveStyle({ backgroundColor: hoverColor });
    });

    it('should restore color on mouse leave', () => {
      render(
        <StatusTransitionButton
          currentStatus="New"
          targetStatus="Acknowledged"
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      const originalColor = '#8b5cf6'; // Purple
      
      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);
      
      expect(button).toHaveStyle({ backgroundColor: originalColor });
    });

    it('should not change color on hover when disabled', () => {
      render(
        <StatusTransitionButton
          currentStatus="New"
          targetStatus="Acknowledged"
          onClick={mockOnClick}
          disabled={true}
        />
      );
      
      const button = screen.getByRole('button');
      const originalColor = '#8b5cf6'; // Purple
      
      fireEvent.mouseEnter(button);
      expect(button).toHaveStyle({ backgroundColor: originalColor });
    });
  });
});
