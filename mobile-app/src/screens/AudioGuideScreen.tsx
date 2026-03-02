import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const MOCK_CONTENT = {
  'LP-PILLAR-001': {
    title: 'Hanging Pillar',
    audioGuide: 'Welcome to the famous Hanging Pillar of Lepakshi Temple. This architectural marvel appears to be suspended in mid-air, with a small gap between the pillar base and the ground. Built during the Vijayanagara period, this pillar demonstrates the exceptional engineering skills of ancient Indian architects...',
    facts: [
      'Built in 16th century during Vijayanagara Empire',
      'One of 70 pillars in the temple',
      'Small gap visible between base and ground',
      'Made of granite stone',
    ],
  },
  'LP-NANDI-002': {
    title: 'Monolithic Nandi',
    audioGuide: 'Behold the magnificent Monolithic Nandi of Lepakshi, one of the largest Nandi statues in India. Carved from a single granite rock, this 27-foot long and 15-foot high sculpture faces the Veerabhadra Temple. The intricate details and massive scale showcase the mastery of Vijayanagara sculptors...',
    facts: [
      'Carved from single granite rock',
      'Length: 27 feet, Height: 15 feet',
      'One of the largest Nandi statues in India',
      'Faces the Veerabhadra Temple',
    ],
  },
  'LP-PAINT-003': {
    title: 'Ceiling Paintings',
    audioGuide: 'Marvel at the stunning ceiling paintings of Lepakshi Temple, created using natural dyes and vegetable colors. These vibrant frescoes depict scenes from Hindu epics including Ramayana, Mahabharata, and Puranas. Despite being over 500 years old, the colors remain remarkably vivid...',
    facts: [
      'Created in 16th century',
      'Natural dyes and vegetable colors used',
      'Depicts scenes from Hindu epics',
      'Colors remain vibrant after 500+ years',
    ],
  },
  'TT-DEITY-001': {
    title: 'Lord Venkateswara Deity',
    audioGuide: 'Welcome to the sacred shrine of Lord Venkateswara at Tirumala. This ancient deity, also known as Balaji, is one of the most visited pilgrimage sites in the world. The idol is believed to be self-manifested and is adorned with precious jewels and gold ornaments...',
    facts: [
      'One of the richest temples in the world',
      'Receives millions of pilgrims annually',
      'Deity adorned with precious jewels',
      'Ancient Dravidian architecture',
    ],
  },
  'TT-GOPURAM-002': {
    title: 'Golden Gopuram',
    audioGuide: 'Behold the magnificent Golden Gopuram of Tirumala Temple, a stunning example of Dravidian temple architecture. This towering gateway is covered in gold plating and features intricate carvings depicting various deities and mythological scenes...',
    facts: [
      'Covered in gold plating',
      'Dravidian architectural style',
      'Intricate deity carvings',
      'Main entrance to the temple',
    ],
  },
  'SK-LINGA-001': {
    title: 'Vayu Linga',
    audioGuide: 'Welcome to the sacred Vayu Linga at Sri Kalahasti Temple, one of the Pancha Bhoota Sthalams representing the element of Air. This ancient Shiva Linga is believed to be self-manifested and is associated with the legend of the spider, snake, and elephant devotees...',
    facts: [
      'Represents Air element (Vayu)',
      'One of Pancha Bhoota Sthalams',
      'Self-manifested Linga',
      'Associated with spider-snake-elephant legend',
    ],
  },
};

export default function AudioGuideScreen({ navigation, route }: any) {
  const { artifact, language } = route.params;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(180); // 3 minutes

  const content = MOCK_CONTENT[artifact.id as keyof typeof MOCK_CONTENT] || MOCK_CONTENT['LP-PILLAR-001'];

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In real app, control audio playback here
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.language}>🗣️ {language.toUpperCase()}</Text>
      </View>

      {/* Audio Player */}
      <View style={styles.audioPlayer}>
        <View style={styles.waveform}>
          <Text style={styles.waveformText}>🎵 Audio Waveform</Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progress, { width: `${(currentTime / duration) * 100}%` }]} />
        </View>

        <View style={styles.timeContainer}>
          <Text style={styles.time}>{formatTime(currentTime)}</Text>
          <Text style={styles.time}>{formatTime(duration)}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlIcon}>⏮️</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.playButton}
            onPress={togglePlayPause}
          >
            <Text style={styles.playIcon}>{isPlaying ? '⏸️' : '▶️'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlIcon}>⏭️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transcript */}
      <View style={styles.transcript}>
        <Text style={styles.sectionTitle}>📝 Audio Guide Transcript</Text>
        <Text style={styles.transcriptText}>{content.audioGuide}</Text>
      </View>

      {/* Quick Facts */}
      <View style={styles.facts}>
        <Text style={styles.sectionTitle}>💡 Quick Facts</Text>
        {content.facts.map((fact, index) => (
          <View key={index} style={styles.factItem}>
            <Text style={styles.factBullet}>•</Text>
            <Text style={styles.factText}>{fact}</Text>
          </View>
        ))}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('VideoPlayer', { artifact, language })}
        >
          <Text style={styles.navIcon}>🎬</Text>
          <Text style={styles.navText}>Watch Video</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Infographic', { artifact, language })}
        >
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navText}>View Infographic</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('QAChat', { artifact, language })}
        >
          <Text style={styles.navIcon}>💬</Text>
          <Text style={styles.navText}>Ask Questions</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#FF6B35',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  language: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  audioPlayer: {
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  waveform: {
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  waveformText: {
    color: '#999',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    marginBottom: 10,
  },
  progress: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  time: {
    fontSize: 12,
    color: '#666',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    padding: 10,
  },
  controlIcon: {
    fontSize: 24,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  playIcon: {
    fontSize: 24,
  },
  transcript: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  transcriptText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  facts: {
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  factItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  factBullet: {
    fontSize: 16,
    color: '#FF6B35',
    marginRight: 10,
  },
  factText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  navigation: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
  },
  navButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  navText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
});
