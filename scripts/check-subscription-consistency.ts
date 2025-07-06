#!/usr/bin/env node

/**
 * Subscription Data Consistency Monitor
 * 
 * This script can be run periodically to check and fix subscription data consistency
 * Usage:
 *   npm run check-consistency         # Check only
 *   npm run check-consistency --fix   # Check and fix
 *   npm run check-consistency --user=userId  # Check specific user
 */

import { PrismaClient } from '@prisma/client'
import { SubscriptionService } from '../app/dashboard/subscription/services/subscription-service'

const prisma = new PrismaClient()

interface ConsistencyReport {
  totalUsers: number
  inconsistentUsers: number
  fixedUsers: number
  failedFixes: number
  issues: Record<string, number>
  details: Array<{
    userId: string
    email: string
    issue: string
    fixed?: boolean
    error?: string
  }>
}

async function main() {
  const args = process.argv.slice(2)
  const shouldFix = args.includes('--fix')
  const userId = args.find(arg => arg.startsWith('--user='))?.split('=')[1]
  
  console.log('🔍 Subscription Data Consistency Monitor')
  console.log('==========================================')
  
  if (userId) {
    await checkSingleUser(userId, shouldFix)
  } else {
    await checkAllUsers(shouldFix)
  }
  
  await prisma.$disconnect()
}

async function checkSingleUser(userId: string, shouldFix: boolean) {
  console.log(`📊 Checking user: ${userId}`)
  
  try {
    const validation = await SubscriptionService.validateUserConsistency(userId)
    
    console.log(`\n👤 User: ${userId}`)
    console.log(`✅ Consistent: ${validation.isConsistent}`)
    
    if (!validation.isConsistent) {
      console.log(`❌ Issues:`)
      validation.issues.forEach(issue => {
        console.log(`   - ${issue}`)
      })
      
      if (shouldFix) {
        console.log(`\n🔧 Attempting to fix...`)
        const fixResult = await SubscriptionService.fixUserConsistency(userId)
        
        if (fixResult.success) {
          console.log(`✅ Fixed: ${fixResult.message}`)
        } else {
          console.log(`❌ Fix failed: ${fixResult.message}`)
        }
      }
    } else {
      console.log(`✅ User data is consistent`)
    }
    
  } catch (error) {
    console.error(`❌ Error checking user ${userId}:`, error)
  }
}

async function checkAllUsers(shouldFix: boolean) {
  const report: ConsistencyReport = {
    totalUsers: 0,
    inconsistentUsers: 0,
    fixedUsers: 0,
    failedFixes: 0,
    issues: {},
    details: []
  }
  
  try {
    // Get all inconsistent users using our SQL function
    console.log('📊 Analyzing subscription data consistency...')
    
    const inconsistentUsers = await prisma.$queryRaw`
      SELECT * FROM validate_subscription_consistency() 
      WHERE is_inconsistent = true
    ` as any[]
    
    const totalUsers = await prisma.user.count()
    
    report.totalUsers = totalUsers
    report.inconsistentUsers = inconsistentUsers.length
    
    console.log(`\n📈 Summary:`)
    console.log(`   Total users: ${totalUsers}`)
    console.log(`   Inconsistent users: ${inconsistentUsers.length}`)
    console.log(`   Consistency rate: ${((totalUsers - inconsistentUsers.length) / totalUsers * 100).toFixed(2)}%`)
    
    if (inconsistentUsers.length === 0) {
      console.log(`\n✅ All subscription data is consistent!`)
      return
    }
    
    // Group issues by type
    inconsistentUsers.forEach(user => {
      const issue = user.issue_description
      report.issues[issue] = (report.issues[issue] || 0) + 1
      
      report.details.push({
        userId: user.user_id,
        email: user.email || 'no-email',
        issue: issue
      })
    })
    
    console.log(`\n🔍 Issue Types:`)
    Object.entries(report.issues).forEach(([issue, count]) => {
      console.log(`   ${count}x: ${issue}`)
    })
    
    if (shouldFix) {
      console.log(`\n🔧 Fixing inconsistencies...`)
      
      // Fix users in batches of 10 to avoid overwhelming the database
      const batchSize = 10
      for (let i = 0; i < inconsistentUsers.length; i += batchSize) {
        const batch = inconsistentUsers.slice(i, i + batchSize)
        
        console.log(`   Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(inconsistentUsers.length / batchSize)}...`)
        
        const batchResults = await Promise.allSettled(
          batch.map(async (user) => {
            const fixResult = await SubscriptionService.fixUserConsistency(user.user_id)
            
            const detail = report.details.find(d => d.userId === user.user_id)
            if (detail) {
              detail.fixed = fixResult.success
              if (!fixResult.success) {
                detail.error = fixResult.message
              }
            }
            
            if (fixResult.success) {
              report.fixedUsers++
            } else {
              report.failedFixes++
            }
            
            return { userId: user.user_id, result: fixResult }
          })
        )
        
        // Log batch results
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const { userId, result: fixResult } = result.value
            if (fixResult.success) {
              console.log(`      ✅ Fixed ${userId}`)
            } else {
              console.log(`      ❌ Failed to fix ${userId}: ${fixResult.message}`)
            }
          } else {
            console.log(`      ❌ Error processing user: ${result.reason}`)
          }
        })
        
        // Small delay between batches
        if (i + batchSize < inconsistentUsers.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      console.log(`\n📊 Fix Results:`)
      console.log(`   ✅ Successfully fixed: ${report.fixedUsers}`)
      console.log(`   ❌ Failed to fix: ${report.failedFixes}`)
      console.log(`   📈 Fix success rate: ${report.fixedUsers > 0 ? (report.fixedUsers / (report.fixedUsers + report.failedFixes) * 100).toFixed(2) : 0}%`)
      
    } else {
      console.log(`\n💡 To fix these issues, run: npm run check-consistency --fix`)
    }
    
    // Show detailed report for first 10 users
    if (report.details.length > 0) {
      console.log(`\n📋 Detailed Report (first 10):`)
      report.details.slice(0, 10).forEach((detail, index) => {
        const status = detail.fixed === true ? '✅' : detail.fixed === false ? '❌' : '📋'
        console.log(`   ${index + 1}. ${status} ${detail.userId} (${detail.email})`)
        console.log(`      Issue: ${detail.issue}`)
        if (detail.error) {
          console.log(`      Error: ${detail.error}`)
        }
      })
      
      if (report.details.length > 10) {
        console.log(`   ... and ${report.details.length - 10} more`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error running consistency check:', error)
    process.exit(1)
  }
}

// Handle script execution
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
}

export { main as checkConsistency }
