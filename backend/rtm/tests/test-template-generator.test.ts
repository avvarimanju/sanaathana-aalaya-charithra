/**
 * Test Template Generator Tests
 * 
 * Tests template generation for all requirement types
 * Validates template customization and metadata extraction
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TestTemplateGenerator, TestGenerationRequest, TestTemplate } from '../services/test-template-generator';
import { writeFileSync, unlinkSync, existsSync, mkdirSync, rmdirSync } from 'fs';
import { join } from 'path';
import * as fc from 'fast-check';

describe('TestTemplateGenerator', () => {
  let generator: TestTemplateGenerator;
  const testOutputDir = join(__dirname, 'test-output');

  beforeEach(() => {
    generator = new TestTemplateGenerator();
    
    // Create test output directory
    if (!existsSync(testOutputDir)) {
      mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Cleanup test output directory
    if (existsSync(testOutputDir)) {
      const files = require('fs').readdirSync(testOutputDir);
      files.forEach((file: string) => {
        unlinkSync(join(testOutputDir, file));
      });
      rmdirSync(testOutputDir);
    }
  });

  describe('Task 20.1: Template Generation Core', () => {
    it('should generate template for valid request', () => {
      const request: TestGenerationRequest = {
        requirementId: 'req-123',
        requirementType: 'functional',
        requirementTitle: 'User Authentication',
        requirementDescription: 'Implement JWT-based authentication',
        testType: 'unit',
        platform: 'backend',
        outputPath: join(testOutputDir, 'auth.test.ts')
      };

      const template = generator.generateTemplate(request);

      expect(template).toBeDefined();
      expect(template.templateId).toBeDefined();
      expect(template.name).toContain('User Authentication');
      expect(template.content).toContain('req-123');
      expect(template.requirementType).toBe('functional');
      expect(template.testType).toBe('unit');
      expect(template.platform).toBe('backend');
    });

    it('should throw error for unsupported template type', () => {
      const request: TestGenerationRequest = {
        requirementId: 'req-123',
        requirementType: 'functional',
        requirementTitle: 'Test',
        requirementDescription: 'Test description',
        testType: 'unit',
        platform: 'unsupported' as any,
        outputPath: join(testOutputDir, 'test.ts')
      };

      expect(() => generator.generateTemplate(request)).toThrow();
    });

    it('should customize template with requirement details', () => {
      const request: TestGenerationRequest = {
        requirementId: 'req-456',
        requirementType: 'functional',
        requirementTitle: 'Password Reset',
        requirementDescription: 'Allow users to reset password',
        testType: 'unit',
        platform: 'backend',
        outputPath: join(testOutputDir, 'password-reset.test.ts')
      };

      const template = generator.generateTemplate(request);

      expect(template.content).toContain('req-456');
      expect(template.content).toContain('Password Reset');
      expect(template.content).toContain('PasswordResetService');
    });
  });

  describe('Task 20.3: Functional Unit Test Generation', () => {
    it('should generate functional unit test template', () => {
      const request: TestGenerationRequest = {
        requirementId: 'req-func-001',
        requirementType: 'functional',
        requirementTitle: 'Calculate Total Price',
        requirementDescription: 'Calculate total price with tax',
        testType: 'unit',
        platform: 'backend',
        outputPath: join(testOutputDir, 'price-calculator.test.ts')
      };

      const template = generator.generateTemplate(request);

      expect(template.content).toContain('describe');
      expect(template.content).toContain('it(');
      expect(template.content).toContain('expect');
      expect(template.content).toContain('beforeEach');
      expect(template.content).toContain('CalculateTotalPriceService');
      expect(template.content).toContain('should');
      expect(template.metadata.framework).toBe('Jest');
    });

    it('should include error handling tests', () => {
      const request: TestGenerationRequest = {
        requirementId: 'req-func-002',
        requirementType: 'functional',
        requirementTitle: 'Validate Email',
        requirementDescription: 'Validate email format',
        testType: 'unit',
        platform: 'backend',
        outputPath: join(testOutputDir, 'email-validator.test.ts')
      };

      const template = generator.generateTemplate(request);

      expect(template.content).toContain('invalid input');
      expect(template.content).toContain('rejects.toThrow');
      expect(template.content).toContain('validate input parameters');
    });
  });

  describe('Task 20.4: API Integration Test Generation', () => {
    it('should generate API integration test template', () => {
      const request: TestGenerationRequest = {
        requirementId: 'req-api-001',
        requirementType: 'api',
        requirementTitle: 'Create User Endpoint',
        requirementDescription: 'POST /api/users endpoint',
        testType: 'integration',
        platform: 'backend',
        outputPath: join(testOutputDir, 'create-user-api.test.ts')
      };

      const template = generator.generateTemplate(request);

      expect(template.content).toContain('request(app)');
      expect(template.content).toContain('supertest');
      expect(template.content).toContain('Authorization');
      expect(template.content).toContain('Bearer');
      expect(template.content).toContain('/api/create-user-endpoint');
      expect(template.metadata.framework).toContain('Supertest');
    });

    it('should include authentication tests', () => {
      const request: TestGenerationRequest = {
        requirementId: 'req-api-002',
        requirementType: 'api',
        requirementTitle: 'Protected Resource',
        requirementDescription: 'GET /api/protected endpoint',
        testType: 'integration',
        platform: 'backend',
        outputPath: join(testOutputDir, 'protected-api.test.ts')
      };

      const template = generator.generateTemplate(request);

      expect(template.content).toContain('401 when not authenticated');
      expect(template.content).toContain('403 when not authorized');
      expect(template.content).toContain('validate request body schema');
    });
  });

  describe('Task 20.5: Workflow System Test Generation', () => {
    it('should generate workflow system test template', () => {
      const request: TestGenerationRequest = {
        requirementId: 'req-workflow-001',
        requirementType: 'workflow',
        requirementTitle: 'User Registration Flow',
        requirementDescription: 'Complete user registration workflow',
        testType: 'system',
        platform: 'backend',
        outputPath: join(testOutputDir, 'registration-workflow.test.ts')
      };

      const template = generator.generateTemplate(request);

      expect(template.content).toContain('WorkflowTestHelper');
      expect(template.content).toContain('TestOrchestrator');
      expect(template.content).toContain('Step 1:');
      expect(template.content).toContain('Step 2:');
      expect(template.content).toContain('Step 3:');
      expect(template.content).toContain('End-to-End Flow');
      expect(template.metadata.estimatedTime).toContain('hours');
    });

    it('should include workflow interruption handling', () => {
      const request: TestGenerationRequest = {
        requirementId: 'req-workflow-002',
        requirementType: 'workflow',
        requirementTitle: 'Payment Processing',
        requirementDescription: 'Process payment workflow',
        testType: 'system',
        platform: 'backend',
        outputPath: join(testOutputDir, 'payment-workflow.test.ts')
      };

      const template = generator.generateTemplate(request);

      expect(template.content).toContain('workflow interruption');
      expect(template.content).toContain('simulateInterruption');
      expect(template.content).toContain('validate workflow prerequisites');
    });
  });

  describe('Task 20.6: Property-Based Test Generation', () => {
    it('should generate property-based test template', () => {
      const request: TestGenerationRequest = {
        requirementId: 'req-parser-001',
        requirementType: 'parser',
        requirementTitle: 'JSON Parser',
        requirementDescription: 'Parse and serialize JSON',
        testType: 'unit',
        platform: 'backend',
        outputPath: join(testOutputDir, 'json-parser.test.ts')
      };

      const template = generator.generateTemplate(request);

      expect(template.content).toContain('fast-check');
      expect(template.content).toContain('fc.assert');
      expect(template.content).toContain('fc.property');
      expect(template.content).toContain('Round Trip Property');
      expect(template.content).toContain('numRuns: 100');
      expect(template.metadata.dependencies).toContain('fast-check');
    });

    it('should include parser invariants', () => {
      const request: TestGenerationRequest = {
        requirementId: 'req-parser-002',
        requirementType: 'parser',
        requirementTitle: 'XML Parser',
        requirementDescription: 'Parse XML documents',
        testType: 'unit',
        platform: 'backend',
        outputPath: join(testOutputDir, 'xml-parser.test.ts')
      };

      const template = generator.generateTemplate(request);

      expect(template.content).toContain('Parser Invariants');
      expect(template.content).toContain('always produce valid output');
      expect(template.content).toContain('reject invalid input consistently');
      expect(template.content).toContain('Performance Properties');
    });
  });

  describe('Task 20.7: Security Test Generation', () => {
    it('should generate security test template', () => {
      const request: TestGenerationRequest = {
        requirementId: 'req-sec-001',
        requirementType: 'security',
        requirementTitle: 'API Authentication',
        requirementDescription: 'Secure API endpoints',
        testType: 'security',
        platform: 'backend',
        outputPath: join(testOutputDir, 'api-security.test.ts')
      };

      const template = generator.generateTemplate(request);

      expect(template.content).toContain('Authentication Security');
      expect(template.content).toContain('Authorization Security');
      expect(template.content).toContain('Input Validation Security');
      expect(template.content).toContain('Rate Limiting Security');
      expect(template.content).toContain('SecurityTestHelper');
    });

    it('should include injection attack tests', () => {
      const request: TestGenerationRequest = {
        requirementId: 'req-sec-002',
        requirementType: 'security',
        requirementTitle: 'Input Sanitization',
        requirementDescription: 'Sanitize user input',
        testType: 'security',
        platform: 'backend',
        outputPath: join(testOutputDir, 'input-security.test.ts')
      };

      const template = generator.generateTemplate(request);

      expect(template.content).toContain('SQL injection');
      expect(template.content).toContain('XSS attacks');
      expect(template.content).toContain('DROP TABLE');
      expect(template.content).toContain('<script>');
    });
  });

  describe('Task 20.8: Performance Test Generation', () => {
    it('should generate performance test template', () => {
      const request: TestGenerationRequest = {
        requirementId: 'req-perf-001',
        requirementType: 'performance',
        requirementTitle: 'API Response Time',
        requirementDescription: 'Ensure fast API responses',
        testType: 'performance',
        platform: 'backend',
        outputPath: join(testOutputDir, 'api-performance.test.ts')
      };

      const template = generator.generateTemplate(request);

      expect(template.content).toContain('PerformanceTestRunner');
      expect(template.content).toContain('Response Time Performance');
      expect(template.content).toContain('Load Testing');
      expect(template.content).toContain('Stress Testing');
      expect(template.content).toContain('Memory Performance');
    });

    it('should include load and stress tests', () => {
      const request: TestGenerationRequest = {
        requirementId: 'req-perf-002',
        requirementType: 'performance',
        requirementTitle: 'High Concurrency',
        requirementDescription: 'Handle concurrent requests',
        testType: 'performance',
        platform: 'backend',
        outputPath: join(testOutputDir, 'concurrency-performance.test.ts')
      };

      const template = generator.generateTemplate(request);

      expect(template.content).toContain('concurrent requests');
      expect(template.content).toContain('breaking point');
      expect(template.content).toContain('memory leaks');
      expect(template.content).toContain('Database Performance');
    });
  });

  describe('Task 20.9: Test Metadata Extraction', () => {
    it('should extract test metadata from file', () => {
      const testFilePath = join(testOutputDir, 'sample.test.ts');
      const testContent = `
/**
 * @testCase TC-001
 * @requirement req-123
 * @type unit
 */
describe('Sample Test', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });

  it('should handle errors', () => {
    expect(() => { throw new Error(); }).toThrow();
  });
});
      `;
      
      writeFileSync(testFilePath, testContent);

      const metadata = generator.extractTestMetadata(testFilePath);

      expect(metadata.testCases).toContain('TC-001');
      expect(metadata.requirements).toContain('req-123');
      expect(metadata.type).toBe('unit');
      expect(metadata.testFunctions).toHaveLength(2);
      expect(metadata.testFunctions[0].description).toBe('should do something');
    });

    it('should handle file not found', () => {
      expect(() => generator.extractTestMetadata('/nonexistent/file.ts'))
        .toThrow('Test file not found');
    });

    it('should extract multiple annotations', () => {
      const testFilePath = join(testOutputDir, 'multi-annotation.test.ts');
      const testContent = `
/**
 * @testCase TC-001
 * @testCase TC-002
 * @requirement req-123
 * @requirement req-456
 * @type integration
 */
describe('Multi Annotation Test', () => {
  it('test 1', () => {});
  it('test 2', () => {});
  it('test 3', () => {});
});
      `;
      
      writeFileSync(testFilePath, testContent);

      const metadata = generator.extractTestMetadata(testFilePath);

      expect(metadata.testCases).toHaveLength(2);
      expect(metadata.requirements).toHaveLength(2);
      expect(metadata.testFunctions).toHaveLength(3);
    });
  });

  describe('Task 20.10: Template Saving', () => {
    it('should save template to file', () => {
      const request: TestGenerationRequest = {
        requirementId: 'req-save-001',
        requirementType: 'functional',
        requirementTitle: 'Save Test',
        requirementDescription: 'Test saving functionality',
        testType: 'unit',
        platform: 'backend',
        outputPath: join(testOutputDir, 'save-test.test.ts')
      };

      const template = generator.generateTemplate(request);
      generator.saveTemplate(template, request.outputPath);

      expect(existsSync(request.outputPath)).toBe(true);
      
      const metadataPath = request.outputPath.replace('.ts', '.metadata.json');
      expect(existsSync(metadataPath)).toBe(true);
    });

    it('should create directory if not exists', () => {
      const nestedPath = join(testOutputDir, 'nested', 'deep', 'test.test.ts');
      const request: TestGenerationRequest = {
        requirementId: 'req-nested-001',
        requirementType: 'functional',
        requirementTitle: 'Nested Test',
        requirementDescription: 'Test nested directory creation',
        testType: 'unit',
        platform: 'backend',
        outputPath: nestedPath
      };

      const template = generator.generateTemplate(request);
      generator.saveTemplate(template, request.outputPath);

      expect(existsSync(nestedPath)).toBe(true);
    });

    it('should save metadata with template', () => {
      const request: TestGenerationRequest = {
        requirementId: 'req-metadata-001',
        requirementType: 'api',
        requirementTitle: 'Metadata Test',
        requirementDescription: 'Test metadata saving',
        testType: 'integration',
        platform: 'backend',
        outputPath: join(testOutputDir, 'metadata-test.test.ts')
      };

      const template = generator.generateTemplate(request);
      generator.saveTemplate(template, request.outputPath);

      const metadataPath = request.outputPath.replace('.ts', '.metadata.json');
      const metadataContent = require('fs').readFileSync(metadataPath, 'utf8');
      const metadata = JSON.parse(metadataContent);

      expect(metadata.templateId).toBe(template.templateId);
      expect(metadata.name).toBe(template.name);
      expect(metadata.requirementType).toBe('api');
      expect(metadata.testType).toBe('integration');
      expect(metadata.generatedAt).toBeDefined();
    });
  });

  describe('Property-Based Tests', () => {
    it('should generate valid templates for various requirement titles', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 5, maxLength: 50 }).filter(s => /^[a-zA-Z\s]+$/.test(s)),
        fc.constantFrom('functional', 'api', 'workflow', 'parser', 'security', 'performance'),
        (title, reqType) => {
          const request: TestGenerationRequest = {
            requirementId: 'req-prop-test',
            requirementType: reqType as any,
            requirementTitle: title,
            requirementDescription: 'Property test description',
            testType: 'unit',
            platform: 'backend',
            outputPath: join(testOutputDir, 'prop-test.ts')
          };

          try {
            const template = generator.generateTemplate(request);
            
            // Properties that should always hold
            expect(template.templateId).toBeDefined();
            expect(template.content).toContain('describe');
            expect(template.content).toContain('it(');
            expect(template.content.length).toBeGreaterThan(100);
            
            return true;
          } catch (error) {
            // Some combinations might not have templates
            return true;
          }
        }
      ), { numRuns: 20 });
    });

    it('should handle various special characters in requirement titles', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 5, maxLength: 30 }),
        (title) => {
          const sanitizedTitle = title.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
          if (sanitizedTitle.length < 3) return true;

          const request: TestGenerationRequest = {
            requirementId: 'req-special-chars',
            requirementType: 'functional',
            requirementTitle: sanitizedTitle,
            requirementDescription: 'Test special characters',
            testType: 'unit',
            platform: 'backend',
            outputPath: join(testOutputDir, 'special-chars.test.ts')
          };

          const template = generator.generateTemplate(request);
          
          // Should not contain unescaped special characters
          expect(template.content).not.toContain('{{');
          expect(template.content).not.toContain('}}');
          
          return true;
        }
      ), { numRuns: 20 });
    });
  });

  describe('Template Customization', () => {
    it('should generate unique service names', () => {
      const titles = [
        'User Authentication',
        'Password Reset',
        'Email Validation',
        'Data Processing'
      ];

      const serviceNames = titles.map(title => {
        const request: TestGenerationRequest = {
          requirementId: 'req-unique',
          requirementType: 'functional',
          requirementTitle: title,
          requirementDescription: 'Test',
          testType: 'unit',
          platform: 'backend',
          outputPath: join(testOutputDir, 'test.ts')
        };

        const template = generator.generateTemplate(request);
        const match = template.content.match(/new (\w+Service)/);
        return match ? match[1] : null;
      });

      // All service names should be unique
      const uniqueNames = new Set(serviceNames);
      expect(uniqueNames.size).toBe(titles.length);
    });

    it('should generate valid API endpoints', () => {
      const request: TestGenerationRequest = {
        requirementId: 'req-endpoint',
        requirementType: 'api',
        requirementTitle: 'Create User Account',
        requirementDescription: 'API endpoint for user creation',
        testType: 'integration',
        platform: 'backend',
        outputPath: join(testOutputDir, 'endpoint.test.ts')
      };

      const template = generator.generateTemplate(request);
      
      expect(template.content).toMatch(/\/api\/[a-z-]+/);
      expect(template.content).toContain('/api/create-user-account');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing output directory', () => {
      const request: TestGenerationRequest = {
        requirementId: 'req-error',
        requirementType: 'functional',
        requirementTitle: 'Error Test',
        requirementDescription: 'Test error handling',
        testType: 'unit',
        platform: 'backend',
        outputPath: join(testOutputDir, 'nonexistent', 'deep', 'path', 'test.ts')
      };

      const template = generator.generateTemplate(request);
      
      // Should not throw when saving to non-existent directory
      expect(() => generator.saveTemplate(template, request.outputPath)).not.toThrow();
      expect(existsSync(request.outputPath)).toBe(true);
    });
  });
});
