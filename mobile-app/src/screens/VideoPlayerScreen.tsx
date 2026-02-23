import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function VideoPlayerScreen({ route }: any) {
  const { artifact } = route.params;

  return (
    <ScrollView style={styles.container}>
      {/* Video Player Placeholder */}
      <View style={styles.videoContainer}>
        <View style={styles.videoPlaceholder}>
          <Text style={styles.playIcon}>▶️</Text>
          <Text style={styles.videoTitle}>Historical Reconstruction</Text>
          <Text style={styles.videoDuration}>Duration: 2:30</Text>
        </View>
      </View>

      {/* Video Info */}
      <View style={styles.info}>
        <Text style={styles.title}>{artifact.name} - Video Tour</Text>
        <Text style={styles.description}>
          Experience a cinematic journey through the history and architecture of {artifact.name}. 
          This AI-generated video brings the past to life with stunning visuals and narration.
        </Text>
      </View>

      {/* Quality Selector */}
      <View style={styles.quality}>
        <Text style={styles.sectionTitle}>Video Quality</Text>
        <View style={styles.qualityButtons}>
          <TouchableOpacity style={styles.qualityButton}>
            <Text style={styles.qualityText}>480p</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.qualityButton, styles.qualityButtonActive]}>
            <Text style={[styles.qualityText, styles.qualityTextActive]}>720p</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qualityButton}>
            <Text style={styles.qualityText}>1080p</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Subtitles */}
      <View style={styles.subtitles}>
        <Text style={styles.sectionTitle}>Subtitles Available</Text>
        <Text style={styles.subtitleInfo}>
          ✓ English, Hindi, Tamil, Telugu, Bengali, and 5 more languages
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  videoContainer: {
    backgroundColor: '#000',
    aspectRatio: 16 / 9,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  videoDuration: {
    color: '#999',
    fontSize: 12,
  },
  info: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  quality: {
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  qualityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  qualityButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  qualityButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  qualityText: {
    color: '#666',
    fontWeight: '600',
  },
  qualityTextActive: {
    color: '#fff',
  },
  subtitles: {
    padding: 20,
  },
  subtitleInfo: {
    fontSize: 14,
    color: '#666',
  },
});
