/**
 * SentimentAnalyzer Service
 * Feature: real-time-reports-dashboard
 * 
 * Analyzes sentiment from review text and ratings using AWS Comprehend.
 * Classifies sentiment as positive, neutral, or negative based on threshold logic.
 * Supports batch processing for efficiency.
 */

import {
  ComprehendClient,
  DetectSentimentCommand,
  BatchDetectSentimentCommand,
  SentimentType,
  BatchDetectSentimentItemResult
} from '@aws-sdk/client-comprehend';
import { SentimentScore, SentimentLabel } from '../types';
import { getConfig } from '../config';

export interface SentimentAnalysisInput {
  text: string;
  rating: number;
}

export class SentimentAnalyzer {
  private comprehendClient: ComprehendClient;
  private positiveThreshold: number;
  private negativeThreshold: number;

  constructor(comprehendClient?: ComprehendClient) {
    const config = getConfig();
    this.comprehendClient = comprehendClient || new ComprehendClient({ region: config.region });
    this.positiveThreshold = config.sentimentPositiveThreshold;
    this.negativeThreshold = config.sentimentNegativeThreshold;
  }

  /**
   * Analyze sentiment for a single item
   * Requirement 3.1: Calculate sentiment score within 5 seconds
   * Requirement 3.3: Consider both rating values and review text
   * Requirement 3.5: Handle empty review text by using rating only
   */
  async analyzeSentiment(text: string, rating: number): Promise<SentimentScore> {
    // Handle empty or whitespace-only text
    const trimmedText = text?.trim() || '';
    
    if (trimmedText.length === 0) {
      // Calculate sentiment based solely on rating value
      return this.calculateSentimentFromRating(rating);
    }

    try {
      // Use AWS Comprehend to analyze text sentiment
      const command = new DetectSentimentCommand({
        Text: trimmedText,
        LanguageCode: 'en' // Default to English, can be made configurable
      });

      const response = await this.comprehendClient.send(command);
      
      // Convert AWS Comprehend sentiment to our score format
      const textScore = this.convertComprehendSentimentToScore(
        response.Sentiment,
        response.SentimentScore
      );

      // Combine text sentiment with rating sentiment
      const ratingScore = this.calculateRatingScore(rating);
      const combinedScore = this.combineScores(textScore, ratingScore);

      const label = this.classifySentiment(combinedScore);

      return {
        score: combinedScore,
        label,
        confidence: this.calculateConfidence(response.SentimentScore)
      };
    } catch (error) {
      // On AWS Comprehend failure, fall back to rating-based sentiment
      console.error('AWS Comprehend API error, falling back to rating-based sentiment:', error);
      return this.calculateSentimentFromRating(rating);
    }
  }

  /**
   * Analyze sentiment for multiple items in batch
   * Requirement 3.1: Efficient batch processing
   */
  async analyzeBatch(items: SentimentAnalysisInput[]): Promise<SentimentScore[]> {
    if (items.length === 0) {
      return [];
    }

    const config = getConfig();
    const batchSize = config.sentimentBatchSize;
    const results: SentimentScore[] = [];

    // Process in batches to respect AWS Comprehend limits (max 25 items per batch)
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await this.processBatch(batch);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Process a single batch of items
   */
  private async processBatch(items: SentimentAnalysisInput[]): Promise<SentimentScore[]> {
    // Separate items with text from items without text
    const itemsWithText = items.filter(item => item.text?.trim().length > 0);
    const itemsWithoutText = items.filter(item => !item.text?.trim() || item.text.trim().length === 0);

    const results: SentimentScore[] = new Array(items.length);
    const itemIndexMap = new Map<number, number>(); // Maps batch index to original items index

    // Build index map for items with text
    let batchIndex = 0;
    items.forEach((item, originalIndex) => {
      if (item.text?.trim().length > 0) {
        itemIndexMap.set(batchIndex, originalIndex);
        batchIndex++;
      }
    });

    // Process items with text using AWS Comprehend
    if (itemsWithText.length > 0) {
      try {
        const command = new BatchDetectSentimentCommand({
          TextList: itemsWithText.map(item => item.text.trim()),
          LanguageCode: 'en'
        });

        const response = await this.comprehendClient.send(command);

        // Process successful results
        response.ResultList?.forEach((result) => {
          const originalIndex = itemIndexMap.get(result.Index!);
          if (originalIndex !== undefined) {
            const item = items[originalIndex];
            const textScore = this.convertComprehendSentimentToScore(
              result.Sentiment,
              result.SentimentScore
            );
            const ratingScore = this.calculateRatingScore(item.rating);
            const combinedScore = this.combineScores(textScore, ratingScore);
            const label = this.classifySentiment(combinedScore);

            results[originalIndex] = {
              score: combinedScore,
              label,
              confidence: this.calculateConfidence(result.SentimentScore)
            };
          }
        });

        // Handle error list if any
        response.ErrorList?.forEach((error) => {
          console.error(`Batch sentiment analysis error for item ${error.Index}:`, error.ErrorMessage);
          // Fall back to rating-based sentiment for failed items
          const originalIndex = itemIndexMap.get(error.Index!);
          if (originalIndex !== undefined) {
            const item = items[originalIndex];
            results[originalIndex] = this.calculateSentimentFromRating(item.rating);
          }
        });
      } catch (error) {
        console.error('Batch sentiment analysis failed, falling back to rating-based sentiment:', error);
        // Fall back to rating-based sentiment for all items with text
        itemsWithText.forEach((item, index) => {
          const originalIndex = itemIndexMap.get(index);
          if (originalIndex !== undefined) {
            results[originalIndex] = this.calculateSentimentFromRating(item.rating);
          }
        });
      }
    }

    // Process items without text using rating only
    items.forEach((item, index) => {
      if (!item.text?.trim() || item.text.trim().length === 0) {
        results[index] = this.calculateSentimentFromRating(item.rating);
      }
    });

    return results;
  }

  /**
   * Classify sentiment based on score thresholds
   * Requirement 3.2: Classify as positive (>= 0.3), neutral (-0.3 to 0.3), or negative (<= -0.3)
   */
  classifySentiment(score: number): SentimentLabel {
    if (score >= this.positiveThreshold) {
      return 'positive';
    } else if (score <= this.negativeThreshold) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  /**
   * Calculate sentiment from rating value only
   * Requirement 3.5: Handle empty review text
   */
  private calculateSentimentFromRating(rating: number): SentimentScore {
    const score = this.calculateRatingScore(rating);
    const label = this.classifySentiment(score);

    return {
      score,
      label,
      confidence: 1.0 // High confidence since it's based on explicit rating
    };
  }

  /**
   * Convert rating (1-5) to sentiment score (-1.0 to 1.0)
   */
  private calculateRatingScore(rating: number): number {
    // Map rating 1-5 to score -1.0 to 1.0
    // Rating 1 -> -1.0 (very negative)
    // Rating 2 -> -0.5 (negative)
    // Rating 3 -> 0.0 (neutral)
    // Rating 4 -> 0.5 (positive)
    // Rating 5 -> 1.0 (very positive)
    return (rating - 3) / 2;
  }

  /**
   * Convert AWS Comprehend sentiment to our score format
   */
  private convertComprehendSentimentToScore(
    sentiment?: SentimentType,
    sentimentScore?: {
      Positive?: number;
      Negative?: number;
      Neutral?: number;
      Mixed?: number;
    }
  ): number {
    if (!sentiment || !sentimentScore) {
      return 0;
    }

    // Calculate weighted score based on sentiment probabilities
    const positive = sentimentScore.Positive || 0;
    const negative = sentimentScore.Negative || 0;
    const neutral = sentimentScore.Neutral || 0;
    const mixed = sentimentScore.Mixed || 0;

    // Score calculation:
    // Positive contributes +1.0
    // Negative contributes -1.0
    // Neutral contributes 0.0
    // Mixed contributes based on the difference between positive and negative
    const score = (positive * 1.0) + (negative * -1.0) + (neutral * 0.0) + (mixed * 0.0);

    // Clamp to [-1.0, 1.0] range
    return Math.max(-1.0, Math.min(1.0, score));
  }

  /**
   * Combine text sentiment score with rating sentiment score
   * Requirement 3.3: Consider both rating values and review text
   */
  private combineScores(textScore: number, ratingScore: number): number {
    // Weight text sentiment more heavily (70%) than rating (30%)
    // This gives more importance to the detailed feedback in the text
    const combined = (textScore * 0.7) + (ratingScore * 0.3);
    
    // Clamp to [-1.0, 1.0] range
    return Math.max(-1.0, Math.min(1.0, combined));
  }

  /**
   * Calculate confidence score from AWS Comprehend sentiment scores
   */
  private calculateConfidence(sentimentScore?: {
    Positive?: number;
    Negative?: number;
    Neutral?: number;
    Mixed?: number;
  }): number {
    if (!sentimentScore) {
      return 0;
    }

    // Confidence is the highest probability among all sentiment types
    const scores = [
      sentimentScore.Positive || 0,
      sentimentScore.Negative || 0,
      sentimentScore.Neutral || 0,
      sentimentScore.Mixed || 0
    ];

    return Math.max(...scores);
  }
}
