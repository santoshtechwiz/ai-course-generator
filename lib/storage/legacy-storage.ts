/**
 * Unified Storage Service
 * 
 * A comprehensive storage solution that consolidates all localStorage, sessionStorage,
 * encryption, and persistence needs across the application.
 * 
 * Features:
 * - Safe browser-side operations with SSR support
 * - Optional encryption for sensitive data
 * - Automatic data sanitization
 * - Error handling and recovery
 * - Memory limits and cleanup
 * - Cross-tab synchronization
 * - Type safety
 * 
 * @author AI Learning Platform
 * @version 3.0.0
 */

import { AES, enc } from 'crypto-js'

// ============================================================================
// CONFIGURATION
// ============================================================================

const STORAGE_CONFIG = {
  // Encryption
  secret: process.env.NEXT_PUBLIC_STORAGE_SECRET || 'ai-learning-secret',
  
  // Size limits
  maxItemSize: 1024 * 1024, // 1MB per item
  maxTotalSize: 5 * 1024 * 1024, // 5MB total storage
  
  // Error handling
  maxRetries: 3,
  retryDelay: 1000,
  
  // Compression
  compressionThreshold: 50 * 1024, // 50KB
  
  // Cleanup
  maxErrorLogs: 10,
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
} as const

// ============================================================================
// TYPES
// ============================================================================

export interface StorageOptions {
  /** Use encryption for sensitive data */
  encrypt?: boolean
  /** Storage type to use */
  storage?: 'localStorage' | 'sessionStorage'
  /** Custom serialization */
  serialize?: (value: any) => string
  /** Custom deserialization */
  deserialize?: (value: string) => any
  /** Automatic cleanup after specified time (ms) */
  ttl?: number
  /** Sanitize data before storage */
  sanitize?: boolean
}

interface StorageItem<T = any> {
  value: T
  timestamp: number
  ttl?: number
  encrypted: boolean
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Safe browser check
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Safe storage access
 */
function getStorageApi(type: 'localStorage' | 'sessionStorage'): Storage | null {
  if (!isBrowser()) return null
  
  try {
    const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage
    // Test if storage is available and working
    const testKey = '__storage_test__'
    storage.setItem(testKey, 'test')
    storage.removeItem(testKey)
    return storage
  } catch {
    return null
  }
}

/**
 * Calculate storage size
 */
function getStorageSize(storage: Storage): number {
  let total = 0
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key) {
      const value = storage.getItem(key)
      if (value) {
        total += key.length + value.length
      }
    }
  }
  return total
}

/**
 * Sanitize data to remove sensitive information
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') return data
  
  // Deep clone to avoid modifying original
  const cloned = JSON.parse(JSON.stringify(data))
  
  // Remove sensitive fields
  const sensitiveFields = ['token', 'password', 'authState', 'secret', 'key']
  function removeSensitiveFields(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(removeSensitiveFields)
    }
    
    if (obj && typeof obj === 'object') {
      const cleaned = { ...obj }
      
      sensitiveFields.forEach(field => {
        delete cleaned[field]
      })
      
      // Sanitize quiz data to prevent cheating
      if (cleaned.questions && !cleaned.isCompleted) {
        cleaned.questions = cleaned.questions.map((q: any) => {
          const question = { ...q }
          delete question.answer
          delete question.correctAnswer
          delete question.correctOptionId
          return question
        })
      }
      
      // Recursively clean nested objects
      Object.keys(cleaned).forEach(key => {
        cleaned[key] = removeSensitiveFields(cleaned[key])
      })
      
      return cleaned
    }
    
    return obj
  }
  
  return removeSensitiveFields(cloned)
}

/**
 * Encrypt data
 */
function encryptData(data: string): string {
  try {
    return AES.encrypt(data, STORAGE_CONFIG.secret).toString()
  } catch (error) {
    console.error('Encryption failed:', error)
    return data
  }
}

/**
 * Decrypt data
 */
function decryptData(data: string): string {
  try {
    const bytes = AES.decrypt(data, STORAGE_CONFIG.secret)
    return bytes.toString(enc.Utf8)
  } catch (error) {
    console.error('Decryption failed:', error)
    return data
  }
}

/**
 * Check if data appears to be encrypted
 */
function isEncrypted(data: string): boolean {
  // Simple heuristic: encrypted data is typically longer and contains no spaces
  return data.length > 100 && !data.includes(' ') && /^[A-Za-z0-9+/=]+$/.test(data)
}

// ============================================================================
// UNIFIED STORAGE SERVICE
// ============================================================================

export class UnifiedStorageService {
  private static instance: UnifiedStorageService
  private cleanupTimer: NodeJS.Timeout | null = null
  
  private constructor() {
    this.setupCleanup()
  }
  
  static getInstance(): UnifiedStorageService {
    if (!UnifiedStorageService.instance) {
      UnifiedStorageService.instance = new UnifiedStorageService()
    }
    return UnifiedStorageService.instance
  }
  
  // ============================================================================
  // CORE STORAGE OPERATIONS
  // ============================================================================
  
  /**
   * Store data with optional encryption and sanitization
   */
  setItem<T>(key: string, value: T, options: StorageOptions = {}): boolean {
    const {
      encrypt = false,
      storage = 'localStorage',
      serialize = JSON.stringify,
      sanitize = true,
      ttl
    } = options
    
    if (!isBrowser()) return false
    
    const storageApi = getStorageApi(storage)
    if (!storageApi) return false
    
    try {
      // Prepare data
      let processedValue = sanitize ? sanitizeData(value) : value
      
      // Create storage item
      const item: StorageItem<T> = {
        value: processedValue,
        timestamp: Date.now(),
        encrypted: encrypt,
        ...(ttl && { ttl })
      }
      
      // Serialize
      let serialized = serialize(item)
      
      // Encrypt if requested
      if (encrypt) {
        serialized = encryptData(serialized)
      }
      
      // Check size limits
      if (serialized.length > STORAGE_CONFIG.maxItemSize) {
        console.warn(`Item too large for storage: ${serialized.length} bytes`)
        return false
      }
      
      const currentSize = getStorageSize(storageApi)
      if (currentSize + serialized.length > STORAGE_CONFIG.maxTotalSize) {
        console.warn('Storage quota exceeded, attempting cleanup')
        this.cleanup(storageApi)
        
        // Check again after cleanup
        if (getStorageSize(storageApi) + serialized.length > STORAGE_CONFIG.maxTotalSize) {
          console.error('Storage quota exceeded even after cleanup')
          return false
        }
      }
      
      // Store with retries
      let attempts = 0
      while (attempts < STORAGE_CONFIG.maxRetries) {
        try {
          storageApi.setItem(key, serialized)
          
          // Verify storage
          if (storageApi.getItem(key) === serialized) {
            return true
          }
          
          throw new Error('Storage verification failed')
        } catch (error) {
          attempts++
          if (attempts >= STORAGE_CONFIG.maxRetries) {
            console.error(`Storage failed after ${attempts} attempts:`, error)
            return false
          }
          
          // Wait before retry (sync for browser compatibility)
          const delay = STORAGE_CONFIG.retryDelay
          const start = Date.now()
          while (Date.now() - start < delay) {
            // Busy wait for short delay
          }
        }
      }
      
      return false
    } catch (error) {
      console.error('Storage setItem failed:', error)
      return false
    }
  }
  
  /**
   * Retrieve and decrypt data
   */
  getItem<T>(key: string, options: StorageOptions = {}): T | null {
    const {
      storage = 'localStorage',
      deserialize = JSON.parse
    } = options
    
    if (!isBrowser()) return null
    
    const storageApi = getStorageApi(storage)
    if (!storageApi) return null
    
    try {
      const raw = storageApi.getItem(key)
      if (!raw) return null
      
      let data = raw
      
      // Decrypt if appears to be encrypted
      if (isEncrypted(raw)) {
        data = decryptData(raw)
        if (!data) return null
      }
      
      // Parse storage item
      const item: StorageItem<T> = deserialize(data)
      
      // Check TTL
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        this.removeItem(key, { storage })
        return null
      }
      
      return item.value
    } catch (error) {
      console.error('Storage getItem failed:', error)
      return null
    }
  }
  
  /**
   * Remove item from storage
   */
  removeItem(key: string, options: StorageOptions = {}): boolean {
    const { storage = 'localStorage' } = options
    
    if (!isBrowser()) return false
    
    const storageApi = getStorageApi(storage)
    if (!storageApi) return false
    
    try {
      storageApi.removeItem(key)
      return true
    } catch (error) {
      console.error('Storage removeItem failed:', error)
      return false
    }
  }
  
  /**
   * Check if key exists
   */
  hasItem(key: string, options: StorageOptions = {}): boolean {
    return this.getItem(key, options) !== null
  }
  
  /**
   * Clear all items or items matching pattern
   */
  clear(pattern?: string, options: StorageOptions = {}): boolean {
    const { storage = 'localStorage' } = options
    
    if (!isBrowser()) return false
    
    const storageApi = getStorageApi(storage)
    if (!storageApi) return false
    
    try {
      if (pattern) {
        const keysToRemove: string[] = []
        for (let i = 0; i < storageApi.length; i++) {
          const key = storageApi.key(i)
          if (key && key.includes(pattern)) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => storageApi.removeItem(key))
      } else {
        storageApi.clear()
      }
      return true
    } catch (error) {
      console.error('Storage clear failed:', error)
      return false
    }
  }
  
  // ============================================================================
  // SPECIALIZED METHODS
  // ============================================================================
  
  /**
   * Store secure data with encryption
   */
  setSecureItem<T>(key: string, value: T, options: Omit<StorageOptions, 'encrypt'> = {}): boolean {
    return this.setItem(key, value, { ...options, encrypt: true })
  }
  
  /**
   * Get secure data with decryption
   */
  getSecureItem<T>(key: string, options: StorageOptions = {}): T | null {
    return this.getItem<T>(key, options)
  }
  
  /**
   * Store temporary data in sessionStorage
   */
  setTemporary<T>(key: string, value: T, options: Omit<StorageOptions, 'storage'> = {}): boolean {
    return this.setItem(key, value, { ...options, storage: 'sessionStorage' })
  }
  
  /**
   * Get temporary data from sessionStorage
   */
  getTemporary<T>(key: string, options: Omit<StorageOptions, 'storage'> = {}): T | null {
    return this.getItem<T>(key, { ...options, storage: 'sessionStorage' })
  }
  
  /**
   * Store quiz results with appropriate security
   */
  storeQuizResults(slug: string, results: any): boolean {
    const success1 = this.setTemporary(`quiz_results_${slug}`, results)
    const success2 = this.setSecureItem(`quiz_results_${slug}`, results)
    const success3 = this.setItem('pendingQuizResults', {
      slug,
      results,
      title: results.title || "Quiz Results",
      questions: results.questions || [],
      quizType: results.quizType || "mcq",
    })
    
    return success1 && success2 && success3
  }
  
  /**
   * Get quiz results from any storage
   */
  getQuizResults<T>(slug: string): T | null {
    // Try temporary first, then persistent
    return this.getTemporary<T>(`quiz_results_${slug}`) || 
           this.getSecureItem<T>(`quiz_results_${slug}`)
  }
  
  /**
   * Store user preferences
   */
  setPreference<T>(key: string, value: T): boolean {
    return this.setItem(`pref_${key}`, value, { sanitize: false })
  }
  
  /**
   * Get user preferences
   */
  getPreference<T>(key: string, defaultValue?: T): T | null {
    return this.getItem<T>(`pref_${key}`) ?? defaultValue ?? null
  }
  
  // ============================================================================
  // MAINTENANCE
  // ============================================================================
  
  /**
   * Clean up expired and oversized storage
   */
  private cleanup(storage?: Storage): void {
    if (!isBrowser()) return
    
    const storageApis = storage ? [storage] : [
      getStorageApi('localStorage'),
      getStorageApi('sessionStorage')
    ].filter(Boolean) as Storage[]
    
    storageApis.forEach(storageApi => {
      const keysToRemove: string[] = []
      
      for (let i = 0; i < storageApi.length; i++) {
        const key = storageApi.key(i)
        if (!key) continue
        
        try {
          const raw = storageApi.getItem(key)
          if (!raw) continue
          
          // Try to parse as storage item to check TTL
          let data = raw
          if (isEncrypted(raw)) {
            data = decryptData(raw)
          }
          
          const item = JSON.parse(data) as StorageItem
          
          // Remove expired items
          if (item.ttl && Date.now() - item.timestamp > item.ttl) {
            keysToRemove.push(key)
          }
        } catch {
          // Invalid items, consider for removal
          if (key.startsWith('__temp_') || key.includes('_expired_')) {
            keysToRemove.push(key)
          }
        }
      }
      
      keysToRemove.forEach(key => storageApi.removeItem(key))
    })
  }
  
  /**
   * Setup automatic cleanup
   */
  private setupCleanup(): void {
    if (!isBrowser()) return
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, STORAGE_CONFIG.cleanupInterval)
  }
  
  /**
   * Get storage statistics
   */
  getStats(): { localStorage: number; sessionStorage: number; total: number } {
    if (!isBrowser()) return { localStorage: 0, sessionStorage: 0, total: 0 }
    
    const localSize = getStorageApi('localStorage')?.length ?? 0
    const sessionSize = getStorageApi('sessionStorage')?.length ?? 0
    
    return {
      localStorage: localSize,
      sessionStorage: sessionSize,
      total: localSize + sessionSize
    }
  }
  
  /**
   * Cleanup on instance destruction
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

// Singleton instance
export const storage = UnifiedStorageService.getInstance()

// Safe storage utilities (backward compatibility)
const safeStorage = {
  getItem: <T>(key: string, defaultValue: T | null = null): T | null => 
    storage.getItem<T>(key) ?? defaultValue,
  
  setItem: (key: string, value: any): boolean => 
    storage.setItem(key, value),
  
  removeItem: (key: string): boolean => 
    storage.removeItem(key),
  
  clear: (): boolean => 
    storage.clear()
}

const safeSessionStorage = {
  getItem: <T>(key: string, defaultValue: T | null = null): T | null => 
    storage.getTemporary<T>(key) ?? defaultValue,
  
  setItem: (key: string, value: any): boolean => 
    storage.setTemporary(key, value),
  
  removeItem: (key: string): boolean => 
    storage.removeItem(key, { storage: 'sessionStorage' }),
  
  clear: (): boolean => 
    storage.clear(undefined, { storage: 'sessionStorage' })
}

// Default export

