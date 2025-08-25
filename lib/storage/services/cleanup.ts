/**
 * Storage Cleanup Script
 * 
 * Run this script to migrate data from old storage patterns to the unified storage system
 */

import { migrateStorageData, migratedStorage } from '@/lib/storage'

// Additional cleanup for specific patterns
export function performStorageCleanup() {
  const results = {
    migrated: 0,
    cleaned: 0,
    errors: [] as string[]
  }

  try {
    // Run the main migration
    const migrationResults = migrateStorageData()
    results.migrated = migrationResults.migrated
    results.errors = [...migrationResults.errors]

    // Clean up specific patterns
    if (typeof window !== 'undefined') {
      const keysToClean = []
      
      // Find old redux persist keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (
          key.startsWith('persist:') || 
          key.includes('redux') ||
          key.includes('_persist_') ||
          key.startsWith('@@')
        )) {
          keysToClean.push(key)
        }
      }

      // Remove old keys
      keysToClean.forEach(key => {
        try {
          localStorage.removeItem(key)
          results.cleaned++
        } catch (error) {
          results.errors.push(`Failed to clean key "${key}": ${error}`)
        }
      })

      // Clean up temporary files
      const tempKeys = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (
          key.startsWith('temp_') ||
          key.includes('_tmp_') ||
          key.includes('debug_')
        )) {
          tempKeys.push(key)
        }
      }

      tempKeys.forEach(key => {
        try {
          sessionStorage.removeItem(key)
          results.cleaned++
        } catch (error) {
          results.errors.push(`Failed to clean temp key "${key}": ${error}`)
        }
      })
    }

  } catch (error) {
    results.errors.push(`Cleanup failed: ${error}`)
  }

  return results
}

/**
 * Validate storage migration
 */
export function validateStorageMigration() {
  const validationResults = {
    valid: true,
    issues: [] as string[],
    recommendations: [] as string[]
  }

  if (typeof window === 'undefined') {
    return validationResults
  }

  // Check for remaining old patterns
  const oldPatterns = [
    'authToken',
    'hasSeenChatTooltip', 
    'hasSeenTrialModal',
    'animationsEnabled',
    'flashcard_best_streak'
  ]

  oldPatterns.forEach(pattern => {
    if (localStorage.getItem(pattern)) {
      validationResults.valid = false
      validationResults.issues.push(`Old storage key "${pattern}" still exists`)
      validationResults.recommendations.push(`Remove "${pattern}" and use the unified storage service`)
    }
  })

  // Check storage size
  const stats = migratedStorage.getItem('__storage_stats__')
  if (!stats) {
    validationResults.recommendations.push('Consider enabling storage statistics tracking')
  }

  return validationResults
}

/**
 * Generate storage report
 */
export function generateStorageReport() {
  const report = {
    timestamp: new Date().toISOString(),
    localStorage: {
      count: 0,
      size: 0,
      keys: [] as string[]
    },
    sessionStorage: {
      count: 0,
      size: 0,
      keys: [] as string[]
    },
    unified: {
      active: false,
      version: '3.0.0'
    }
  }

  if (typeof window === 'undefined') {
    return report
  }

  // Analyze localStorage
  report.localStorage.count = localStorage.length
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      report.localStorage.keys.push(key)
      const value = localStorage.getItem(key)
      if (value) {
        report.localStorage.size += key.length + value.length
      }
    }
  }

  // Analyze sessionStorage
  report.sessionStorage.count = sessionStorage.length
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key) {
      report.sessionStorage.keys.push(key)
      const value = sessionStorage.getItem(key)
      if (value) {
        report.sessionStorage.size += key.length + value.length
      }
    }
  }

  // Check if unified storage is working
  try {
    const testKey = '__test_unified_storage__'
    const testValue = { test: true, timestamp: Date.now() }
    
    migratedStorage.setItem(testKey, testValue)
    const retrieved = migratedStorage.getItem(testKey)
    
    if (retrieved && typeof retrieved === 'object' && 'test' in retrieved && (retrieved as any).test === true) {
      report.unified.active = true
    }
    
    migratedStorage.removeItem(testKey)
  } catch (error) {
    report.unified.active = false
  }

  return report
}

// Auto-run cleanup when imported in browser - but defer to avoid blocking initial render
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run cleanup after initial render to avoid blocking hydration
  setTimeout(() => {
    const results = performStorageCleanup()
    console.log('🧹 Storage cleanup completed:', results)
    
    const validation = validateStorageMigration()
    if (!validation.valid) {
      console.warn('⚠️ Storage validation issues:', validation.issues)
      console.log('💡 Recommendations:', validation.recommendations)
    } else {
      console.log('✅ Storage validation passed')
    }
  }, 5000) // Increased delay to 5 seconds
}

export default {
  performStorageCleanup,
  validateStorageMigration,
  generateStorageReport
}
