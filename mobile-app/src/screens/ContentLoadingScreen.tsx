import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function ContentLoadingScreen({ navigation, route }: any) {
  const { artifact, language } = route.params;
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Connecting to AI...');

  useEffect(() => {
    // Simulate AI content generation
    const steps = [
      { delay: 500, progress: 20, status: 'Analyzing artifact...' },
      { delay: 1000, progress: 40, status: 'Generating content with Bedrock...' },
      { delay: 1500, progress: 60, status: 'Creating audio guide with Polly...' },
      { delay: 2000, progress: 80, status: 'Preparing multimedia...' },
      { delay: 2500, progress: 100, status: 'Ready!' },
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        setProgress(step.progress);
        setStatus(step.status);
        
        if (step.progress === 100) {
          setTimeout(() => {
            navigation.replace('AudioGuide', { artifact, language });
          }, 500);
        }
      }, step.delay);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.artifactName}>{artifact.name}</Text>
      <Text style={styles.location}>{artifact.location}</Text>

      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.status}>{status}</Text>
        
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>

      <View style={styles.aiInfo}>
        <Text style={styles.aiInfoTitle}>🤖 AI Services Active:</Text>
        <Text style={styles.aiInfoItem}>✓ Amazon Bedrock (Content Generation)</Text>
        <Text style={styles.aiInfoItem}>✓ Amazon Polly (Text-to-Speech)</Text>
        <Text style={styles.aiInfoItem}>✓ Amazon Translate (Multilingual)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artifactName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  status: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
    marginBottom: 20,
  },
  progressBar: {
    width: 250,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
  },
  progressText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  aiInfo: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 10,
    width: '100%',
  },
  aiInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  aiInfoItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
});
