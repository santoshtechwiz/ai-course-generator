#!/usr/bin/env node

/**
 * Debug script to manually trigger subscription force sync
 * This helps debug subscription sync issues by calling the API directly
 * 
 * Usage: node scripts/debug-force-sync.js
 */

const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

async function forceSync() {
  try {
    console.log('🔄 Triggering force sync with Stripe...')
    
    const response = await fetch(`${baseUrl}/api/subscriptions/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': process.env.DEBUG_COOKIE || '', // You'll need to add session cookie here
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    
    console.log('✅ Force sync completed!')
    console.log('📊 Subscription data:', JSON.stringify(result, null, 2))
    
    if (result.subscription?.debug) {
      console.log('\n🔍 Debug info:')
      console.log('- Stripe Price ID:', result.subscription.debug.stripePriceId)
      console.log('- Stripe Price Amount:', result.subscription.debug.stripePriceAmount)
      console.log('- Stripe Price Nickname:', result.subscription.debug.stripePriceNickname)
      console.log('- Original Plan:', result.subscription.debug.originalPlan)
      console.log('- Original Status:', result.subscription.debug.originalStatus)
      console.log('- Synced:', result.subscription.synced)
    }

  } catch (error) {
    console.error('❌ Force sync failed:', error.message)
    process.exit(1)
  }
}

forceSync()
