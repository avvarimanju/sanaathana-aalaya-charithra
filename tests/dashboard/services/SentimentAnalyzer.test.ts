/**
 * Unit tests for SentimentAnalyzer
 * Feature: real-time-reports-dashboard
 */

import { SentimentAnalyzer } from '../../../src/dashboard/services/SentimentAnalyzer';
import { ComprehendClient } from '@aws-sdk/client-comprehend';

// Mock the ComprehendClient
jest.mock('@aws-sdk/client-comprehend');

describe('SentimentAnalyzer', () => {
  let analyzer: SentimentAnalyzer;
  let mockSend: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock send function
    mockSend = jest.fn();
    
    // Mock ComprehendClient constructor
    (ComprehendClient as jest.MockedClass<typeof ComprehendClient>).mockImplementation(() => ({
      send: mockSend,
    } as any));
    
    // Create analyzer with mocked client
    analyzer = new SentimentAnalyzer();
  });

  describe('analyzeSentiment', () => {
    it('should analyze sentiment with both text and rating', async () => {
      mockSend.mockResolvedValueOnce({
        Sentiment: 'POSITIVE',
        SentimentScore: {
          Positive: 0.95,
          Negative: 0.02,
          Neutral: 0.02,
          Mixed: 0.01
        }
      });

      const result = await analyzer.analyzeSentiment('This temple is amazing!', 5);

      expect(result.label).toBe('positive');
      expect(result.score).toBeGreaterThan(0.3);
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle empty text by using rating only', async () => {
      // Should not call AWS Comprehend for empty text
      const result = await analyzer.analyzeSentiment('', 5);

      expect(result.label).toBe('positive');
      expect(result.score).toBe(1.0); // Rating 5 maps to score 1.0
      expect(result.confidence).toBe(1.0);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only text by using rating only', async () => {
      const result = await analyzer.analyzeSentiment('   \n\t  ', 4);

      expect(result.label).toBe('positive');
      expect(result.score).toBe(0.5); // Rating 4 maps to score 0.5
      expect(result.confidence).toBe(1.0);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should classify negative sentiment correctly', async () => {
      mockSend.mockResolvedValueOnce({
        Sentiment: 'NEGATIVE',
        SentimentScore: {
          Positive: 0.01,
          Negative: 0.96,
          Neutral: 0.02,
          Mixed: 0.01
        }
      });

      const result = await analyzer.analyzeSentiment('Terrible experience', 1);

      expect(result.label).toBe('negative');
      expect(result.score).toBeLessThan(-0.3);
    });

    it('should classify neutral sentiment correctly', async () => {
      mockSend.mockResolvedValueOnce({
        Sentiment: 'NEUTRAL',
        SentimentScore: {
          Positive: 0.25,
          Negative: 0.25,
          Neutral: 0.45,
          Mixed: 0.05
        }
      });

      const result = await analyzer.analyzeSentiment('It was okay', 3);

      expect(result.label).toBe('neutral');
      expect(result.score).toBeGreaterThan(-0.3);
      expect(result.score).toBeLessThan(0.3);
    });

    it('should fall back to rating-based sentiment on AWS Comprehend error', async () => {
      mockSend.mockRejectedValueOnce(new Error('AWS Comprehend API error'));

      const result = await analyzer.analyzeSentiment('Some text', 5);

      expect(result.label).toBe('positive');
      expect(result.score).toBe(1.0); // Falls back to rating 5
      expect(result.confidence).toBe(1.0);
    });

    it('should combine text and rating scores appropriately', async () => {
      // Positive text with negative rating
      mockSend.mockResolvedValueOnce({
        Sentiment: 'POSITIVE',
        SentimentScore: {
          Positive: 0.90,
          Negative: 0.05,
          Neutral: 0.03,
          Mixed: 0.02
        }
      });

      const result = await analyzer.analyzeSentiment('Great place!', 2);

      // Text score is positive (0.90), rating score is negative (-0.5)
      // Combined: (0.90 * 0.7) + (-0.5 * 0.3) = 0.63 - 0.15 = 0.48
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(1.0);
    });
  });

  describe('analyzeBatch', () => {
    it('should handle empty batch', async () => {
      const results = await analyzer.analyzeBatch([]);
      expect(results).toEqual([]);
    });

    it('should process batch with text items', async () => {
      mockSend.mockResolvedValueOnce({
        ResultList: [
          {
            Index: 0,
            Sentiment: 'POSITIVE',
            SentimentScore: {
              Positive: 0.95,
              Negative: 0.02,
              Neutral: 0.02,
              Mixed: 0.01
            }
          },
          {
            Index: 1,
            Sentiment: 'NEGATIVE',
            SentimentScore: {
              Positive: 0.01,
              Negative: 0.96,
              Neutral: 0.02,
              Mixed: 0.01
            }
          }
        ],
        ErrorList: []
      });

      const items = [
        { text: 'Amazing temple!', rating: 5 },
        { text: 'Very disappointing', rating: 1 }
      ];

      const results = await analyzer.analyzeBatch(items);

      expect(results).toHaveLength(2);
      expect(results[0].label).toBe('positive');
      expect(results[1].label).toBe('negative');
    });

    it('should handle batch with empty text items', async () => {
      const items = [
        { text: '', rating: 5 },
        { text: '  ', rating: 1 }
      ];

      const results = await analyzer.analyzeBatch(items);

      expect(results).toHaveLength(2);
      expect(results[0].label).toBe('positive');
      expect(results[0].score).toBe(1.0);
      expect(results[1].label).toBe('negative');
      expect(results[1].score).toBe(-1.0);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle mixed batch with text and empty items', async () => {
      mockSend.mockResolvedValueOnce({
        ResultList: [
          {
            Index: 0,
            Sentiment: 'POSITIVE',
            SentimentScore: {
              Positive: 0.95,
              Negative: 0.02,
              Neutral: 0.02,
              Mixed: 0.01
            }
          }
        ],
        ErrorList: []
      });

      const items = [
        { text: 'Great experience', rating: 5 },
        { text: '', rating: 2 }
      ];

      const results = await analyzer.analyzeBatch(items);

      expect(results).toHaveLength(2);
      expect(results[0].label).toBe('positive');
      expect(results[1].label).toBe('negative');
      expect(results[1].score).toBe(-0.5); // Rating 2 only
    });

    it('should handle batch errors gracefully', async () => {
      mockSend.mockResolvedValueOnce({
        ResultList: [
          {
            Index: 0,
            Sentiment: 'POSITIVE',
            SentimentScore: {
              Positive: 0.95,
              Negative: 0.02,
              Neutral: 0.02,
              Mixed: 0.01
            }
          }
        ],
        ErrorList: [
          {
            Index: 1,
            ErrorCode: 'InternalServerException',
            ErrorMessage: 'Internal error'
          }
        ]
      });

      const items = [
        { text: 'Good temple', rating: 4 },
        { text: 'Another review', rating: 3 }
      ];

      const results = await analyzer.analyzeBatch(items);

      expect(results).toHaveLength(2);
      expect(results[0].label).toBe('positive');
      // Second item should fall back to rating-based sentiment
      expect(results[1].score).toBe(0.0); // Rating 3 maps to 0.0
    });

    it('should fall back to rating-based sentiment on batch API error', async () => {
      mockSend.mockRejectedValueOnce(new Error('API error'));

      const items = [
        { text: 'Review 1', rating: 5 },
        { text: 'Review 2', rating: 1 }
      ];

      const results = await analyzer.analyzeBatch(items);

      expect(results).toHaveLength(2);
      expect(results[0].score).toBe(1.0);
      expect(results[1].score).toBe(-1.0);
    });
  });

  describe('classifySentiment', () => {
    it('should classify score >= 0.3 as positive', () => {
      expect(analyzer.classifySentiment(0.3)).toBe('positive');
      expect(analyzer.classifySentiment(0.5)).toBe('positive');
      expect(analyzer.classifySentiment(1.0)).toBe('positive');
    });

    it('should classify score <= -0.3 as negative', () => {
      expect(analyzer.classifySentiment(-0.3)).toBe('negative');
      expect(analyzer.classifySentiment(-0.5)).toBe('negative');
      expect(analyzer.classifySentiment(-1.0)).toBe('negative');
    });

    it('should classify score between -0.3 and 0.3 as neutral', () => {
      expect(analyzer.classifySentiment(-0.29)).toBe('neutral');
      expect(analyzer.classifySentiment(0.0)).toBe('neutral');
      expect(analyzer.classifySentiment(0.29)).toBe('neutral');
    });
  });

  describe('rating to score conversion', () => {
    it('should map rating 1 to score -1.0', async () => {
      const result = await analyzer.analyzeSentiment('', 1);
      expect(result.score).toBe(-1.0);
    });

    it('should map rating 2 to score -0.5', async () => {
      const result = await analyzer.analyzeSentiment('', 2);
      expect(result.score).toBe(-0.5);
    });

    it('should map rating 3 to score 0.0', async () => {
      const result = await analyzer.analyzeSentiment('', 3);
      expect(result.score).toBe(0.0);
    });

    it('should map rating 4 to score 0.5', async () => {
      const result = await analyzer.analyzeSentiment('', 4);
      expect(result.score).toBe(0.5);
    });

    it('should map rating 5 to score 1.0', async () => {
      const result = await analyzer.analyzeSentiment('', 5);
      expect(result.score).toBe(1.0);
    });
  });
});
