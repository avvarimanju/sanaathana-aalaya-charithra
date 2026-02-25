#!/usr/bin/env ts-node
/**
 * Test script to verify progress tracker functionality
 */

import { ProgressTracker } from '../src/pre-generation/tracking/progress-tracker';
import { GenerationItem } from '../src/pre-generation/types';
import * as fs from 'fs/promises';
import * as path from 'path';

async function testProgressTracker() {
  console.log('🧪 Testing Progress Tracker...\n');

  const storageDir = path.join(process.cwd(), '.pre-generation', 'test-progress');
  
  // Clean up test directory
  try {
    await fs.rm(storageDir, { recursive: true, force: true });
  } catch (error) {
    // Ignore if doesn't exist
  }

  // Test 1: Initialize progress tracker
  console.log('📊 Test 1: Initialize progress tracker');
  const tracker = new ProgressTracker({
    storageMode: 'local',
    localStorageDir: storageDir,
  });

  const testItems: GenerationItem[] = [
    {
      artifactId: 'artifact-1',
      siteId: 'site-1',
      language: 'en' as any,
      contentType: 'audio_guide' as any,
      status: 'pending',
      retryCount: 0,
      timestamp: new Date().toISOString(),
    },
    {
      artifactId: 'artifact-1',
      siteId: 'site-1',
      language: 'en' as any,
      contentType: 'video' as any,
      status: 'pending',
      retryCount: 0,
      timestamp: new Date().toISOString(),
    },
    {
      artifactId: 'artifact-2',
      siteId: 'site-2',
      language: 'hi' as any,
      contentType: 'infographic' as any,
      status: 'pending',
      retryCount: 0,
      timestamp: new Date().toISOString(),
    },
    {
      artifactId: 'artifact-2',
      siteId: 'site-2',
      language: 'hi' as any,
      contentType: 'qa_knowledge_base' as any,
      status: 'pending',
      retryCount: 0,
      timestamp: new Date().toISOString(),
    },
    {
      artifactId: 'artifact-3',
      siteId: 'site-3',
      language: 'ta' as any,
      contentType: 'audio_guide' as any,
      status: 'pending',
      retryCount: 0,
      timestamp: new Date().toISOString(),
    },
  ];

  await tracker.initialize(testItems);
  console.log(`   ✅ Initialized with ${testItems.length} items`);
  console.log(`   Job ID: ${tracker.getJobId()}`);

  // Test 2: Mark items as completed
  console.log('\n✅ Test 2: Mark items as completed');
  await tracker.markCompleted(testItems[0]);
  await tracker.markCompleted(testItems[1]);
  
  let stats = tracker.getStatistics();
  console.log(`   Completed: ${stats.completed}/${stats.totalItems}`);
  console.log(`   Remaining: ${stats.remaining}`);
  console.log(`   Progress: ${stats.percentComplete.toFixed(1)}%`);

  // Test 3: Mark item as failed
  console.log('\n❌ Test 3: Mark item as failed');
  await tracker.markFailed(testItems[2], 'Test error message');
  
  stats = tracker.getStatistics();
  console.log(`   Failed: ${stats.failed}`);
  console.log(`   Remaining: ${stats.remaining}`);

  // Test 4: Mark item as skipped
  console.log('\n⏭️  Test 4: Mark item as skipped');
  await tracker.markSkipped(testItems[3]);
  
  stats = tracker.getStatistics();
  console.log(`   Skipped: ${stats.skipped}`);
  console.log(`   Completed (including skipped): ${stats.completed}`);
  console.log(`   Remaining: ${stats.remaining}`);

  // Test 5: Check statistics
  console.log('\n📈 Test 5: Progress statistics');
  stats = tracker.getStatistics();
  console.log(`   Total: ${stats.totalItems}`);
  console.log(`   Completed: ${stats.completed}`);
  console.log(`   Failed: ${stats.failed}`);
  console.log(`   Skipped: ${stats.skipped}`);
  console.log(`   Remaining: ${stats.remaining}`);
  console.log(`   Progress: ${stats.percentComplete.toFixed(1)}%`);
  console.log(`   Items/min: ${stats.itemsPerMinute.toFixed(2)}`);

  // Test 6: Print summary
  console.log('\n📋 Test 6: Print summary');
  tracker.printSummary();

  // Test 7: Save and load progress
  console.log('💾 Test 7: Save and load progress');
  const jobId = tracker.getJobId();
  console.log(`   Saving job: ${jobId}`);
  
  // Load the saved progress
  const loadedTracker = await ProgressTracker.load({
    storageMode: 'local',
    localStorageDir: storageDir,
  }, jobId);
  
  const loadedStats = loadedTracker.getStatistics();
  console.log(`   ✅ Loaded successfully`);
  console.log(`   Completed: ${loadedStats.completed}/${loadedStats.totalItems}`);
  console.log(`   Failed: ${loadedStats.failed}`);
  console.log(`   Remaining: ${loadedStats.remaining}`);

  // Test 8: List incomplete jobs
  console.log('\n📂 Test 8: List incomplete jobs');
  const incompleteJobs = await ProgressTracker.listIncompleteJobs({
    storageMode: 'local',
    localStorageDir: storageDir,
  });
  
  console.log(`   Found ${incompleteJobs.length} incomplete job(s)`);
  incompleteJobs.forEach(job => {
    console.log(`   - Job ${job.jobId}: ${job.completedItems.length}/${job.totalItems} completed`);
  });

  // Test 9: Complete remaining item and mark job as completed
  console.log('\n🏁 Test 9: Complete job');
  await loadedTracker.markCompleted(testItems[4]);
  await loadedTracker.markJobCompleted();
  
  const finalStats = loadedTracker.getStatistics();
  console.log(`   ✅ Job completed`);
  console.log(`   Final stats: ${finalStats.completed}/${finalStats.totalItems} completed`);
  console.log(`   Is complete: ${loadedTracker.isComplete()}`);

  // Test 10: Verify completed job is not in incomplete list
  console.log('\n🔍 Test 10: Verify completed job not in incomplete list');
  const incompleteJobsAfter = await ProgressTracker.listIncompleteJobs({
    storageMode: 'local',
    localStorageDir: storageDir,
  });
  
  console.log(`   Incomplete jobs after completion: ${incompleteJobsAfter.length}`);
  if (incompleteJobsAfter.length === 0) {
    console.log(`   ✅ Completed job correctly removed from incomplete list`);
  }

  // Test 11: Resume functionality
  console.log('\n🔄 Test 11: Resume functionality');
  const resumeTracker = new ProgressTracker({
    storageMode: 'local',
    localStorageDir: storageDir,
  });

  const resumeItems: GenerationItem[] = [
    { 
      artifactId: 'resume-1', 
      siteId: 'site-1',
      language: 'en' as any, 
      contentType: 'audio_guide' as any,
      status: 'pending',
      retryCount: 0,
      timestamp: new Date().toISOString(),
    },
    { 
      artifactId: 'resume-2', 
      siteId: 'site-2',
      language: 'hi' as any, 
      contentType: 'video' as any,
      status: 'pending',
      retryCount: 0,
      timestamp: new Date().toISOString(),
    },
    { 
      artifactId: 'resume-3', 
      siteId: 'site-3',
      language: 'ta' as any, 
      contentType: 'infographic' as any,
      status: 'pending',
      retryCount: 0,
      timestamp: new Date().toISOString(),
    },
  ];

  await resumeTracker.initialize(resumeItems);
  await resumeTracker.markCompleted(resumeItems[0]);
  await resumeTracker.markJobPaused();
  
  const resumeJobId = resumeTracker.getJobId();
  console.log(`   Created paused job: ${resumeJobId}`);
  
  // Resume the job
  const resumedTracker = await ProgressTracker.load({
    storageMode: 'local',
    localStorageDir: storageDir,
  }, resumeJobId);
  
  console.log(`   ✅ Resumed job: ${resumeJobId}`);
  const resumedState = resumedTracker.getState();
  console.log(`   Status: ${resumedState.status}`);
  console.log(`   Remaining items: ${resumedState.remainingItems.length}`);

  // Clean up
  console.log('\n🧹 Cleaning up test files...');
  await fs.rm(storageDir, { recursive: true, force: true });
  console.log('   ✅ Cleanup complete');

  console.log('\n✅ All progress tracker tests completed successfully!\n');
}

testProgressTracker().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
