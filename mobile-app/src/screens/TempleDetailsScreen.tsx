import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface Artifact {
  artifactId: string;
  name: string;
  type: string;
  description: string;
  qrCode: string;
  isUnlocked: boolean;
}

interface TempleDetails {
  siteId: string;
  name: string;
  location: {
    address: string;
    city: string;
    state: string;
  };
  description: string;
  historicalContext: string;
  visitingHours: any;
  entryFee: {
    indian: number;
    foreign: number;
    currency: string;
  };
  artifacts: Artifact[];
}

export default function TempleDetailsScreen({ route, navigation }: any) {
  const { templeId } = route.params;
  const [temple, setTemple] = useState<TempleDetails | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    loadTempleDetails();
  }, [templeId]);

  const loadTempleDetails = () => {
    // Mock data - replace with API call
    const mockTemple: TempleDetails = {
      siteId: templeId,
      name: 'Lepakshi Temple',
      location: {
        address: 'Lepakshi, Hindupur Taluk, Anantapur District',
        city: 'Lepakshi',
        state: 'Andhra Pradesh',
      },
      description: 'Magnificent Veerabhadra Temple known for its hanging pillar and stunning frescoes',
      historicalContext: 'Built in 16th century during Vijayanagara Empire by brothers Virupanna and Viranna',
      visitingHours: {
        monday: { open: '06:00', close: '18:00' },
      },
      entryFee: {
        indian: 25,
        foreign: 300,
        currency: 'INR',
      },
      artifacts: [
        {
          artifactId: 'hanging-pillar',
          name: 'Hanging Pillar',
          type: 'Architecture',
          description: 'Mysterious pillar that hangs without touching the ground',
          qrCode: 'LP-PILLAR-001',
          isUnlocked: false,
        },
        {
          artifactId: 'monolithic-nandi',
          name: 'Monolithic Nandi',
          type: 'Sculpture',
          description: 'Largest monolithic Nandi bull in India',
          qrCode: 'LP-NANDI-002',
          isUnlocked: false,
        },
        {
          artifactId: 'ceiling-paintings',
          name: 'Vijayanagara Ceiling Paintings',
          type: 'Painting',
          description: 'Exquisite frescoes depicting scenes from epics',
          qrCode: 'LP-PAINT-003',
          isUnlocked: false,
        },
      ],
    };

    setTemple(mockTemple);
  };

  const handleUnlockTemple = () => {
    // Navigate to payment screen
    navigation.navigate('Payment', {
      type: 'temple',
      itemId: templeId,
      itemName: temple?.name,
      price: 99,
    });
  };

  const handleDownload = () => {
    // Handle download logic
    alert('Download started! You will be notified when complete.');
    setIsDownloaded(true);
  };

  if (!temple) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header Image */}
      <View style={styles.headerImage}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerImageIcon}>🏛️</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Temple Info */}
        <View style={styles.infoSection}>
          <Text style={styles.templeName}>{temple.name}</Text>
          <Text style={styles.templeLocation}>
            📍 {temple.location.city}, {temple.location.state}
          </Text>
          
          <View style={styles.quickInfo}>
            <View style={styles.quickInfoItem}>
              <Text style={styles.quickInfoLabel}>⏰ Timings</Text>
              <Text style={styles.quickInfoValue}>
                {temple.visitingHours.monday.open} - {temple.visitingHours.monday.close}
              </Text>
            </View>
            <View style={styles.quickInfoItem}>
              <Text style={styles.quickInfoLabel}>💰 Entry Fee</Text>
              <Text style={styles.quickInfoValue}>
                ₹{temple.entryFee.indian} (Indian)
              </Text>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📖 About</Text>
          <Text style={styles.sectionText}>{temple.description}</Text>
          <Text style={styles.sectionText} style={{ marginTop: 10 }}>
            {temple.historicalContext}
          </Text>
        </View>

        {/* Artifacts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🗿 Artifacts ({temple.artifacts.length})
          </Text>
          
          {temple.artifacts.map(artifact => (
            <TouchableOpacity
              key={artifact.artifactId}
              style={styles.artifactCard}
              onPress={() => navigation.navigate('ArtifactDetails', {
                artifactId: artifact.artifactId,
                templeId: temple.siteId,
              })}
            >
              <View style={styles.artifactIcon}>
                <Text style={styles.artifactIconText}>
                  {artifact.type === 'Architecture' ? '🏛️' : 
                   artifact.type === 'Sculpture' ? '🗿' : '🎨'}
                </Text>
              </View>
              
              <View style={styles.artifactInfo}>
                <Text style={styles.artifactName}>{artifact.name}</Text>
                <Text style={styles.artifactType}>{artifact.type}</Text>
                <Text style={styles.artifactDescription} numberOfLines={2}>
                  {artifact.description}
                </Text>
              </View>
              
              <View style={styles.artifactLock}>
                <Text style={styles.artifactLockIcon}>
                  {artifact.isUnlocked ? '🔓' : '🔒'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Unlock Section */}
        <View style={styles.unlockSection}>
          <View style={styles.unlockCard}>
            <Text style={styles.unlockTitle}>🔓 Unlock Full Access</Text>
            <Text style={styles.unlockDescription}>
              Get complete access to all {temple.artifacts.length} artifacts in this temple:
            </Text>
            <View style={styles.unlockFeatures}>
              <Text style={styles.unlockFeature}>• 🎧 Audio Guides</Text>
              <Text style={styles.unlockFeature}>• 📖 Detailed History</Text>
              <Text style={styles.unlockFeature}>• 🎥 Video Content</Text>
              <Text style={styles.unlockFeature}>• 💬 Ask Questions</Text>
              <Text style={styles.unlockFeature}>• 📥 Offline Downloads</Text>
            </View>
            
            <TouchableOpacity
              style={styles.unlockButton}
              onPress={handleUnlockTemple}
            >
              <Text style={styles.unlockButtonText}>
                Unlock for ₹99
              </Text>
              <Text style={styles.unlockButtonSubtext}>
                30-day access
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, isDownloaded && styles.actionButtonDisabled]}
            onPress={handleDownload}
            disabled={isDownloaded}
          >
            <Text style={styles.actionButtonText}>
              {isDownloaded ? '✓ Downloaded' : '📥 Download All'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {/* Handle favorite */}}
          >
            <Text style={styles.actionButtonText}>⭐ Add to Favorites</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImage: {
    height: 200,
    backgroundColor: '#FFE5D9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  headerImageIcon: {
    fontSize: 80,
  },
  content: {
    flex: 1,
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  templeName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  templeLocation: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  quickInfo: {
    flexDirection: 'row',
    gap: 20,
  },
  quickInfoItem: {
    flex: 1,
  },
  quickInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  quickInfoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sectionText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  artifactCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  artifactIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFE5D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  artifactIconText: {
    fontSize: 24,
  },
  artifactInfo: {
    flex: 1,
  },
  artifactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  artifactType: {
    fontSize: 12,
    color: '#FF6B35',
    marginBottom: 5,
  },
  artifactDescription: {
    fontSize: 13,
    color: '#666',
  },
  artifactLock: {
    marginLeft: 10,
  },
  artifactLockIcon: {
    fontSize: 24,
  },
  unlockSection: {
    padding: 20,
  },
  unlockCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  unlockTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  unlockDescription: {
    fontSize: 15,
    color: '#666',
    marginBottom: 15,
  },
  unlockFeatures: {
    marginBottom: 20,
  },
  unlockFeature: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
  },
  unlockButton: {
    backgroundColor: '#FF6B35',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  unlockButtonSubtext: {
    color: '#fff',
    fontSize: 12,
    marginTop: 3,
    opacity: 0.9,
  },
  actionButtons: {
    padding: 20,
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actionButtonDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});
