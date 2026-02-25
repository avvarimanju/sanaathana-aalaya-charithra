/**
 * Property-based testing setup verification
 */

import * as fc from 'fast-check';

describe('Property-Based Testing Setup', () => {
  it('should verify fast-check is working', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n + 0 === n;
      }),
      { numRuns: 100 }
    );
  });

  it('should verify string generation', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        return s.length >= 0;
      }),
      { numRuns: 100 }
    );
  });

  it('should verify array generation', () => {
    fc.assert(
      fc.property(fc.array(fc.string()), (arr) => {
        return Array.isArray(arr);
      }),
      { numRuns: 100 }
    );
  });
});
