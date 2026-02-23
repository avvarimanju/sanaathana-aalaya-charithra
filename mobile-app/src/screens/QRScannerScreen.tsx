import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

// Mock QR codes for demo
const MOCK_QR_CODES = [
  {
    id: 'LP-PILLAR-001',
    name: 'Hanging Pillar',
    type: 'Architecture',
    location: 'Lepakshi, Andhra Pradesh',
  },
  {
    id: 'LP-NANDI-002',
    name: 'Monolithic Nandi',
    type: 'Sculpture',
    location: 'Lepakshi, Andhra Pradesh',
  },
  {
    id: 'LP-PAINT-003',
    name: 'Ceiling Paintings',
    type: 'Painting',
    location: 'Lepakshi, Andhra Pradesh',
  },
  {
    id: 'TT-DEITY-001',
    name: 'Lord Venkateswara Deity',
    type: 'Sculpture',
    location: 'Tirupati, Andhra Pradesh',
  },
  {
    id: 'TT-GOPURAM-002',
    name: 'Golden Gopuram',
    type: 'Architecture',
    location: 'Tirupati, Andhra Pradesh',
  },
  {
    id: 'SK-LINGA-001',
    name: 'Vayu Linga',
    type: 'Sculpture',
    location: 'Sri Kalahasti, Andhra Pradesh',
  },
  {
    id: 'SK-KALAM-002',
    name: 'Kalamkari Paintings',
    type: 'Painting',
    location: 'Sri Kalahasti, Andhra Pradesh',
  },
  {
    id: 'SS-JYOTIR-001',
    name: 'Mallikarjuna Jyotirlinga',
    type: 'Sculpture',
    location: 'Srisailam, Andhra Pradesh',
  },
  {
    id: 'SS-SHAKTI-002',
    name: 'Goddess Bhramaramba',
    type: 'Sculpture',
    location: 'Srisailam, Andhra Pradesh',
  },
  {
    id: 'VD-DEITY-001',
    name: 'Narasimha Deity',
    type: 'Sculpture',
    location: 'Vidurashwatha, Karnataka',
  },
  {
    id: 'VD-PILLAR-002',
    name: 'Hoysala Pillars',
    type: 'Architecture',
    location: 'Vidurashwatha, Karnataka',
  },
  {
    id: 'HM-TEMPLE-001',
    name: 'Virupaksha Temple',
    type: 'Temple',
    location: 'Hampi, Karnataka',
  },
  {
    id: 'HM-CHARIOT-002',
    name: 'Stone Chariot',
    type: 'Sculpture',
    location: 'Hampi, Karnataka',
  },
];

export default function QRScannerScreen({ navigation, route }: any) {
  const [scanning, setScanning] = useState(false);
  const language = route.params?.language || 'en';

  const handleScanDemo = (artifact: any) => {
    setScanning(true);
    
    // Simulate QR scan delay
    setTimeout(() => {
      setScanning(false);
      navigation.navigate('ContentLoading', {
        artifact,
        language,
      });
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Camera View Placeholder */}
      <View style={styles.cameraView}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        
        <Text style={styles.instruction}>
          {scanning ? 'Scanning...' : 'Point camera at QR code'}
        </Text>
      </View>

      {/* Demo Buttons */}
      <View style={styles.demoSection}>
        <Text style={styles.demoTitle}>Demo Mode - Select an Artifact:</Text>
        
        {MOCK_QR_CODES.map((artifact) => (
          <TouchableOpacity
            key={artifact.id}
            style={styles.demoButton}
            onPress={() => handleScanDemo(artifact)}
            disabled={scanning}
          >
            <Text style={styles.artifactName}>{artifact.name}</Text>
            <Text style={styles.artifactDetails}>
              {artifact.type} • {artifact.location}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Info */}
      <Text style={styles.info}>
        In production, this would use your device camera to scan QR codes at heritage sites
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#FF6B35',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    marginTop: 30,
  },
  demoSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  demoButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  artifactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  artifactDetails: {
    fontSize: 12,
    color: '#666',
  },
  info: {
    color: '#999',
    fontSize: 11,
    textAlign: 'center',
    padding: 10,
    backgroundColor: '#fff',
  },
});
