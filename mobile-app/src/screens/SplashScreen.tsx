import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
// import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen({ navigation }: any) {
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // In production: Check AsyncStorage for auth token
      // const authToken = await AsyncStorage.getItem('authToken');
      // const language = await AsyncStorage.getItem('selectedLanguage');
      
      // Mock check - simulate loading
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo: Always go to Welcome
      // In production: Check if user is logged in
      const isLoggedIn = false; // await AsyncStorage.getItem('authToken');
      const hasSelectedLanguage = false; // await AsyncStorage.getItem('selectedLanguage');
      
      if (isLoggedIn && hasSelectedLanguage) {
        // User is logged in and has selected language
        // Go directly to Explore
        navigation.replace('Explore');
      } else if (isLoggedIn) {
        // User is logged in but hasn't selected language
        navigation.replace('LanguageSelection');
      } else {
        // User is not logged in
        navigation.replace('Welcome');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      navigation.replace('Welcome');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Text style={styles.logo}>🏛️</Text>
      <Text style={styles.title}>Sanaathana Aalaya Charithra</Text>
      <Text style={styles.subtitle}>Eternal Temple History</Text>
      
      <ActivityIndicator 
        size="large" 
        color="#fff" 
        style={styles.loader}
      />
      
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 50,
  },
  loader: {
    marginTop: 30,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 15,
    opacity: 0.8,
  },
});
