#!/usr/bin/env tsx

/**
 * Code Quality Check Script
 * Runs comprehensive code quality checks for CI/CD pipeline
 */

import { codeQualityChecker, testingFramework, documentationChecker } from '../lib/code-quality'
import { observabilityIntegration } from '../lib/observability'

async function main() {
  const isCI = process.argv.includes('--ci')
  console.log('🔍 Running Code Quality Checks...\n')

  let allPassed = true
  const startTime = Date.now()

  try {
    // 1. Code Quality Checks
    console.log('📋 Running code quality checks...')
    const qualityResult = await codeQualityChecker.runQualityChecks()

    console.log(`Quality Checks: ${qualityResult.summary.passedChecks}/${qualityResult.summary.totalChecks} passed`)

    if (!qualityResult.passed) {
      console.log('❌ Quality checks failed:')
      qualityResult.checks.forEach(check => {
        if (check.status === 'failed') {
          console.log(`  - ${check.name}: ${check.message}`)
          if (check.details) {
            console.log(`    ${check.details}`)
          }
        }
      })
      allPassed = false
    }

    // 2. Documentation Check
    console.log('\n📚 Checking documentation...')
    const docsResult = await documentationChecker.checkDocumentation()

    console.log(`Documentation Score: ${docsResult.score.toFixed(1)}%`)

    if (docsResult.recommendations.length > 0) {
      console.log('📝 Recommendations:')
      docsResult.recommendations.forEach(rec => {
        console.log(`  - ${rec}`)
      })
    }

    // 3. Run Tests (if not in CI, or if CI and tests requested)
    if (!isCI || process.argv.includes('--with-tests')) {
      console.log('\n🧪 Running test suites...')
      const testResult = await testingFramework.runAllTests()

      console.log(`\nTest Results:`)
      console.log(`  Suites: ${testResult.totalSuites}`)
      console.log(`  Tests: ${testResult.totalTests}`)
      console.log(`  Passed: ${testResult.passed}`)
      console.log(`  Failed: ${testResult.failed}`)
      console.log(`  Success Rate: ${testResult.successRate.toFixed(1)}%`)
      console.log(`  Total Duration: ${testResult.totalDuration}ms`)
      console.log(`  Average Duration: ${testResult.averageDuration.toFixed(2)}ms`)

      if (testResult.failed > 0) {
        console.log('\n❌ Failed Tests:')
        testResult.failedTests.forEach(test => {
          console.log(`  - ${test.suiteName} > ${test.testName}: ${test.error}`)
        })
        allPassed = false
      }
    }

    // Record metrics
    const duration = Date.now() - startTime
    observabilityIntegration.recordBusinessMetric('code_quality_check', allPassed ? 1 : 0, {
      duration: duration.toString(),
      qualityScore: qualityResult.summary.passedChecks.toString(),
      docScore: docsResult.score.toString()
    })

    // Final result
    const totalTime = Date.now() - startTime
    console.log(`\n⏱️  Total execution time: ${totalTime}ms`)

    if (allPassed) {
      console.log('✅ All code quality checks passed!')
      process.exit(0)
    } else {
      console.log('❌ Some quality checks failed. Please fix the issues above.')
      process.exit(1)
    }

  } catch (error) {
    console.error('💥 Code quality check failed:', error)
    observabilityIntegration.recordError(error as Error, {
      component: 'code_quality',
      operation: 'quality_check'
    })
    process.exit(1)
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

main()