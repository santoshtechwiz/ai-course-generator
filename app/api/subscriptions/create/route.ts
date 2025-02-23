import { NextResponse } from 'next/server'
import { SubscriptionService } from '@/services/subscriptionService'
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans'

export async function POST(req: Request) {
  try {
    const { userId, planName, duration } = await req.json()
    
    const plan = SUBSCRIPTION_PLANS.find(p => p.name === planName)
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan name' }, { status: 400 })
    }

    const option = plan.options.find(o => o.duration === duration)
    if (!option) {
      return NextResponse.json({ error: 'Invalid duration for the selected plan' }, { status: 400 })
    }

    // Create checkout session and handle active subscription case
    try {
      const { sessionId } = await SubscriptionService.createCheckoutSession(userId, planName, duration)
      return NextResponse.json({ sessionId })
    } catch (error) {
      if ((error as Error).message === 'User already has an active subscription') {
        return NextResponse.json({ error: 'You already have an active subscription.' }, { status: 409 }) // 409 Conflict
      }
      throw error 
    }

  } catch (error) {
    console.error('Failed to create checkout session:', error);
    return NextResponse.json({ error: (error as Error).message || 'An unexpected error occurred' }, { status: 500 })
  }
}
