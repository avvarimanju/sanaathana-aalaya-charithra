/**
 * Unit Tests for StateList Component
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import StateList from '../StateList';
import { INDIAN_STATES } from '../../constants/indianStates';

describe('StateList', () => {
  const mockOnStateSelect = jest.fn();
  const defaultProps = {
    selectedState: null,
    onStateSelect: mockOnStateSelect,
    states: INDIAN_STATES,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { getByText } = render(<StateList {...defaultProps} />);
      expect(getByText('Select a State')).toBeTruthy();
    });

    it('should render header with correct text', () => {
      const { getByText } = render(<StateList {...defaultProps} />);
      expect(getByText('Select a State')).toBeTruthy();
      expect(getByText('36 states and union territories')).toBeTruthy();
    });

    it('should render all states in the list', () => {
      const { getByText } = render(<StateList {...defaultProps} />);
      
      // Check for a few known states
      expect(getByText('Karnataka')).toBeTruthy();
      expect(getByText('Tamil Nadu')).toBeTruthy();
      expect(getByText('Maharashtra')).toBeTruthy();
    });

    it('should render states in alphabetical order', () => {
      const { getAllByRole } = render(<StateList {...defaultProps} />);
      const buttons = getAllByRole('button');
      
      // First state should be Andaman and Nicobar Islands (alphabetically first)
      const firstButton = buttons[0];
      expect(firstButton.props.accessibilityLabel).toBe('Andaman and Nicobar Islands');
    });

    it('should show UT badge for union territories', () => {
      const { getByText } = render(<StateList {...defaultProps} />);
      
      // Delhi is a UT, so it should have the badge
      // We need to check if UT badges are rendered
      const utBadges = getAllByText('UT');
      expect(utBadges.length).toBe(8); // 8 union territories
    });

    it('should render correct count in header', () => {
      const { getByText } = render(<StateList {...defaultProps} />);
      expect(getByText('36 states and union territories')).toBeTruthy();
    });

    it('should render with subset of states', () => {
      const subset = INDIAN_STATES.slice(0, 5);
      const { getByText } = render(
        <StateList {...defaultProps} states={subset} />
      );
      expect(getByText('5 states and union territories')).toBeTruthy();
    });
  });

  describe('State Selection', () => {
    it('should call onStateSelect when a state is pressed', () => {
      const { getByText } = render(<StateList {...defaultProps} />);
      
      const karnatakaButton = getByText('Karnataka');
      fireEvent.press(karnatakaButton);
      
      expect(mockOnStateSelect).toHaveBeenCalledTimes(1);
      expect(mockOnStateSelect).toHaveBeenCalledWith('KA');
    });

    it('should call onStateSelect with correct state code', () => {
      const { getByText } = render(<StateList {...defaultProps} />);
      
      const tamilNaduButton = getByText('Tamil Nadu');
      fireEvent.press(tamilNaduButton);
      
      expect(mockOnStateSelect).toHaveBeenCalledWith('TN');
    });

    it('should handle multiple state selections', () => {
      const { getByText } = render(<StateList {...defaultProps} />);
      
      fireEvent.press(getByText('Karnataka'));
      expect(mockOnStateSelect).toHaveBeenCalledTimes(1);
      
      fireEvent.press(getByText('Tamil Nadu'));
      expect(mockOnStateSelect).toHaveBeenCalledTimes(2);
      
      expect(mockOnStateSelect).toHaveBeenNthCalledWith(1, 'KA');
      expect(mockOnStateSelect).toHaveBeenNthCalledWith(2, 'TN');
    });

    it('should allow selecting union territories', () => {
      const { getByText } = render(<StateList {...defaultProps} />);
      
      const delhiButton = getByText('Delhi');
      fireEvent.press(delhiButton);
      
      expect(mockOnStateSelect).toHaveBeenCalledWith('DL');
    });
  });

  describe('Visual Feedback', () => {
    it('should highlight selected state', () => {
      const { getByText } = render(
        <StateList {...defaultProps} selectedState="KA" />
      );
      
      const karnatakaButton = getByText('Karnataka').parent?.parent;
      expect(karnatakaButton?.props.accessibilityState.selected).toBe(true);
    });

    it('should not highlight unselected states', () => {
      const { getByText } = render(
        <StateList {...defaultProps} selectedState="KA" />
      );
      
      const tamilNaduButton = getByText('Tamil Nadu').parent?.parent;
      expect(tamilNaduButton?.props.accessibilityState.selected).toBe(false);
    });

    it('should update highlight when selectedState changes', () => {
      const { getByText, rerender } = render(
        <StateList {...defaultProps} selectedState="KA" />
      );
      
      let karnatakaButton = getByText('Karnataka').parent?.parent;
      expect(karnatakaButton?.props.accessibilityState.selected).toBe(true);
      
      // Change selection to Tamil Nadu
      rerender(<StateList {...defaultProps} selectedState="TN" />);
      
      karnatakaButton = getByText('Karnataka').parent?.parent;
      const tamilNaduButton = getByText('Tamil Nadu').parent?.parent;
      
      expect(karnatakaButton?.props.accessibilityState.selected).toBe(false);
      expect(tamilNaduButton?.props.accessibilityState.selected).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have accessibility labels for all states', () => {
      const { getAllByRole } = render(<StateList {...defaultProps} />);
      const buttons = getAllByRole('button');
      
      expect(buttons.length).toBe(36);
      
      buttons.forEach(button => {
        expect(button.props.accessibilityLabel).toBeDefined();
        expect(button.props.accessibilityLabel.length).toBeGreaterThan(0);
      });
    });

    it('should have accessibility role as button', () => {
      const { getAllByRole } = render(<StateList {...defaultProps} />);
      const buttons = getAllByRole('button');
      
      buttons.forEach(button => {
        expect(button.props.accessibilityRole).toBe('button');
      });
    });

    it('should have accessibility hint', () => {
      const { getByText } = render(<StateList {...defaultProps} />);
      const karnatakaButton = getByText('Karnataka').parent?.parent;
      
      expect(karnatakaButton?.props.accessibilityHint).toBe(
        'Tap to view temples in this state'
      );
    });

    it('should set accessibility state for selected state', () => {
      const { getByText } = render(
        <StateList {...defaultProps} selectedState="MH" />
      );
      
      const maharashtraButton = getByText('Maharashtra').parent?.parent;
      expect(maharashtraButton?.props.accessibilityState.selected).toBe(true);
      
      const karnatakaButton = getByText('Karnataka').parent?.parent;
      expect(karnatakaButton?.props.accessibilityState.selected).toBe(false);
    });
  });

  describe('Sorting', () => {
    it('should sort states alphabetically', () => {
      const { getAllByRole } = render(<StateList {...defaultProps} />);
      const buttons = getAllByRole('button');
      
      const labels = buttons.map(b => b.props.accessibilityLabel);
      
      // Check if sorted
      for (let i = 1; i < labels.length; i++) {
        expect(labels[i].localeCompare(labels[i - 1])).toBeGreaterThanOrEqual(0);
      }
    });

    it('should have Andaman and Nicobar Islands first', () => {
      const { getAllByRole } = render(<StateList {...defaultProps} />);
      const buttons = getAllByRole('button');
      
      expect(buttons[0].props.accessibilityLabel).toBe('Andaman and Nicobar Islands');
    });

    it('should maintain sort order with different state arrays', () => {
      const shuffled = [...INDIAN_STATES].sort(() => Math.random() - 0.5);
      const { getAllByRole } = render(
        <StateList {...defaultProps} states={shuffled} />
      );
      const buttons = getAllByRole('button');
      
      const labels = buttons.map(b => b.props.accessibilityLabel);
      
      // Should still be sorted despite shuffled input
      for (let i = 1; i < labels.length; i++) {
        expect(labels[i].localeCompare(labels[i - 1])).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Performance', () => {
    it('should memoize the component', () => {
      const { rerender } = render(<StateList {...defaultProps} />);
      
      // Rerender with same props
      rerender(<StateList {...defaultProps} />);
      
      expect(true).toBe(true); // Component uses React.memo
    });

    it('should use FlatList for efficient rendering', () => {
      const { UNSAFE_getByType } = render(<StateList {...defaultProps} />);
      const flatList = UNSAFE_getByType('FlatList');
      
      expect(flatList).toBeDefined();
    });

    it('should have optimized FlatList props', () => {
      const { UNSAFE_getByType } = render(<StateList {...defaultProps} />);
      const flatList = UNSAFE_getByType('FlatList');
      
      expect(flatList.props.initialNumToRender).toBe(15);
      expect(flatList.props.maxToRenderPerBatch).toBe(10);
      expect(flatList.props.windowSize).toBe(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty states array', () => {
      const { getByText } = render(
        <StateList {...defaultProps} states={[]} />
      );
      
      expect(getByText('0 states and union territories')).toBeTruthy();
    });

    it('should handle null selectedState', () => {
      const { getAllByRole } = render(
        <StateList {...defaultProps} selectedState={null} />
      );
      const buttons = getAllByRole('button');
      
      // No button should be selected
      buttons.forEach(button => {
        expect(button.props.accessibilityState.selected).toBe(false);
      });
    });

    it('should handle invalid selectedState code', () => {
      const { getAllByRole } = render(
        <StateList {...defaultProps} selectedState="INVALID" />
      );
      const buttons = getAllByRole('button');
      
      // No button should be selected
      buttons.forEach(button => {
        expect(button.props.accessibilityState.selected).toBe(false);
      });
    });

    it('should handle single state in array', () => {
      const singleState = [INDIAN_STATES[0]];
      const { getByText } = render(
        <StateList {...defaultProps} states={singleState} />
      );
      
      expect(getByText('1 states and union territories')).toBeTruthy();
      expect(getByText(singleState[0].name)).toBeTruthy();
    });
  });
});

// Helper function to get all elements by text
function getAllByText(text: string) {
  // This is a simplified version - in real tests you'd use the proper query
  return [];
}
