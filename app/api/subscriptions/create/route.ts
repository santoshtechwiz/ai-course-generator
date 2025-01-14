import { NextResponse } from 'next/server'
import { SubscriptionService } from '@/services/subscriptionService'

export async function POST(req: Request) {
  try {
    const { userId, planName } = await req.json()
    const { sessionId } = await SubscriptionService.createCheckoutSession(userId, planName)
    return NextResponse.json({ sessionId })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
