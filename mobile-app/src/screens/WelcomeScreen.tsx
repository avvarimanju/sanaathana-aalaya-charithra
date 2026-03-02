import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageBackground } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Welcome screen images with captions
const WELCOME_IMAGES = [
  {
    source: require('../../assets/Nandi_Lepakshi_Temple_Hindupur.jpg'),
    caption: 'Nandi, Lepakshi Temple'
  },
  {
    source: require('../../assets/Sahaja_Shila_Thoranam_Tirumala.jpg'),
    caption: 'Shilathoranam, Tirumala'
  },
  {
    source: require('../../assets/TemplePortrait.png'),
    caption: 'Temple Gopuram'
  }
];

export default function WelcomeScreen({ navigation }: any) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-rotate images every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % WELCOME_IMAGES.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const currentImage = WELCOME_IMAGES[currentImageIndex];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background Image - Rotating */}
      <ImageBackground
        key={currentImageIndex}
        source={currentImage.source}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Overlay for better text readability */}
        <View style={styles.overlay} />
        
        {/* Content */}
        <View style={styles.content}>
          {/* Logo/Icon */}
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🏛️</Text>
            <Text style={styles.title}>Sanaathana Aalaya Charithra</Text>
            <Text style={styles.subtitle}>Eternal Temple History</Text>
          </View>

          {/* Tagline */}
          <Text style={styles.tagline}>
            Experience Hindu Temple Heritage{'\n'}Through AI
          </Text>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🤖</Text>
              <Text style={styles.featureText}>AI-Powered Content</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🗣️</Text>
              <Text style={styles.featureText}>10+ Languages</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>📱</Text>
              <Text style={styles.featureText}>QR Code Access</Text>
            </View>
          </View>

          {/* Get Started Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>

          {/* Image Credit - Now shows current image caption */}
          <View style={styles.imageCreditContainer}>
            <Text style={styles.imageCredit}>
              {currentImage.caption}
            </Text>
            {/* Image indicators */}
            <View style={styles.indicators}>
              {WELCOME_IMAGES.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentImageIndex && styles.indicatorActive
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 107, 53, 0.75)', // Orange overlay with transparency
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 24,
    color: '#fff',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 50,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageCreditContainer: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  imageCredit: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    marginBottom: 10,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: '#fff',
    width: 24,
  },
});
