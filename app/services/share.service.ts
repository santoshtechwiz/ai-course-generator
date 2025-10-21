import crypto from 'crypto';

/**
 * Share Service - Handles secure token/key generation, validation, and expiry logic
 * for shared courses and quizzes
 */

/**
 * Generate a secure random token for share links
 * @returns 32-character random token
 */
export function generateShareToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate optional access key for additional protection
 * @returns 8-character random alphanumeric key
 */
export function generateAccessKey(): string {
  return crypto.randomBytes(4).toString('hex').substring(0, 8).toUpperCase();
}

/**
 * Hash a key or token using SHA256
 * @param value - The value to hash
 * @returns Hashed value
 */
export function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Verify a token against its hash from database
 * @param token - Plain text token
 * @param hash - Stored hash in database
 * @returns true if token matches hash
 */
export function verifyToken(token: string, hash: string): boolean {
  const tokenHash = hashValue(token);
  return tokenHash === hash;
}

/**
 * Verify an optional access key
 * @param key - Plain text key provided by user
 * @param keyHash - Stored hash in database (can be null if not set)
 * @returns true if key matches hash, or true if keyHash is null (no key required)
 */
export function verifyAccessKey(key: string | undefined | null, keyHash: string | null): boolean {
  // If no key hash is set, access key is not required
  if (!keyHash) {
    return true;
  }

  // If key hash is set but no key provided, access denied
  if (!key) {
    return false;
  }

  // Verify key against hash
  const keyCheckHash = hashValue(key);
  return keyCheckHash === keyHash;
}

/**
 * Check if share link has expired
 * @param expiry - Expiry datetime from database (can be null for no expiry)
 * @returns true if link is still valid, false if expired
 */
export function isShareValid(expiry: Date | null): boolean {
  // If no expiry set, link is valid indefinitely
  if (!expiry) {
    return true;
  }

  // Check if current time is before expiry
  return new Date() < expiry;
}

/**
 * Calculate expiry datetime based on days from now
 * @param daysUntilExpiry - Number of days until expiry (null = never expires)
 * @returns DateTime of expiry or null
 */
export function calculateExpiry(daysUntilExpiry: number | null): Date | null {
  if (daysUntilExpiry === null) {
    return null;
  }

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + daysUntilExpiry);
  return expiry;
}

/**
 * Validate share access based on visibility, token, key, and expiry
 * @param visibility - Resource visibility level ('private' | 'link-only' | 'public')
 * @param shareToken - Stored share token hash
 * @param shareKeyHash - Optional stored key hash
 * @param shareExpiry - Share expiry datetime
 * @param providedToken - Token provided by user (only needed if not public)
 * @param providedKey - Optional key provided by user
 * @returns Object with isValid and error message if applicable
 */
export function validateShareAccess(
  visibility: string,
  shareToken: string | null,
  shareKeyHash: string | null,
  shareExpiry: Date | null,
  providedToken?: string,
  providedKey?: string
): { isValid: boolean; error?: string } {
  // Public resources don't need validation
  if (visibility === 'public') {
    return { isValid: true };
  }

  // Link-only and private resources need token
  if (!shareToken) {
    return { isValid: false, error: 'Share link not configured - token required' };
  }

  if (!providedToken) {
    return { isValid: false, error: 'Access token required' };
  }

  // Verify token
  if (!verifyToken(providedToken, shareToken)) {
    return { isValid: false, error: 'Invalid access token' };
  }

  // Check expiry
  if (!isShareValid(shareExpiry)) {
    return { isValid: false, error: 'Share link has expired' };
  }

  // Verify optional access key if set
  if (!verifyAccessKey(providedKey, shareKeyHash)) {
    return { isValid: false, error: 'Invalid access key' };
  }

  return { isValid: true };
}

/**
 * Generate complete share data for creation
 * @param withAccessKey - Whether to generate an optional access key
 * @param expiryDays - Days until expiry (null = never expires)
 * @returns Object with token, tokenHash, key, keyHash, and expiry
 */
export function generateShareData(
  withAccessKey: boolean = false,
  expiryDays: number | null = null
) {
  const token = generateShareToken();
  const tokenHash = hashValue(token);

  let key: string | null = null;
  let keyHash: string | null = null;

  if (withAccessKey) {
    key = generateAccessKey();
    keyHash = hashValue(key);
  }

  const expiry = calculateExpiry(expiryDays);

  return {
    token,
    tokenHash,
    key,
    keyHash,
    expiry,
    shareUrl: token, // Frontend will construct full URL
  };
}
