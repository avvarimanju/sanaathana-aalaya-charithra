import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Minimal test app to verify React Native is working
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>✅ Mobile App is Working!</Text>
      <Text style={styles.subtitle}>If you see this, React Native is rendering correctly.</Text>
      <Text style={styles.info}>Environment: {process.env.EXPO_PUBLIC_ENVIRONMENT || 'Not Set'}</Text>
      <Text style={styles.info}>API URL: {process.env.EXPO_PUBLIC_API_URL || 'Not Set'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    color: '#fff',
    marginTop: 10,
    opacity: 0.9,
  },
});
