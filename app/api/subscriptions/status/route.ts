import { NextResponse } from 'next/server'
import { SubscriptionService } from '@/services/subscriptionService'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const status = await SubscriptionService.getSubscriptionStatus(userId)
    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}

