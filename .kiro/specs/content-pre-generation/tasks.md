# Implementation Plan: Content Pre-Generation System

## Overview

This implementation plan breaks down the Content Pre-Generation System into incremental coding tasks following a layered architecture approach: configuration → artifact loading → content generation → storage → reporting. The system will pre-generate all multimedia content (audio guides, videos, infographics, Q&A knowledge bases) for 49 artifacts across 14 temple groups in 10 supported Indian languages, reducing ongoing AWS operational costs by 80-90%.

The implementation supports both local script execution and AWS Lambda deployment modes, with robust error handling, progress tracking, and resumption capabilities.

## Tasks

- [x] 1. Set up project structure and configuration
  - Create directory structure: `src/pre-generation/` with subdirectories for `config/`, `loaders/`, `generators/`, `validators/`, `storage/`, `tracking/`, `reporting/`
  - Create TypeScript interfaces file: `src/pre-generation/types.ts` with all core types from design
  - Create configuration schema file: `config/pre-generation.yaml` with AWS settings, rate limits, retry config, validation rules
  - Create configuration loader: `src/pre-generation/config/config-loader.ts` to load and validate YAML configuration
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 1.1 Write property test for configuration validation
  - **Property 16: Filter Validation**
  - **Validates: Requirements 11.5**

- [x] 2. Implement artifact discovery and loading layer
  - [x] 2.1 Create artifact loader module
    - Implement `ArtifactLoader` class in `src/pre-generation/loaders/artifact-loader.ts`
    - Read artifact definitions from `scripts/seed-data.ts` or exported JSON
    - Validate exactly 49 artifacts across 14 temple groups
    - Extract artifact ID, name, temple group, site ID, description, historical context, cultural significance
    - Implement filter functionality for temple groups, artifact IDs, and site IDs
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 11.1, 11.2_

  - [ ] 2.2 Write property test for artifact metadata extraction
    - **Property 1: Artifact Metadata Extraction Completeness**
    - **Validates: Requirements 1.4**

  - [ ] 2.3 Write property test for filter application
    - **Property 8: Filter Application Correctness**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

- [x] 3. Implement rate limiting and retry infrastructure
  - [x] 3.1 Create rate limiter module
    - Implement `RateLimiter` class in `src/pre-generation/utils/rate-limiter.ts`
    - Use token bucket algorithm with separate buckets per AWS service
    - Enforce rate limits: Bedrock (10 req/sec), Polly (100 req/sec), S3 (3500 req/sec), DynamoDB (1000 req/sec)
    - Implement exponential backoff with jitter for throttling errors
    - _Requirements: 7.1, 7.2_

  - [ ] 3.2 Write property test for rate limit enforcement
    - **Property 7: Rate Limit Enforcement**
    - **Validates: Requirements 7.1**

  - [ ] 3.3 Write property test for exponential backoff
    - **Property 12: Exponential Backoff on Throttling**
    - **Validates: Requirements 7.2**

  - [x] 3.4 Create retry handler module
    - Implement `RetryHandler` class in `src/pre-generation/utils/retry-handler.ts`
    - Support configurable max attempts, initial delay, max delay, backoff multiplier, jitter
    - Classify errors: transient (retry), validation (retry up to 3), permanent (skip), critical (abort)
    - Integrate with rate limiter for throttling errors
    - _Requirements: 7.2, 7.3, 7.4_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement progress tracking and resumption
  - [x] 5.1 Create progress tracker module
    - Implement `ProgressTracker` class in `src/pre-generation/tracking/progress-tracker.ts`
    - Support both local file storage (`.pre-generation/progress-{jobId}.json`) and DynamoDB storage
    - Persist progress after each artifact-language-content combination completion
    - Implement resume functionality to load incomplete jobs
    - Calculate real-time statistics: completed, failed, skipped, remaining, percent complete, elapsed time, estimated time remaining
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 5.2 Write property test for progress persistence
    - **Property 9: Progress Persistence After Completion**
    - **Validates: Requirements 6.1**

  - [ ] 5.3 Write property test for progress statistics accuracy
    - **Property 15: Progress Statistics Accuracy**
    - **Validates: Requirements 3.5, 6.5**

- [x] 6. Implement content validation layer
  - [x] 6.1 Create content validator module
    - Implement `ContentValidator` class in `src/pre-generation/validators/content-validator.ts`
    - Implement audio validation: valid format, non-zero duration, language detection
    - Implement video validation: valid format, expected dimensions, contains frames
    - Implement infographic validation: valid image, minimum resolution, contains visual elements
    - Implement Q&A validation: minimum 5 question-answer pairs, valid JSON structure
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 2.4, 2.5_

  - [ ] 6.2 Write property test for content validation requirements
    - **Property 6: Content Validation Requirements**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

  - [ ] 6.3 Write property test for language-appropriate content
    - **Property 5: Language-Appropriate Content Generation**
    - **Validates: Requirements 2.3, 2.4**

- [x] 7. Implement storage layer with S3 and DynamoDB
  - [x] 7.1 Create storage manager module
    - Implement `StorageManager` class in `src/pre-generation/storage/storage-manager.ts`
    - Upload content to S3 with structured key format: `{temple_group}/{artifact_id}/{language}/{content_type}/{timestamp}.{extension}`
    - Create DynamoDB cache entries with artifact ID, language, content type, S3 URL, generation timestamp, file size, content hash
    - Set appropriate cache TTL (30 days default) and content metadata
    - Implement round-trip verification: retrieve content immediately after upload and compare hashes
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 14.1, 14.2, 14.3_

  - [ ] 7.2 Write property test for S3 key format compliance
    - **Property 4: S3 Key Format Compliance**
    - **Validates: Requirements 4.2**

  - [ ] 7.3 Write property test for storage and cache consistency
    - **Property 3: Storage and Cache Consistency**
    - **Validates: Requirements 4.1, 4.3, 4.4**

  - [ ] 7.4 Write property test for storage round-trip verification
    - **Property 13: Storage Round-Trip Verification**
    - **Validates: Requirements 14.1, 14.2**

  - [ ] 7.5 Write property test for cache TTL configuration
    - **Property 14: Cache TTL Configuration**
    - **Validates: Requirements 4.5**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement content generation orchestrator
  - [x] 9.1 Create content generator orchestrator
    - Implement `ContentGeneratorOrchestrator` class in `src/pre-generation/generators/content-generator-orchestrator.ts`
    - Process artifacts in language order: English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi
    - Generate all 4 content types per artifact per language: audio_guide, video, infographic, qa_knowledge_base
    - Check cache before generation (skip if < 30 days old unless force mode enabled)
    - Integrate with rate limiter, retry handler, content validator, and storage manager
    - Update progress tracker after each item
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 9.1, 9.2_

  - [ ] 9.2 Write property test for complete content generation coverage
    - **Property 2: Complete Content Generation Coverage**
    - **Validates: Requirements 2.1, 3.1, 3.2, 3.3, 3.4**

  - [x] 9.3 Implement audio guide generator
    - Create `AudioGuideGenerator` class in `src/pre-generation/generators/audio-guide-generator.ts`
    - Use AWS Polly for text-to-speech synthesis
    - Support language-appropriate voice profiles from configuration
    - Generate MP3 format, 128 kbps, 44.1 kHz, mono
    - Target duration: 60-180 seconds
    - _Requirements: 3.1, 2.3_

  - [x] 9.4 Implement video generator
    - Create `VideoGenerator` class in `src/pre-generation/generators/video-generator.ts`
    - Use AWS Bedrock for AI-generated video content
    - Generate MP4 format (H.264), 1920x1080, 30 fps, 5 Mbps
    - Target duration: 120-300 seconds
    - _Requirements: 3.2, 2.3_

  - [x] 9.5 Implement infographic generator
    - Create `InfographicGenerator` class in `src/pre-generation/generators/infographic-generator.ts`
    - Use AWS Bedrock for AI-generated infographic content
    - Generate PNG format, 1920x1080 minimum, 24-bit color, lossless compression
    - _Requirements: 3.3, 2.3_

  - [x] 9.6 Implement Q&A knowledge base generator
    - Create `QAKnowledgeBaseGenerator` class in `src/pre-generation/generators/qa-generator.ts`
    - Use AWS Bedrock to generate question-answer pairs
    - Generate JSON format with 5-20 question-answer pairs
    - Include question, answer, confidence, and sources for each pair
    - _Requirements: 3.4, 2.3_

- [ ] 10. Implement cache-based idempotency
  - [x] 10.1 Add cache checking logic to orchestrator
    - Before generating content, query DynamoDB cache for existing entry
    - Check if cached content is less than 30 days old
    - Skip regeneration unless force mode is enabled
    - When regenerating, update cache entry with new timestamp and increment version number
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 10.2 Write property test for cache-based idempotency
    - **Property 10: Cache-Based Idempotency**
    - **Validates: Requirements 9.1, 9.2**

  - [ ] 10.3 Write property test for cache update on regeneration
    - **Property 11: Cache Update on Regeneration**
    - **Validates: Requirements 9.4, 9.5**

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement cost estimation
  - [x] 12.1 Create cost estimator module
    - Implement `CostEstimator` class in `src/pre-generation/utils/cost-estimator.ts`
    - Calculate Bedrock costs based on token estimates (input: ~500 tokens, output: ~1500 tokens)
    - Calculate Polly costs based on character count (~1000 characters per audio)
    - Calculate S3 storage and request costs
    - Calculate DynamoDB write costs
    - Convert USD to INR using current exchange rate
    - Display breakdown by service and content type
    - Calculate estimated processing time based on artifact count and rate limits
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 12.2 Write property test for time estimation consistency
    - **Property 17: Time Estimation Consistency**
    - **Validates: Requirements 5.4**

  - [x] 12.3 Implement actual cost calculation
    - Track actual API calls and data sizes during generation
    - Calculate actual costs from generation results
    - Compare estimated vs actual costs in final report
    - _Requirements: 12.2_

- [ ] 13. Implement reporting and monitoring
  - [x] 13.1 Create report generator module
    - Implement `ReportGenerator` class in `src/pre-generation/reporting/report-generator.ts`
    - Generate summary report: total items, succeeded, failed, skipped, duration
    - Generate cost report: estimated vs actual costs by service
    - Generate detailed log file with timestamps, artifact IDs, languages, content types, status
    - Generate failure report with artifact IDs, error messages, recommended actions
    - Calculate and report total storage used in S3 and DynamoDB
    - Support JSON, CSV, and HTML output formats
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 13.2 Create verification report generator
    - Implement verification logic to confirm all content is retrievable
    - Query DynamoDB cache for all expected entries
    - Verify S3 objects exist and are accessible
    - Generate verification report confirming completeness
    - _Requirements: 14.4, 14.5_

- [ ] 14. Implement main orchestrator and CLI
  - [x] 14.1 Create main orchestrator
    - Implement `PreGenerationOrchestrator` class in `src/pre-generation/orchestrator.ts`
    - Initialize configuration loader, artifact loader, progress tracker, cost estimator
    - Check for existing incomplete jobs and offer resumption
    - Display cost estimate and require user confirmation
    - Coordinate all components: artifact loading, content generation, storage, reporting
    - Handle execution modes: local and Lambda
    - _Requirements: 5.5, 6.3, 6.4, 10.1, 10.2_

  - [x] 14.2 Create CLI interface
    - Implement CLI in `src/pre-generation/cli.ts` using a command-line argument parser
    - Support flags: `--temple-groups`, `--artifact-ids`, `--languages`, `--content-types`, `--force`, `--dry-run`, `--resume`
    - Display real-time progress with completed items, remaining items, elapsed time, estimated time remaining
    - Handle user confirmation for cost approval
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 5.5_

  - [x] 14.3 Create npm scripts for execution
    - Add `pre-generate` script to `package.json` to run the CLI
    - Add `pre-generate:dry-run` script for cost estimation only
    - Add `pre-generate:force` script for forced regeneration
    - _Requirements: 10.1, 10.2_

- [ ] 15. Implement Lambda execution mode
  - [x] 15.1 Create Lambda handler
    - Implement Lambda handler in `src/lambdas/pre-generation.ts`
    - Handle Lambda timeout limits by processing in batches (configurable batch size)
    - Load progress state from DynamoDB at start
    - Process batch of items (default: 10 items per invocation)
    - Update progress state in DynamoDB after batch
    - Invoke next Lambda if more items remain and time allows
    - _Requirements: 10.3, 10.4_

  - [x] 15.2 Create Lambda deployment infrastructure
    - Add Lambda function definition to CDK stack in `infrastructure/stacks/`
    - Configure Lambda: Node.js 18.x runtime, 1024 MB memory, 5 minutes timeout
    - Set environment variables: S3_BUCKET, DYNAMODB_PROGRESS_TABLE, DYNAMODB_CACHE_TABLE, BATCH_SIZE
    - Create IAM role with permissions for Bedrock, Polly, S3, DynamoDB, Lambda invocation
    - _Requirements: 10.3, 10.4, 10.5_

  - [x] 15.3 Create Lambda deployment script
    - Create deployment script to package and deploy Lambda function
    - Bundle Lambda code with dependencies
    - Deploy using CDK
    - _Requirements: 10.4_

- [x] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Integration and end-to-end wiring
  - [x] 17.1 Wire all components together in orchestrator
    - Connect artifact loader → content generator orchestrator → storage manager → report generator
    - Ensure progress tracker updates after each operation
    - Ensure rate limiter is applied to all AWS service calls
    - Ensure retry handler wraps all fallible operations
    - Ensure content validator is called before storage
    - _Requirements: All requirements_

  - [x] 17.2 Add comprehensive error handling
    - Wrap all AWS service calls with try-catch and retry logic
    - Log all errors with context (artifact ID, language, content type)
    - Continue processing remaining items after failures
    - Collect all failures for final report
    - _Requirements: 7.3, 7.4_

  - [x] 17.3 Add logging and observability
    - Implement structured JSON logging throughout the system
    - Log key events: job start, artifact processing, content generation, storage, errors, job completion
    - Add CloudWatch metrics for Lambda mode: items processed, succeeded, failed, skipped, processing duration, costs
    - _Requirements: 12.3_

  - [x] 17.4 Write end-to-end integration test
    - Test full generation flow for 1 artifact in 1 language
    - Verify all 4 content types are generated
    - Verify S3 upload and DynamoDB cache entry creation
    - Verify round-trip retrieval
    - Verify progress tracking and resumption

- [x] 18. Create documentation and runbooks
  - [x] 18.1 Create README for pre-generation system
    - Document system overview, architecture, and components
    - Document configuration options and environment variables
    - Document CLI usage with examples
    - Document Lambda deployment process
    - _Requirements: 10.1, 10.2, 10.4_

  - [x] 18.2 Create operational runbook
    - Document initial generation process (before platform launch)
    - Document content update process (after platform launch)
    - Document troubleshooting guide for common issues
    - Document monitoring and alerting setup
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 19. Final checkpoint - Ensure all tests pass and system is ready
  - Run full test suite including property-based tests
  - Run dry-run to verify cost estimation
  - Test resumption by interrupting and restarting a job
  - Verify all documentation is complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties using fast-check library with minimum 100 iterations
- The implementation follows a layered architecture: configuration → artifact loading → content generation → storage → reporting
- Both local script and AWS Lambda execution modes are supported
- The system is designed to be idempotent and resumable
- Estimated one-time cost for pre-generating all content: ~₹5,560 INR (~$66.74 USD)
- This eliminates ongoing generation costs of ~$0.03 per user interaction, saving 80-90% of operational costs
