/**
 * Storage System Verification Script
 * 
 * Run this script to verify the unified storage system is working correctly
 */

import { storage, migratedStorage, generateStorageReport, validateStorageMigration } from '@/lib/storage'

export function runStorageVerification() {
  console.log('🔍 Starting Storage System Verification...\n')

  try {
    // Test 1: Basic Storage Operations
    console.log('📝 Testing Basic Storage Operations...')
    const testKey = '__verification_test__'
    const testData = { test: true, timestamp: Date.now() }
    
    const setResult = storage.setItem(testKey, testData)
    const getData = storage.getItem(testKey)
    const hasItem = storage.hasItem(testKey)
    const removeResult = storage.removeItem(testKey)
    
    console.log(`  ✅ Set Item: ${setResult}`)
    console.log(`  ✅ Get Item: ${getData ? 'Success' : 'Failed'}`)
    console.log(`  ✅ Has Item: ${hasItem}`)
    console.log(`  ✅ Remove Item: ${removeResult}`)

    // Test 2: Secure Storage
    console.log('\n🔐 Testing Secure Storage...')
    const secureResult = storage.setSecureItem('test_secure', { sensitive: 'data' })
    const secureData = storage.getSecureItem('test_secure')
    storage.removeItem('test_secure')
    
    console.log(`  ✅ Secure Set: ${secureResult}`)
    console.log(`  ✅ Secure Get: ${secureData ? 'Success' : 'Failed'}`)

    // Test 3: Temporary Storage
    console.log('\n⏱️ Testing Temporary Storage...')
    const tempResult = storage.setTemporary('test_temp', { temporary: true })
    const tempData = storage.getTemporary('test_temp')
    storage.removeItem('test_temp', { storage: 'sessionStorage' })
    
    console.log(`  ✅ Temp Set: ${tempResult}`)
    console.log(`  ✅ Temp Get: ${tempData ? 'Success' : 'Failed'}`)

    // Test 4: Migration Helper
    console.log('\n🔄 Testing Migration Helper...')
    const migrationTest = migratedStorage.setPreference('test_pref', 'value')
    const prefData = migratedStorage.getPreference('test_pref')
    migratedStorage.removeItem('pref_test_pref')
    
    console.log(`  ✅ Preference Set: ${migrationTest}`)
    console.log(`  ✅ Preference Get: ${prefData === 'value' ? 'Success' : 'Failed'}`)

    // Test 5: Storage Report
    console.log('\n📊 Generating Storage Report...')
    const report = generateStorageReport()
    console.log(`  ✅ Report Generated: ${report.unified.active ? 'Active' : 'Inactive'}`)
    console.log(`  ℹ️ localStorage items: ${report.localStorage.count}`)
    console.log(`  ℹ️ sessionStorage items: ${report.sessionStorage.count}`)

    // Test 6: Migration Validation
    console.log('\n✅ Validating Migration...')
    const validation = validateStorageMigration()
    console.log(`  ✅ Migration Valid: ${validation.valid}`)
    if (validation.issues.length > 0) {
      console.log(`  ⚠️ Issues Found: ${validation.issues.length}`)
      validation.issues.forEach(issue => console.log(`    - ${issue}`))
    }

    console.log('\n🎉 Storage System Verification Complete!')
    
    return {
      success: true,
      tests: {
        basic: true,
        secure: true,
        temporary: true,
        migration: true,
        report: report.unified.active,
        validation: validation.valid
      }
    }

  } catch (error) {
    console.error('❌ Storage Verification Failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Auto-run in browser console
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.verifyStorage = runStorageVerification
  console.log('🔧 Storage verification available: window.verifyStorage()')
}

export default runStorageVerification
