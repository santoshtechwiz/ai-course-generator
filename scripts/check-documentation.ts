#!/usr/bin/env tsx

/**
 * Documentation Check Script
 * Validates documentation completeness and quality
 */

import { documentationChecker } from '../lib/code-quality'
import { observabilityIntegration } from '../lib/observability'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  console.log('📚 Checking Documentation Quality...\n')

  try {
    // Check main documentation
    const docsResult = await documentationChecker.checkDocumentation()

    console.log(`Documentation Score: ${docsResult.score.toFixed(1)}%\n`)

    // Detailed results
    docsResult.checks.forEach(check => {
      const icon = check.passed ? '✅' : '❌'
      console.log(`${icon} ${check.name}: ${check.message}`)
      if (check.details) {
        console.log(`   ${check.details}`)
      }
    })

    // Recommendations
    if (docsResult.recommendations.length > 0) {
      console.log('\n📝 Recommendations:')
      docsResult.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`)
      })
    }

    // Additional checks
    console.log('\n🔍 Additional Documentation Checks:')

    // Check for API documentation files
    const apiDocsExist = checkFileExists('API.md') || checkFileExists('docs/API.md')
    console.log(`${apiDocsExist ? '✅' : '❌'} API Documentation: ${apiDocsExist ? 'Found' : 'Missing'}`)

    // Check for architecture docs
    const archDocsExist = checkFileExists('ARCHITECTURE.md') || checkFileExists('docs/ARCHITECTURE.md')
    console.log(`${archDocsExist ? '✅' : '❌'} Architecture Documentation: ${archDocsExist ? 'Found' : 'Missing'}`)

    // Check for deployment docs
    const deployDocsExist = checkFileExists('DEPLOYMENT.md') || checkFileExists('docs/DEPLOYMENT.md')
    console.log(`${deployDocsExist ? '✅' : '❌'} Deployment Documentation: ${deployDocsExist ? 'Found' : 'Missing'}`)

    // Check JSDoc coverage in source files
    const jsdocCoverage = await checkJSDocCoverage()
    console.log(`📖 JSDoc Coverage: ${jsdocCoverage.toFixed(1)}% of exported functions documented`)

    // Record metrics
    observabilityIntegration.recordBusinessMetric('documentation_check', docsResult.score, {
      apiDocs: apiDocsExist.toString(),
      archDocs: archDocsExist.toString(),
      deployDocs: deployDocsExist.toString(),
      jsdocCoverage: jsdocCoverage.toString()
    })

    // Final assessment
    const overallScore = calculateOverallScore(docsResult.score, jsdocCoverage, apiDocsExist, archDocsExist, deployDocsExist)

    console.log(`\n🏆 Overall Documentation Score: ${overallScore.toFixed(1)}%`)

    if (overallScore >= 80) {
      console.log('✅ Documentation quality is excellent!')
      process.exit(0)
    } else if (overallScore >= 60) {
      console.log('⚠️  Documentation quality is acceptable but could be improved.')
      process.exit(0)
    } else {
      console.log('❌ Documentation quality needs significant improvement.')
      process.exit(1)
    }

  } catch (error) {
    console.error('💥 Documentation check failed:', error)
    observabilityIntegration.recordError(error as Error, {
      component: 'documentation',
      operation: 'docs_check'
    })
    process.exit(1)
  }
}

function checkFileExists(filePath: string): boolean {
  try {
    fs.accessSync(path.join(process.cwd(), filePath))
    return true
  } catch {
    return false
  }
}

async function checkJSDocCoverage(): Promise<number> {
  // This is a simplified check - in a real implementation,
  // you might use a tool like jsdoc or typescript compiler API
  const libDir = path.join(process.cwd(), 'lib')
  let totalExports = 0
  let documentedExports = 0

  try {
    const files = fs.readdirSync(libDir).filter(f => f.endsWith('.ts'))

    for (const file of files) {
      const content = fs.readFileSync(path.join(libDir, file), 'utf-8')
      const exportMatches = content.match(/export (const|function|class|interface)/g) || []
      const jsdocMatches = content.match(/\/\*\*\s*\n.*?\*\//gs) || []

      totalExports += exportMatches.length
      documentedExports += Math.min(jsdocMatches.length, exportMatches.length)
    }
  } catch (error) {
    console.warn('Could not check JSDoc coverage:', error)
  }

  return totalExports > 0 ? (documentedExports / totalExports) * 100 : 0
}

function calculateOverallScore(
  baseScore: number,
  jsdocCoverage: number,
  apiDocs: boolean,
  archDocs: boolean,
  deployDocs: boolean
): number {
  const docsFilesScore = ([apiDocs, archDocs, deployDocs].filter(Boolean).length / 3) * 100
  const jsdocScore = jsdocCoverage

  // Weighted average: base checks 40%, docs files 30%, JSDoc 30%
  return (baseScore * 0.4) + (docsFilesScore * 0.3) + (jsdocScore * 0.3)
}

main()