// Payment Screen Component
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { razorpayService } from '../services/razorpay.service';

interface PaymentScreenProps {
  route: {
    params: {
      templeId: string;
      templeName: string;
      amount: number;
      userId: string;
    };
  };
  navigation: any;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
  route,
  navigation,
}) => {
  const { templeId, templeName, amount, userId } = route.params;
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      const result = await razorpayService.initiatePayment({
        amount,
        templeId,
        templeName,
        userId,
      });

      if (result.success) {
        Alert.alert(
          'Payment Successful!',
          `You have unlocked ${templeName}. Enjoy the full experience!`,
          [
            {
              text: 'Explore Now',
              onPress: () => {
                navigation.navigate('TempleDetails', { templeId });
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Payment Failed',
          result.error || 'Something went wrong. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Unlock Full Content</Text>
        
        <View style={styles.templeInfo}>
          <Text style={styles.templeName}>{templeName}</Text>
          <Text style={styles.description}>
            Get access to:
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.feature}>✓ Full audio guide</Text>
            <Text style={styles.feature}>✓ HD video content</Text>
            <Text style={styles.feature}>✓ Detailed descriptions</Text>
            <Text style={styles.feature}>✓ Interactive Q&A</Text>
            <Text style={styles.feature}>✓ Offline download</Text>
            <Text style={styles.feature}>✓ Lifetime access</Text>
          </View>
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>One-time payment</Text>
          <Text style={styles.price}>₹{amount}</Text>
          <Text style={styles.priceNote}>Valid for 30 days</Text>
        </View>

        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Pay ₹{amount}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.secureNote}>
          🔒 Secure payment powered by Razorpay
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  templeInfo: {
    marginBottom: 24,
  },
  templeName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  featureList: {
    marginLeft: 8,
  },
  feature: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  priceNote: {
    fontSize: 12,
    color: '#999',
  },
  payButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  secureNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
});
