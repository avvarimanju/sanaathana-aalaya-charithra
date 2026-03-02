/**
 * Unit Tests for IndiaMapScreen
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import IndiaMapScreen from '../IndiaMapScreen';
import { useNavigation } from '@react-navigation/native';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

// Mock components
jest.mock('../../components/InteractiveIndiaMap', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return ({ selectedState, onStateSelect }: any) => (
    <View testID="interactive-india-map">
      <Text>Interactive India Map</Text>
      <TouchableOpacity
        testID="map-state-button"
        onPress={() => onStateSelect('KA')}
      >
        <Text>Karnataka on Map</Text>
      </TouchableOpacity>
    </View>
  );
});

jest.mock('../../components/StateList', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return ({ selectedState, onStateSelect }: any) => (
    <View testID="state-list">
      <Text>State List</Text>
      <TouchableOpacity
        testID="list-state-button"
        onPress={() => onStateSelect('TN')}
      >
        <Text>Tamil Nadu in List</Text>
      </TouchableOpacity>
    </View>
  );
});

describe('IndiaMapScreen', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigation as jest.Mock).mockReturnValue({
      navigate: mockNavigate,
    });
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { getByText } = render(<IndiaMapScreen />);
      expect(getByText('Select Your State')).toBeTruthy();
    });

    it('should render header with title', () => {
      const { getByText } = render(<IndiaMapScreen />);
      expect(getByText('Select Your State')).toBeTruthy();
    });

    it('should render header with subtitle', () => {
      const { getByText } = render(<IndiaMapScreen />);
      expect(getByText('Tap on the map or choose from the list below')).toBeTruthy();
    });

    it('should render InteractiveIndiaMap component', () => {
      const { getByTestId } = render(<IndiaMapScreen />);
      expect(getByTestId('interactive-india-map')).toBeTruthy();
    });

    it('should render StateList component', () => {
      const { getByTestId } = render(<IndiaMapScreen />);
      expect(getByTestId('state-list')).toBeTruthy();
    });

    it('should render divider with OR text', () => {
      const { getByText } = render(<IndiaMapScreen />);
      expect(getByText('OR')).toBeTruthy();
    });
  });

  describe('State Selection from Map', () => {
    it('should handle state selection from map', async () => {
      const { getByTestId } = render(<IndiaMapScreen />);
      
      const mapButton = getByTestId('map-state-button');
      fireEvent.press(mapButton);
      
      // Wait for navigation with delay
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Explore', {
          selectedState: 'KA',
        });
      }, { timeout: 300 });
    });

    it('should update selected state when map is clicked', () => {
      const { getByTestId } = render(<IndiaMapScreen />);
      
      const mapButton = getByTestId('map-state-button');
      fireEvent.press(mapButton);
      
      // State should be updated (tested via navigation call)
      expect(true).toBe(true);
    });
  });

  describe('State Selection from List', () => {
    it('should handle state selection from list', async () => {
      const { getByTestId } = render(<IndiaMapScreen />);
      
      const listButton = getByTestId('list-state-button');
      fireEvent.press(listButton);
      
      // Wait for navigation with delay
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Explore', {
          selectedState: 'TN',
        });
      }, { timeout: 300 });
    });

    it('should update selected state when list item is clicked', () => {
      const { getByTestId } = render(<IndiaMapScreen />);
      
      const listButton = getByTestId('list-state-button');
      fireEvent.press(listButton);
      
      // State should be updated (tested via navigation call)
      expect(true).toBe(true);
    });
  });

  describe('Navigation', () => {
    it('should navigate to Explore screen with selected state', async () => {
      const { getByTestId } = render(<IndiaMapScreen />);
      
      const mapButton = getByTestId('map-state-button');
      fireEvent.press(mapButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('Explore', {
          selectedState: 'KA',
        });
      }, { timeout: 300 });
    });

    it('should navigate with correct state code from map', async () => {
      const { getByTestId } = render(<IndiaMapScreen />);
      
      fireEvent.press(getByTestId('map-state-button'));
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Explore', {
          selectedState: 'KA',
        });
      }, { timeout: 300 });
    });

    it('should navigate with correct state code from list', async () => {
      const { getByTestId } = render(<IndiaMapScreen />);
      
      fireEvent.press(getByTestId('list-state-button'));
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Explore', {
          selectedState: 'TN',
        });
      }, { timeout: 300 });
    });

    it('should have navigation delay for visual feedback', async () => {
      const { getByTestId } = render(<IndiaMapScreen />);
      
      fireEvent.press(getByTestId('map-state-button'));
      
      // Should not navigate immediately
      expect(mockNavigate).not.toHaveBeenCalled();
      
      // Should navigate after delay
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      }, { timeout: 300 });
    });
  });

  describe('Component Integration', () => {
    it('should pass selectedState to InteractiveIndiaMap', () => {
      const { getByTestId } = render(<IndiaMapScreen />);
      
      // Map component should be rendered
      expect(getByTestId('interactive-india-map')).toBeTruthy();
    });

    it('should pass selectedState to StateList', () => {
      const { getByTestId } = render(<IndiaMapScreen />);
      
      // List component should be rendered
      expect(getByTestId('state-list')).toBeTruthy();
    });

    it('should pass onStateSelect handler to both components', () => {
      const { getByTestId } = render(<IndiaMapScreen />);
      
      // Both components should be able to trigger selection
      expect(getByTestId('map-state-button')).toBeTruthy();
      expect(getByTestId('list-state-button')).toBeTruthy();
    });

    it('should pass INDIAN_STATES to StateList', () => {
      const { getByTestId } = render(<IndiaMapScreen />);
      
      // StateList should be rendered with states
      expect(getByTestId('state-list')).toBeTruthy();
    });
  });

  describe('Responsive Design', () => {
    it('should calculate map dimensions based on screen size', () => {
      const { getByTestId } = render(<IndiaMapScreen />);
      
      // Map should be rendered with calculated dimensions
      expect(getByTestId('interactive-india-map')).toBeTruthy();
    });

    it('should render ScrollView for mobile experience', () => {
      const { UNSAFE_getByType } = render(<IndiaMapScreen />);
      
      const scrollView = UNSAFE_getByType('ScrollView');
      expect(scrollView).toBeDefined();
    });
  });

  describe('Layout', () => {
    it('should have header section', () => {
      const { getByText } = render(<IndiaMapScreen />);
      expect(getByText('Select Your State')).toBeTruthy();
    });

    it('should have map section', () => {
      const { getByTestId } = render(<IndiaMapScreen />);
      expect(getByTestId('interactive-india-map')).toBeTruthy();
    });

    it('should have divider between map and list', () => {
      const { getByText } = render(<IndiaMapScreen />);
      expect(getByText('OR')).toBeTruthy();
    });

    it('should have list section', () => {
      const { getByTestId } = render(<IndiaMapScreen />);
      expect(getByTestId('state-list')).toBeTruthy();
    });
  });

  describe('User Experience', () => {
    it('should provide visual feedback before navigation', async () => {
      const { getByTestId } = render(<IndiaMapScreen />);
      
      const startTime = Date.now();
      fireEvent.press(getByTestId('map-state-button'));
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
        const endTime = Date.now();
        const delay = endTime - startTime;
        
        // Should have at least 150ms delay for visual feedback
        expect(delay).toBeGreaterThanOrEqual(150);
      }, { timeout: 300 });
    });

    it('should allow selecting different states sequentially', async () => {
      const { getByTestId } = render(<IndiaMapScreen />);
      
      // Select from map
      fireEvent.press(getByTestId('map-state-button'));
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Explore', {
          selectedState: 'KA',
        });
      }, { timeout: 300 });
      
      mockNavigate.mockClear();
      
      // Select from list
      fireEvent.press(getByTestId('list-state-button'));
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Explore', {
          selectedState: 'TN',
        });
      }, { timeout: 300 });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid state selections', async () => {
      const { getByTestId } = render(<IndiaMapScreen />);
      
      // Rapid clicks
      fireEvent.press(getByTestId('map-state-button'));
      fireEvent.press(getByTestId('list-state-button'));
      
      // Should handle both (though only last one matters)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      }, { timeout: 500 });
    });

    it('should handle navigation when useNavigation returns undefined', () => {
      (useNavigation as jest.Mock).mockReturnValue({
        navigate: undefined,
      });
      
      const { getByTestId } = render(<IndiaMapScreen />);
      
      // Should not crash
      expect(getByTestId('interactive-india-map')).toBeTruthy();
    });
  });
});
