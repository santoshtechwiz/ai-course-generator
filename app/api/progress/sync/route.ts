/**
 * API Route: Progress Sync
 * Handles progress data synchronization and retrieval
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import type { ProgressSyncResponse, ProgressQueryData } from '@/services/enhanced-progress/types'

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id
    const courseId = searchParams.get('courseId')
    const lastSyncTime = searchParams.get('lastSyncTime')

    // Ensure user can only access their own data
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: cannot access other user data' },
        { status: 403 }
      )
    }

    // Build query filters
    const whereClause: any = { userId }
    if (courseId) {
      whereClause.courseId = parseInt(courseId)
    }

    let lastSyncDate: Date | undefined
    if (lastSyncTime) {
      lastSyncDate = new Date(parseInt(lastSyncTime))
      whereClause.updatedAt = { gte: lastSyncDate }
    }

    // Fetch chapter progress
    const chapterProgress = await prisma.chapterProgress.findMany({
      where: whereClause,
      select: {
        courseId: true,
        chapterId: true,
        lastProgress: true,
        isCompleted: true,
        timeSpent: true,
        lastAccessedAt: true
      }
    })

    // Fetch course progress
    const courseProgress = await prisma.courseProgress.findMany({
      where: {
        userId,
        ...(courseId && { courseId: parseInt(courseId) }),
        ...(lastSyncDate && { updatedAt: { gte: lastSyncDate } })
      },
      select: {
        courseId: true,
        progress: true,
        isCompleted: true,
        currentChapterId: true,
        totalChapters: true,
        totalTimeSpent: true,
        lastAccessedAt: true
      }
    })

    // Fetch quiz progress if applicable
    const quizProgress = await prisma.quizProgress.findMany({
      where: {
        userId,
        ...(lastSyncDate && { lastUpdated: { gte: lastSyncDate } })
      },
      select: {
        chapterId: true,
        courseId: true,
        currentQuestionIndex: true,
        isCompleted: true,
        timeSpent: true,
        score: true,
        lastUpdated: true
      }
    })

    // Transform data to match expected format
    const progressData: ProgressQueryData = {
      courseProgress: courseProgress.reduce((acc, cp) => {
        acc[cp.courseId] = {
          progress: cp.progress,
          completed: cp.isCompleted,
          currentChapterId: cp.currentChapterId,
          totalChapters: cp.totalChapters,
          totalTimeSpent: cp.totalTimeSpent,
          lastAccessed: cp.lastAccessedAt?.getTime() || 0,
          lastUpdated: Date.now()
        }
        return acc
      }, {} as Record<string, any>),

      chapterProgress: chapterProgress.reduce((acc, cp) => {
        const key = `${cp.courseId}:${cp.chapterId}`
        acc[key] = {
          progress: cp.lastProgress,
          completed: cp.isCompleted,
          timeSpent: cp.timeSpent,
          lastUpdated: cp.lastAccessedAt?.getTime() || 0
        }
        return acc
      }, {} as Record<string, any>),

      quizProgress: quizProgress.reduce((acc, qp) => {
        const key = `${qp.courseId}:${qp.chapterId}`
        acc[key] = {
          progress: qp.currentQuestionIndex,
          completed: qp.isCompleted,
          timeSpent: qp.timeSpent,
          score: qp.score,
          lastUpdated: qp.lastUpdated.getTime()
        }
        return acc
      }, {} as Record<string, any>),

      lastUpdated: Date.now()
    }

    const hasUpdates = chapterProgress.length > 0 || courseProgress.length > 0 || quizProgress.length > 0

    const response: ProgressSyncResponse = {
      progress: progressData,
      syncTime: Date.now(),
      hasUpdates
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Progress sync API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Handle manual sync trigger
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { forceFlush } = await request.json()

    if (forceFlush) {
      // Trigger immediate queue flush
      const { progressQueue } = await import('@/services/enhanced-progress/queue')
      await progressQueue.flush()
      
      return NextResponse.json({
        success: true,
        message: 'Queue flush triggered',
        timestamp: Date.now()
      })
    }

    return NextResponse.json({
      success: false,
      message: 'No action specified'
    })

  } catch (error) {
    console.error('Progress sync POST API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}