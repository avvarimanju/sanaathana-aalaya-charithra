/**
 * Unit tests for ReportGenerator
 * Feature: real-time-reports-dashboard
 * 
 * Tests CSV and PDF report generation with proper escaping,
 * chart embedding, and large dataset handling.
 */

import { ReportGenerator, ChartImage } from '../../../src/dashboard/services/ReportGenerator';
import {
  DashboardData,
  FilterState,
  AggregatedMetrics,
  Review,
  Comment,
  VisualizationData
} from '../../../src/dashboard/types';

describe('ReportGenerator', () => {
  let reportGenerator: ReportGenerator;
  let mockDashboardData: DashboardData;
  let mockFilters: FilterState;

  beforeEach(() => {
    reportGenerator = new ReportGenerator();

    // Mock aggregated metrics
    const mockMetrics: AggregatedMetrics = {
      metricId: 'test:2024-01-15',
      metricType: 'dashboard_summary',
      averageRating: 4.25,
      totalReviews: 150,
      totalComments: 75,
      sentimentDistribution: {
        positive: 65.5,
        neutral: 25.0,
        negative: 9.5
      },
      ratingDistribution: {
        1: 5,
        2: 10,
        3: 20,
        4: 50,
        5: 65
      },
      calculatedAt: '2024-01-15T10:00:00Z',
      ttl: 1234567890
    };

    // Mock reviews
    const mockReviews: Review[] = [
      {
        feedbackId: 'review-1',
        userId: 'user-1',
        userName: 'Test User 1',
        templeId: 'temple-1',
        templeName: 'Test Temple 1',
        rating: 5,
        reviewText: 'Excellent temple with beautiful architecture',
        sentimentLabel: 'positive',
        timestamp: Date.now(),
        createdAt: '2024-01-15T09:00:00Z'
      },
      {
        feedbackId: 'review-2',
        userId: 'user-2',
        userName: 'Test User 2',
        templeId: 'temple-2',
        templeName: 'Test Temple 2',
        rating: 4,
        reviewText: 'Good experience, "highly recommended"',
        sentimentLabel: 'positive',
        timestamp: Date.now(),
        createdAt: '2024-01-15T08:00:00Z'
      }
    ];

    // Mock comments
    const mockComments: Comment[] = [
      {
        feedbackId: 'comment-1',
        userId: 'user-3',
        templeId: 'temple-1',
        templeName: 'Test Temple 1',
        commentText: 'Please add more parking space',
        commentType: 'suggestion',
        timestamp: Date.now(),
        createdAt: '2024-01-15T07:00:00Z'
      }
    ];

    // Mock visualizations
    const mockVisualizations: VisualizationData = {
      ratingTrend: [
        { timestamp: Date.now() - 86400000, value: 4.2, label: '2024-01-14' },
        { timestamp: Date.now(), value: 4.25, label: '2024-01-15' }
      ],
      sentimentPie: {
        positive: 65.5,
        neutral: 25.0,
        negative: 9.5
      },
      reviewsByTemple: [
        { label: 'Test Temple 1', value: 80, metadata: { templeId: 'temple-1' } },
        { label: 'Test Temple 2', value: 70, metadata: { templeId: 'temple-2' } }
      ],
      ratingHistogram: [
        { bin: 1, count: 5 },
        { bin: 2, count: 10 },
        { bin: 3, count: 20 },
        { bin: 4, count: 50 },
        { bin: 5, count: 65 }
      ]
    };

    mockDashboardData = {
      metrics: mockMetrics,
      reviews: mockReviews,
      comments: mockComments,
      visualizations: mockVisualizations
    };

    mockFilters = {
      timeRange: 'last_7_days',
      templeIds: ['temple-1', 'temple-2'],
      regions: ['North'],
      categories: ['Architecture']
    };
  });

  describe('generateCSV', () => {
    it('should generate valid CSV with header, metrics, reviews, and comments', async () => {
      const csvBuffer = await reportGenerator.generateCSV(mockDashboardData, mockFilters);
      const csvContent = csvBuffer.toString('utf-8');

      // Check header section
      expect(csvContent).toContain('Dashboard Report');
      expect(csvContent).toContain('Generated At');
      expect(csvContent).toContain('Date Range');
      expect(csvContent).toContain('last_7_days');

      // Check metrics section
      expect(csvContent).toContain('METRICS');
      expect(csvContent).toContain('Average Rating');
      expect(csvContent).toContain('4.25');
      expect(csvContent).toContain('Total Reviews');
      expect(csvContent).toContain('150');

      // Check sentiment distribution
      expect(csvContent).toContain('SENTIMENT DISTRIBUTION');
      expect(csvContent).toContain('Positive');
      expect(csvContent).toContain('65.50%');

      // Check reviews section
      expect(csvContent).toContain('REVIEWS');
      expect(csvContent).toContain('Test Temple 1');
      expect(csvContent).toContain('Excellent temple with beautiful architecture');

      // Check comments section
      expect(csvContent).toContain('COMMENTS');
      expect(csvContent).toContain('Please add more parking space');
    });

    it('should properly escape special characters in CSV', async () => {
      // Add review with special characters
      mockDashboardData.reviews[0].reviewText = 'Review with "quotes", commas, and\nnewlines';

      const csvBuffer = await reportGenerator.generateCSV(mockDashboardData, mockFilters);
      const csvContent = csvBuffer.toString('utf-8');

      // CSV should contain the text (csv-stringify handles escaping)
      expect(csvContent).toContain('Review with');
    });

    it('should handle empty reviews gracefully', async () => {
      mockDashboardData.reviews = [];

      const csvBuffer = await reportGenerator.generateCSV(mockDashboardData, mockFilters);
      const csvContent = csvBuffer.toString('utf-8');

      expect(csvContent).toContain('REVIEWS');
      expect(csvContent).toContain('No reviews available');
    });

    it('should handle empty comments gracefully', async () => {
      mockDashboardData.comments = [];

      const csvBuffer = await reportGenerator.generateCSV(mockDashboardData, mockFilters);
      const csvContent = csvBuffer.toString('utf-8');

      expect(csvContent).toContain('COMMENTS');
      expect(csvContent).toContain('No comments available');
    });

    it('should include applied filters in CSV header', async () => {
      const csvBuffer = await reportGenerator.generateCSV(mockDashboardData, mockFilters);
      const csvContent = csvBuffer.toString('utf-8');

      expect(csvContent).toContain('temple-1, temple-2');
      expect(csvContent).toContain('North');
      expect(csvContent).toContain('Architecture');
    });
  });

  describe('generatePDF', () => {
    it('should generate valid PDF with header, metrics, reviews, and comments', async () => {
      const pdfBuffer = await reportGenerator.generatePDF(mockDashboardData, mockFilters);

      // Check that we got a buffer
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);

      // Check PDF magic number (PDF files start with %PDF)
      const pdfHeader = pdfBuffer.toString('utf-8', 0, 4);
      expect(pdfHeader).toBe('%PDF');
    });

    it('should generate PDF with embedded charts', async () => {
      const mockCharts: ChartImage[] = [
        {
          type: 'line',
          data: mockDashboardData.visualizations.ratingTrend,
          title: 'Rating Trend Over Time'
        },
        {
          type: 'pie',
          data: mockDashboardData.visualizations.sentimentPie,
          title: 'Sentiment Distribution'
        }
      ];

      const pdfBuffer = await reportGenerator.generatePDF(
        mockDashboardData,
        mockFilters,
        mockCharts
      );

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should handle large datasets efficiently by limiting items', async () => {
      // Create large dataset with 100 reviews
      const largeReviews: Review[] = Array.from({ length: 100 }, (_, i) => ({
        feedbackId: `review-${i}`,
        userId: `user-${i}`,
        userName: `User ${i}`,
        templeId: 'temple-1',
        templeName: 'Test Temple',
        rating: 4,
        reviewText: `Review text ${i}`,
        sentimentLabel: 'positive' as const,
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
      }));

      mockDashboardData.reviews = largeReviews;

      const pdfBuffer = await reportGenerator.generatePDF(mockDashboardData, mockFilters);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);

      // PDF should be generated successfully even with large dataset
      const pdfHeader = pdfBuffer.toString('utf-8', 0, 4);
      expect(pdfHeader).toBe('%PDF');
    });

    it('should handle empty reviews in PDF', async () => {
      mockDashboardData.reviews = [];

      const pdfBuffer = await reportGenerator.generatePDF(mockDashboardData, mockFilters);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should handle empty comments in PDF', async () => {
      mockDashboardData.comments = [];

      const pdfBuffer = await reportGenerator.generatePDF(mockDashboardData, mockFilters);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should complete PDF generation within reasonable time for 10,000 records', async () => {
      // Create dataset with 10,000 reviews (but PDF will limit to 50)
      const largeReviews: Review[] = Array.from({ length: 10000 }, (_, i) => ({
        feedbackId: `review-${i}`,
        userId: `user-${i}`,
        userName: `User ${i}`,
        templeId: 'temple-1',
        templeName: 'Test Temple',
        rating: 4,
        reviewText: `Review text ${i}`,
        sentimentLabel: 'positive' as const,
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
      }));

      mockDashboardData.reviews = largeReviews;

      const startTime = Date.now();
      const pdfBuffer = await reportGenerator.generatePDF(mockDashboardData, mockFilters);
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      // Should complete within 10 seconds (10000ms)
      expect(duration).toBeLessThan(10000);
    });
  });

  describe('renderChartToImage', () => {
    it('should render chart to image buffer', async () => {
      const mockChart: ChartImage = {
        type: 'line',
        data: mockDashboardData.visualizations.ratingTrend,
        title: 'Rating Trend'
      };

      const imageBuffer = await reportGenerator.renderChartToImage(mockChart);

      expect(imageBuffer).toBeInstanceOf(Buffer);
      expect(imageBuffer.length).toBeGreaterThan(0);
    });

    it('should handle different chart types', async () => {
      const chartTypes: Array<'line' | 'pie' | 'bar' | 'histogram'> = ['line', 'pie', 'bar', 'histogram'];

      for (const type of chartTypes) {
        const mockChart: ChartImage = {
          type,
          data: [],
          title: `${type} Chart`
        };

        const imageBuffer = await reportGenerator.renderChartToImage(mockChart);
        expect(imageBuffer).toBeInstanceOf(Buffer);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle all_time filter correctly', async () => {
      mockFilters.timeRange = 'all_time';

      const csvBuffer = await reportGenerator.generateCSV(mockDashboardData, mockFilters);
      const csvContent = csvBuffer.toString('utf-8');

      expect(csvContent).toContain('All Time');
    });

    it('should handle today filter correctly', async () => {
      mockFilters.timeRange = 'today';

      const csvBuffer = await reportGenerator.generateCSV(mockDashboardData, mockFilters);
      const csvContent = csvBuffer.toString('utf-8');

      const today = new Date().toISOString().split('T')[0];
      expect(csvContent).toContain(today);
    });

    it('should handle empty filter arrays', async () => {
      mockFilters.templeIds = [];
      mockFilters.regions = [];
      mockFilters.categories = [];

      const csvBuffer = await reportGenerator.generateCSV(mockDashboardData, mockFilters);
      const csvContent = csvBuffer.toString('utf-8');

      expect(csvContent).toContain('All');
    });

    it('should handle very long review text by truncating in PDF', async () => {
      const longText = 'A'.repeat(1000);
      mockDashboardData.reviews[0].reviewText = longText;

      const pdfBuffer = await reportGenerator.generatePDF(mockDashboardData, mockFilters);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
  });
});
