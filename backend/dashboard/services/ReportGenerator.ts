/**
 * ReportGenerator
 * Feature: real-time-reports-dashboard
 * 
 * Generates exportable reports in CSV and PDF formats.
 * PDF reports include embedded charts and visualizations.
 * Handles large datasets efficiently with streaming and chunking.
 * 
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5
 */

import * as PDFDocument from 'pdfkit';
import { stringify } from 'csv-stringify/sync';
import {
  DashboardData,
  FilterState,
  TimeSeriesData,
  BarChartData,
  HistogramData,
  SentimentDistribution
} from '../types';

export interface ChartImage {
  type: 'line' | 'pie' | 'bar' | 'histogram';
  data: TimeSeriesData[] | SentimentDistribution | BarChartData[] | HistogramData[];
  title: string;
  imageBuffer?: Buffer;
}

export class ReportGenerator {
  /**
   * Generate CSV report with proper escaping
   * Requirement 8.1: Support exporting data in CSV format
   * Requirement 8.4: Include all visible metrics and applied filters
   * Requirement 8.5: Include timestamp and date range in report header
   * 
   * @param data Dashboard data to export
   * @param filters Applied filters
   * @returns CSV file as Buffer
   */
  async generateCSV(data: DashboardData, filters: FilterState): Promise<Buffer> {
    const timestamp = new Date().toISOString();
    const dateRange = this.formatDateRange(filters.timeRange);

    // Build CSV content with sections
    const sections: string[] = [];

    // Header section
    sections.push(this.generateCSVHeader(timestamp, dateRange, filters));

    // Metrics section
    sections.push(this.generateCSVMetrics(data));

    // Reviews section
    sections.push(this.generateCSVReviews(data));

    // Comments section
    sections.push(this.generateCSVComments(data));

    // Combine all sections
    const csvContent = sections.join('\n\n');

    return Buffer.from(csvContent, 'utf-8');
  }

  /**
   * Generate PDF report with embedded charts
   * Requirement 8.2: Support exporting data in PDF format with charts and visualizations
   * Requirement 8.3: Generate report within 10 seconds for datasets under 10,000 records
   * Requirement 8.4: Include all visible metrics and applied filters
   * Requirement 8.5: Include timestamp and date range in report header
   * 
   * @param data Dashboard data to export
   * @param filters Applied filters
   * @param charts Chart images to embed (optional)
   * @returns PDF file as Buffer
   */
  async generatePDF(
    data: DashboardData,
    filters: FilterState,
    charts?: ChartImage[]
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new (PDFDocument as any)({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const chunks: Buffer[] = [];

        // Collect PDF chunks
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const timestamp = new Date().toISOString();
        const dateRange = this.formatDateRange(filters.timeRange);

        // Generate PDF content
        this.addPDFHeader(doc, timestamp, dateRange, filters);
        this.addPDFMetrics(doc, data);
        
        // Add charts if provided
        if (charts && charts.length > 0) {
          this.addPDFCharts(doc, charts);
        }

        this.addPDFReviews(doc, data);
        this.addPDFComments(doc, data);

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Render chart data to image buffer
   * This is a placeholder for chart rendering logic
   * In production, this would use a headless browser or chart rendering library
   * 
   * @param chartData Chart data to render
   * @returns Image buffer
   */
  async renderChartToImage(chartData: ChartImage): Promise<Buffer> {
    // Placeholder implementation
    // In production, this would use:
    // - Puppeteer/Playwright for headless browser rendering
    // - node-canvas for server-side canvas rendering
    // - Chart.js with node-canvas
    // - Or a dedicated chart rendering service

    // For now, return a simple text-based representation
    const text = `Chart: ${chartData.title}\nType: ${chartData.type}`;
    return Buffer.from(text, 'utf-8');
  }

  // ============================================================================
  // CSV Generation Helper Methods
  // ============================================================================

  /**
   * Generate CSV header section
   */
  private generateCSVHeader(
    timestamp: string,
    dateRange: string,
    filters: FilterState
  ): string {
    const headerRows = [
      ['Dashboard Report'],
      ['Generated At', timestamp],
      ['Date Range', dateRange],
      ['Time Range Filter', filters.timeRange],
      ['Temple IDs', filters.templeIds.join(', ') || 'All'],
      ['Regions', filters.regions.join(', ') || 'All'],
      ['Categories', filters.categories.join(', ') || 'All']
    ];

    return stringify(headerRows);
  }

  /**
   * Generate CSV metrics section
   */
  private generateCSVMetrics(data: DashboardData): string {
    const metricsRows = [
      ['METRICS'],
      ['Average Rating', data.metrics.averageRating.toFixed(2)],
      ['Total Reviews', data.metrics.totalReviews.toString()],
      ['Total Comments', data.metrics.totalComments.toString()],
      [],
      ['SENTIMENT DISTRIBUTION'],
      ['Positive', `${data.metrics.sentimentDistribution.positive.toFixed(2)}%`],
      ['Neutral', `${data.metrics.sentimentDistribution.neutral.toFixed(2)}%`],
      ['Negative', `${data.metrics.sentimentDistribution.negative.toFixed(2)}%`],
      [],
      ['RATING DISTRIBUTION'],
      ['1 Star', data.metrics.ratingDistribution[1].toString()],
      ['2 Stars', data.metrics.ratingDistribution[2].toString()],
      ['3 Stars', data.metrics.ratingDistribution[3].toString()],
      ['4 Stars', data.metrics.ratingDistribution[4].toString()],
      ['5 Stars', data.metrics.ratingDistribution[5].toString()]
    ];

    return stringify(metricsRows);
  }

  /**
   * Generate CSV reviews section with proper escaping
   * Handles special characters, quotes, commas, and newlines
   */
  private generateCSVReviews(data: DashboardData): string {
    if (data.reviews.length === 0) {
      return stringify([['REVIEWS'], ['No reviews available']]);
    }

    const reviewRows = [
      ['REVIEWS'],
      ['Feedback ID', 'User ID', 'Temple Name', 'Rating', 'Review Text', 'Sentiment', 'Created At']
    ];

    // Add review data rows
    data.reviews.forEach(review => {
      reviewRows.push([
        review.feedbackId,
        review.userId,
        review.templeName,
        review.rating.toString(),
        review.reviewText, // csv-stringify handles escaping automatically
        review.sentimentLabel,
        review.createdAt
      ]);
    });

    return stringify(reviewRows);
  }

  /**
   * Generate CSV comments section with proper escaping
   */
  private generateCSVComments(data: DashboardData): string {
    if (data.comments.length === 0) {
      return stringify([['COMMENTS'], ['No comments available']]);
    }

    const commentRows = [
      ['COMMENTS'],
      ['Feedback ID', 'User ID', 'Temple Name', 'Comment Type', 'Comment Text', 'Created At']
    ];

    // Add comment data rows
    data.comments.forEach(comment => {
      commentRows.push([
        comment.feedbackId,
        comment.userId,
        comment.templeName,
        comment.commentType,
        comment.commentText, // csv-stringify handles escaping automatically
        comment.createdAt
      ]);
    });

    return stringify(commentRows);
  }

  // ============================================================================
  // PDF Generation Helper Methods
  // ============================================================================

  /**
   * Add PDF header section
   */
  private addPDFHeader(
    doc: PDFKit.PDFDocument,
    timestamp: string,
    dateRange: string,
    filters: FilterState
  ): void {
    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('Dashboard Report', { align: 'center' });
    doc.moveDown();

    // Metadata
    doc.fontSize(10).font('Helvetica');
    doc.text(`Generated At: ${timestamp}`);
    doc.text(`Date Range: ${dateRange}`);
    doc.text(`Time Range Filter: ${filters.timeRange}`);
    doc.text(`Temple IDs: ${filters.templeIds.join(', ') || 'All'}`);
    doc.text(`Regions: ${filters.regions.join(', ') || 'All'}`);
    doc.text(`Categories: ${filters.categories.join(', ') || 'All'}`);
    doc.moveDown(2);
  }

  /**
   * Add PDF metrics section
   */
  private addPDFMetrics(doc: PDFKit.PDFDocument, data: DashboardData): void {
    // Section title
    doc.fontSize(14).font('Helvetica-Bold').text('Metrics Summary');
    doc.moveDown();

    // Metrics
    doc.fontSize(10).font('Helvetica');
    doc.text(`Average Rating: ${data.metrics.averageRating.toFixed(2)}`);
    doc.text(`Total Reviews: ${data.metrics.totalReviews}`);
    doc.text(`Total Comments: ${data.metrics.totalComments}`);
    doc.moveDown();

    // Sentiment Distribution
    doc.fontSize(12).font('Helvetica-Bold').text('Sentiment Distribution');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Positive: ${data.metrics.sentimentDistribution.positive.toFixed(2)}%`);
    doc.text(`Neutral: ${data.metrics.sentimentDistribution.neutral.toFixed(2)}%`);
    doc.text(`Negative: ${data.metrics.sentimentDistribution.negative.toFixed(2)}%`);
    doc.moveDown();

    // Rating Distribution
    doc.fontSize(12).font('Helvetica-Bold').text('Rating Distribution');
    doc.fontSize(10).font('Helvetica');
    doc.text(`1 Star: ${data.metrics.ratingDistribution[1]}`);
    doc.text(`2 Stars: ${data.metrics.ratingDistribution[2]}`);
    doc.text(`3 Stars: ${data.metrics.ratingDistribution[3]}`);
    doc.text(`4 Stars: ${data.metrics.ratingDistribution[4]}`);
    doc.text(`5 Stars: ${data.metrics.ratingDistribution[5]}`);
    doc.moveDown(2);
  }

  /**
   * Add PDF charts section
   */
  private addPDFCharts(doc: PDFKit.PDFDocument, charts: ChartImage[]): void {
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').text('Visualizations');
    doc.moveDown();

    charts.forEach((chart, index) => {
      if (index > 0) {
        doc.moveDown();
      }

      doc.fontSize(12).font('Helvetica-Bold').text(chart.title);
      doc.moveDown(0.5);

      // If chart has image buffer, embed it
      if (chart.imageBuffer) {
        try {
          doc.image(chart.imageBuffer, {
            fit: [450, 300],
            align: 'center'
          });
        } catch (error) {
          doc.fontSize(10).font('Helvetica').text('Chart image could not be rendered');
        }
      } else {
        // Fallback: render text representation
        doc.fontSize(10).font('Helvetica').text(`Chart Type: ${chart.type}`);
        doc.text('Chart data available but not rendered as image');
      }

      doc.moveDown();
    });
  }

  /**
   * Add PDF reviews section
   * Handles large datasets by chunking
   */
  private addPDFReviews(doc: PDFKit.PDFDocument, data: DashboardData): void {
    if (data.reviews.length === 0) {
      return;
    }

    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').text('Reviews');
    doc.moveDown();

    // Limit to first 50 reviews to keep PDF size manageable
    const reviewsToShow = data.reviews.slice(0, 50);
    const hasMore = data.reviews.length > 50;

    reviewsToShow.forEach((review, index) => {
      // Add new page if needed (check remaining space)
      if (doc.y > 700) {
        doc.addPage();
      }

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`Review ${index + 1}`, { continued: false });
      
      doc.fontSize(9).font('Helvetica');
      doc.text(`Temple: ${review.templeName}`);
      doc.text(`Rating: ${review.rating} stars`);
      doc.text(`Sentiment: ${review.sentimentLabel}`);
      doc.text(`User: ${review.userId}`);
      doc.text(`Date: ${review.createdAt}`);
      
      // Review text with word wrapping
      doc.fontSize(9).font('Helvetica');
      const reviewText = this.truncateText(review.reviewText, 500);
      doc.text(`Review: ${reviewText}`, { width: 500 });
      
      doc.moveDown(0.5);
      doc.strokeColor('#cccccc').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
    });

    if (hasMore) {
      doc.fontSize(9).font('Helvetica-Oblique');
      doc.text(`... and ${data.reviews.length - 50} more reviews (not shown)`);
    }
  }

  /**
   * Add PDF comments section
   * Handles large datasets by chunking
   */
  private addPDFComments(doc: PDFKit.PDFDocument, data: DashboardData): void {
    if (data.comments.length === 0) {
      return;
    }

    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').text('Comments');
    doc.moveDown();

    // Limit to first 50 comments to keep PDF size manageable
    const commentsToShow = data.comments.slice(0, 50);
    const hasMore = data.comments.length > 50;

    commentsToShow.forEach((comment, index) => {
      // Add new page if needed (check remaining space)
      if (doc.y > 700) {
        doc.addPage();
      }

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`Comment ${index + 1}`, { continued: false });
      
      doc.fontSize(9).font('Helvetica');
      doc.text(`Temple: ${comment.templeName}`);
      doc.text(`Type: ${comment.commentType}`);
      doc.text(`User: ${comment.userId}`);
      doc.text(`Date: ${comment.createdAt}`);
      
      // Comment text with word wrapping
      doc.fontSize(9).font('Helvetica');
      const commentText = this.truncateText(comment.commentText, 500);
      doc.text(`Comment: ${commentText}`, { width: 500 });
      
      doc.moveDown(0.5);
      doc.strokeColor('#cccccc').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
    });

    if (hasMore) {
      doc.fontSize(9).font('Helvetica-Oblique');
      doc.text(`... and ${data.comments.length - 50} more comments (not shown)`);
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Format time range to human-readable date range
   */
  private formatDateRange(timeRange: string): string {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'last_7_days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last_30_days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last_90_days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all_time':
        return 'All Time';
      default:
        return 'Unknown';
    }

    return `${startDate.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`;
  }

  /**
   * Truncate text to maximum length
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }
}
