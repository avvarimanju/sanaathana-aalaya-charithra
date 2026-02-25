// Mock AWS SDK BEFORE importing the handler
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(),
  },
  PutCommand: jest.fn(),
  GetCommand: jest.fn(),
}));

// Mock Razorpay
jest.mock('razorpay', () => {
  const mockRazorpay = jest.fn().mockImplementation(() => ({
    orders: {
      create: jest.fn(),
    },
    payments: {
      fetch: jest.fn(),
    },
  }));
  return { default: mockRazorpay };
});

// Mock crypto
jest.mock('crypto', () => ({
  createHmac: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'valid_signature'),
  })),
}));

import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../src/lambdas/payment-handler';

describe('Payment Handler Lambda', () => {
  let mockDynamoDBSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset crypto mock to default behavior
    const crypto = require('crypto');
    crypto.createHmac = jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn(() => 'valid_signature'),
    }));

    // Mock DynamoDB
    const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
    mockDynamoDBSend = jest.fn();
    DynamoDBDocumentClient.from = jest.fn(() => ({
      send: mockDynamoDBSend,
    }));
  });

  describe('Create Order Endpoint', () => {
    it('should create a Razorpay order successfully', async () => {
      const Razorpay = require('razorpay').default;
      const mockRazorpay = Razorpay.mock.results[0].value;
      mockRazorpay.orders.create.mockResolvedValue({
        id: 'order_test123',
        amount: 9900,
        currency: 'INR',
      });

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/payments/create-order',
        body: JSON.stringify({
          amount: 99,
          currency: 'INR',
          templeId: 'lepakshi',
          userId: 'user123',
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.orderId).toBe('order_test123');
      expect(body.amount).toBe(9900);
      expect(body.currency).toBe('INR');
    });

    it('should reject order creation with missing fields', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/payments/create-order',
        body: JSON.stringify({
          amount: 99,
          // Missing templeId and userId
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Missing required fields');
    });

    it('should handle Razorpay API errors', async () => {
      const Razorpay = require('razorpay');
      const mockRazorpay = new Razorpay();
      mockRazorpay.orders.create.mockRejectedValue(new Error('Razorpay API error'));

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/payments/create-order',
        body: JSON.stringify({
          amount: 99,
          currency: 'INR',
          templeId: 'lepakshi',
          userId: 'user123',
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });
  });

  describe('Verify Payment Endpoint', () => {
    it('should verify payment signature successfully', async () => {
      const Razorpay = require('razorpay');
      const mockRazorpay = new Razorpay();
      mockRazorpay.payments.fetch.mockResolvedValue({
        id: 'pay_test123',
        status: 'captured',
        amount: 9900,
        method: 'upi',
        email: 'user@example.com',
        contact: '9999999999',
      });

      mockDynamoDBSend.mockResolvedValue({});

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/payments/verify',
        body: JSON.stringify({
          razorpay_payment_id: 'pay_test123',
          razorpay_order_id: 'order_test123',
          razorpay_signature: 'valid_signature',
          templeId: 'lepakshi',
          userId: 'user123',
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.message).toContain('verified');
      expect(mockDynamoDBSend).toHaveBeenCalled();
    });

    it('should reject invalid payment signature', async () => {
      const crypto = require('crypto');
      crypto.createHmac = jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn(() => 'different_signature'),
      }));

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/payments/verify',
        body: JSON.stringify({
          razorpay_payment_id: 'pay_test123',
          razorpay_order_id: 'order_test123',
          razorpay_signature: 'invalid_signature',
          templeId: 'lepakshi',
          userId: 'user123',
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid payment signature');
    });

    it('should reject payment with missing details', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/payments/verify',
        body: JSON.stringify({
          razorpay_payment_id: 'pay_test123',
          // Missing order_id and signature
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Missing payment details');
    });

    it('should reject payment that is not captured', async () => {
      const Razorpay = require('razorpay');
      const mockRazorpay = new Razorpay();
      mockRazorpay.payments.fetch.mockResolvedValue({
        id: 'pay_test123',
        status: 'failed',
        amount: 9900,
      });

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/payments/verify',
        body: JSON.stringify({
          razorpay_payment_id: 'pay_test123',
          razorpay_order_id: 'order_test123',
          razorpay_signature: 'valid_signature',
          templeId: 'lepakshi',
          userId: 'user123',
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Payment not successful');
    });
  });

  describe('Check Access Endpoint', () => {
    it('should return true for valid active purchase', async () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
      
      mockDynamoDBSend.mockResolvedValue({
        Item: {
          userId: 'user123',
          purchaseId: 'user123_lepakshi',
          templeId: 'lepakshi',
          expiryDate: futureDate,
          purchaseDate: new Date().toISOString(),
          status: 'completed',
        },
      });

      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/payments/check-access/user123/lepakshi',
        body: null,
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: {
          userId: 'user123',
          templeId: 'lepakshi',
        },
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.hasAccess).toBe(true);
      expect(body.expiryDate).toBe(futureDate);
    });

    it('should return false for expired purchase', async () => {
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      
      mockDynamoDBSend.mockResolvedValue({
        Item: {
          userId: 'user123',
          purchaseId: 'user123_lepakshi',
          templeId: 'lepakshi',
          expiryDate: pastDate,
          purchaseDate: new Date().toISOString(),
          status: 'completed',
        },
      });

      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/payments/check-access/user123/lepakshi',
        body: null,
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: {
          userId: 'user123',
          templeId: 'lepakshi',
        },
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.hasAccess).toBe(false);
    });

    it('should return false for non-existent purchase', async () => {
      mockDynamoDBSend.mockResolvedValue({
        Item: undefined,
      });

      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/payments/check-access/user123/lepakshi',
        body: null,
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: {
          userId: 'user123',
          templeId: 'lepakshi',
        },
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.hasAccess).toBe(false);
    });

    it('should reject request with missing parameters', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/payments/check-access',
        body: null,
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.hasAccess).toBe(false);
      expect(body.error).toContain('Missing userId or templeId');
    });
  });

  describe('Get Purchases Endpoint', () => {
    it('should return user purchases', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/payments/purchases/user123',
        body: null,
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: {
          userId: 'user123',
        },
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.temples).toBeDefined();
      expect(Array.isArray(body.temples)).toBe(true);
    });

    it('should reject request with missing userId', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/payments/purchases',
        body: null,
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.temples).toEqual([]);
      expect(body.error).toContain('Missing userId');
    });
  });

  describe('Invalid Endpoint', () => {
    it('should return 404 for unknown endpoint', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/payments/unknown',
        body: null,
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle DynamoDB errors gracefully', async () => {
      mockDynamoDBSend.mockRejectedValue(new Error('DynamoDB error'));

      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/payments/check-access/user123/lepakshi',
        body: null,
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: {
          userId: 'user123',
          templeId: 'lepakshi',
        },
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.hasAccess).toBe(false);
      expect(body.error).toBeDefined();
    });

    it('should handle malformed JSON in request body', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/payments/create-order',
        body: 'invalid json{',
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error).toBeDefined();
    });
  });

  describe('Payment Amount Validation', () => {
    it('should accept valid payment amount (99 rupees)', async () => {
      const Razorpay = require('razorpay');
      const mockRazorpay = new Razorpay();
      mockRazorpay.orders.create.mockResolvedValue({
        id: 'order_test123',
        amount: 9900,
        currency: 'INR',
      });

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/payments/create-order',
        body: JSON.stringify({
          amount: 99,
          currency: 'INR',
          templeId: 'lepakshi',
          userId: 'user123',
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockRazorpay.orders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 9900, // 99 * 100 paise
          currency: 'INR',
        })
      );
    });
  });

  describe('Purchase Expiry Calculation', () => {
    it('should set expiry date to 30 days from purchase', async () => {
      const Razorpay = require('razorpay');
      const mockRazorpay = new Razorpay();
      mockRazorpay.payments.fetch.mockResolvedValue({
        id: 'pay_test123',
        status: 'captured',
        amount: 9900,
        method: 'upi',
        email: 'user@example.com',
        contact: '9999999999',
      });

      let savedItem: any;
      mockDynamoDBSend.mockImplementation((command: any) => {
        if (command.input?.Item) {
          savedItem = command.input.Item;
        }
        return Promise.resolve({});
      });

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/payments/verify',
        body: JSON.stringify({
          razorpay_payment_id: 'pay_test123',
          razorpay_order_id: 'order_test123',
          razorpay_signature: 'valid_signature',
          templeId: 'lepakshi',
          userId: 'user123',
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      await handler(event);

      expect(savedItem).toBeDefined();
      expect(savedItem.expiryDate).toBeDefined();
      
      // Check that expiry is approximately 30 days from now
      const expiryDate = new Date(savedItem.expiryDate);
      const expectedExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const timeDiff = Math.abs(expiryDate.getTime() - expectedExpiry.getTime());
      expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
    });
  });
});
