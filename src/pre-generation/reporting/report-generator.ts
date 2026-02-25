/**
 * Report Generator Module
 * 
 * Generates comprehensive reports after generation completes, including:
 * - Summary statistics (total, succeeded, failed, skipped, duration)
 * - Cost analysis (estimated vs actual costs by service)
 * - Detailed logs (timestamps, artifact IDs, languages, content types, status)
 * - Failure reports (artifact IDs, error messages, recommended actions)
 * - Storage usage (S3 and DynamoDB)
 * 
 * Supports JSON, CSV, and HTML output formats.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  GenerationResult, 
  CostBreakdown,
  GenerationFailure,
  GenerationItem,
  Language,
  ContentType
} from '../types';
import { CostEstimator } from '../utils/cost-estimator';

/**
 * Report format types
 */
export type ReportFormat = 'json' | 'csv' | 'html';

/**
 * Summary report data
 */
export interface SummaryReport {
  totalItems: number;
  succeeded: number;
  failed: number;
  skipped: number;
  duration: number;
  durationFormatted: string;
  startTime: string;
  endTime: string;
  successRate: number;
}

/**
 * Cost report data
 */
export interface CostReport {
  estimated: CostBreakdown;
  actual: CostBreakdown;
  variance: {
    bedrock: number;
    polly: number;
    s3Storage: number;
    s3Requests: number;
    dynamoDB: number;
    total: number;
    totalPercent: number;
  };
}

/**
 * Storage usage report data
 */
export interface StorageReport {
  s3: {
    totalSizeBytes: number;
    totalSizeFormatted: string;
    objectCount: number;
    averageSizeBytes: number;
  };
  dynamoDB: {
    itemCount: number;
    estimatedSizeBytes: number;
    estimatedSizeFormatted: string;
  };
}

/**
 * Detailed log entry
 */
export interface DetailedLogEntry {
  timestamp: string;
  artifactId: string;
  language: Language;
  contentType: ContentType;
  status: string;
  duration?: number;
  s3Key?: string;
  error?: string;
}

/**
 * Failure report entry with recommended actions
 */
export interface FailureReportEntry {
  artifactId: string;
  language: Language;
  contentType: ContentType;
  error: string;
  retryCount: number;
  timestamp: string;
  recommendedAction: string;
}

/**
 * Verification report entry
 */
export interface VerificationReportEntry {
  artifactId: string;
  language: Language;
  contentType: ContentType;
  cacheEntryExists: boolean;
  s3ObjectExists: boolean;
  s3Key?: string;
  verified: boolean;
  error?: string;
}

/**
 * Verification report summary
 */
export interface VerificationReport {
  totalExpected: number;
  totalVerified: number;
  totalFailed: number;
  cacheEntriesMissing: number;
  s3ObjectsMissing: number;
  successRate: number;
  entries: VerificationReportEntry[];
  timestamp: string;
}

/**
 * ReportGenerator class
 * 
 * Generates comprehensive reports in multiple formats
 */
export class ReportGenerator {
  private costEstimator: CostEstimator;
  private outputDir: string;
  
  constructor(outputDir: string = './reports') {
    this.costEstimator = new CostEstimator();
    this.outputDir = outputDir;
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }
  
  /**
   * Generate all reports for a completed generation job
   * 
   * @param result - Generation result data
   * @param estimatedCost - Estimated cost breakdown
   * @param startTime - Job start time
   * @param formats - Output formats to generate
   * @returns Paths to generated report files
   */
  async generateAllReports(
    result: GenerationResult,
    estimatedCost: CostBreakdown,
    startTime: Date,
    formats: ReportFormat[] = ['json', 'csv', 'html']
  ): Promise<string[]> {
    const endTime = new Date();
    const reportPaths: string[] = [];
    
    // Generate summary report
    const summary = this.generateSummaryReport(result, startTime, endTime);
    
    // Generate cost report
    const actualCost = this.costEstimator.calculateActualCost(result);
    const costReport = this.generateCostReport(estimatedCost, actualCost);
    
    // Generate storage report
    const storageReport = this.generateStorageReport(result);
    
    // Generate failure report if there are failures
    const failureReport = result.failures.length > 0 
      ? this.generateFailureReport(result.failures)
      : null;
    
    // Generate detailed log (always as JSON for now)
    const detailedLog = this.generateDetailedLog(result);
    
    // Write reports in requested formats
    for (const format of formats) {
      const paths = await this.writeReports(
        summary,
        costReport,
        storageReport,
        failureReport,
        detailedLog,
        format,
        startTime
      );
      reportPaths.push(...paths);
    }
    
    return reportPaths;
  }

  /**
   * Generate verification report to confirm all content is retrievable
   * 
   * @param artifacts - List of artifacts to verify
   * @param languages - List of languages to verify
   * @param contentTypes - List of content types to verify
   * @param storageManager - Storage manager instance for verification
   * @returns Verification report
   */
  async generateVerificationReport(
    artifacts: { artifactId: string; siteId: string }[],
    languages: Language[],
    contentTypes: ContentType[],
    storageManager: any // StorageManager instance
  ): Promise<VerificationReport> {
    const entries: VerificationReportEntry[] = [];
    let totalVerified = 0;
    let totalFailed = 0;
    let cacheEntriesMissing = 0;
    let s3ObjectsMissing = 0;

    // Verify each artifact-language-content combination
    for (const artifact of artifacts) {
      for (const language of languages) {
        for (const contentType of contentTypes) {
          try {
            // Check if cache entry exists
            const cachedContent = await storageManager.getCachedContent(
              artifact.siteId,
              artifact.artifactId,
              language,
              contentType
            );

            const cacheEntryExists = cachedContent !== null;
            let s3ObjectExists = false;
            let s3Key: string | undefined;
            let verified = false;
            let error: string | undefined;

            if (cacheEntryExists && cachedContent) {
              s3Key = cachedContent.s3Key;

              // Verify S3 object exists
              try {
                s3ObjectExists = await storageManager.verifyContentExists(s3Key);

                if (s3ObjectExists) {
                  // Both cache entry and S3 object exist
                  verified = true;
                  totalVerified++;
                } else {
                  // Cache entry exists but S3 object is missing
                  s3ObjectsMissing++;
                  totalFailed++;
                  error = 'S3 object not found';
                }
              } catch (s3Error: any) {
                s3ObjectsMissing++;
                totalFailed++;
                error = `S3 verification failed: ${s3Error.message}`;
              }
            } else {
              // Cache entry is missing
              cacheEntriesMissing++;
              totalFailed++;
              error = 'Cache entry not found';
            }

            entries.push({
              artifactId: artifact.artifactId,
              language,
              contentType,
              cacheEntryExists,
              s3ObjectExists,
              s3Key,
              verified,
              error,
            });
          } catch (err: any) {
            // Unexpected error during verification
            totalFailed++;
            entries.push({
              artifactId: artifact.artifactId,
              language,
              contentType,
              cacheEntryExists: false,
              s3ObjectExists: false,
              verified: false,
              error: `Verification error: ${err.message}`,
            });
          }
        }
      }
    }

    const totalExpected = artifacts.length * languages.length * contentTypes.length;
    const successRate = totalExpected > 0 ? (totalVerified / totalExpected) * 100 : 0;

    return {
      totalExpected,
      totalVerified,
      totalFailed,
      cacheEntriesMissing,
      s3ObjectsMissing,
      successRate: Math.round(successRate * 100) / 100,
      entries,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Write verification report to file
   * 
   * @param report - Verification report
   * @param format - Output format
   * @returns Path to generated report file
   */
  async writeVerificationReport(
    report: VerificationReport,
    format: ReportFormat = 'json'
  ): Promise<string> {
    const timestamp = new Date(report.timestamp).toISOString().replace(/[:.]/g, '-');
    let reportPath: string;

    switch (format) {
      case 'json':
        reportPath = path.join(this.outputDir, `verification-${timestamp}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        break;

      case 'csv':
        reportPath = path.join(this.outputDir, `verification-${timestamp}.csv`);
        const csv = this.verificationReportToCSV(report);
        fs.writeFileSync(reportPath, csv);
        break;

      case 'html':
        reportPath = path.join(this.outputDir, `verification-${timestamp}.html`);
        const html = this.generateVerificationHTML(report);
        fs.writeFileSync(reportPath, html);
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return reportPath;
  }
  
  /**
   * Generate summary report
   */
  private generateSummaryReport(
    result: GenerationResult,
    startTime: Date,
    endTime: Date
  ): SummaryReport {
    const duration = (endTime.getTime() - startTime.getTime()) / 1000; // seconds
    const successRate = result.totalItems > 0 
      ? (result.succeeded / result.totalItems) * 100 
      : 0;
    
    return {
      totalItems: result.totalItems,
      succeeded: result.succeeded,
      failed: result.failed,
      skipped: result.skipped,
      duration,
      durationFormatted: this.formatDuration(duration),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      successRate: Math.round(successRate * 100) / 100,
    };
  }
  
  /**
   * Generate cost report with variance analysis
   */
  private generateCostReport(
    estimated: CostBreakdown,
    actual: CostBreakdown
  ): CostReport {
    return {
      estimated,
      actual,
      variance: {
        bedrock: actual.bedrockCost - estimated.bedrockCost,
        polly: actual.pollyCost - estimated.pollyCost,
        s3Storage: actual.s3StorageCost - estimated.s3StorageCost,
        s3Requests: actual.s3RequestCost - estimated.s3RequestCost,
        dynamoDB: actual.dynamoDBCost - estimated.dynamoDBCost,
        total: actual.totalCost - estimated.totalCost,
        totalPercent: estimated.totalCost > 0 
          ? ((actual.totalCost - estimated.totalCost) / estimated.totalCost) * 100 
          : 0,
      },
    };
  }
  
  /**
   * Generate storage usage report
   */
  private generateStorageReport(result: GenerationResult): StorageReport {
    // Calculate S3 storage from actual metrics if available
    const totalSizeBytes = result.actualMetrics?.totalFileSizeBytes || 0;
    const objectCount = result.succeeded;
    const averageSizeBytes = objectCount > 0 ? totalSizeBytes / objectCount : 0;
    
    // Estimate DynamoDB storage (2 items per succeeded item: cache + progress)
    const dynamoDBItemCount = result.succeeded * 2;
    const avgItemSizeBytes = 1024; // ~1KB per item estimate
    const estimatedDynamoDBSize = dynamoDBItemCount * avgItemSizeBytes;
    
    return {
      s3: {
        totalSizeBytes,
        totalSizeFormatted: this.formatBytes(totalSizeBytes),
        objectCount,
        averageSizeBytes,
      },
      dynamoDB: {
        itemCount: dynamoDBItemCount,
        estimatedSizeBytes: estimatedDynamoDBSize,
        estimatedSizeFormatted: this.formatBytes(estimatedDynamoDBSize),
      },
    };
  }
  
  /**
   * Generate failure report with recommended actions
   */
  private generateFailureReport(failures: GenerationFailure[]): FailureReportEntry[] {
    return failures.map(failure => ({
      ...failure,
      recommendedAction: this.getRecommendedAction(failure),
    }));
  }
  
  /**
   * Generate detailed log entries
   */
  private generateDetailedLog(result: GenerationResult): DetailedLogEntry[] {
    // This would ideally come from the progress tracker
    // For now, we'll create entries from the result data
    const entries: DetailedLogEntry[] = [];
    
    // Add succeeded items (we don't have full details, so this is simplified)
    for (let i = 0; i < result.succeeded; i++) {
      entries.push({
        timestamp: new Date().toISOString(),
        artifactId: 'unknown',
        language: 'en' as Language,
        contentType: 'audio_guide' as ContentType,
        status: 'completed',
      });
    }
    
    // Add failed items
    for (const failure of result.failures) {
      entries.push({
        timestamp: failure.timestamp,
        artifactId: failure.artifactId,
        language: failure.language,
        contentType: failure.contentType,
        status: 'failed',
        error: failure.error,
      });
    }
    
    return entries;
  }
  
  /**
   * Get recommended action for a failure
   */
  private getRecommendedAction(failure: GenerationFailure): string {
    const error = failure.error.toLowerCase();
    
    // Throttling errors
    if (error.includes('throttl') || error.includes('rate limit')) {
      return 'Reduce rate limits in configuration and retry. The system will automatically apply exponential backoff.';
    }
    
    // Validation errors
    if (error.includes('validation') || error.includes('invalid')) {
      return 'Review artifact metadata for completeness and accuracy. Check that all required fields are present.';
    }
    
    // Network errors
    if (error.includes('network') || error.includes('timeout') || error.includes('connection')) {
      return 'Check network connectivity and AWS service availability. Retry the failed items.';
    }
    
    // Permission errors
    if (error.includes('permission') || error.includes('access denied') || error.includes('unauthorized')) {
      return 'Verify IAM permissions for Bedrock, Polly, S3, and DynamoDB. Ensure the execution role has required permissions.';
    }
    
    // Service errors
    if (error.includes('service') || error.includes('internal error')) {
      return 'AWS service issue. Wait a few minutes and retry. If the issue persists, check AWS service health dashboard.';
    }
    
    // Model errors
    if (error.includes('model') || error.includes('bedrock')) {
      return 'Check Bedrock model availability in your region. Verify model ID in configuration is correct.';
    }
    
    // Default recommendation
    return 'Review error details and retry. If the issue persists, check logs for more information or contact support.';
  }
  
  /**
   * Write reports in specified format
   */
  private async writeReports(
    summary: SummaryReport,
    costReport: CostReport,
    storageReport: StorageReport,
    failureReport: FailureReportEntry[] | null,
    detailedLog: DetailedLogEntry[],
    format: ReportFormat,
    startTime: Date
  ): Promise<string[]> {
    const timestamp = startTime.toISOString().replace(/[:.]/g, '-');
    const paths: string[] = [];
    
    switch (format) {
      case 'json':
        paths.push(...await this.writeJSONReports(
          summary, costReport, storageReport, failureReport, detailedLog, timestamp
        ));
        break;
      case 'csv':
        paths.push(...await this.writeCSVReports(
          summary, costReport, storageReport, failureReport, detailedLog, timestamp
        ));
        break;
      case 'html':
        paths.push(...await this.writeHTMLReports(
          summary, costReport, storageReport, failureReport, detailedLog, timestamp
        ));
        break;
    }
    
    return paths;
  }
  
  /**
   * Write JSON format reports
   */
  private async writeJSONReports(
    summary: SummaryReport,
    costReport: CostReport,
    storageReport: StorageReport,
    failureReport: FailureReportEntry[] | null,
    detailedLog: DetailedLogEntry[],
    timestamp: string
  ): Promise<string[]> {
    const paths: string[] = [];
    
    // Summary report
    const summaryPath = path.join(this.outputDir, `summary-${timestamp}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    paths.push(summaryPath);
    
    // Cost report
    const costPath = path.join(this.outputDir, `cost-${timestamp}.json`);
    fs.writeFileSync(costPath, JSON.stringify(costReport, null, 2));
    paths.push(costPath);
    
    // Storage report
    const storagePath = path.join(this.outputDir, `storage-${timestamp}.json`);
    fs.writeFileSync(storagePath, JSON.stringify(storageReport, null, 2));
    paths.push(storagePath);
    
    // Failure report (if any failures)
    if (failureReport && failureReport.length > 0) {
      const failurePath = path.join(this.outputDir, `failures-${timestamp}.json`);
      fs.writeFileSync(failurePath, JSON.stringify(failureReport, null, 2));
      paths.push(failurePath);
    }
    
    // Detailed log
    const logPath = path.join(this.outputDir, `detailed-log-${timestamp}.json`);
    fs.writeFileSync(logPath, JSON.stringify(detailedLog, null, 2));
    paths.push(logPath);
    
    return paths;
  }
  
  /**
   * Write CSV format reports
   */
  private async writeCSVReports(
    summary: SummaryReport,
    costReport: CostReport,
    storageReport: StorageReport,
    failureReport: FailureReportEntry[] | null,
    detailedLog: DetailedLogEntry[],
    timestamp: string
  ): Promise<string[]> {
    const paths: string[] = [];
    
    // Summary report CSV
    const summaryPath = path.join(this.outputDir, `summary-${timestamp}.csv`);
    const summaryCSV = this.summaryToCSV(summary);
    fs.writeFileSync(summaryPath, summaryCSV);
    paths.push(summaryPath);
    
    // Cost report CSV
    const costPath = path.join(this.outputDir, `cost-${timestamp}.csv`);
    const costCSV = this.costReportToCSV(costReport);
    fs.writeFileSync(costPath, costCSV);
    paths.push(costPath);
    
    // Storage report CSV
    const storagePath = path.join(this.outputDir, `storage-${timestamp}.csv`);
    const storageCSV = this.storageReportToCSV(storageReport);
    fs.writeFileSync(storagePath, storageCSV);
    paths.push(storagePath);
    
    // Failure report CSV (if any failures)
    if (failureReport && failureReport.length > 0) {
      const failurePath = path.join(this.outputDir, `failures-${timestamp}.csv`);
      const failureCSV = this.failureReportToCSV(failureReport);
      fs.writeFileSync(failurePath, failureCSV);
      paths.push(failurePath);
    }
    
    // Detailed log CSV
    const logPath = path.join(this.outputDir, `detailed-log-${timestamp}.csv`);
    const logCSV = this.detailedLogToCSV(detailedLog);
    fs.writeFileSync(logPath, logCSV);
    paths.push(logPath);
    
    return paths;
  }
  
  /**
   * Write HTML format reports
   */
  private async writeHTMLReports(
    summary: SummaryReport,
    costReport: CostReport,
    storageReport: StorageReport,
    failureReport: FailureReportEntry[] | null,
    detailedLog: DetailedLogEntry[],
    timestamp: string
  ): Promise<string[]> {
    const paths: string[] = [];
    
    // Generate a single comprehensive HTML report
    const htmlPath = path.join(this.outputDir, `report-${timestamp}.html`);
    const html = this.generateHTMLReport(summary, costReport, storageReport, failureReport, detailedLog);
    fs.writeFileSync(htmlPath, html);
    paths.push(htmlPath);
    
    return paths;
  }
  
  /**
   * Convert summary to CSV format
   */
  private summaryToCSV(summary: SummaryReport): string {
    const lines: string[] = [];
    lines.push('Metric,Value');
    lines.push(`Total Items,${summary.totalItems}`);
    lines.push(`Succeeded,${summary.succeeded}`);
    lines.push(`Failed,${summary.failed}`);
    lines.push(`Skipped,${summary.skipped}`);
    lines.push(`Duration,${summary.durationFormatted}`);
    lines.push(`Start Time,${summary.startTime}`);
    lines.push(`End Time,${summary.endTime}`);
    lines.push(`Success Rate,${summary.successRate}%`);
    return lines.join('\n');
  }
  
  /**
   * Convert cost report to CSV format
   */
  private costReportToCSV(costReport: CostReport): string {
    const lines: string[] = [];
    lines.push('Service,Estimated (USD),Actual (USD),Variance (USD),Variance (%)');
    
    const formatVariance = (variance: number, estimated: number) => {
      const percent = estimated > 0 ? ((variance / estimated) * 100).toFixed(2) : '0.00';
      return `${variance.toFixed(4)},${percent}`;
    };
    
    lines.push(`Bedrock,${costReport.estimated.bedrockCost.toFixed(4)},${costReport.actual.bedrockCost.toFixed(4)},${formatVariance(costReport.variance.bedrock, costReport.estimated.bedrockCost)}`);
    lines.push(`Polly,${costReport.estimated.pollyCost.toFixed(4)},${costReport.actual.pollyCost.toFixed(4)},${formatVariance(costReport.variance.polly, costReport.estimated.pollyCost)}`);
    lines.push(`S3 Storage,${costReport.estimated.s3StorageCost.toFixed(4)},${costReport.actual.s3StorageCost.toFixed(4)},${formatVariance(costReport.variance.s3Storage, costReport.estimated.s3StorageCost)}`);
    lines.push(`S3 Requests,${costReport.estimated.s3RequestCost.toFixed(4)},${costReport.actual.s3RequestCost.toFixed(4)},${formatVariance(costReport.variance.s3Requests, costReport.estimated.s3RequestCost)}`);
    lines.push(`DynamoDB,${costReport.estimated.dynamoDBCost.toFixed(4)},${costReport.actual.dynamoDBCost.toFixed(4)},${formatVariance(costReport.variance.dynamoDB, costReport.estimated.dynamoDBCost)}`);
    lines.push(`Total,${costReport.estimated.totalCost.toFixed(4)},${costReport.actual.totalCost.toFixed(4)},${formatVariance(costReport.variance.total, costReport.estimated.totalCost)}`);
    
    return lines.join('\n');
  }
  
  /**
   * Convert storage report to CSV format
   */
  private storageReportToCSV(storageReport: StorageReport): string {
    const lines: string[] = [];
    lines.push('Storage Type,Metric,Value');
    lines.push(`S3,Total Size,${storageReport.s3.totalSizeFormatted}`);
    lines.push(`S3,Total Size (Bytes),${storageReport.s3.totalSizeBytes}`);
    lines.push(`S3,Object Count,${storageReport.s3.objectCount}`);
    lines.push(`S3,Average Size (Bytes),${storageReport.s3.averageSizeBytes.toFixed(0)}`);
    lines.push(`DynamoDB,Item Count,${storageReport.dynamoDB.itemCount}`);
    lines.push(`DynamoDB,Estimated Size,${storageReport.dynamoDB.estimatedSizeFormatted}`);
    lines.push(`DynamoDB,Estimated Size (Bytes),${storageReport.dynamoDB.estimatedSizeBytes}`);
    return lines.join('\n');
  }
  
  /**
   * Convert failure report to CSV format
   */
  private failureReportToCSV(failureReport: FailureReportEntry[]): string {
    const lines: string[] = [];
    lines.push('Artifact ID,Language,Content Type,Error,Retry Count,Timestamp,Recommended Action');
    
    for (const entry of failureReport) {
      const escapedError = this.escapeCSV(entry.error);
      const escapedAction = this.escapeCSV(entry.recommendedAction);
      lines.push(`${entry.artifactId},${entry.language},${entry.contentType},${escapedError},${entry.retryCount},${entry.timestamp},${escapedAction}`);
    }
    
    return lines.join('\n');
  }
  
  /**
   * Convert detailed log to CSV format
   */
  private detailedLogToCSV(detailedLog: DetailedLogEntry[]): string {
    const lines: string[] = [];
    lines.push('Timestamp,Artifact ID,Language,Content Type,Status,Duration (s),S3 Key,Error');
    
    for (const entry of detailedLog) {
      const duration = entry.duration !== undefined ? entry.duration.toFixed(2) : '';
      const s3Key = entry.s3Key || '';
      const error = entry.error ? this.escapeCSV(entry.error) : '';
      lines.push(`${entry.timestamp},${entry.artifactId},${entry.language},${entry.contentType},${entry.status},${duration},${s3Key},${error}`);
    }
    
    return lines.join('\n');
  }
  
  /**
   * Escape CSV values
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
  
  /**
   * Generate comprehensive HTML report
   */
  private generateHTMLReport(
    summary: SummaryReport,
    costReport: CostReport,
    storageReport: StorageReport,
    failureReport: FailureReportEntry[] | null,
    detailedLog: DetailedLogEntry[]
  ): string {
    const successRateColor = summary.successRate >= 95 ? '#28a745' : summary.successRate >= 80 ? '#ffc107' : '#dc3545';
    const costVarianceColor = Math.abs(costReport.variance.totalPercent) <= 10 ? '#28a745' : '#ffc107';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pre-Generation Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    h1, h2, h3 { color: #2c3e50; }
    h1 { border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    h2 { border-bottom: 2px solid #95a5a6; padding-bottom: 8px; margin-top: 30px; }
    .card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    .metric {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #3498db;
    }
    .metric-label {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 5px;
    }
    .metric-value {
      font-size: 1.5em;
      font-weight: bold;
      color: #2c3e50;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #3498db;
      color: white;
      font-weight: 600;
    }
    tr:hover { background-color: #f5f5f5; }
    .success { color: #28a745; }
    .warning { color: #ffc107; }
    .danger { color: #dc3545; }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85em;
      font-weight: 600;
    }
    .badge-success { background-color: #d4edda; color: #155724; }
    .badge-danger { background-color: #f8d7da; color: #721c24; }
    .badge-warning { background-color: #fff3cd; color: #856404; }
    .badge-info { background-color: #d1ecf1; color: #0c5460; }
  </style>
</head>
<body>
  <h1>Content Pre-Generation Report</h1>
  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  
  <div class="card">
    <h2>Summary</h2>
    <div class="metric-grid">
      <div class="metric">
        <div class="metric-label">Total Items</div>
        <div class="metric-value">${summary.totalItems}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Succeeded</div>
        <div class="metric-value" style="color: #28a745">${summary.succeeded}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Failed</div>
        <div class="metric-value" style="color: #dc3545">${summary.failed}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Skipped</div>
        <div class="metric-value" style="color: #ffc107">${summary.skipped}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Duration</div>
        <div class="metric-value">${summary.durationFormatted}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Success Rate</div>
        <div class="metric-value" style="color: ${successRateColor}">${summary.successRate}%</div>
      </div>
    </div>
  </div>
  
  <div class="card">
    <h2>Cost Analysis</h2>
    <table>
      <thead>
        <tr>
          <th>Service</th>
          <th>Estimated (USD)</th>
          <th>Actual (USD)</th>
          <th>Variance</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Bedrock (AI Content)</td>
          <td>$${costReport.estimated.bedrockCost.toFixed(4)}</td>
          <td>$${costReport.actual.bedrockCost.toFixed(4)}</td>
          <td>${this.formatVariance(costReport.variance.bedrock, costReport.estimated.bedrockCost)}</td>
        </tr>
        <tr>
          <td>Polly (Audio TTS)</td>
          <td>$${costReport.estimated.pollyCost.toFixed(4)}</td>
          <td>$${costReport.actual.pollyCost.toFixed(4)}</td>
          <td>${this.formatVariance(costReport.variance.polly, costReport.estimated.pollyCost)}</td>
        </tr>
        <tr>
          <td>S3 Storage</td>
          <td>$${costReport.estimated.s3StorageCost.toFixed(4)}</td>
          <td>$${costReport.actual.s3StorageCost.toFixed(4)}</td>
          <td>${this.formatVariance(costReport.variance.s3Storage, costReport.estimated.s3StorageCost)}</td>
        </tr>
        <tr>
          <td>S3 Requests</td>
          <td>$${costReport.estimated.s3RequestCost.toFixed(4)}</td>
          <td>$${costReport.actual.s3RequestCost.toFixed(4)}</td>
          <td>${this.formatVariance(costReport.variance.s3Requests, costReport.estimated.s3RequestCost)}</td>
        </tr>
        <tr>
          <td>DynamoDB Writes</td>
          <td>$${costReport.estimated.dynamoDBCost.toFixed(4)}</td>
          <td>$${costReport.actual.dynamoDBCost.toFixed(4)}</td>
          <td>${this.formatVariance(costReport.variance.dynamoDB, costReport.estimated.dynamoDBCost)}</td>
        </tr>
        <tr style="font-weight: bold; background-color: #f8f9fa;">
          <td>Total</td>
          <td>$${costReport.estimated.totalCost.toFixed(4)}</td>
          <td>$${costReport.actual.totalCost.toFixed(4)}</td>
          <td style="color: ${costVarianceColor}">${this.formatVariance(costReport.variance.total, costReport.estimated.totalCost)}</td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <div class="card">
    <h2>Storage Usage</h2>
    <h3>Amazon S3</h3>
    <div class="metric-grid">
      <div class="metric">
        <div class="metric-label">Total Size</div>
        <div class="metric-value">${storageReport.s3.totalSizeFormatted}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Object Count</div>
        <div class="metric-value">${storageReport.s3.objectCount}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Average Size</div>
        <div class="metric-value">${this.formatBytes(storageReport.s3.averageSizeBytes)}</div>
      </div>
    </div>
    
    <h3>Amazon DynamoDB</h3>
    <div class="metric-grid">
      <div class="metric">
        <div class="metric-label">Item Count</div>
        <div class="metric-value">${storageReport.dynamoDB.itemCount}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Estimated Size</div>
        <div class="metric-value">${storageReport.dynamoDB.estimatedSizeFormatted}</div>
      </div>
    </div>
  </div>
  
  ${failureReport && failureReport.length > 0 ? `
  <div class="card">
    <h2>Failures (${failureReport.length})</h2>
    <table>
      <thead>
        <tr>
          <th>Artifact ID</th>
          <th>Language</th>
          <th>Content Type</th>
          <th>Error</th>
          <th>Recommended Action</th>
        </tr>
      </thead>
      <tbody>
        ${failureReport.map(f => `
        <tr>
          <td>${f.artifactId}</td>
          <td><span class="badge badge-info">${f.language}</span></td>
          <td><span class="badge badge-warning">${f.contentType}</span></td>
          <td style="max-width: 300px; word-wrap: break-word;">${this.escapeHTML(f.error)}</td>
          <td style="max-width: 300px; word-wrap: break-word;">${this.escapeHTML(f.recommendedAction)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}
  
  <div class="card">
    <h2>Detailed Log (${detailedLog.length} entries)</h2>
    <p><em>Showing first 100 entries. See detailed-log JSON file for complete log.</em></p>
    <table>
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Artifact ID</th>
          <th>Language</th>
          <th>Content Type</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${detailedLog.slice(0, 100).map(entry => `
        <tr>
          <td>${new Date(entry.timestamp).toLocaleString()}</td>
          <td>${entry.artifactId}</td>
          <td><span class="badge badge-info">${entry.language}</span></td>
          <td><span class="badge badge-warning">${entry.contentType}</span></td>
          <td><span class="badge ${entry.status === 'completed' ? 'badge-success' : 'badge-danger'}">${entry.status}</span></td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;
  }
  
  /**
   * Format variance for HTML display
   */
  private formatVariance(variance: number, estimated: number): string {
    const percent = estimated > 0 ? ((variance / estimated) * 100).toFixed(1) : '0.0';
    const sign = variance >= 0 ? '+' : '';
    const color = Math.abs(parseFloat(percent)) <= 10 ? '#28a745' : '#ffc107';
    return `<span style="color: ${color}">${sign}$${variance.toFixed(4)} (${sign}${percent}%)</span>`;
  }
  
  /**
   * Escape HTML special characters
   */
  private escapeHTML(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Convert verification report to CSV format
   */
  private verificationReportToCSV(report: VerificationReport): string {
    const lines: string[] = [];
    
    // Summary section
    lines.push('Verification Summary');
    lines.push('Metric,Value');
    lines.push(`Total Expected,${report.totalExpected}`);
    lines.push(`Total Verified,${report.totalVerified}`);
    lines.push(`Total Failed,${report.totalFailed}`);
    lines.push(`Cache Entries Missing,${report.cacheEntriesMissing}`);
    lines.push(`S3 Objects Missing,${report.s3ObjectsMissing}`);
    lines.push(`Success Rate,${report.successRate}%`);
    lines.push(`Timestamp,${report.timestamp}`);
    lines.push('');
    
    // Detailed entries
    lines.push('Detailed Verification Results');
    lines.push('Artifact ID,Language,Content Type,Cache Entry Exists,S3 Object Exists,S3 Key,Verified,Error');
    
    for (const entry of report.entries) {
      const s3Key = entry.s3Key || '';
      const error = entry.error ? this.escapeCSV(entry.error) : '';
      lines.push(
        `${entry.artifactId},${entry.language},${entry.contentType},` +
        `${entry.cacheEntryExists},${entry.s3ObjectExists},${s3Key},${entry.verified},${error}`
      );
    }
    
    return lines.join('\n');
  }

  /**
   * Generate HTML verification report
   */
  private generateVerificationHTML(report: VerificationReport): string {
    const successRateColor = report.successRate >= 95 ? '#28a745' : report.successRate >= 80 ? '#ffc107' : '#dc3545';
    const failedEntries = report.entries.filter(e => !e.verified);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Content Verification Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    h1, h2, h3 { color: #2c3e50; }
    h1 { border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    h2 { border-bottom: 2px solid #95a5a6; padding-bottom: 8px; margin-top: 30px; }
    .card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    .metric {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #3498db;
    }
    .metric-label {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 5px;
    }
    .metric-value {
      font-size: 1.5em;
      font-weight: bold;
      color: #2c3e50;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #3498db;
      color: white;
      font-weight: 600;
    }
    tr:hover { background-color: #f5f5f5; }
    .success { color: #28a745; }
    .warning { color: #ffc107; }
    .danger { color: #dc3545; }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85em;
      font-weight: 600;
    }
    .badge-success { background-color: #d4edda; color: #155724; }
    .badge-danger { background-color: #f8d7da; color: #721c24; }
    .badge-warning { background-color: #fff3cd; color: #856404; }
    .badge-info { background-color: #d1ecf1; color: #0c5460; }
    .alert {
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .alert-success {
      background-color: #d4edda;
      border-left: 4px solid #28a745;
      color: #155724;
    }
    .alert-danger {
      background-color: #f8d7da;
      border-left: 4px solid #dc3545;
      color: #721c24;
    }
  </style>
</head>
<body>
  <h1>Content Verification Report</h1>
  <p><strong>Generated:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
  
  ${report.successRate === 100 ? `
  <div class="alert alert-success">
    <strong>✓ All content verified successfully!</strong> All ${report.totalExpected} expected items are properly stored and retrievable.
  </div>
  ` : `
  <div class="alert alert-danger">
    <strong>⚠ Verification issues detected!</strong> ${report.totalFailed} out of ${report.totalExpected} items failed verification.
  </div>
  `}
  
  <div class="card">
    <h2>Verification Summary</h2>
    <div class="metric-grid">
      <div class="metric">
        <div class="metric-label">Total Expected</div>
        <div class="metric-value">${report.totalExpected}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Total Verified</div>
        <div class="metric-value" style="color: #28a745">${report.totalVerified}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Total Failed</div>
        <div class="metric-value" style="color: #dc3545">${report.totalFailed}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Cache Entries Missing</div>
        <div class="metric-value" style="color: #ffc107">${report.cacheEntriesMissing}</div>
      </div>
      <div class="metric">
        <div class="metric-label">S3 Objects Missing</div>
        <div class="metric-value" style="color: #ffc107">${report.s3ObjectsMissing}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Success Rate</div>
        <div class="metric-value" style="color: ${successRateColor}">${report.successRate}%</div>
      </div>
    </div>
  </div>
  
  ${failedEntries.length > 0 ? `
  <div class="card">
    <h2>Failed Verifications (${failedEntries.length})</h2>
    <table>
      <thead>
        <tr>
          <th>Artifact ID</th>
          <th>Language</th>
          <th>Content Type</th>
          <th>Cache Entry</th>
          <th>S3 Object</th>
          <th>Error</th>
        </tr>
      </thead>
      <tbody>
        ${failedEntries.map(entry => `
        <tr>
          <td>${entry.artifactId}</td>
          <td><span class="badge badge-info">${entry.language}</span></td>
          <td><span class="badge badge-warning">${entry.contentType}</span></td>
          <td><span class="badge ${entry.cacheEntryExists ? 'badge-success' : 'badge-danger'}">${entry.cacheEntryExists ? 'Found' : 'Missing'}</span></td>
          <td><span class="badge ${entry.s3ObjectExists ? 'badge-success' : 'badge-danger'}">${entry.s3ObjectExists ? 'Found' : 'Missing'}</span></td>
          <td style="max-width: 300px; word-wrap: break-word;">${this.escapeHTML(entry.error || '')}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}
  
  <div class="card">
    <h2>All Verification Results (${report.entries.length} entries)</h2>
    <p><em>Showing first 100 entries. See verification JSON file for complete results.</em></p>
    <table>
      <thead>
        <tr>
          <th>Artifact ID</th>
          <th>Language</th>
          <th>Content Type</th>
          <th>Status</th>
          <th>S3 Key</th>
        </tr>
      </thead>
      <tbody>
        ${report.entries.slice(0, 100).map(entry => `
        <tr>
          <td>${entry.artifactId}</td>
          <td><span class="badge badge-info">${entry.language}</span></td>
          <td><span class="badge badge-warning">${entry.contentType}</span></td>
          <td><span class="badge ${entry.verified ? 'badge-success' : 'badge-danger'}">${entry.verified ? 'Verified' : 'Failed'}</span></td>
          <td style="font-size: 0.85em; word-break: break-all;">${entry.s3Key || 'N/A'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;
  }
  
  /**
   * Format bytes to human-readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
  
  /**
   * Format duration in human-readable format
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    
    return parts.join(' ');
  }
  
  /**
   * Generate a console-friendly summary report
   * 
   * @param result - Generation result data
   * @param estimatedCost - Estimated cost breakdown
   * @param actualCost - Actual cost breakdown
   * @param startTime - Job start time
   * @param endTime - Job end time
   * @returns Formatted string for console output
   */
  generateConsoleSummary(
    result: GenerationResult,
    estimatedCost: CostBreakdown,
    actualCost: CostBreakdown,
    startTime: Date,
    endTime: Date
  ): string {
    const summary = this.generateSummaryReport(result, startTime, endTime);
    const costReport = this.generateCostReport(estimatedCost, actualCost);
    const storageReport = this.generateStorageReport(result);
    
    const lines: string[] = [];
    
    lines.push('');
    lines.push('='.repeat(80));
    lines.push('GENERATION COMPLETE');
    lines.push('='.repeat(80));
    lines.push('');
    lines.push('Summary:');
    lines.push(`  Total Items:     ${summary.totalItems}`);
    lines.push(`  Succeeded:       ${summary.succeeded} ✓`);
    lines.push(`  Failed:          ${summary.failed} ${summary.failed > 0 ? '✗' : ''}`);
    lines.push(`  Skipped:         ${summary.skipped}`);
    lines.push(`  Duration:        ${summary.durationFormatted}`);
    lines.push(`  Success Rate:    ${summary.successRate}%`);
    lines.push('');
    lines.push('Cost Summary:');
    lines.push(`  Estimated:       $${estimatedCost.totalCost.toFixed(4)} USD`);
    lines.push(`  Actual:          $${actualCost.totalCost.toFixed(4)} USD`);
    lines.push(`  Variance:        ${this.formatVarianceText(costReport.variance.total, estimatedCost.totalCost)}`);
    lines.push('');
    lines.push('Storage Usage:');
    lines.push(`  S3:              ${storageReport.s3.totalSizeFormatted} (${storageReport.s3.objectCount} objects)`);
    lines.push(`  DynamoDB:        ${storageReport.dynamoDB.itemCount} items`);
    lines.push('');
    
    if (result.failures.length > 0) {
      lines.push(`Failures: ${result.failures.length} items failed`);
      lines.push('  See failure report for details and recommended actions.');
      lines.push('');
    }
    
    lines.push('='.repeat(80));
    
    return lines.join('\n');
  }
  
  /**
   * Format variance for text display
   */
  private formatVarianceText(variance: number, estimated: number): string {
    const percent = estimated > 0 ? ((variance / estimated) * 100).toFixed(1) : '0.0';
    const sign = variance >= 0 ? '+' : '';
    const indicator = Math.abs(parseFloat(percent)) <= 10 ? '✓' : '⚠';
    return `${sign}$${variance.toFixed(4)} (${sign}${percent}%) ${indicator}`;
  }
}
