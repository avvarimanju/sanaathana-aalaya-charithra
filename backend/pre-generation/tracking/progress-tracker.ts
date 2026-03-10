// Progress Tracker for Pre-Generation System
// Supports both local file storage and DynamoDB storage

import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  ProgressState, 
  ProgressStatistics, 
  GenerationItem,
  Language,
  ContentType 
} from '../types';

export interface ProgressTrackerConfig {
  storageMode: 'local' | 'dynamodb' | 'both';
  localStorageDir: string;
  dynamoDBTableName?: string;
}

export class ProgressTracker {
  private config: ProgressTrackerConfig;
  private state: ProgressState;
  private startTime: number;

  constructor(config: ProgressTrackerConfig, jobId?: string) {
    this.config = config;
    this.startTime = Date.now();
    
    // Initialize state
    this.state = {
      jobId: jobId || this.generateJobId(),
      startTime: new Date().toISOString(),
      lastUpdateTime: new Date().toISOString(),
      totalItems: 0,
      completedItems: [],
      failedItems: [],
      remainingItems: [],
      status: 'in_progress',
    };
  }

  /**
   * Generate a unique job ID
   */
  private generateJobId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `job-${timestamp}-${random}`;
  }

  /**
   * Initialize progress tracking with total items
   */
  public async initialize(items: GenerationItem[]): Promise<void> {
    this.state.totalItems = items.length;
    this.state.remainingItems = [...items];
    this.state.status = 'in_progress';
    
    await this.persist();
    
    console.log(`📊 Progress tracking initialized`);
    console.log(`   Job ID: ${this.state.jobId}`);
    console.log(`   Total items: ${this.state.totalItems}`);
  }

  /**
   * Mark an item as completed
   */
  public async markCompleted(item: GenerationItem): Promise<void> {
    // Remove from remaining
    this.state.remainingItems = this.state.remainingItems.filter(
      i => !this.isSameItem(i, item)
    );
    
    // Add to completed
    this.state.completedItems.push(item);
    
    // Update timestamp
    this.state.lastUpdateTime = new Date().toISOString();
    
    await this.persist();
  }

  /**
   * Mark an item as failed
   */
  public async markFailed(item: GenerationItem, error?: string): Promise<void> {
    // Remove from remaining
    this.state.remainingItems = this.state.remainingItems.filter(
      i => !this.isSameItem(i, item)
    );
    
    // Add to failed with error info
    const failedItem = { ...item };
    if (error) {
      (failedItem as any).error = error;
    }
    this.state.failedItems.push(failedItem);
    
    // Update timestamp
    this.state.lastUpdateTime = new Date().toISOString();
    
    await this.persist();
  }

  /**
   * Mark an item as skipped (already exists in cache)
   */
  public async markSkipped(item: GenerationItem): Promise<void> {
    // Remove from remaining
    this.state.remainingItems = this.state.remainingItems.filter(
      i => !this.isSameItem(i, item)
    );
    
    // Add to completed (skipped items count as completed)
    const skippedItem = { ...item };
    (skippedItem as any).skipped = true;
    this.state.completedItems.push(skippedItem);
    
    // Update timestamp
    this.state.lastUpdateTime = new Date().toISOString();
    
    await this.persist();
  }

  /**
   * Check if two items are the same
   */
  private isSameItem(item1: GenerationItem, item2: GenerationItem): boolean {
    return (
      item1.artifactId === item2.artifactId &&
      item1.language === item2.language &&
      item1.contentType === item2.contentType
    );
  }

  /**
   * Get current progress statistics
   */
  public getStatistics(): ProgressStatistics {
    const now = Date.now();
    const elapsedMs = now - this.startTime;
    const elapsedMinutes = elapsedMs / 60000;
    
    const completed = this.state.completedItems.length;
    const failed = this.state.failedItems.length;
    const skipped = this.state.completedItems.filter(
      (item: any) => item.skipped === true
    ).length;
    const remaining = this.state.remainingItems.length;
    const total = this.state.totalItems;
    
    const percentComplete = total > 0 ? (completed / total) * 100 : 0;
    const itemsPerMinute = elapsedMinutes > 0 ? completed / elapsedMinutes : 0;
    
    // Estimate time remaining based on current rate
    const estimatedTimeRemaining = itemsPerMinute > 0 
      ? (remaining / itemsPerMinute) * 60000 // Convert to ms
      : 0;
    
    return {
      totalItems: total,
      completed,
      failed,
      skipped,
      remaining,
      percentComplete,
      elapsedTime: elapsedMs,
      estimatedTimeRemaining,
      itemsPerMinute,
    };
  }

  /**
   * Get current progress state
   */
  public getState(): ProgressState {
    return { ...this.state };
  }

  /**
   * Get job ID
   */
  public getJobId(): string {
    return this.state.jobId;
  }

  /**
   * Check if job is complete
   */
  public isComplete(): boolean {
    return this.state.remainingItems.length === 0;
  }

  /**
   * Mark job as completed
   */
  public async markJobCompleted(): Promise<void> {
    this.state.status = 'completed';
    this.state.lastUpdateTime = new Date().toISOString();
    await this.persist();
  }

  /**
   * Mark job as failed
   */
  public async markJobFailed(): Promise<void> {
    this.state.status = 'failed';
    this.state.lastUpdateTime = new Date().toISOString();
    await this.persist();
  }

  /**
   * Mark job as paused
   */
  public async markJobPaused(): Promise<void> {
    this.state.status = 'paused';
    this.state.lastUpdateTime = new Date().toISOString();
    await this.persist();
  }

  /**
   * Persist progress to storage
   */
  private async persist(): Promise<void> {
    if (this.config.storageMode === 'local' || this.config.storageMode === 'both') {
      await this.persistToLocal();
    }
    
    if (this.config.storageMode === 'dynamodb' || this.config.storageMode === 'both') {
      await this.persistToDynamoDB();
    }
  }

  /**
   * Persist progress to local file
   */
  private async persistToLocal(): Promise<void> {
    try {
      // Ensure directory exists
      await fs.mkdir(this.config.localStorageDir, { recursive: true });
      
      // Write progress file
      const filePath = path.join(
        this.config.localStorageDir,
        `progress-${this.state.jobId}.json`
      );
      
      await fs.writeFile(
        filePath,
        JSON.stringify(this.state, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to persist progress to local file:', error);
      throw error;
    }
  }

  /**
   * Persist progress to DynamoDB
   */
  private async persistToDynamoDB(): Promise<void> {
    // TODO: Implement DynamoDB persistence
    // This will be implemented when we add AWS SDK integration
    console.log('⚠️  DynamoDB persistence not yet implemented');
  }

  /**
   * Load progress from storage
   */
  public static async load(
    config: ProgressTrackerConfig,
    jobId: string
  ): Promise<ProgressTracker> {
    let state: ProgressState | null = null;
    
    if (config.storageMode === 'local' || config.storageMode === 'both') {
      state = await ProgressTracker.loadFromLocal(config.localStorageDir, jobId);
    }
    
    if (!state && (config.storageMode === 'dynamodb' || config.storageMode === 'both')) {
      state = await ProgressTracker.loadFromDynamoDB(config.dynamoDBTableName!, jobId);
    }
    
    if (!state) {
      throw new Error(`Progress state not found for job ID: ${jobId}`);
    }
    
    const tracker = new ProgressTracker(config, jobId);
    tracker.state = state;
    tracker.startTime = new Date(state.startTime).getTime();
    
    console.log(`📂 Loaded progress for job: ${jobId}`);
    console.log(`   Status: ${state.status}`);
    console.log(`   Completed: ${state.completedItems.length}/${state.totalItems}`);
    console.log(`   Failed: ${state.failedItems.length}`);
    console.log(`   Remaining: ${state.remainingItems.length}`);
    
    return tracker;
  }

  /**
   * Load progress from local file
   */
  private static async loadFromLocal(
    storageDir: string,
    jobId: string
  ): Promise<ProgressState | null> {
    try {
      const filePath = path.join(storageDir, `progress-${jobId}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Load progress from DynamoDB
   */
  private static async loadFromDynamoDB(
    tableName: string,
    jobId: string
  ): Promise<ProgressState | null> {
    // TODO: Implement DynamoDB loading
    // This will be implemented when we add AWS SDK integration
    console.log('⚠️  DynamoDB loading not yet implemented');
    return null;
  }

  /**
   * List all incomplete jobs
   */
  public static async listIncompleteJobs(
    config: ProgressTrackerConfig
  ): Promise<ProgressState[]> {
    const jobs: ProgressState[] = [];
    
    if (config.storageMode === 'local' || config.storageMode === 'both') {
      const localJobs = await ProgressTracker.listLocalIncompleteJobs(
        config.localStorageDir
      );
      jobs.push(...localJobs);
    }
    
    if (config.storageMode === 'dynamodb' || config.storageMode === 'both') {
      const dynamoJobs = await ProgressTracker.listDynamoDBIncompleteJobs(
        config.dynamoDBTableName!
      );
      jobs.push(...dynamoJobs);
    }
    
    return jobs;
  }

  /**
   * List incomplete jobs from local storage
   */
  private static async listLocalIncompleteJobs(
    storageDir: string
  ): Promise<ProgressState[]> {
    try {
      const files = await fs.readdir(storageDir);
      const progressFiles = files.filter(f => f.startsWith('progress-') && f.endsWith('.json'));
      
      const jobs: ProgressState[] = [];
      
      for (const file of progressFiles) {
        const filePath = path.join(storageDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const state: ProgressState = JSON.parse(content);
        
        if (state.status === 'in_progress' || state.status === 'paused') {
          jobs.push(state);
        }
      }
      
      return jobs;
    } catch (error) {
      return [];
    }
  }

  /**
   * List incomplete jobs from DynamoDB
   */
  private static async listDynamoDBIncompleteJobs(
    tableName: string
  ): Promise<ProgressState[]> {
    // TODO: Implement DynamoDB listing
    // This will be implemented when we add AWS SDK integration
    console.log('⚠️  DynamoDB listing not yet implemented');
    return [];
  }

  /**
   * Delete progress file
   */
  public async delete(): Promise<void> {
    if (this.config.storageMode === 'local' || this.config.storageMode === 'both') {
      await this.deleteFromLocal();
    }
    
    if (this.config.storageMode === 'dynamodb' || this.config.storageMode === 'both') {
      await this.deleteFromDynamoDB();
    }
  }

  /**
   * Delete progress from local storage
   */
  private async deleteFromLocal(): Promise<void> {
    try {
      const filePath = path.join(
        this.config.localStorageDir,
        `progress-${this.state.jobId}.json`
      );
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Failed to delete local progress file:', error);
    }
  }

  /**
   * Delete progress from DynamoDB
   */
  private async deleteFromDynamoDB(): Promise<void> {
    // TODO: Implement DynamoDB deletion
    // This will be implemented when we add AWS SDK integration
    console.log('⚠️  DynamoDB deletion not yet implemented');
  }

  /**
   * Print progress summary
   */
  public printSummary(): void {
    const stats = this.getStatistics();
    
    console.log('\n' + '='.repeat(80));
    console.log('PROGRESS SUMMARY');
    console.log('='.repeat(80));
    console.log(`Job ID: ${this.state.jobId}`);
    console.log(`Status: ${this.state.status}`);
    console.log(`\nProgress:`);
    console.log(`  Total Items: ${stats.totalItems}`);
    console.log(`  Completed: ${stats.completed} (${stats.percentComplete.toFixed(1)}%)`);
    console.log(`  Failed: ${stats.failed}`);
    console.log(`  Skipped: ${stats.skipped}`);
    console.log(`  Remaining: ${stats.remaining}`);
    console.log(`\nPerformance:`);
    console.log(`  Elapsed Time: ${this.formatDuration(stats.elapsedTime)}`);
    console.log(`  Items/Minute: ${stats.itemsPerMinute.toFixed(2)}`);
    console.log(`  Est. Time Remaining: ${this.formatDuration(stats.estimatedTimeRemaining)}`);
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Format duration in milliseconds to human-readable string
   */
  private formatDuration(ms: number): string {
    if (ms === 0) return '0s';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
