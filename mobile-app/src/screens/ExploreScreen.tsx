import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getStateName } from '../constants/indianStates';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

interface Temple {
  templeId: string;
  name: string;
  description: string;
  location: {
    city: string;
    state: string;
    district?: string;
  };
  activeArtifactCount: number;
  qrCodeCount: number;
  accessMode: 'FREE' | 'PAID' | 'HYBRID';
  status: 'active' | 'inactive';
  imageUrl?: string;
}

interface ExploreScreenProps {
  navigation: any;
  route?: {
    params?: {
      selectedState?: string;
      language?: string;
    };
  };
}

export default function ExploreScreen({ navigation, route }: ExploreScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [temples, setTemples] = useState<Temple[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get state from navigation params
  const stateFromParams = route?.params?.selectedState;

  useEffect(() => {
    // Set selected state from navigation params
    if (stateFromParams) {
      const stateName = getStateName(stateFromParams);
      setSelectedState(stateName);
    }
  }, [stateFromParams]);

  useEffect(() => {
    // Load temples from API or mock data
    loadTemples();
  }, [selectedState]);

  const loadTemples = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch temples from API
      const params = new URLSearchParams();
      if (selectedState) {
        params.append('state', selectedState);
      }
      params.append('status', 'active'); // Only show active temples
      
      const response = await fetch(`${API_BASE_URL}/api/temples?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch temples');
      }
      
      const data = await response.json();
      setTemples(data.items || []);
    } catch (err) {
      setError('Failed to load temples. Please try again.');
      console.error('Error loading temples:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadTemples();
  };

  const handleBackToMap = () => {
    navigation.goBack();
  };

  const states = ['Andhra Pradesh', 'Karnataka', 'Tamil Nadu', 'Maharashtra', 'Madhya Pradesh'];

  const filteredTemples = temples.filter(temple =>
    temple.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    temple.location.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToMap}>
            <Text style={styles.backButtonText}>Back to Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show empty state for selected state with no temples
  if (!loading && filteredTemples.length === 0 && selectedState) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateIcon}>🏛️</Text>
          <Text style={styles.emptyStateTitle}>Temples are being added...</Text>
          <Text style={styles.emptyStateSubtext}>
            We're working on adding temples in {selectedState}.{'\n'}
            Check back soon!
          </Text>
          <TouchableOpacity style={styles.backToMapButton} onPress={handleBackToMap}>
            <Text style={styles.backToMapButtonText}>← Explore Other States</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🏛️ Explore Temples</Text>
          <Text style={styles.headerSubtitle}>
            {selectedState ? `Temples in ${selectedState}` : 'Discover Hindu temple heritage'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('QRScanner')}
        >
          <Text style={styles.scanButtonText}>📷 Scan QR</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search temples..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* State Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>📍 Browse by State</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, !selectedState && styles.filterChipActive]}
              onPress={() => setSelectedState(null)}
            >
              <Text style={[styles.filterChipText, !selectedState && styles.filterChipTextActive]}>
                All States
              </Text>
            </TouchableOpacity>
            {states.map(state => (
              <TouchableOpacity
                key={state}
                style={[styles.filterChip, selectedState === state && styles.filterChipActive]}
                onPress={() => setSelectedState(state)}
              >
                <Text style={[styles.filterChipText, selectedState === state && styles.filterChipTextActive]}>
                  {state}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Temple List */}
        <View style={styles.templesSection}>
          <Text style={styles.sectionTitle}>
            🏛️ {selectedState ? `Temples in ${selectedState}` : 'All Temples'} ({filteredTemples.length})
          </Text>
          
          {filteredTemples.map(temple => (
            <TouchableOpacity
              key={temple.templeId}
              style={styles.templeCard}
              onPress={() => navigation.navigate('TempleDetails', { templeId: temple.templeId })}
            >
              <View style={styles.templeImagePlaceholder}>
                <Text style={styles.templeImageIcon}>🏛️</Text>
              </View>
              
              <View style={styles.templeInfo}>
                <Text style={styles.templeName}>{temple.name}</Text>
                <Text style={styles.templeLocation}>
                  📍 {temple.location.city}, {temple.location.state}
                </Text>
                <Text style={styles.templeDescription} numberOfLines={2}>
                  {temple.description}
                </Text>
                <View style={styles.templeStats}>
                  <Text style={styles.templeStat}>
                    🗿 {temple.activeArtifactCount || 0} artifacts
                  </Text>
                  <Text style={styles.templeStat}>
                    {temple.accessMode === 'FREE' ? '🆓 Free' : temple.accessMode === 'PAID' ? '💰 Paid' : '🔀 Hybrid'}
                  </Text>
                </View>
                
                <View style={styles.templeActions}>
                  <TouchableOpacity
                    style={styles.exploreButton}
                    onPress={() => navigation.navigate('TempleDetails', { templeId: temple.templeId })}
                  >
                    <Text style={styles.exploreButtonText}>Explore</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={() => alert('Coming Soon! 📥\n\nDownload temple content anytime during your subscription period (30 days) to access it offline, even without internet connection.')}
                  >
                    <Text style={styles.downloadButtonText}>📥 Download - Coming Soon</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty State for Search */}
        {filteredTemples.length === 0 && !selectedState && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateText}>No temples found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your search or filters</Text>
          </View>
        )}
        
        {/* Bottom Padding for Web Scrolling */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    ...(Platform.OS === 'web' && {
      height: '100vh' as any,
      overflow: 'hidden' as any,
    }),
  },
  header: {
    backgroundColor: '#FF6B35',
    padding: 15,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scanButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fff',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      overflowY: 'auto' as any,
      maxHeight: 'calc(100vh - 100px)' as any,
    }),
  },
  searchContainer: {
    padding: 15,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none' as any,
    }),
  },
  filterSection: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterChipText: {
    color: '#666',
    fontSize: 14,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  templesSection: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  templeCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  templeImagePlaceholder: {
    height: 150,
    backgroundColor: '#FFE5D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  templeImageIcon: {
    fontSize: 60,
  },
  templeInfo: {
    padding: 15,
  },
  templeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  templeLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  templeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  templeStats: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  templeStat: {
    fontSize: 14,
    color: '#666',
    marginRight: 15,
  },
  templeActions: {
    flexDirection: 'row',
    gap: 10,
  },
  exploreButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  exploreButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  downloadButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  backToMapButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  backToMapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
