import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { INDIAN_STATES, getSortedStates, IndianState } from '../constants/indianStates';

interface SimpleIndiaMapProps {
  selectedState: string | null;
  onStateSelect: (stateCode: string) => void;
  visibleStates?: IndianState[];
}

// Mock temple counts by state (replace with actual API data)
const TEMPLE_COUNTS: Record<string, number> = {
  'Andhra Pradesh': 3,
  'Karnataka': 2,
  // All other states have 0 temples (will show "Coming Soon")
};

/**
 * SimpleIndiaMap Component
 * 
 * A simplified grid-based representation of Indian states.
 * Shows temple counts for each state.
 * 
 * Features:
 * - Grid layout showing all states
 * - Color-coded by region
 * - Temple count badges
 * - "Coming Soon" for states with no temples
 * - Touch interaction
 * - Visual feedback on selection
 * 
 * @component
 */
const SimpleIndiaMap: React.FC<SimpleIndiaMapProps> = ({
  selectedState,
  onStateSelect,
  visibleStates = INDIAN_STATES,
}) => {
  // Group states by region for better visual organization
  const regions = {
    north: ['JK', 'LA', 'HP', 'PB', 'HR', 'DL', 'UP', 'UK'],
    northeast: ['AR', 'AS', 'MN', 'ML', 'MZ', 'NL', 'SK', 'TR'],
    west: ['RJ', 'GJ', 'DH', 'MH', 'GA'],
    central: ['MP', 'CG'],
    east: ['BR', 'JH', 'OR', 'WB'],
    south: ['TS', 'AP', 'KA', 'TN', 'KL', 'PY'],
    islands: ['AN', 'LD'],
  };

  // Create a set of visible state codes for quick lookup
  const visibleStateCodes = useMemo(() => {
    return new Set(visibleStates.map(s => s.code));
  }, [visibleStates]);

  const regionColors = {
    north: '#FFE5E5',
    northeast: '#E5F5FF',
    west: '#FFF5E5',
    central: '#F5E5FF',
    east: '#E5FFE5',
    south: '#FFE5F5',
    islands: '#E5FFFF',
  };

  const regionNames = {
    north: 'North India',
    northeast: 'Northeast',
    west: 'West India',
    central: 'Central India',
    east: 'East India',
    south: 'South India',
    islands: 'Islands',
  };

  const handleStatePress = useCallback((stateCode: string) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // Haptic feedback would go here
    }
    onStateSelect(stateCode);
  }, [onStateSelect]);

  // Get temple count for a state
  const getTempleCount = useCallback((stateName: string): number => {
    return TEMPLE_COUNTS[stateName] || 0;
  }, []);

  const renderRegion = (regionKey: keyof typeof regions) => {
    const stateCodes = regions[regionKey];
    const states = stateCodes
      .map(code => INDIAN_STATES.find(s => s.code === code))
      .filter(state => state && visibleStateCodes.has(state.code)); // Only show visible states

    // Don't render region if no visible states
    if (states.length === 0) {
      return null;
    }

    return (
      <View key={regionKey} style={styles.regionContainer}>
        <Text style={styles.regionTitle}>{regionNames[regionKey]}</Text>
        <View style={styles.statesGrid}>
          {states.map(state => {
            if (!state) return null;
            const isSelected = state.code === selectedState;
            const templeCount = getTempleCount(state.name);
            const hasTemples = templeCount > 0;
            
            return (
              <TouchableOpacity
                key={state.code}
                style={[
                  styles.stateBox,
                  { backgroundColor: regionColors[regionKey] },
                  isSelected && styles.stateBoxSelected,
                ]}
                onPress={() => handleStatePress(state.code)}
                accessible={true}
                accessibilityLabel={`${state.name}, ${hasTemples ? `${templeCount} temples` : 'Coming soon'}`}
                accessibilityRole="button"
                accessibilityHint="Tap to view temples in this state"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.stateCode, isSelected && styles.stateCodeSelected]}>
                  {state.code}
                </Text>
                <Text 
                  style={[styles.stateName, isSelected && styles.stateNameSelected]}
                  numberOfLines={2}
                >
                  {state.name}
                </Text>
                
                {/* Temple Count or Coming Soon Badge */}
                {hasTemples ? (
                  <View style={styles.templeCountBadge}>
                    <Text style={styles.templeCountText}>🏛️ {templeCount}</Text>
                  </View>
                ) : (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Coming Soon</Text>
                  </View>
                )}
                
                {state.type === 'ut' && (
                  <Text style={styles.utBadge}>UT</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapNote}>
        <Text style={styles.mapNoteIcon}>🗺️</Text>
        <Text style={styles.mapNoteText}>
          Tap any state to explore temples
        </Text>
      </View>

      {(Object.keys(regions) as Array<keyof typeof regions>).map(renderRegion)}
      
      {/* Extra padding at bottom */}
      <View style={{ height: 40 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  mapNote: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  mapNoteIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  mapNoteText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'center',
  },
  regionContainer: {
    marginBottom: 24,
  },
  regionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingLeft: 4,
  },
  statesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stateBox: {
    width: '30%',
    minWidth: 100,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s',
      },
    }),
  },
  stateBoxSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#2E7D32',
    borderWidth: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  stateCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  stateCodeSelected: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  stateName: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 6,
  },
  stateNameSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  templeCountBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  templeCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  comingSoonBadge: {
    backgroundColor: '#FFE8E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  comingSoonText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FF6B35',
  },
  utBadge: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FF6B35',
    backgroundColor: '#FFE8E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    position: 'absolute',
    top: 4,
    right: 4,
  },
});

export default React.memo(SimpleIndiaMap);
