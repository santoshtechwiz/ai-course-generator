/**
 * Safe JSON Parser Utility
 * Use this wrapper for all JSON.parse() calls to prevent crashes
 * 
 * @deprecated Use storage utilities from @/lib/storage instead for persistent data
 */

import { storage } from '@/lib/storage'

export interface SafeParseResult<T> {
  success: boolean
  data?: T
  error?: Error
}

/**
 * Safely parse JSON with error handling and fallback
 * @param jsonString - The JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @param onError - Optional error callback
 * @returns Parsed data or fallback
 */
export function safeJSONParse<T>(
  jsonString: string | null | undefined,
  fallback: T,
  onError?: (error: Error) => void
): T {
  if (!jsonString || jsonString.trim() === '') {
    return fallback
  }

  try {
    return JSON.parse(jsonString) as T
  } catch (error) {
    const parseError = error instanceof Error ? error : new Error('JSON parse failed')
    console.warn('[SafeJSON] Parse error:', parseError.message, { jsonString: jsonString.substring(0, 100) })
    
    if (onError) {
      onError(parseError)
    }
    
    return fallback
  }
}

/**
 * Safely parse JSON and return result object with success flag
 * @param jsonString - The JSON string to parse
 * @returns Result object with success flag and data/error
 */
export function tryParseJSON<T>(jsonString: string | null | undefined): SafeParseResult<T> {
  if (!jsonString || jsonString.trim() === '') {
    return { success: false, error: new Error('Empty or null JSON string') }
  }

  try {
    const data = JSON.parse(jsonString) as T
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('JSON parse failed')
    }
  }
}

/**
 * Parse JSON from localStorage with automatic cleanup of corrupted data
 * @param key - LocalStorage key
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed data or fallback
 */
export function parseLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const item = localStorage.getItem(key)
    if (!item) return fallback

    return JSON.parse(item) as T
  } catch (error) {
    console.warn(`[SafeJSON] Failed to parse localStorage key "${key}", removing corrupted data`)
    try {
      localStorage.removeItem(key)
    } catch (removeError) {
      console.error('[SafeJSON] Failed to remove corrupted localStorage item:', removeError)
    }
    return fallback
  }
}

/**
 * Validate and parse JSON with Zod schema (optional)
 * @param jsonString - The JSON string to parse
 * @param schema - Zod schema for validation (optional)
 * @param fallback - Fallback value if parsing/validation fails
 * @returns Validated parsed data or fallback
 */
export function parseAndValidate<T>(
  jsonString: string | null | undefined,
  fallback: T,
  schema?: { parse: (data: any) => T }
): T {
  const parseResult = tryParseJSON<T>(jsonString)
  
  if (!parseResult.success || !parseResult.data) {
    return fallback
  }

  if (schema) {
    try {
      return schema.parse(parseResult.data)
    } catch (validationError) {
      console.warn('[SafeJSON] Validation failed:', validationError)
      return fallback
    }
  }

  return parseResult.data
}

/**
 * Batch parse multiple JSON strings
 * @param items - Array of JSON strings with keys
 * @returns Map of key to parsed data or errors
 */
export function batchParseJSON<T>(
  items: Array<{ key: string; json: string; fallback: T }>
): Map<string, T> {
  const results = new Map<string, T>()

  for (const item of items) {
    results.set(item.key, safeJSONParse(item.json, item.fallback))
  }

  return results
}

// Export a default instance for convenience
export const SafeJSON = {
  parse: safeJSONParse,
  tryParse: tryParseJSON,
  parseLocalStorage,
  parseAndValidate,
  batchParse: batchParseJSON,
}

export default SafeJSON
