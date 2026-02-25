#!/usr/bin/env ts-node
/**
 * Test script to verify content validator functionality
 */

import { ContentValidator, ValidationConfig } from '../src/pre-generation/validators/content-validator';
import { ContentType, Language } from '../src/pre-generation/types';

async function testContentValidator() {
  console.log('🧪 Testing Content Validator...\n');

  const config: ValidationConfig = {
    audio: {
      minDuration: 30,
      maxDuration: 300,
    },
    video: {
      minDuration: 60,
      maxDuration: 600,
      expectedDimensions: {
        width: 1920,
        height: 1080,
      },
    },
    infographic: {
      minResolution: {
        width: 1200,
        height: 800,
      },
    },
    qaKnowledgeBase: {
      minQuestionCount: 5,
    },
  };

  const validator = new ContentValidator(config);

  // Test 1: Validate empty audio
  console.log('🎵 Test 1: Validate empty audio');
  const emptyAudio = Buffer.alloc(0);
  const result1 = await validator.validate(emptyAudio, 'audio_guide' as any, 'en' as any);
  console.log(`   Valid: ${result1.valid}`);
  console.log(`   Errors: ${result1.errors.length}`);
  if (result1.errors.length > 0) {
    console.log(`   - ${result1.errors[0]}`);
  }

  // Test 2: Validate valid MP3 audio
  console.log('\n🎵 Test 2: Validate valid MP3 audio');
  // Create a buffer with MP3 header (ID3 tag)
  const validMP3 = Buffer.alloc(2 * 1024 * 1024); // 2 MB
  validMP3[0] = 0x49; // 'I'
  validMP3[1] = 0x44; // 'D'
  validMP3[2] = 0x33; // '3'
  const result2 = await validator.validate(validMP3, 'audio_guide' as any, 'en' as any);
  console.log(`   Valid: ${result2.valid}`);
  console.log(`   Errors: ${result2.errors.length}`);
  console.log(`   Warnings: ${result2.warnings.length}`);
  if (result2.metadata) {
    console.log(`   Duration: ~${result2.metadata.duration?.toFixed(0)}s`);
    console.log(`   Format: ${result2.metadata.format}`);
  }

  // Test 3: Validate audio too short
  console.log('\n🎵 Test 3: Validate audio too short');
  const shortMP3 = Buffer.alloc(100 * 1024); // 100 KB
  shortMP3[0] = 0x49;
  shortMP3[1] = 0x44;
  shortMP3[2] = 0x33;
  const result3 = await validator.validate(shortMP3, 'audio_guide' as any, 'en' as any);
  console.log(`   Valid: ${result3.valid}`);
  console.log(`   Errors: ${result3.errors.length}`);
  if (result3.errors.length > 0) {
    console.log(`   - ${result3.errors[0]}`);
  }

  // Test 4: Validate empty video
  console.log('\n🎬 Test 4: Validate empty video');
  const emptyVideo = Buffer.alloc(0);
  const result4 = await validator.validate(emptyVideo, 'video' as any, 'en' as any);
  console.log(`   Valid: ${result4.valid}`);
  console.log(`   Errors: ${result4.errors.length}`);

  // Test 5: Validate valid MP4 video
  console.log('\n🎬 Test 5: Validate valid MP4 video');
  // Create a buffer with MP4 header (ftyp box)
  const validMP4 = Buffer.alloc(50 * 1024 * 1024); // 50 MB
  validMP4[4] = 0x66; // 'f'
  validMP4[5] = 0x74; // 't'
  validMP4[6] = 0x79; // 'y'
  validMP4[7] = 0x70; // 'p'
  const result5 = await validator.validate(validMP4, 'video' as any, 'en' as any);
  console.log(`   Valid: ${result5.valid}`);
  console.log(`   Errors: ${result5.errors.length}`);
  console.log(`   Warnings: ${result5.warnings.length}`);
  if (result5.metadata) {
    console.log(`   Duration: ~${result5.metadata.duration?.toFixed(0)}s`);
    console.log(`   Format: ${result5.metadata.format}`);
  }

  // Test 6: Validate empty infographic
  console.log('\n🖼️  Test 6: Validate empty infographic');
  const emptyInfographic = Buffer.alloc(0);
  const result6 = await validator.validate(emptyInfographic, 'infographic' as any, 'en' as any);
  console.log(`   Valid: ${result6.valid}`);
  console.log(`   Errors: ${result6.errors.length}`);

  // Test 7: Validate valid PNG infographic
  console.log('\n🖼️  Test 7: Validate valid PNG infographic');
  // Create a buffer with PNG header and dimensions
  const validPNG = Buffer.alloc(2 * 1024 * 1024); // 2 MB
  // PNG signature
  validPNG[0] = 0x89;
  validPNG[1] = 0x50;
  validPNG[2] = 0x4E;
  validPNG[3] = 0x47;
  validPNG[4] = 0x0D;
  validPNG[5] = 0x0A;
  validPNG[6] = 0x1A;
  validPNG[7] = 0x0A;
  // IHDR chunk with dimensions 1920x1080
  validPNG.writeUInt32BE(1920, 16); // width
  validPNG.writeUInt32BE(1080, 20); // height
  const result7 = await validator.validate(validPNG, 'infographic' as any, 'en' as any);
  console.log(`   Valid: ${result7.valid}`);
  console.log(`   Errors: ${result7.errors.length}`);
  console.log(`   Warnings: ${result7.warnings.length}`);
  if (result7.metadata) {
    console.log(`   Dimensions: ${result7.metadata.dimensions?.width}x${result7.metadata.dimensions?.height}`);
    console.log(`   Format: ${result7.metadata.format}`);
  }

  // Test 8: Validate PNG too small
  console.log('\n🖼️  Test 8: Validate PNG too small');
  const smallPNG = Buffer.alloc(1 * 1024 * 1024); // 1 MB
  // PNG signature
  smallPNG[0] = 0x89;
  smallPNG[1] = 0x50;
  smallPNG[2] = 0x4E;
  smallPNG[3] = 0x47;
  smallPNG[4] = 0x0D;
  smallPNG[5] = 0x0A;
  smallPNG[6] = 0x1A;
  smallPNG[7] = 0x0A;
  // IHDR chunk with dimensions 800x600 (too small)
  smallPNG.writeUInt32BE(800, 16); // width
  smallPNG.writeUInt32BE(600, 20); // height
  const result8 = await validator.validate(smallPNG, 'infographic' as any, 'en' as any);
  console.log(`   Valid: ${result8.valid}`);
  console.log(`   Errors: ${result8.errors.length}`);
  if (result8.errors.length > 0) {
    result8.errors.forEach(err => console.log(`   - ${err}`));
  }

  // Test 9: Validate empty Q&A
  console.log('\n❓ Test 9: Validate empty Q&A');
  const emptyQA = Buffer.alloc(0);
  const result9 = await validator.validate(emptyQA, 'qa_knowledge_base' as any, 'en' as any);
  console.log(`   Valid: ${result9.valid}`);
  console.log(`   Errors: ${result9.errors.length}`);

  // Test 10: Validate invalid JSON Q&A
  console.log('\n❓ Test 10: Validate invalid JSON Q&A');
  const invalidJSON = Buffer.from('{ invalid json }', 'utf-8');
  const result10 = await validator.validate(invalidJSON, 'qa_knowledge_base' as any, 'en' as any);
  console.log(`   Valid: ${result10.valid}`);
  console.log(`   Errors: ${result10.errors.length}`);
  if (result10.errors.length > 0) {
    console.log(`   - ${result10.errors[0]}`);
  }

  // Test 11: Validate valid Q&A with too few questions
  console.log('\n❓ Test 11: Validate Q&A with too few questions');
  const fewQA = Buffer.from(JSON.stringify([
    { question: 'What is this temple?', answer: 'This is a historic temple.' },
    { question: 'When was it built?', answer: 'It was built in the 16th century.' },
  ]), 'utf-8');
  const result11 = await validator.validate(fewQA, 'qa_knowledge_base' as any, 'en' as any);
  console.log(`   Valid: ${result11.valid}`);
  console.log(`   Errors: ${result11.errors.length}`);
  if (result11.errors.length > 0) {
    console.log(`   - ${result11.errors[0]}`);
  }

  // Test 12: Validate valid Q&A
  console.log('\n❓ Test 12: Validate valid Q&A');
  const validQA = Buffer.from(JSON.stringify([
    { question: 'What is this temple?', answer: 'This is a historic temple dedicated to Lord Shiva.' },
    { question: 'When was it built?', answer: 'It was built in the 16th century during the Vijayanagara period.' },
    { question: 'What is special about it?', answer: 'It features unique architectural elements and intricate carvings.' },
    { question: 'Who built it?', answer: 'It was commissioned by the Vijayanagara rulers.' },
    { question: 'What are the visiting hours?', answer: 'The temple is open from 6 AM to 6 PM daily.' },
    { question: 'Is photography allowed?', answer: 'Yes, photography is allowed in most areas except the sanctum.' },
  ]), 'utf-8');
  const result12 = await validator.validate(validQA, 'qa_knowledge_base' as any, 'en' as any);
  console.log(`   Valid: ${result12.valid}`);
  console.log(`   Errors: ${result12.errors.length}`);
  console.log(`   Warnings: ${result12.warnings.length}`);
  if (result12.metadata) {
    console.log(`   Question count: ${result12.metadata.questionCount}`);
    console.log(`   Format: ${result12.metadata.format}`);
  }

  // Test 13: Batch validation
  console.log('\n📦 Test 13: Batch validation');
  const batchItems = [
    { content: validMP3, contentType: 'audio_guide' as any, language: 'en' as any, identifier: 'audio-1' },
    { content: validMP4, contentType: 'video' as any, language: 'en' as any, identifier: 'video-1' },
    { content: validPNG, contentType: 'infographic' as any, language: 'en' as any, identifier: 'infographic-1' },
    { content: validQA, contentType: 'qa_knowledge_base' as any, language: 'en' as any, identifier: 'qa-1' },
  ];

  const batchResults = await validator.validateBatch(batchItems);
  const stats = validator.getValidationStats(batchResults);
  
  console.log(`   Total: ${stats.total}`);
  console.log(`   Valid: ${stats.valid}`);
  console.log(`   Invalid: ${stats.invalid}`);
  console.log(`   Total Errors: ${stats.totalErrors}`);
  console.log(`   Total Warnings: ${stats.totalWarnings}`);

  console.log('\n✅ All content validator tests completed!\n');
}

testContentValidator().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
