// Razorpay Payment Service
import { Alert } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { apiService } from './api.service';

export interface PaymentOptions {
  amount: number; // in rupees
  templeId: string;
  templeName: string;
  userId: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  error?: string;
}

class RazorpayService {
  private razorpayKeyId: string;

  constructor() {
    // TODO: Replace with your actual Razorpay keys after receiving OTP
    // Get keys from: Razorpay Dashboard → Settings → API Keys
    // Test key format: rzp_test_XXXXXXXXXXXX
    // Live key format: rzp_live_XXXXXXXXXXXX
    this.razorpayKeyId = __DEV__ 
      ? 'rzp_test_PLACEHOLDER_KEY' // ⚠️ REPLACE with your test key from Razorpay Dashboard
      : 'rzp_live_PLACEHOLDER_KEY'; // ⚠️ REPLACE with your live key after KYC approval
  }

  /**
   * Initialize payment and open Razorpay checkout
   */
  async initiatePayment(options: PaymentOptions): Promise<PaymentResult> {
    try {
      // Step 1: Create order on backend
      const order = await this.createOrder(options);

      if (!order.success) {
        return {
          success: false,
          error: order.error || 'Failed to create order',
        };
      }

      // Step 2: Open Razorpay checkout
      const paymentData = {
        description: `Unlock ${options.templeName}`,
        image: 'https://your-cdn-url.com/logo.png', // Your app logo
        currency: 'INR',
        key: this.razorpayKeyId,
        amount: options.amount * 100, // Convert to paise
        order_id: order.orderId,
        name: 'Sanaathana Aalaya Charithra',
        prefill: {
          email: 'user@example.com', // Get from user profile
          contact: '9999999999', // Get from user profile
          name: 'User Name', // Get from user profile
        },
        theme: { color: '#FF6B35' }, // Your app theme color
      };

      // Step 3: Open Razorpay payment modal
      const paymentResult = await RazorpayCheckout.open(paymentData);

      // Step 4: Verify payment on backend
      const verification = await this.verifyPayment({
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_order_id: paymentResult.razorpay_order_id,
        razorpay_signature: paymentResult.razorpay_signature,
        templeId: options.templeId,
        userId: options.userId,
      });

      if (verification.success) {
        return {
          success: true,
          paymentId: paymentResult.razorpay_payment_id,
          orderId: paymentResult.razorpay_order_id,
          signature: paymentResult.razorpay_signature,
        };
      } else {
        return {
          success: false,
          error: 'Payment verification failed',
        };
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      
      // Handle user cancellation
      if (error.code === RazorpayCheckout.PAYMENT_CANCELLED) {
        return {
          success: false,
          error: 'Payment cancelled by user',
        };
      }

      return {
        success: false,
        error: error.description || 'Payment failed',
      };
    }
  }

  /**
   * Create order on backend
   */
  private async createOrder(options: PaymentOptions) {
    try {
      const response = await apiService.post('/payments/create-order', {
        amount: options.amount,
        currency: 'INR',
        templeId: options.templeId,
        userId: options.userId,
      });

      return response.data;
    } catch (error) {
      console.error('Create order error:', error);
      return {
        success: false,
        error: 'Failed to create order',
      };
    }
  }

  /**
   * Verify payment on backend
   */
  private async verifyPayment(data: any) {
    try {
      const response = await apiService.post('/payments/verify', data);
      return response.data;
    } catch (error) {
      console.error('Verify payment error:', error);
      return {
        success: false,
        error: 'Payment verification failed',
      };
    }
  }

  /**
   * Check if temple is already unlocked
   */
  async isTempleUnlocked(templeId: string, userId: string): Promise<boolean> {
    try {
      const response = await apiService.get(
        `/payments/check-access/${userId}/${templeId}`
      );
      return response.data.hasAccess || false;
    } catch (error) {
      console.error('Check access error:', error);
      return false;
    }
  }

  /**
   * Get user's purchased temples
   */
  async getPurchasedTemples(userId: string): Promise<string[]> {
    try {
      const response = await apiService.get(`/payments/purchases/${userId}`);
      return response.data.temples || [];
    } catch (error) {
      console.error('Get purchases error:', error);
      return [];
    }
  }
}

export const razorpayService = new RazorpayService();
