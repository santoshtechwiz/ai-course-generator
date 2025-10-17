import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { usageLimitService } from '@/services/usage-limit.service'

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await usageLimitService.getUserUsageStats(session.user.id)

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('[API] Error fetching usage stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage stats' },
      { status: 500 }
    )
  }
}
