import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const MOCK_CONTENT = {
  'qr-001': {
    title: 'Qutub Minar',
    audioGuide: 'Welcome to Qutub Minar, a UNESCO World Heritage Site and one of Delhi\'s most iconic monuments. This magnificent tower stands 73 meters tall and was built in 1193 by Qutb-ud-din Aibak...',
    facts: [
      'Built in 1193 CE',
      'Height: 73 meters (240 feet)',
      'UNESCO World Heritage Site since 1993',
      'Made of red sandstone and marble',
    ],
  },
  'qr-002': {
    title: 'Taj Mahal',
    audioGuide: 'Welcome to the Taj Mahal, one of the Seven Wonders of the World. This ivory-white marble mausoleum was commissioned by Mughal Emperor Shah Jahan in memory of his beloved wife Mumtaz Mahal...',
    facts: [
      'Built between 1632-1653',
      'Took 22 years to complete',
      'Over 20,000 artisans worked on it',
      'Made of white marble from Rajasthan',
    ],
  },
  'qr-003': {
    title: 'Hampi Ruins',
    audioGuide: 'Welcome to Hampi, the ancient capital of the Vijayanagara Empire. This UNESCO World Heritage Site features stunning ruins spread across 4,100 hectares, showcasing the grandeur of medieval Hindu architecture...',
    facts: [
      'Capital of Vijayanagara Empire (1336-1565)',
      'UNESCO World Heritage Site since 1986',
      'Over 1,600 monuments',
      'Spread across 4,100 hectares',
    ],
  },
};

export default function AudioGuideScreen({ navigation, route }: any) {
  const { artifact, language } = route.params;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(180); // 3 minutes

  const content = MOCK_CONTENT[artifact.id as keyof typeof MOCK_CONTENT] || MOCK_CONTENT['qr-001'];

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
