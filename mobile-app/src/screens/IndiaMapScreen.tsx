import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SimpleIndiaMap from '../components/SimpleIndiaMap';
import StateList from '../components/StateList';
import { INDIAN_STATES, IndianState } from '../constants/indianStates';

/**
 * IndiaMapScreen Component
 * 
 * Main screen for state selection using an interactive map and list.
 * Users can select a state by tapping either the map or the list.
 * After selection, navigates to ExploreScreen with the selected state filter.
 * 
 * Features:
 * - Fetches visible states from admin settings
 * - Filters states based on admin visibility configuration
 * - Shows only states that admin has enabled
 * 
 * Layout:
 * - Header with title and instructions
 * - Interactive India map (60% of screen)
 * - Scrollable state list (40% of screen)
 * 
 * @screen
 */
const IndiaMapScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [visibleStates, setVisibleStates] = useState<IndianState[]>(INDIAN_STATES);
  const [loading, setLoading] = useState(true);

  // Calculate responsive dimensions for the map
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  
  const mapDimensions = Platform.select({
    web: {
      width: Math.min(screenWidth * 0.9, 600),
      height: Math.min(screenHeight * 0.4, 480),
    },
    default: {
      width: screenWidth * 0.95,
      height: screenHeight * 0.4,
    },
  });

  /**
   * Load visible states from admin settings
   */
  useEffect(() => {
    loadVisibleStates();
  }, []);

  const loadVisibleStates = async () => {
    setLoading(true);
    try {
      // Fetch visible states from backend API
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/public/states/visible`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.allVisible) {
        // All states are visible
        setVisibleStates(INDIAN_STATES);
      } else {
        // Filter based on API response
        const visibleStateCodes = new Set(data.visibleStates);
        const filtered = INDIAN_STATES.filter(state => visibleStateCodes.has(state.code));
        setVisibleStates(filtered);
      }
    } catch (error) {
      console.error('Failed to load visible states:', error);
      // On error, show all states (fail-open for better UX)
      setVisibleStates(INDIAN_STATES);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle state selection from either map or list
   * Navigates to ExploreScreen with the selected state
   */
  const handleStateSelect = useCallback((stateCode: string) => {
    setSelectedState(stateCode);
    
    // Navigate to Explore screen with state filter
    // Small delay for visual feedback
    setTimeout(() => {
      (navigation as any).navigate('Explore', { selectedState: stateCode });
    }, 200);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Your State</Text>
        <Text style={styles.headerSubtitle}>
          {loading ? 'Loading states...' : `${visibleStates.length} states available`}
        </Text>
      </View>

      {/* Scroll Indicator - Only on Web */}
      {Platform.OS === 'web' && !loading && (
        <View style={styles.scrollIndicator}>
          <Text style={styles.scrollIndicatorText}>↓ Scroll down to see all states ↓</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading available states...</Text>
        </View>
      ) : visibleStates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyTitle}>No States Available</Text>
          <Text style={styles.emptyText}>
            States are being configured. Please check back later.
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Interactive Map Section */}
          <View style={styles.mapSection}>
            <SimpleIndiaMap
              selectedState={selectedState}
              onStateSelect={handleStateSelect}
              visibleStates={visibleStates}
            />
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR SELECT FROM LIST</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* State List Section */}
          <View style={styles.listSection}>
            <StateList
              selectedState={selectedState}
              onStateSelect={handleStateSelect}
              states={visibleStates}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: {
        height: '100vh' as any,
        overflow: 'hidden' as any,
      },
    }),
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 40,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  scrollIndicator: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#FFB74D',
    ...Platform.select({
      web: {
        animation: 'pulse 2s infinite' as any,
      },
    }),
  },
  scrollIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'scroll' as any,  // Changed from 'auto' to 'scroll' to always show scrollbar
        maxHeight: 'calc(100vh - 140px)' as any,  // Adjusted for scroll indicator
        // Force scrollbar to always be visible
        scrollbarWidth: 'auto' as any,
        scrollbarColor: '#FF6B35 #F5F5F5' as any,
        '::-webkit-scrollbar': {
          width: '12px',
        } as any,
        '::-webkit-scrollbar-track': {
          background: '#F5F5F5',
        } as any,
        '::-webkit-scrollbar-thumb': {
          background: '#FF6B35',
          borderRadius: '6px',
        } as any,
        '::-webkit-scrollbar-thumb:hover': {
          background: '#E65100',
        } as any,
      },
    }),
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  mapSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
  },
  listSection: {
    flex: 1,
    minHeight: 400,
    ...Platform.select({
      web: {
        minHeight: 500,
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default IndiaMapScreen;
