import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateShareToken,
  generateAccessKey,
  hashValue,
  verifyToken,
  verifyAccessKey,
  isShareValid,
  calculateExpiry,
  validateShareAccess,
  generateShareData,
} from '@/app/services/share.service';

describe('Share Service', () => {
  describe('Token Generation', () => {
    it('should generate a 32-character token', () => {
      const token = generateShareToken();
      expect(token).toHaveLength(32);
      expect(/^[a-f0-9]+$/.test(token)).toBe(true);
    });

    it('should generate unique tokens', () => {
      const token1 = generateShareToken();
      const token2 = generateShareToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('Access Key Generation', () => {
    it('should generate an 8-character access key', () => {
      const key = generateAccessKey();
      expect(key).toHaveLength(8);
      expect(/^[A-F0-9]+$/.test(key)).toBe(true);
    });

    it('should generate unique keys', () => {
      const key1 = generateAccessKey();
      const key2 = generateAccessKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('Hashing', () => {
    it('should consistently hash the same value', () => {
      const value = 'test-value';
      const hash1 = hashValue(value);
      const hash2 = hashValue(value);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different values', () => {
      const hash1 = hashValue('value1');
      const hash2 = hashValue('value2');
      expect(hash1).not.toBe(hash2);
    });

    it('should produce SHA256 hashes (64 characters)', () => {
      const hash = hashValue('test');
      expect(hash).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });
  });

  describe('Token Verification', () => {
    it('should verify matching token and hash', () => {
      const token = 'test-token';
      const hash = hashValue(token);
      expect(verifyToken(token, hash)).toBe(true);
    });

    it('should reject mismatched token and hash', () => {
      const token = 'test-token';
      const wrongHash = hashValue('different-token');
      expect(verifyToken(token, wrongHash)).toBe(false);
    });

    it('should be case-sensitive', () => {
      const token = 'Test-Token';
      const hash = hashValue(token);
      expect(verifyToken('test-token', hash)).toBe(false);
    });
  });

  describe('Access Key Verification', () => {
    it('should verify matching key and hash', () => {
      const key = 'TESTKEY12';
      const keyHash = hashValue(key);
      expect(verifyAccessKey(key, keyHash)).toBe(true);
    });

    it('should reject mismatched key and hash', () => {
      const keyHash = hashValue('CORRECT-KEY');
      expect(verifyAccessKey('WRONG-KEY', keyHash)).toBe(false);
    });

    it('should return true when no key hash is set', () => {
      expect(verifyAccessKey('any-key', null)).toBe(true);
      expect(verifyAccessKey(undefined, null)).toBe(true);
    });

    it('should reject access when key required but not provided', () => {
      const keyHash = hashValue('REQUIRED-KEY');
      expect(verifyAccessKey(undefined, keyHash)).toBe(false);
      expect(verifyAccessKey(null, keyHash)).toBe(false);
    });
  });

  describe('Share Expiry', () => {
    it('should return true for unexpired share', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(isShareValid(futureDate)).toBe(true);
    });

    it('should return false for expired share', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(isShareValid(pastDate)).toBe(false);
    });

    it('should return true when no expiry is set', () => {
      expect(isShareValid(null)).toBe(true);
    });
  });

  describe('Calculate Expiry', () => {
    it('should calculate correct expiry date', () => {
      const days = 7;
      const expiry = calculateExpiry(days);
      const now = new Date();
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + days);

      expect(expiry).not.toBeNull();
      expect(expiry!.getDate()).toBe(expectedDate.getDate());
      expect(expiry!.getMonth()).toBe(expectedDate.getMonth());
      expect(expiry!.getFullYear()).toBe(expectedDate.getFullYear());
    });

    it('should return null when daysUntilExpiry is null', () => {
      expect(calculateExpiry(null)).toBeNull();
    });

    it('should handle 0 days (today)', () => {
      const expiry = calculateExpiry(0);
      const now = new Date();
      expect(expiry).not.toBeNull();
      expect(expiry!.getDate()).toBe(now.getDate());
    });
  });

  describe('Validate Share Access', () => {
    it('should allow access for public resources', () => {
      const result = validateShareAccess('public', null, null, null);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should require token for link-only resources', () => {
      const result = validateShareAccess('link-only', null, null, null);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('token');
    });

    it('should validate token correctly', () => {
      const token = 'test-token';
      const tokenHash = hashValue(token);

      const result = validateShareAccess('link-only', tokenHash, null, null, token);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid token', () => {
      const tokenHash = hashValue('correct-token');

      const result = validateShareAccess('link-only', tokenHash, null, null, 'wrong-token');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid');
    });

    it('should reject expired share', () => {
      const token = 'test-token';
      const tokenHash = hashValue(token);
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const result = validateShareAccess('link-only', tokenHash, null, pastDate, token);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should validate optional access key', () => {
      const token = 'test-token';
      const tokenHash = hashValue(token);
      const key = 'TESTKEY12';
      const keyHash = hashValue(key);

      const result = validateShareAccess('link-only', tokenHash, keyHash, null, token, key);
      expect(result.isValid).toBe(true);
    });

    it('should reject wrong access key', () => {
      const token = 'test-token';
      const tokenHash = hashValue(token);
      const keyHash = hashValue('CORRECT-KEY');

      const result = validateShareAccess('link-only', tokenHash, keyHash, null, token, 'WRONG-KEY');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid');
    });

    it('should reject access when key required but not provided', () => {
      const token = 'test-token';
      const tokenHash = hashValue(token);
      const keyHash = hashValue('REQUIRED-KEY');

      const result = validateShareAccess('link-only', tokenHash, keyHash, null, token);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid');
    });
  });

  describe('Generate Share Data', () => {
    it('should generate basic share data without access key', () => {
      const data = generateShareData(false, null);

      expect(data.token).toHaveLength(32);
      expect(data.tokenHash).toHaveLength(64);
      expect(data.key).toBeNull();
      expect(data.keyHash).toBeNull();
      expect(data.expiry).toBeNull();
    });

    it('should generate share data with access key', () => {
      const data = generateShareData(true, null);

      expect(data.token).toHaveLength(32);
      expect(data.tokenHash).toHaveLength(64);
      expect(data.key).toHaveLength(8);
      expect(data.keyHash).toHaveLength(64);
      expect(data.expiry).toBeNull();
    });

    it('should generate share data with expiry', () => {
      const days = 7;
      const data = generateShareData(false, days);

      expect(data.expiry).not.toBeNull();
      expect(isShareValid(data.expiry)).toBe(true);
    });

    it('should generate share data with both key and expiry', () => {
      const data = generateShareData(true, 7);

      expect(data.token).toHaveLength(32);
      expect(data.key).toHaveLength(8);
      expect(data.expiry).not.toBeNull();
      expect(isShareValid(data.expiry)).toBe(true);
    });

    it('should generate unique data on each call', () => {
      const data1 = generateShareData(true, 7);
      const data2 = generateShareData(true, 7);

      expect(data1.token).not.toBe(data2.token);
      expect(data1.tokenHash).not.toBe(data2.tokenHash);
      expect(data1.key).not.toBe(data2.key);
      expect(data1.keyHash).not.toBe(data2.keyHash);
    });
  });
});
