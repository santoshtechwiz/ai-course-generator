import { NextResponse } from 'next/server'
import { SubscriptionService } from '@/services/subscriptionService'

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()
    const user = await SubscriptionService.cancelSubscription(userId)
    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}

