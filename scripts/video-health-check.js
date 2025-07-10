#!/usr/bin/env node

/**
 * Video Processing Health Check and Fix Script
 * 
 * This script can be run manually to diagnose and fix video processing issues.
 * It helps identify chapters stuck in processing state and provides fixes.
 * 
 * Usage:
 * npm run video-fix
 * npm run video-fix -- --auto-fix
 * npm run video-fix -- --status
 */

const axios = require('axios')

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

async function checkVideoStatus() {
  try {
    console.log('🔍 Checking video processing status...')
    
    const response = await axios.get(`${BASE_URL}/api/video/debug?action=overview`)
    const data = response.data
    
    if (!data.success) {
      throw new Error(data.error)
    }
    
    console.log('\n📊 Current Status:')
    console.log(`   Processing: ${data.overview.processing}`)
    console.log(`   Completed:  ${data.overview.completed}`)
    console.log(`   Errors:     ${data.overview.error}`)
    console.log(`   Idle:       ${data.overview.idle}`)
    console.log(`   Total:      ${data.overview.total}`)
    
    if (data.details.processing && data.details.processing.length > 0) {
      console.log('\n⏳ Chapters currently processing:')
      data.details.processing.forEach(ch => {
        console.log(`   • Chapter ${ch.id}: "${ch.title}" (updated: ${new Date(ch.updatedAt).toLocaleString()})`)
      })
    }
    
    if (data.details.error && data.details.error.length > 0) {
      console.log('\n❌ Chapters with errors:')
      data.details.error.forEach(ch => {
        console.log(`   • Chapter ${ch.id}: "${ch.title}" (updated: ${new Date(ch.updatedAt).toLocaleString()})`)
      })
    }
    
    return data.overview
    
  } catch (error) {
    console.error('❌ Error checking status:', error.message)
    return null
  }
}

async function checkStuckChapters() {
  try {
    console.log('\n🕐 Checking for stuck chapters...')
    
    const response = await axios.get(`${BASE_URL}/api/video/debug?action=stuck_check`)
    const data = response.data
    
    if (!data.success) {
      throw new Error(data.error)
    }
    
    console.log(`📋 ${data.message}`)
    
    if (data.stuckChapters && data.stuckChapters.length > 0) {
      console.log('\n⚠️  Stuck chapters:')
      data.stuckChapters.forEach(ch => {
        console.log(`   • Chapter ${ch.id}: "${ch.title}" (stuck for: ${ch.stuckFor})`)
      })
      return data.stuckChapters
    }
    
    return []
    
  } catch (error) {
    console.error('❌ Error checking stuck chapters:', error.message)
    return []
  }
}

async function resetStuckChapters() {
  try {
    console.log('\n🔧 Resetting stuck chapters...')
    
    const response = await axios.post(`${BASE_URL}/api/video/debug`, {
      action: 'reset_stuck'
    })
    
    const data = response.data
    
    if (!data.success) {
      throw new Error(data.error)
    }
    
    console.log(`✅ ${data.message}`)
    return data.resetCount
    
  } catch (error) {
    console.error('❌ Error resetting stuck chapters:', error.message)
    return 0
  }
}

async function runDiagnostics(autoFix = false) {
  try {
    console.log(`\n🩺 Running diagnostics${autoFix ? ' with auto-fix' : ''}...`)
    
    const response = await axios.post(`${BASE_URL}/api/video/fix`, {
      action: 'diagnose',
      autoFix
    })
    
    const data = response.data
    
    if (!data.success) {
      throw new Error(data.error)
    }
    
    console.log(`\n📋 Diagnostic Summary:`)
    console.log(`   Total Issues: ${data.summary.totalIssues}`)
    console.log(`   Critical:     ${data.summary.criticalIssues}`)
    console.log(`   High:         ${data.summary.highIssues}`)
    console.log(`   Overall:      ${data.summary.overallHealth}`)
    
    if (data.diagnostics && data.diagnostics.length > 0) {
      console.log('\n🔍 Issues found:')
      data.diagnostics.forEach((issue, index) => {
        const icon = issue.severity === 'critical' ? '🚨' : 
                    issue.severity === 'high' ? '⚠️' : 
                    issue.severity === 'medium' ? '⚡' : 'ℹ️'
        console.log(`   ${icon} [${issue.severity.toUpperCase()}] ${issue.issue.replace(/_/g, ' ')}`)
        console.log(`      ${issue.description}`)
        if (issue.fix) {
          console.log(`      💡 Fix: ${issue.fix}`)
        }
        if (issue.fixApplied) {
          console.log(`      ✅ Fix applied automatically`)
        }
        console.log('')
      })
    }
    
    if (data.fixes && data.fixes.length > 0) {
      console.log('✅ Fixes applied:')
      data.fixes.forEach(fix => {
        console.log(`   • ${fix}`)
      })
    }
    
    return data
    
  } catch (error) {
    console.error('❌ Error running diagnostics:', error.message)
    return null
  }
}

async function main() {
  console.log('🎬 Video Processing Health Check\n')
  
  const args = process.argv.slice(2)
  const autoFix = args.includes('--auto-fix')
  const statusOnly = args.includes('--status')
  
  // Always check current status first
  const status = await checkVideoStatus()
  
  if (statusOnly) {
    console.log('\n✅ Status check complete.')
    return
  }
  
  // Check for stuck chapters
  const stuckChapters = await checkStuckChapters()
  
  // Run full diagnostics
  const diagnostics = await runDiagnostics(autoFix)
  
  // Provide recommendations
  console.log('\n💡 Recommendations:')
  
  if (status && status.processing > 0) {
    console.log('   • Monitor processing chapters for completion')
  }
  
  if (stuckChapters.length > 0 && !autoFix) {
    console.log('   • Run with --auto-fix to reset stuck chapters')
  }
  
  if (status && status.error > 0) {
    console.log('   • Check error chapters and retry processing')
  }
  
  if (diagnostics && diagnostics.summary.totalIssues === 0) {
    console.log('   • System appears healthy! 🎉')
  }
  
  console.log('\n📚 Usage:')
  console.log('   npm run video-fix                    # Check status and run diagnostics')
  console.log('   npm run video-fix -- --auto-fix      # Auto-fix detected issues')
  console.log('   npm run video-fix -- --status        # Status check only')
  
  console.log('\n✅ Health check complete.')
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error.message)
    process.exit(1)
  })
}

module.exports = { checkVideoStatus, checkStuckChapters, resetStuckChapters, runDiagnostics }
