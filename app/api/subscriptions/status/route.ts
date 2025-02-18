import { NextResponse } from 'next/server'
import { SubscriptionService } from '@/services/subscriptionService'
import { getAuthSession } from '@/lib/authOptions'

export async function GET(req: Request) {
  const session=await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'User is not authenticated' }, { status: 401 })
  }
  const userId = session.user.id;
  
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

