import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Platform } from 'react-native';
import { IndianState, getSortedStates } from '../constants/indianStates';

interface StateListProps {
  selectedState: string | null;
  onStateSelect: (stateCode: string) => void;
  states: IndianState[];
}

// Mock temple counts by state (replace with actual API data)
const TEMPLE_COUNTS: Record<string, number> = {
  'Andhra Pradesh': 3,
  'Karnataka': 2,
  // All other states have 0 temples (will show "Coming Soon")
};

/**
 * StateList Component
 * 
 * Renders a scrollable list of Indian states and union territories.
 * Synchronized with the map selection - tapping a state name selects it.
 * Shows temple counts for each state.
 * 
 * Features:
 * - Alphabetically sorted list
 * - Visual highlight for selected state
 * - Smooth scrolling performance
 * - Accessible with proper labels
 * - Dividers between items
 * - Temple count or "Coming Soon" badge
 * 
 * @component
 */
const StateList: React.FC<StateListProps> = ({
  selectedState,
  onStateSelect,
  states,
}) => {
  // Sort states alphabetically for better UX
  const sortedStates = useMemo(() => {
    return [...states].sort((a, b) => a.name.localeCompare(b.name));
  }, [states]);

  /**
   * Handle state item press
   */
  const handleStatePress = useCallback((stateCode: string) => {
    onStateSelect(stateCode);
  }, [onStateSelect]);

  /**
   * Get temple count for a state
   */
  const getTempleCount = useCallback((stateName: string): number => {
    return TEMPLE_COUNTS[stateName] || 0;
  }, []);

  /**
   * Render individual state list item
   */
  const renderStateItem = useCallback(({ item }: { item: IndianState }) => {
    const isSelected = item.code === selectedState;
    const templeCount = getTempleCount(item.name);
    const hasTemples = templeCount > 0;
    
    return (
      <TouchableOpacity
        style={[
          styles.stateItem,
          isSelected && styles.stateItemSelected,
        ]}
        onPress={() => handleStatePress(item.code)}
        accessible={true}
        accessibilityLabel={`${item.name}, ${hasTemples ? `${templeCount} temples` : 'Coming soon'}`}
        accessibilityRole="button"
        accessibilityHint="Tap to view temples in this state"
        accessibilityState={{ selected: isSelected }}
      >
        <View style={styles.stateItemContent}>
          <View style={styles.stateNameContainer}>
            <Text 
              style={[
                styles.stateItemText,
                isSelected && styles.stateItemTextSelected,
              ]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            {item.type === 'ut' && (
              <Text style={styles.stateItemBadge}>UT</Text>
            )}
          </View>
          
          {/* Temple Count or Coming Soon */}
          {hasTemples ? (
            <View style={styles.templeCountContainer}>
              <Text style={styles.templeCountText}>🏛️ {templeCount}</Text>
            </View>
          ) : (
            <View style={styles.comingSoonContainer}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          )}
        </View>
        {isSelected && (
          <View style={styles.selectedIndicator} />
        )}
      </TouchableOpacity>
    );
  }, [selectedState, handleStatePress, getTempleCount]);

  /**
   * Item separator component
   */
  const renderSeparator = useCallback(() => (
    <View style={styles.separator} />
  ), []);

  /**
   * Extract unique key for each item
   */
  const keyExtractor = useCallback((item: IndianState) => item.code, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Select a State</Text>
        <Text style={styles.headerSubtext}>
          {sortedStates.length} states and union territories
        </Text>
      </View>
      <FlatList
        data={sortedStates}
        renderItem={renderStateItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={renderSeparator}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={Platform.OS === 'android'}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  headerSubtext: {
    fontSize: 14,
    color: '#666666',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  stateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 70,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        ':hover': {
          backgroundColor: '#F5F5F5',
        },
      },
    }),
  },
  stateItemSelected: {
    backgroundColor: '#E8F5E9',
  },
  stateItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stateNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stateItemText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  stateItemTextSelected: {
    fontWeight: '600',
    color: '#2E7D32',
  },
  stateItemBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
    backgroundColor: '#FFE8E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  templeCountContainer: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  templeCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  comingSoonContainer: {
    backgroundColor: '#FFE8E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF6B35',
  },
  selectedIndicator: {
    width: 4,
    height: '100%',
    backgroundColor: '#4CAF50',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 16,
  },
});

export default React.memo(StateList);
