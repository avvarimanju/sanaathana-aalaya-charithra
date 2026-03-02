/**
 * Unit Tests for Indian States Data
 * Tests the state data structure and helper functions
 */

import {
  INDIAN_STATES,
  getStateByCode,
  getStateName,
  getSortedStates,
  getStatesByType,
  IndianState,
} from '../indianStates';

describe('Indian States Data', () => {
  describe('INDIAN_STATES array', () => {
    it('should contain exactly 36 entries (28 states + 8 UTs)', () => {
      expect(INDIAN_STATES).toHaveLength(36);
    });

    it('should contain 28 states', () => {
      const states = INDIAN_STATES.filter(s => s.type === 'state');
      expect(states).toHaveLength(28);
    });

    it('should contain 8 union territories', () => {
      const uts = INDIAN_STATES.filter(s => s.type === 'ut');
      expect(uts).toHaveLength(8);
    });

    it('should have unique state codes', () => {
      const codes = INDIAN_STATES.map(s => s.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(INDIAN_STATES.length);
    });

    it('should have all required fields for each state', () => {
      INDIAN_STATES.forEach(state => {
        expect(state).toHaveProperty('code');
        expect(state).toHaveProperty('name');
        expect(state).toHaveProperty('displayName');
        expect(state).toHaveProperty('svgPath');
        expect(state).toHaveProperty('labelPosition');
        expect(state).toHaveProperty('type');
        
        expect(typeof state.code).toBe('string');
        expect(typeof state.name).toBe('string');
        expect(typeof state.displayName).toBe('string');
        expect(typeof state.svgPath).toBe('string');
        expect(typeof state.labelPosition.x).toBe('number');
        expect(typeof state.labelPosition.y).toBe('number');
        expect(['state', 'ut']).toContain(state.type);
      });
    });

    it('should have non-empty SVG paths', () => {
      INDIAN_STATES.forEach(state => {
        expect(state.svgPath.length).toBeGreaterThan(0);
        expect(state.svgPath).toMatch(/^M\s+\d+/); // Should start with M (move to)
      });
    });

    it('should have valid label positions', () => {
      INDIAN_STATES.forEach(state => {
        expect(state.labelPosition.x).toBeGreaterThan(0);
        expect(state.labelPosition.y).toBeGreaterThan(0);
        expect(state.labelPosition.x).toBeLessThan(1000);
        expect(state.labelPosition.y).toBeLessThan(1200);
      });
    });
  });

  describe('getStateByCode', () => {
    it('should return state for valid code', () => {
      const karnataka = getStateByCode('KA');
      expect(karnataka).toBeDefined();
      expect(karnataka?.name).toBe('Karnataka');
      expect(karnataka?.type).toBe('state');
    });

    it('should return UT for valid UT code', () => {
      const delhi = getStateByCode('DL');
      expect(delhi).toBeDefined();
      expect(delhi?.name).toBe('Delhi');
      expect(delhi?.type).toBe('ut');
    });

    it('should return undefined for invalid code', () => {
      const invalid = getStateByCode('XX');
      expect(invalid).toBeUndefined();
    });

    it('should be case-sensitive', () => {
      const lowercase = getStateByCode('ka');
      expect(lowercase).toBeUndefined();
    });

    it('should work for all states', () => {
      const testCodes = ['AP', 'TN', 'MH', 'GJ', 'RJ', 'UP', 'WB'];
      testCodes.forEach(code => {
        const state = getStateByCode(code);
        expect(state).toBeDefined();
        expect(state?.code).toBe(code);
      });
    });
  });

  describe('getStateName', () => {
    it('should return state name for valid code', () => {
      expect(getStateName('KA')).toBe('Karnataka');
      expect(getStateName('TN')).toBe('Tamil Nadu');
      expect(getStateName('DL')).toBe('Delhi');
    });

    it('should return code itself for invalid code', () => {
      expect(getStateName('XX')).toBe('XX');
      expect(getStateName('INVALID')).toBe('INVALID');
    });

    it('should handle empty string', () => {
      expect(getStateName('')).toBe('');
    });
  });

  describe('getSortedStates', () => {
    it('should return all states sorted alphabetically', () => {
      const sorted = getSortedStates();
      expect(sorted).toHaveLength(36);
      
      // Check if sorted
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].name.localeCompare(sorted[i - 1].name)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should not modify original array', () => {
      const originalFirst = INDIAN_STATES[0].name;
      getSortedStates();
      expect(INDIAN_STATES[0].name).toBe(originalFirst);
    });

    it('should have Andaman and Nicobar Islands first (alphabetically)', () => {
      const sorted = getSortedStates();
      expect(sorted[0].name).toBe('Andaman and Nicobar Islands');
    });
  });

  describe('getStatesByType', () => {
    it('should return only states when type is "state"', () => {
      const states = getStatesByType('state');
      expect(states).toHaveLength(28);
      states.forEach(state => {
        expect(state.type).toBe('state');
      });
    });

    it('should return only UTs when type is "ut"', () => {
      const uts = getStatesByType('ut');
      expect(uts).toHaveLength(8);
      uts.forEach(ut => {
        expect(ut.type).toBe('ut');
      });
    });

    it('should include Karnataka in states', () => {
      const states = getStatesByType('state');
      const karnataka = states.find(s => s.code === 'KA');
      expect(karnataka).toBeDefined();
    });

    it('should include Delhi in UTs', () => {
      const uts = getStatesByType('ut');
      const delhi = uts.find(s => s.code === 'DL');
      expect(delhi).toBeDefined();
    });
  });

  describe('Specific State Validations', () => {
    it('should have correct data for Karnataka', () => {
      const ka = getStateByCode('KA');
      expect(ka).toEqual({
        code: 'KA',
        name: 'Karnataka',
        displayName: 'Karnataka',
        svgPath: expect.any(String),
        labelPosition: expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
        }),
        type: 'state',
      });
    });

    it('should have correct data for Tamil Nadu', () => {
      const tn = getStateByCode('TN');
      expect(tn?.name).toBe('Tamil Nadu');
      expect(tn?.code).toBe('TN');
      expect(tn?.type).toBe('state');
    });

    it('should have correct data for Delhi', () => {
      const dl = getStateByCode('DL');
      expect(dl?.name).toBe('Delhi');
      expect(dl?.code).toBe('DL');
      expect(dl?.type).toBe('ut');
    });
  });

  describe('Data Integrity', () => {
    it('should have all major states', () => {
      const majorStates = [
        'AP', 'AR', 'AS', 'BR', 'CG', 'GA', 'GJ', 'HR', 'HP', 'JH',
        'KA', 'KL', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OR', 'PB',
        'RJ', 'SK', 'TN', 'TS', 'TR', 'UP', 'UK', 'WB'
      ];
      
      majorStates.forEach(code => {
        const state = getStateByCode(code);
        expect(state).toBeDefined();
        expect(state?.type).toBe('state');
      });
    });

    it('should have all union territories', () => {
      const uts = ['AN', 'CH', 'DH', 'DL', 'JK', 'LA', 'LD', 'PY'];
      
      uts.forEach(code => {
        const ut = getStateByCode(code);
        expect(ut).toBeDefined();
        expect(ut?.type).toBe('ut');
      });
    });
  });
});
