#!/usr/bin/env node

/**
 * Simple AI Migration Test - OpenAI Provider
 * 
 * Basic smoke test to verify AI functions work after migration.
 * Run: node scripts/test-ai-simple.js
 * 
 * Prerequisites:
 * - OPENAI_API_KEY in .env or .env.local
 */

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') })
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') })

console.log('\n🧪 AI Migration Smoke Test - OpenAI Provider\n')
console.log('='.repeat(60))

// Check API key
if (!process.env.OPENAI_API_KEY) {
  console.error('\n❌ ERROR: OPENAI_API_KEY not set')
  console.error('   Add it to .env or .env.local file\n')
  process.exit(1)
}

console.log('✅ OpenAI API key found')
console.log('✅ Environment loaded')
console.log('='.repeat(60))

// Test summary
let passedTests = 0
let failedTests = 0

function testSuccess(name) {
  passedTests++
  console.log(`✅ ${name}`)
}

function testFailure(name, error) {
  failedTests++
  console.error(`❌ ${name}`)
  console.error(`   ${error.message || String(error)}`)
}

async function runTests() {
  console.log('\n🚀 Running tests...\n')
  
  try {
    // Test 1: Check wrappers module exists
    try {
      const wrappers = require('../lib/ai/services/wrappers')
      
      if (typeof wrappers.generateFlashCards !== 'function') {
        throw new Error('generateFlashCards function not found')
      }
      if (typeof wrappers.generateMcqForUserInput !== 'function') {
        throw new Error('generateMcqForUserInput function not found')
      }
      if (typeof wrappers.checkOrderingQuizAccess !== 'function') {
        throw new Error('checkOrderingQuizAccess function not found')
      }
      
      testSuccess('Wrappers module exports correct functions')
    } catch (error) {
      testFailure('Wrappers module check', error)
    }
    
    // Test 2: Check video summary service exists
    try {
      const videoSummary = require('../lib/ai/services/video-summary.service')
      
      if (typeof videoSummary.generateVideoSummaryFromTranscript !== 'function') {
        throw new Error('generateVideoSummaryFromTranscript function not found')
      }
      
      testSuccess('Video summary service exports correct functions')
    } catch (error) {
      testFailure('Video summary service check', error)
    }
    
    // Test 3: Check ordering quiz access function
    try {
      const { checkOrderingQuizAccess } = require('../lib/ai/services/wrappers')
      
      const accessFree = checkOrderingQuizAccess('FREE', 0)
      if (!accessFree.canGenerate) {
        throw new Error('FREE user should be able to generate')
      }
      
      const accessLimit = checkOrderingQuizAccess('FREE', 3)
      if (accessLimit.canGenerate) {
        throw new Error('FREE user at limit should not be able to generate')
      }
      
      testSuccess('Ordering quiz access check works correctly')
    } catch (error) {
      testFailure('Ordering quiz access check', error)
    }
    
    // Test 4: Verify old imports don't exist
    try {
      let hasOldImports = false
      try {
        require('../lib/chatgptAndGoogleAi')
        hasOldImports = true
      } catch (e) {
        // Expected - file should not exist
      }
      
      if (hasOldImports) {
        throw new Error('Old chatgptAndGoogleAi.ts file still exists')
      }
      
      testSuccess('Old lib/chatgptAndGoogleAi.ts removed')
    } catch (error) {
      testFailure('Old imports check', error)
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Passed: ${passedTests}`)
    console.log(`❌ Failed: ${failedTests}`)
    console.log(`📈 Total:  ${passedTests + failedTests}`)
    
    if (failedTests > 0) {
      console.log('\n⚠️  Some tests failed')
      console.log('\nℹ️  If you see module not found errors:')
      console.log('   1. Run: npm run build')
      console.log('   2. Or check that TypeScript compiled successfully')
      process.exit(1)
    } else {
      console.log('\n🎉 All smoke tests passed!')
      console.log('\nℹ️  Migration structure looks good.')
      console.log('   For full API testing with real calls, ensure:')
      console.log('   - OPENAI_API_KEY is valid')
      console.log('   - You have API credits')
      console.log('   - Network connection is available')
      process.exit(0)
    }
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

runTests()
