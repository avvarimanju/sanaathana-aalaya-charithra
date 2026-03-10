/**
 * Sentiment Analysis Lambda Handler
 * Feature: real-time-reports-dashboard
 * Task: 10.4
 * 
 * EventBridge trigger handler for sentiment analysis:
 * - Triggered by DynamoDB Stream events on Feedback table
 * - Analyzes sentiment using AWS Comprehend
 * - Updates feedback records with sentiment scores
 * - Triggers cache invalidation
 * - Notifies WebSocket clients of updates
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 9.1
 */

import { DynamoDBStreamEvent, DynamoDBRecord } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient } from '@aws-sdk/client-apigatewaymanagementapi';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { SentimentAnalyzer } from '../services/SentimentAnalyzer';
import { CacheService } from '../services/CacheService';
import { WebSocketManager } from '../services/WebSocketManager';
import { FeedbackRepository } from '../repositories/FeedbackRepository';
import { getConfig } from '../config';
import { Feedback, DashboardUpdate } from '../types';

// Initialize AWS clients
const config = getConfig();
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: config.region }));

// Initialize services
const sentimentAnalyzer = new SentimentAnalyzer();
const cacheService = new CacheService(config.redisEndpoint, config.redisPort);
const feedbackRepository = new FeedbackRepository(dynamoClient, config.feedbackTableName);

// WebSocket manager will be initialized per invocation with API Gateway endpoint
let webSocketManager: WebSocketManager;

/**
 * Main Lambda handler for DynamoDB Stream events
 */
export async function handler(event: DynamoDBStreamEvent): Promise<void> {
  console.log('Sentiment analysis triggered', {
    recordCount: event.Records.length
  });

  // Initialize WebSocket manager
  // In production, get the WebSocket API endpoint from environment variable
  const wsEndpoint = process.env.WEBSOCKET_API_ENDPOINT || 'https://example.execute-api.us-east-1.amazonaws.com/prod';
  const apiGatewayClient = new ApiGatewayManagementApiClient({ endpoint: wsEndpoint });
  webSocketManager = new WebSocketManager(dynamoClient, apiGatewayClient, config.connectionsTableName);

  // Process each record
  const processPromises = event.Records.map(record => processRecord(record));
  
  // Wait for all processing to complete
  const results = await Promise.allSettled(processPromises);
  
  // Log results
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log('Sentiment analysis completed', {
    total: event.Records.length,
    successful,
    failed
  });
  
  // Log failures
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error('Record processing failed', {
        recordIndex: index,
        error: result.reason
      });
    }
  });
}

/**
 * Process a single DynamoDB Stream record
 */
async function processRecord(record: DynamoDBRecord): Promise<void> {
  try {
    // Only process INSERT and MODIFY events
    if (record.eventName !== 'INSERT' && record.eventName !== 'MODIFY') {
      console.log('Skipping event', { eventName: record.eventName });
      return;
    }

    // Extract new image
    if (!record.dynamodb?.NewImage) {
      console.warn('No new image in record');
      return;
    }

    const feedback = unmarshall(record.dynamodb.NewImage as any) as Feedback;

    // Skip if sentiment already analyzed
    if (feedback.sentimentScore !== undefined && feedback.sentimentLabel !== undefined) {
      console.log('Sentiment already analyzed', { feedbackId: feedback.feedbackId });
      return;
    }

    // Skip if no review text to analyze
    if (!feedback.reviewText || feedback.reviewText.trim().length === 0) {
      console.log('No review text to analyze', { feedbackId: feedback.feedbackId });
      
      // Set neutral sentiment for empty reviews
      await updateFeedbackSentiment(feedback.feedbackId, {
        sentimentScore: 0,
        sentimentLabel: 'neutral'
      });
      
      return;
    }

    // Analyze sentiment
    console.log('Analyzing sentiment', {
      feedbackId: feedback.feedbackId,
      reviewTextLength: feedback.reviewText.length
    });

    const sentimentResult = await sentimentAnalyzer.analyzeSentiment(feedback.reviewText);

    // Update feedback record with sentiment
    await updateFeedbackSentiment(feedback.feedbackId, {
      sentimentScore: sentimentResult.score,
      sentimentLabel: sentimentResult.label
    });

    // Invalidate cache for this feedback
    await invalidateCache(feedback);

    // Notify WebSocket clients
    await notifyClients(feedback, sentimentResult);

    console.log('Sentiment analysis completed', {
      feedbackId: feedback.feedbackId,
      sentimentLabel: sentimentResult.label,
      sentimentScore: sentimentResult.score
    });

  } catch (error) {
    console.error('Failed to process record', { error });
    throw error;
  }
}

/**
 * Update feedback record with sentiment scores
 */
async function updateFeedbackSentiment(
  feedbackId: string,
  sentiment: { sentimentScore: number; sentimentLabel: string }
): Promise<void> {
  try {
    await dynamoClient.send(
      new UpdateCommand({
        TableName: config.feedbackTableName,
        Key: { feedbackId },
        UpdateExpression: 'SET sentimentScore = :score, sentimentLabel = :label, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':score': sentiment.sentimentScore,
          ':label': sentiment.sentimentLabel,
          ':updatedAt': new Date().toISOString()
        }
      })
    );
  } catch (error) {
    console.error('Failed to update feedback sentiment', { feedbackId, error });
    throw error;
  }
}

/**
 * Invalidate cache for updated feedback
 * Requirement 10.3: Cache invalidation on data changes
 */
async function invalidateCache(feedback: Feedback): Promise<void> {
  try {
    await cacheService.invalidateForFeedback(feedback.feedbackId, feedback.templeId);
    console.log('Cache invalidated', {
      feedbackId: feedback.feedbackId,
      templeId: feedback.templeId
    });
  } catch (error) {
    // Log error but don't fail the entire process
    console.error('Failed to invalidate cache', { feedbackId: feedback.feedbackId, error });
  }
}

/**
 * Notify WebSocket clients of sentiment analysis completion
 * Requirement 9.1: Real-time updates via WebSocket
 */
async function notifyClients(
  feedback: Feedback,
  sentiment: { score: number; label: string }
): Promise<void> {
  try {
    const update: DashboardUpdate = {
      type: 'new_review',
      data: {
        reviews: [{
          feedbackId: feedback.feedbackId,
          userId: feedback.userId,
          templeId: feedback.templeId,
          templeName: feedback.templeId, // Will be enriched by frontend
          rating: feedback.rating,
          reviewText: feedback.reviewText || '',
          sentimentLabel: sentiment.label as any,
          timestamp: feedback.timestamp,
          createdAt: feedback.createdAt
        }]
      },
      timestamp: Date.now()
    };

    // Broadcast to connections interested in this temple/region
    await webSocketManager.broadcastToFilters(update, {
      templeIds: [feedback.templeId],
      regions: [feedback.region]
    });

    console.log('WebSocket notification sent', {
      feedbackId: feedback.feedbackId,
      templeId: feedback.templeId
    });
  } catch (error) {
    // Log error but don't fail the entire process
    console.error('Failed to notify WebSocket clients', { feedbackId: feedback.feedbackId, error });
  }
}

/**
 * Batch process multiple feedback items
 * Used for backfilling sentiment analysis on existing data
 */
export async function batchHandler(event: { feedbackIds: string[] }): Promise<void> {
  console.log('Batch sentiment analysis triggered', {
    feedbackCount: event.feedbackIds.length
  });

  const batchSize = config.sentimentBatchSize || 25;
  const batches: string[][] = [];

  // Split into batches
  for (let i = 0; i < event.feedbackIds.length; i += batchSize) {
    batches.push(event.feedbackIds.slice(i, i + batchSize));
  }

  // Process batches sequentially to avoid throttling
  for (const batch of batches) {
    console.log('Processing batch', { size: batch.length });

    const batchPromises = batch.map(async feedbackId => {
      try {
        // Get feedback item
        const feedback = await feedbackRepository.getFeedbackById(feedbackId);
        
        if (!feedback) {
          console.warn('Feedback not found', { feedbackId });
          return;
        }

        // Skip if already analyzed
        if (feedback.sentimentScore !== undefined) {
          return;
        }

        // Analyze and update
        if (feedback.reviewText && feedback.reviewText.trim().length > 0) {
          const sentiment = await sentimentAnalyzer.analyzeSentiment(feedback.reviewText);
          await updateFeedbackSentiment(feedbackId, {
            sentimentScore: sentiment.score,
            sentimentLabel: sentiment.label
          });
        }
      } catch (error) {
        console.error('Failed to process feedback in batch', { feedbackId, error });
      }
    });

    await Promise.allSettled(batchPromises);
  }

  console.log('Batch sentiment analysis completed');
}
