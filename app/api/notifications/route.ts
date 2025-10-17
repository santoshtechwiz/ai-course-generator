/**
 * Notification API End    // Fetch recent badge unlocks (last 7 days)
    const recentBadges = await prisma.userBadge.findMany({
      where: {
        userId,
        unlockedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        Badge: true
      },
      orderBy: {
        unlockedAt: 'desc'
      },
      take: 10
    })etches user notifications including:
 * - Badge unlocks
 * - Streak milestones
 * - Course completions
 * - Quiz achievements
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Fetch recent badge unlocks (last 7 days) using raw query
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentBadges = await prisma.$queryRaw<any[]>`
      SELECT 
        ub.*,
        b."name", b."description", b."category", b."icon"
      FROM "UserBadge" ub
      JOIN "Badge" b ON ub."badgeId" = b."id"
      WHERE ub."userId" = ${userId}
      AND ub."unlockedAt" >= ${sevenDaysAgo}
      ORDER BY ub."unlockedAt" DESC
      LIMIT 10
    `

    // Get user's current streak
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true, longestStreak: true }
    })

    // Build notifications array
    const notifications = []

    // Add badge notifications
    for (const userBadge of recentBadges) {
      notifications.push({
        id: `badge-${userBadge.id}`,
        type: 'badge' as const,
        title: 'New Badge Unlocked!',
        description: `You've earned the "${userBadge.name}" badge`,
        icon: 'trophy',
        timestamp: userBadge.unlockedAt,
        read: false, // TODO: Track read status in database
        actionUrl: '/dashboard/profile?tab=badges'
      })
    }

    // Add streak notification if user has active streak
    if (user?.streak && user.streak >= 3) {
      const streakMilestone = user.streak % 7 === 0 // Every 7 days
      if (streakMilestone) {
        notifications.push({
          id: `streak-${user.streak}`,
          type: 'streak' as const,
          title: `${user.streak}-Day Streak! 🔥`,
          description: 'Keep up the great work! Don\'t break your streak.',
          icon: 'flame',
          timestamp: new Date(),
          read: false,
          actionUrl: '/dashboard/flashcard/review'
        })
      }
    }

    // Sort by timestamp (newest first)
    notifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return NextResponse.json({
      notifications,
      unreadCount: notifications.filter(n => !n.read).length
    })

  } catch (error) {
    console.error('[API] Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// Mark notification as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { notificationId } = await req.json()

    // TODO: Implement read status tracking in database
    // For now, just return success
    
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[API] Error marking notification as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}
