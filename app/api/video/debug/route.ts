import { NextResponse } from "next/server"
import { videoRepository } from "@/app/repositories/video.repository"

/**
 * GET: Debug endpoint to check video processing state
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'overview'
    

    switch (action) {
      case 'overview':
        const [processing, completed, error, idle] = await Promise.all([
          videoRepository.findChaptersWithStatus('processing'),
          videoRepository.findChaptersWithStatus('completed'),
          videoRepository.findChaptersWithStatus('error'),
          videoRepository.findChaptersWithStatus('idle')
        ])

        const overview = {
          processing: processing?.length || 0,
          completed: completed?.length || 0,
          error: error?.length || 0,
          idle: idle?.length || 0,
          total: (processing?.length || 0) + (completed?.length || 0) + (error?.length || 0) + (idle?.length || 0)
        }

        return NextResponse.json({
          success: true,
          overview,
          details: {
            processing: processing?.map(ch => ({ id: ch.id, title: ch.title, updatedAt: ch.updatedAt })),
            error: error?.map(ch => ({ id: ch.id, title: ch.title, updatedAt: ch.updatedAt }))
          },
          timestamp: new Date().toISOString()
        })

      case 'stuck_check':
        const stuckThreshold = 30 * 60 * 1000 // 30 minutes
        const now = new Date()
        const processingChapters = await videoRepository.findChaptersWithStatus('processing')
        
        const stuckChapters = processingChapters?.filter(ch => {
          const lastUpdate = new Date(ch.updatedAt || ch.createdAt || '').getTime()
          return (now.getTime() - lastUpdate) > stuckThreshold
        }) || []

        const message = stuckChapters.length > 0 
          ? `Found ${stuckChapters.length} chapters stuck in processing state for over 30 minutes`
          : 'No stuck chapters detected'


        return NextResponse.json({
          success: true,
          message,
          stuckCount: stuckChapters.length,
          stuckChapters: stuckChapters.map(ch => ({
            id: ch.id,
            title: ch.title,
            stuckFor: Math.round((now.getTime() - new Date(ch.updatedAt || '').getTime()) / (1000 * 60)) + ' minutes'
          })),
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({
          success: true,
          message: 'Video debug endpoint',
          availableActions: ['overview', 'stuck_check'],
          usage: '/api/video/debug?action=overview',
          timestamp: new Date().toISOString()
        })
    }

  } catch (error) {
    console.error('[VideoDebug] Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * POST: Trigger specific debug actions
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, chapterId } = body


    switch (action) {
      case 'reset_stuck':
        const stuck = await videoRepository.findChaptersWithStatus('processing')
        let resetCount = 0

        if (stuck) {
          for (const chapter of stuck) {
            await videoRepository.updateChapterVideo(chapter.id, null, 'idle')
            resetCount++
          }
        }

        const message = `Reset ${resetCount} stuck chapters from processing to idle`

        return NextResponse.json({
          success: true,
          message,
          resetCount,
          timestamp: new Date().toISOString()
        })

      case 'test_chapter':
        if (!chapterId) {
          return NextResponse.json({
            success: false,
            error: 'chapterId required for test_chapter action'
          }, { status: 400 })
        }

        const chapter = await videoRepository.findChapterById(parseInt(chapterId))
        
        return NextResponse.json({
          success: true,
          chapter,
          message: chapter ? 'Chapter found' : 'Chapter not found',
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action',
          availableActions: ['reset_stuck', 'test_chapter']
        }, { status: 400 })
    }

  } catch (error) {
    console.error('[VideoDebug] POST Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
