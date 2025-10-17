import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { badgeService } from '@/services/badge.service'

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const view = searchParams.get('view') || 'earned' // earned, all, progress

    if (view === 'earned') {
      const badges = await badgeService.getUserBadges(session.user.id)
      return NextResponse.json({ badges })
    }

    if (view === 'all') {
      const badges = await badgeService.getAllBadges()
      return NextResponse.json({ badges })
    }

    if (view === 'progress') {
      const progress = await badgeService.getBadgeProgress(session.user.id)
      return NextResponse.json({ progress })
    }

    return NextResponse.json({ error: 'Invalid view parameter' }, { status: 400 })
  } catch (error) {
    console.error('[API] Error fetching badges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check and unlock new badges
    const newBadges = await badgeService.checkAndUnlockBadges(session.user.id)
    
    return NextResponse.json({ 
      success: true, 
      newBadges,
      count: newBadges.length 
    })
  } catch (error) {
    console.error('[API] Error checking badges:', error)
    return NextResponse.json(
      { error: 'Failed to check badges' },
      { status: 500 }
    )
  }
}
