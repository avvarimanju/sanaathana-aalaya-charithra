/**
 * Sentiment Analysis Lambda Handler
 * Triggered by EventBridge when new feedback is submitted
 * Analyzes sentiment and updates feedback records
 * Feature: real-time-reports-dashboard
 * 
 * Trigger: EventBridge rule on DynamoDB Stream
 */

import { EventBridgeEvent } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { SentimentAnalyzer } from '../services/SentimentAnalyzer';
import { CacheService } from '../services/CacheService';
import { WebSocketManager } from '../services/WebSocketManager';
import { getConfig } from '../config';
import { Feedback, DashboardUpdate } from '../types';

// Initialize services
const config = getConfig();
const dynamoClient = new DynamoDBClient({ region: config.region });
const sentimentAnalyzer = new SentimentAnalyzer(config.region);
const cacheService = new CacheService(config);

// Get API Gateway endpoint from environment or construct it
const apiGatewayEndpoint = process.env.WEBSOCKET_API_ENDPOINT || 
  `https://${process.env.WEBSOCKET_API_ID}.execute-api.${config.region}.amazonaws.com/${process.env.STAGE || 'prod'}`;

const webSocketManager = new WebSocketManager(dynamoClient, {
  connectionsTableName: config.connectionsTableName,
  apiGatewayEndpoint,
  connectionTtlHours: 24
});

/**
 * Main Lambda handler for sentiment analysis
 */
export async function handler(event: EventBridgeEvent<string, any>): Promise<void> {
  console.log('Sentiment analysis triggered', {
    eventId: event.id,
    timestamp: event.time
  });
  
  try {
    // Extract feedback data from event
    const feedback = extractFeedbackFromEvent(event);
    
    if (!feedback) {
      console.warn('No feedback data found in event', { eventId: event.id });
      return;
    }
    
    console.log('Processing feedback for sentiment analysis', {
      feedbackId: feedback.feedbackId,
      userId: feedback.userId,
      templeId: feedback.templeId,
      hasReviewText: !!feedback.reviewText
    });
    
    // Analyze sentiment
    const sentimentScore = await sentimentAnalyzer.analyzeSentiment(
      feedback.reviewText || '',
      feedback.rating
    );
    
    console.log('Sentiment analysis completed', {
      feedbackId: feedback.feedbackId,
      score: sentimentScore.score,
      label: sentimentScore.label
    });
    
    // Update feedback record with sentiment
    await updateFeedbackWithSentiment(
      feedback.feedbackId,
      feedback.timestamp,
      sentimentScore.score,
      sentimentScore.label
    );
    
    // Invalidate cache for affected data
    await invalidateCache(feedback);
    
    // Notify WebSocket clients of update
    await notifyClients(feedback, sentimentScore);
    
    console.log('Sentiment analysis processing completed', {
      feedbackId: feedback.feedbackId
    });
    
  } catch (error) {
    console.error('Error processing sentiment analysis:', {
      eventId: event.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Don't throw error to avoid Lambda retries
    // Log error for monitoring and alerting
  }
}

/**
 * Extract feedback data from EventBridge event
 */
function extractFeedbackFromEvent(event: EventBridgeEvent<string, any>): Feedback | null {
  try {
    // EventBridge event detail contains the DynamoDB Stream record
    const detail = event.detail;
    
    if (!detail || !detail.dynamodb || !detail.dynamodb.NewImage) {
      return null;
    }
    
    // Parse DynamoDB item from NewImage
    const newImage = detail.dynamodb.NewImage;
    
    // Convert DynamoDB format to Feedback object
    const feedback: Feedback = {
      feedbackId: newImage.feedbackId?.S || '',
      timestamp: parseInt(newImage.timestamp?.N || '0'),
      userId: newImage.userId?.S || '',
      templeId: newImage.templeId?.S || '',
      artifactId: newImage.artifactId?.S,
      rating: parseInt(newImage.rating?.N || '0'),
      reviewText: newImage.reviewText?.S,
      commentText: newImage.commentText?.S,
      commentType: newImage.commentType?.S as any,
      sentimentScore: newImage.sentimentScore?.N ? parseFloat(newImage.sentimentScore.N) : undefined,
      sentimentLabel: newImage.sentimentLabel?.S as any,
      region: newImage.region?.S || '',
      category: newImage.category?.S || '',
      metadata: {
        deviceType: newImage.metadata?.M?.deviceType?.S || '',
        appVersion: newImage.metadata?.M?.appVersion?.S || '',
        language: newImage.metadata?.M?.language?.S || ''
      },
      createdAt: newImage.createdAt?.S || '',
      updatedAt: newImage.updatedAt?.S || ''
    };
    
    return feedback;
    
  } catch (error) {
    console.error('Error extracting feedback from event:', {
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Update feedback record with sentiment analysis results
 */
async function updateFeedbackWithSentiment(
  feedbackId: string,
  timestamp: number,
  sentimentScore: number,
  sentimentLabel: string
): Promise<void> {
  const command = new UpdateItemCommand({
    TableName: config.feedbackTableName,
    Key: marshall({
      feedbackId,
      timestamp
    }),
    UpdateExpression: 'SET sentimentScore = :score, sentimentLabel = :label, updatedAt = :updatedAt',
    ExpressionAttributeValues: marshall({
      ':score': sentimentScore,
      ':label': sentimentLabel,
      ':updatedAt': new Date().toISOString()
    })
  });
  
  await dynamoClient.send(command);
  
  console.log('Feedback updated with sentiment', {
    feedbackId,
    sentimentScore,
    sentimentLabel
  });
}

/**
 * Invalidate cache for affected data
 */
async function invalidateCache(feedback: Feedback): Promise<void> {
  try {
    // Invalidate cache for this specific feedback
    await cacheService.invalidateForFeedback(feedback.feedbackId, feedback.templeId);
    
    // Invalidate aggregated metrics cache
    const cacheKeys = [
      `dashboard:metrics:overall`,
      `dashboard:metrics:temple:${feedback.templeId}`,
      `dashboard:metrics:region:${feedback.region}`,
      `dashboard:visualizations:*`
    ];
    
    for (const key of cacheKeys) {
      await cacheService.invalidate(key);
    }
    
    console.log('Cache invalidated', {
      feedbackId: feedback.feedbackId,
      templeId: feedback.templeId
    });
    
  } catch (error) {
    console.error('Error invalidating cache:', {
      feedbackId: feedback.feedbackId,
      error: error instanceof Error ? error.message : String(error)
    });
    // Don't throw - cache invalidation failure shouldn't stop processing
  }
}

/**
 * Notify WebSocket clients of update
 */
async function notifyClients(feedback: Feedback, sentimentScore: any): Promise<void> {
  try {
    // Create update message
    const update: DashboardUpdate = {
      type: feedback.reviewText ? 'new_review' : 'new_comment',
      data: {
        reviews: feedback.reviewText ? [{
          feedbackId: feedback.feedbackId,
          userId: feedback.userId,
          templeId: feedback.templeId,
          templeName: '', // Would be populated from temple data
          rating: feedback.rating,
          reviewText: feedback.reviewText || '',
          sentimentLabel: sentimentScore.label,
          timestamp: feedback.timestamp,
          createdAt: feedback.createdAt
        }] : [],
        comments: feedback.commentText ? [{
          feedbackId: feedback.feedbackId,
          userId: feedback.userId,
          templeId: feedback.templeId,
          templeName: '', // Would be populated from temple data
          commentText: feedback.commentText,
          commentType: feedback.commentType || 'general',
          timestamp: feedback.timestamp,
          createdAt: feedback.createdAt
        }] : []
      },
      timestamp: Date.now()
    };
    
    // Push update to all connected clients
    await webSocketManager.pushUpdate(update);
    
    console.log('WebSocket clients notified', {
      feedbackId: feedback.feedbackId,
      updateType: update.type
    });
    
  } catch (error) {
    console.error('Error notifying WebSocket clients:', {
      feedbackId: feedback.feedbackId,
      error: error instanceof Error ? error.message : String(error)
    });
    // Don't throw - notification failure shouldn't stop processing
  }
}

/**
 * Batch process multiple feedback items
 * Used when processing backlog or bulk imports
 */
export async function batchHandler(event: EventBridgeEvent<string, any>[]): Promise<void> {
  console.log(`Processing batch of ${event.length} feedback items`);
  
  const results = await Promise.allSettled(
    event.map(e => handler(e))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log('Batch processing completed', {
    total: event.length,
    successful,
    failed
  });
  
  if (failed > 0) {
    console.error('Some items failed processing', {
      failed,
      errors: results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason)
    });
  }
}
