import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const INFOGRAPHIC_TYPES = ['Timeline', 'Map', 'Architecture', 'Cultural Context'];

export default function InfographicScreen({ route }: any) {
  const { artifact } = route.params;
  const [selectedType, setSelectedType] = useState('Timeline');

  return (
    <View style={styles.container}>
      {/* Type Selector */}
      <View style={styles.typeSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {INFOGRAPHIC_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                selectedType === type && styles.typeButtonActive,
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text
                style={[
                  styles.typeText,
                  selectedType === type && styles.typeTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Infographic Content */}
      <ScrollView style={styles.content}>
        <View style={styles.infographicContainer}>
          {selectedType === 'Timeline' && (
            <View style={styles.timeline}>
              <Text style={styles.infographicTitle}>Historical Timeline</Text>
              <View style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineYear}>1193 CE</Text>
                  <Text style={styles.timelineEvent}>Construction Began</Text>
                </View>
              </View>
              <View style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineYear}>1220 CE</Text>
                  <Text style={styles.timelineEvent}>First Floor Completed</Text>
                </View>
              </View>
              <View style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineYear}>1368 CE</Text>
                  <Text style={styles.timelineEvent}>Restoration Work</Text>
                </View>
              </View>
            </View>
          )}

          {selectedType === 'Map' && (
            <View style={styles.map}>
              <Text style={styles.infographicTitle}>Location Map</Text>
              <View style={styles.mapPlaceholder}>
                <Text style={styles.mapIcon}>🗺️</Text>
                <Text style={styles.mapText}>{artifact.location}</Text>
                <Text style={styles.mapCoords}>Interactive map view</Text>
              </View>
            </View>
          )}

          {selectedType === 'Architecture' && (
            <View style={styles.architecture}>
              <Text style={styles.infographicTitle}>Architectural Details</Text>
              <View style={styles.archItem}>
                <Text style={styles.archLabel}>Height:</Text>
                <Text style={styles.archValue}>73 meters</Text>
              </View>
              <View style={styles.archItem}>
                <Text style={styles.archLabel}>Material:</Text>
                <Text style={styles.archValue}>Red Sandstone & Marble</Text>
              </View>
              <View style={styles.archItem}>
                <Text style={styles.archLabel}>Style:</Text>
                <Text style={styles.archValue}>Indo-Islamic</Text>
              </View>
              <View style={styles.archItem}>
                <Text style={styles.archLabel}>Floors:</Text>
                <Text style={styles.archValue}>5 Stories</Text>
              </View>
            </View>
          )}

          {selectedType === 'Cultural Context' && (
            <View style={styles.cultural}>
              <Text style={styles.infographicTitle}>Cultural Significance</Text>
              <Text style={styles.culturalText}>
                This monument represents the rich cultural heritage of medieval India, 
                showcasing the architectural brilliance of the era and serving as a 
                symbol of the region's historical importance.
              </Text>
              <View style={styles.culturalTags}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>UNESCO Site</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Medieval Era</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Islamic Architecture</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  typeSelector: {
    backgroundColor: '#f9f9f9',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  typeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  typeButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  typeText: {
    color: '#666',
    fontWeight: '600',
  },
  typeTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  infographicContainer: {
    padding: 20,
  },
  infographicTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  timeline: {},
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B35',
    marginTop: 5,
    marginRight: 15,
  },
  timelineContent: {
    flex: 1,
  },
  timelineYear: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 5,
  },
  timelineEvent: {
    fontSize: 14,
    color: '#666',
  },
  map: {},
  mapPlaceholder: {
    height: 300,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  mapText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  mapCoords: {
    fontSize: 12,
    color: '#999',
  },
  architecture: {},
  archItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  archLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  archValue: {
    fontSize: 14,
    color: '#333',
  },
  cultural: {},
  culturalText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  culturalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#FFE5DC',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  tagText: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '600',
  },
});
