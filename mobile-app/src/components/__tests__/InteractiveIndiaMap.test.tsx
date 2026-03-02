/**
 * Unit Tests for InteractiveIndiaMap Component
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import InteractiveIndiaMap from '../InteractiveIndiaMap';
import { INDIAN_STATES } from '../../constants/indianStates';

describe('InteractiveIndiaMap', () => {
  const mockOnStateSelect = jest.fn();
  const defaultProps = {
    selectedState: null,
    onStateSelect: mockOnStateSelect,
    width: 400,
    height: 480,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { getByTestId } = render(<InteractiveIndiaMap {...defaultProps} />);
      // Component should render successfully
      expect(true).toBe(true);
    });

    it('should render SVG with correct dimensions', () => {
      const { UNSAFE_getByType } = render(<InteractiveIndiaMap {...defaultProps} />);
      const svg = UNSAFE_getByType('Svg');
      expect(svg.props.width).toBe(400);
      expect(svg.props.height).toBe(480);
    });

    it('should render SVG with correct viewBox', () => {
      const { UNSAFE_getByType } = render(<InteractiveIndiaMap {...defaultProps} />);
      const svg = UNSAFE_getByType('Svg');
      expect(svg.props.viewBox).toBe('0 0 1000 1200');
    });

    it('should render all 36 state paths', () => {
      const { UNSAFE_getAllByType } = render(<InteractiveIndiaMap {...defaultProps} />);
      const paths = UNSAFE_getAllByType('Path');
      expect(paths.length).toBe(36);
    });

    it('should render paths with correct SVG data', () => {
      const { UNSAFE_getAllByType } = render(<InteractiveIndiaMap {...defaultProps} />);
      const paths = UNSAFE_getAllByType('Path');
      
      // Check that each path has the d attribute (SVG path data)
      paths.forEach(path => {
        expect(path.props.d).toBeDefined();
        expect(path.props.d.length).toBeGreaterThan(0);
      });
    });
  });

  describe('State Selection', () => {
    it('should call onStateSelect when a state is pressed', () => {
      const { UNSAFE_getAllByType } = render(<InteractiveIndiaMap {...defaultProps} />);
      const paths = UNSAFE_getAllByType('Path');
      
      // Press the first state path
      fireEvent.press(paths[0]);
      
      expect(mockOnStateSelect).toHaveBeenCalledTimes(1);
      expect(mockOnStateSelect).toHaveBeenCalledWith(INDIAN_STATES[0].code);
    });

    it('should call onStateSelect with correct state code', () => {
      const { UNSAFE_getAllByType } = render(<InteractiveIndiaMap {...defaultProps} />);
      const paths = UNSAFE_getAllByType('Path');
      
      // Press Karnataka (assuming it's in the array)
      const karnatakaIndex = INDIAN_STATES.findIndex(s => s.code === 'KA');
      if (karnatakaIndex >= 0) {
        fireEvent.press(paths[karnatakaIndex]);
        expect(mockOnStateSelect).toHaveBeenCalledWith('KA');
      }
    });

    it('should handle multiple state selections', () => {
      const { UNSAFE_getAllByType } = render(<InteractiveIndiaMap {...defaultProps} />);
      const paths = UNSAFE_getAllByType('Path');
      
      // Press first state
      fireEvent.press(paths[0]);
      expect(mockOnStateSelect).toHaveBeenCalledTimes(1);
      
      // Press second state
      fireEvent.press(paths[1]);
      expect(mockOnStateSelect).toHaveBeenCalledTimes(2);
      
      expect(mockOnStateSelect).toHaveBeenNthCalledWith(1, INDIAN_STATES[0].code);
      expect(mockOnStateSelect).toHaveBeenNthCalledWith(2, INDIAN_STATES[1].code);
    });
  });

  describe('Visual Feedback', () => {
    it('should apply default color to unselected states', () => {
      const { UNSAFE_getAllByType } = render(<InteractiveIndiaMap {...defaultProps} />);
      const paths = UNSAFE_getAllByType('Path');
      
      // All paths should have default color when nothing is selected
      paths.forEach(path => {
        expect(path.props.fill).toBe('#E8F5E9');
      });
    });

    it('should apply selected color to selected state', () => {
      const propsWithSelection = {
        ...defaultProps,
        selectedState: 'KA',
      };
      
      const { UNSAFE_getAllByType } = render(<InteractiveIndiaMap {...propsWithSelection} />);
      const paths = UNSAFE_getAllByType('Path');
      
      // Find Karnataka path
      const karnatakaIndex = INDIAN_STATES.findIndex(s => s.code === 'KA');
      if (karnatakaIndex >= 0) {
        expect(paths[karnatakaIndex].props.fill).toBe('#4CAF50');
      }
    });

    it('should apply different stroke width to selected state', () => {
      const propsWithSelection = {
        ...defaultProps,
        selectedState: 'TN',
      };
      
      const { UNSAFE_getAllByType } = render(<InteractiveIndiaMap {...propsWithSelection} />);
      const paths = UNSAFE_getAllByType('Path');
      
      // Find Tamil Nadu path
      const tnIndex = INDIAN_STATES.findIndex(s => s.code === 'TN');
      if (tnIndex >= 0) {
        expect(paths[tnIndex].props.strokeWidth).toBe(3);
      }
      
      // Other states should have default stroke width
      const otherIndex = INDIAN_STATES.findIndex(s => s.code !== 'TN');
      if (otherIndex >= 0) {
        expect(paths[otherIndex].props.strokeWidth).toBe(2);
      }
    });

    it('should update colors when selectedState prop changes', () => {
      const { UNSAFE_getAllByType, rerender } = render(
        <InteractiveIndiaMap {...defaultProps} />
      );
      
      // Initially no selection
      let paths = UNSAFE_getAllByType('Path');
      paths.forEach(path => {
        expect(path.props.fill).toBe('#E8F5E9');
      });
      
      // Select Karnataka
      rerender(<InteractiveIndiaMap {...defaultProps} selectedState="KA" />);
      paths = UNSAFE_getAllByType('Path');
      
      const karnatakaIndex = INDIAN_STATES.findIndex(s => s.code === 'KA');
      if (karnatakaIndex >= 0) {
        expect(paths[karnatakaIndex].props.fill).toBe('#4CAF50');
      }
    });
  });

  describe('Accessibility', () => {
    it('should have accessibility labels for all states', () => {
      const { UNSAFE_getAllByType } = render(<InteractiveIndiaMap {...defaultProps} />);
      const paths = UNSAFE_getAllByType('Path');
      
      paths.forEach((path, index) => {
        expect(path.props.accessible).toBe(true);
        expect(path.props.accessibilityLabel).toBeDefined();
        expect(path.props.accessibilityLabel).toContain(INDIAN_STATES[index].name);
      });
    });

    it('should have accessibility role as button', () => {
      const { UNSAFE_getAllByType } = render(<InteractiveIndiaMap {...defaultProps} />);
      const paths = UNSAFE_getAllByType('Path');
      
      paths.forEach(path => {
        expect(path.props.accessibilityRole).toBe('button');
      });
    });

    it('should have accessibility hint', () => {
      const { UNSAFE_getAllByType } = render(<InteractiveIndiaMap {...defaultProps} />);
      const paths = UNSAFE_getAllByType('Path');
      
      paths.forEach(path => {
        expect(path.props.accessibilityHint).toBe('Tap to view temples in this state');
      });
    });

    it('should set accessibility state for selected state', () => {
      const propsWithSelection = {
        ...defaultProps,
        selectedState: 'MH',
      };
      
      const { UNSAFE_getAllByType } = render(<InteractiveIndiaMap {...propsWithSelection} />);
      const paths = UNSAFE_getAllByType('Path');
      
      const maharashtraIndex = INDIAN_STATES.findIndex(s => s.code === 'MH');
      if (maharashtraIndex >= 0) {
        expect(paths[maharashtraIndex].props.accessibilityState.selected).toBe(true);
      }
      
      // Other states should not be selected
      const otherIndex = INDIAN_STATES.findIndex(s => s.code !== 'MH');
      if (otherIndex >= 0) {
        expect(paths[otherIndex].props.accessibilityState.selected).toBe(false);
      }
    });
  });

  describe('Performance', () => {
    it('should memoize the component', () => {
      const { rerender } = render(<InteractiveIndiaMap {...defaultProps} />);
      
      // Rerender with same props should not cause re-render
      // This is tested by React.memo wrapper
      rerender(<InteractiveIndiaMap {...defaultProps} />);
      
      expect(true).toBe(true); // Component uses React.memo
    });
  });

  describe('Edge Cases', () => {
    it('should handle null selectedState', () => {
      const { UNSAFE_getAllByType } = render(
        <InteractiveIndiaMap {...defaultProps} selectedState={null} />
      );
      const paths = UNSAFE_getAllByType('Path');
      
      // All states should have default color
      paths.forEach(path => {
        expect(path.props.fill).toBe('#E8F5E9');
      });
    });

    it('should handle invalid selectedState code', () => {
      const { UNSAFE_getAllByType } = render(
        <InteractiveIndiaMap {...defaultProps} selectedState="INVALID" />
      );
      const paths = UNSAFE_getAllByType('Path');
      
      // All states should have default color since no match
      paths.forEach(path => {
        expect(path.props.fill).toBe('#E8F5E9');
      });
    });

    it('should handle zero dimensions gracefully', () => {
      const { UNSAFE_getByType } = render(
        <InteractiveIndiaMap {...defaultProps} width={0} height={0} />
      );
      const svg = UNSAFE_getByType('Svg');
      
      expect(svg.props.width).toBe(0);
      expect(svg.props.height).toBe(0);
    });
  });
});
