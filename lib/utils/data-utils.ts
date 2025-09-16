"use client"

/**
 * Safely get a value from an object with a fallback
 */
export function safeGet<T>(obj: any, path: string, fallback: T): T {
  try {
    return path.split('.').reduce((acc, part) => acc?.[part], obj) ?? fallback
  } catch {
    return fallback
  }
}

/**
 * Clean an API response by removing null/undefined values and using defaults
 */
export function cleanApiData<T extends Record<string, any>>(
  data: T | null | undefined,
  defaults: Partial<T>
): T {
  if (!data) return defaults as T

  return Object.keys(defaults).reduce((cleaned, key) => {
    const value = data[key]
    const defaultValue = defaults[key]

    // If value is array, filter out null/undefined
    if (Array.isArray(value)) {
      cleaned[key] = value.filter(Boolean)
    }
    // If value is object (and not null), recursively clean
    else if (value && typeof value === 'object') {
      cleaned[key] = cleanApiData(value, defaultValue as Record<string, any>)
    }
    // Otherwise use value or default
    else {
      cleaned[key] = value ?? defaultValue
    }

    return cleaned
  }, { ...data } as T)
}

/**
 * Validate that required data fields are present
 */
export function validateRequiredData<T extends Record<string, any>>(
  data: T | null | undefined,
  required: (keyof T)[]
): boolean {
  if (!data) return false

  return required.every(field => {
    const value = data[field]
    if (Array.isArray(value)) {
      return Array.isArray(value)
    }
    return value !== null && value !== undefined
  })
}

/**
 * Default values for common data structures
 */
export const DEFAULT_STATS = {
  totalCount: 0,
  completedCount: 0,
  averageScore: 0,
  timeSpent: 0,
}

export const DEFAULT_PROGRESS = {
  current: 0,
  total: 0,
  percentage: 0,
}

export const DEFAULT_USER_DATA = {
  id: '',
  name: '',
  email: '',
  image: null,
}
