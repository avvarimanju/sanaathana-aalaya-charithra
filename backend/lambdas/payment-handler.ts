import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const PURCHASES_TABLE = process.env.PURCHASES_TABLE || 'SanaathanaAalayaCharithra-Purchases';

// Initialize Razorpay
// TODO: Add these to AWS Lambda environment variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_PLACEHOLDER',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'PLACEHOLDER_SECRET',
});

/**
 * Main Lambda handler - routes to appropriate function based on path
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const path = event.path;
  const method = event.httpMethod;

  try {
    // Route to appropriate handler
    if (path.includes('/create-order') && method === 'POST') {
      return await createOrder(event);
    } else if (path.includes('/verify') && method === 'POST') {
      return await verifyPayment(event);
    } else if (path.includes('/check-access') && method === 'GET') {
      return await checkAccess(event);
    } else if (path.includes('/purchases') && method === 'GET') {
      return await getPurchases(event);
    } else {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Not found' }),
      };
    }
  } catch (error: any) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message || 'Internal server error',
      }),
    };
  }
};

/**
 * Create Razorpay order
 */
const createOrder = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { amount, currency = 'INR', templeId, userId } = body;

    if (!amount || !templeId || !userId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields',
        }),
      };
    }

    // Create order in Razorpay
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency,
      receipt: `temple_${templeId}_${Date.now()}`,
      notes: {
        templeId,
        userId,
      },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      }),
    };
  } catch (error: any) {
    console.error('Create order error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to create order',
      }),
    };
  }
};

/**
 * Verify payment signature
 */
const verifyPayment = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      templeId,
      userId,
    } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Missing payment details',
        }),
      };
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Invalid payment signature',
        }),
      };
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Payment not successful',
        }),
      };
    }

    // Save purchase to DynamoDB
    const purchaseId = `${userId}_${templeId}_${Date.now()}`;
    const purchaseDate = new Date().toISOString();
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    await docClient.send(
      new PutCommand({
        TableName: PURCHASES_TABLE,
        Item: {
          userId,
          purchaseId,
          templeId,
          amount: Number(payment.amount) / 100, // Convert from paise to rupees
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          status: 'completed',
          purchaseDate,
          expiryDate,
          paymentMethod: payment.method,
          email: payment.email,
          contact: payment.contact,
        },
      })
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Payment verified and temple unlocked',
        expiryDate,
      }),
    };
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Payment verification failed',
      }),
    };
  }
};

/**
 * Check if user has access to temple
 */
const checkAccess = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { userId, templeId } = event.pathParameters || {};

    if (!userId || !templeId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasAccess: false,
          error: 'Missing userId or templeId',
        }),
      };
    }

    // Query DynamoDB for active purchase
    const result = await docClient.send(
      new GetCommand({
        TableName: PURCHASES_TABLE,
        Key: {
          userId,
          purchaseId: `${userId}_${templeId}`,
        },
      })
    );

    if (!result.Item) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasAccess: false,
        }),
      };
    }

    // Check if purchase is still valid (within 30 days)
    const expiryDate = new Date(result.Item.expiryDate);
    const now = new Date();
    const hasAccess = expiryDate > now;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hasAccess,
        expiryDate: result.Item.expiryDate,
        purchaseDate: result.Item.purchaseDate,
      }),
    };
  } catch (error: any) {
    console.error('Check access error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hasAccess: false,
        error: error.message || 'Failed to check access',
      }),
    };
  }
};

/**
 * Get user's purchased temples
 */
const getPurchases = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { userId } = event.pathParameters || {};

    if (!userId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temples: [],
          error: 'Missing userId',
        }),
      };
    }

    // TODO: Implement query to get all purchases for user
    // For now, return empty array
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        temples: [],
      }),
    };
  } catch (error: any) {
    console.error('Get purchases error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        temples: [],
        error: error.message || 'Failed to get purchases',
      }),
    };
  }
};
