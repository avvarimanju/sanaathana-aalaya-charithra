import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface Temple {
  siteId: string;
  name: string;
  location: {
    city: string;
    state: string;
  };
  artifactCount: number;
  rating: number;
  thumbnail?: string;
}

export default function ExploreScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [temples, setTemples] = useState<Temple[]>([]);

  useEffect(() => {
    // Load temples from API or mock data
    loadTemples();
  }, [selectedState]);

  const loadTemples = () => {
    // Mock data - replace with API call
    const mockTemples: Temple[] = [
      {
        siteId: 'lepakshi-temple-andhra',
        name: 'Lepakshi Temple',
        location: { city: 'Lepakshi', state: 'Andhra Pradesh' },
        artifactCount: 3,
        rating: 4.8,
      },
      {
        siteId: 'tirumala-tirupati-andhra',
        name: 'Tirumala Venkateswara Temple',
        location: { city: 'Tirupati', state: 'Andhra Pradesh' },
        artifactCount: 2,
        rating: 4.9,
      },
      {
        siteId: 'srikalahasti-temple-andhra',
        name: 'Sri Kalahasti Temple',
        location: { city: 'Sri Kalahasti', state: 'Andhra Pradesh' },
        artifactCount: 2,
        rating: 4.7,
      },
      {
        siteId: 'hampi-ruins-karnataka',
        name: 'Hampi Ruins',
        location: { city: 'Hampi', state: 'Karnataka' },
        artifactCount: 2,
        rating: 4.9,
      },
      {
        siteId: 'halebidu-temple-karnataka',
        name: 'Halebidu Hoysaleswara Temple',
        location: { city: 'Halebidu', state: 'Karnataka' },
        artifactCount: 2,
        rating: 4.8,
      },
    ];

    const filtered = selectedState
      ? mockTemples.filter(t => t.location.state === selectedState)
      : mockTemples;

    setTemples(filtered);
  };

  const states = ['Andhra Pradesh', 'Karnataka', 'Tamil Nadu', 'Maharashtra', 'Madhya Pradesh'];

  const filteredTemples = temples.filter(temple =>
    temple.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    temple.location.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏛️ Explore Temples</Text>
        <Text style={styles.headerSubtitle}>Discover Hindu temple heritage</Text>
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
              key={temple.siteId}
              style={styles.templeCard}
              onPress={() => navigation.navigate('TempleDetails', { templeId: temple.siteId })}
            >
              <View style={styles.templeImagePlaceholder}>
                <Text style={styles.templeImageIcon}>🏛️</Text>
              </View>
              
              <View style={styles.templeInfo}>
                <Text style={styles.templeName}>{temple.name}</Text>
                <Text style={styles.templeLocation}>
                  📍 {temple.location.city}, {temple.location.state}
                </Text>
                <View style={styles.templeStats}>
                  <Text style={styles.templeStat}>
                    🗿 {temple.artifactCount} artifacts
                  </Text>
                  <Text style={styles.templeStat}>
                    ⭐ {temple.rating}
                  </Text>
                </View>
                
                <View style={styles.templeActions}>
                  <TouchableOpacity
                    style={styles.exploreButton}
                    onPress={() => navigation.navigate('TempleDetails', { templeId: temple.siteId })}
                  >
                    <Text style={styles.exploreButtonText}>Explore</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={() => {/* Handle download */}}
                  >
                    <Text style={styles.downloadButtonText}>📥 Download</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty State */}
        {filteredTemples.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateText}>No temples found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your search or filters</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FF6B35',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
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
});
