// import { NextResponse } from 'next/server'
// import { SubscriptionService } from '@/services/subscriptionService'

// export async function POST(req: Request) {
//   try {
//     const { userId, planName } = await req.json()
//     const { sessionId } = await SubscriptionService.createCheckoutSession(userId, planName)
//     return NextResponse.json({ sessionId })
//   } catch (error) {
//     return NextResponse.json({ error: (error as Error).message }, { status: 400 })
//   }
// }
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

    const { sessionId } = await SubscriptionService.createCheckoutSession(userId, planName, duration)
    return NextResponse.json({ sessionId })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
