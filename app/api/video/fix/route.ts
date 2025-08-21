/**
 * Video Processing Diagnostic and Fix Tool
 * 
 * This script helps diagnose and fix common video processing issues:
 * 1. Chapters stuck in processing state
 * 2. Queue deadlocks
 * 3. Missing API calls
 * 4. Service connectivity issues
 */

import { NextResponse } from "next/server"
import { videoService } from "@/app/services/video.service"
import { optimizedVideoService } from "@/app/services/optimized-video.service"
import { enhancedVideoProcessingService } from "@/app/services/video-processing.service"
import { videoRepository } from "@/app/repositories/video.repository"

interface DiagnosticResult {
  timestamp: string
  issue: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  fix?: string
  fixApplied?: boolean
}

/**
 * POST: Run video processing diagnostics and apply fixes
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action = 'diagnose', autoFix = false } = body

    
    const diagnostics: DiagnosticResult[] = []
    const fixes: string[] = []

    // 1. Check for chapters stuck in processing state
    const stuckChapters = await videoRepository.findChaptersWithStatus('processing')
    if (stuckChapters && stuckChapters.length > 0) {
      const issue: DiagnosticResult = {
        timestamp: new Date().toISOString(),
        issue: 'stuck_processing_chapters',
        severity: 'high',
        description: `Found ${stuckChapters.length} chapters stuck in processing state`,
        fix: 'Reset chapters to idle state and restart processing'
      }

      if (autoFix) {
        // Reset stuck chapters to idle
        for (const chapter of stuckChapters) {
          await videoRepository.updateChapterVideo(chapter.id, null, 'idle')
        }
        issue.fixApplied = true
        fixes.push(`Reset ${stuckChapters.length} stuck chapters`)
      }
      
      diagnostics.push(issue)
    }

    // 2. Check optimized video service metrics
    const optimizedMetrics = optimizedVideoService.getMetrics()
    if (optimizedMetrics.errors > 0 || optimizedMetrics.queueSize > 10) {
      diagnostics.push({
        timestamp: new Date().toISOString(),
        issue: 'optimized_service_issues',
        severity: optimizedMetrics.errors > 5 ? 'high' : 'medium',
        description: `Optimized service has ${optimizedMetrics.errors} errors and ${optimizedMetrics.queueSize} queued items`,
        fix: 'Clear error cache and restart processing queue'
      })
      
      if (autoFix) {
        // Reset optimized service metrics
        optimizedMetrics.errors = 0
        fixes.push('Reset optimized service error count')
      }
    }

    // 3. Check enhanced service queue status
    const queueStatus = enhancedVideoProcessingService.getQueueStatus()
    if (queueStatus.size > 20 || queueStatus.pending > 10) {
      diagnostics.push({
        timestamp: new Date().toISOString(),
        issue: 'queue_congestion',
        severity: 'medium',
        description: `Queue has ${queueStatus.size} pending and ${queueStatus.pending} active processes`,
        fix: 'Consider reducing concurrency or clearing old queue items'
      })
    }

    // 4. Test video API connectivity
    try {
      // Test with a simple chapter lookup
      const testChapter = await videoRepository.findChapterById(1)
      if (!testChapter) {
        diagnostics.push({
          timestamp: new Date().toISOString(),
          issue: 'database_connectivity',
          severity: 'critical',
          description: 'Cannot connect to database or no chapters found',
          fix: 'Check database connection and ensure chapters exist'
        })
      }
    } catch (error) {
      diagnostics.push({
        timestamp: new Date().toISOString(),
        issue: 'database_error',
        severity: 'critical',
        description: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fix: 'Check database configuration and connection'
      })
    }

    // 5. Check for missing video IDs in completed chapters
    const completedChapters = await videoRepository.findChaptersWithStatus('completed')
    if (completedChapters) {
      const missingVideos = completedChapters.filter(ch => !ch.videoId)
      if (missingVideos.length > 0) {
        diagnostics.push({
          timestamp: new Date().toISOString(),
          issue: 'completed_chapters_missing_videos',
          severity: 'medium',
          description: `Found ${missingVideos.length} chapters marked as completed but missing video IDs`,
          fix: 'Reset these chapters to idle state for reprocessing'
        })

        if (autoFix) {
          for (const chapter of missingVideos) {
            await videoRepository.updateChapterVideo(chapter.id, null, 'idle')
          }
          fixes.push(`Reset ${missingVideos.length} completed chapters without videos`)
        }
      }
    }

    // Generate summary
    const criticalIssues = diagnostics.filter(d => d.severity === 'critical').length
    const highIssues = diagnostics.filter(d => d.severity === 'high').length
    const summary = {
      totalIssues: diagnostics.length,
      criticalIssues,
      highIssues,
      fixesApplied: fixes.length,
      overallHealth: criticalIssues > 0 ? 'critical' : highIssues > 0 ? 'warning' : 'healthy'
    }

    return NextResponse.json({
      success: true,
      action,
      autoFix,
      summary,
      diagnostics,
      fixes,
      recommendations: [
        'Run diagnostics regularly to prevent issues',
        'Monitor queue sizes and processing times',
        'Consider implementing circuit breakers for external API calls',
        'Add automated recovery for stuck processes'
      ],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[VideoFix] Error running diagnostics:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * GET: Get current video processing status overview
 */
export async function GET() {
  try {
    // Gather status from all services
    const optimizedMetrics = optimizedVideoService.getMetrics()
    const queueStatus = enhancedVideoProcessingService.getQueueStatus()
    
    // Get chapter status counts
    const [processingChapters, completedChapters, errorChapters] = await Promise.all([
      videoRepository.findChaptersWithStatus('processing'),
      videoRepository.findChaptersWithStatus('completed'), 
      videoRepository.findChaptersWithStatus('error')
    ])

    return NextResponse.json({
      success: true,
      overview: {
        processing: processingChapters?.length || 0,
        completed: completedChapters?.length || 0,
        errors: errorChapters?.length || 0,
        queue: {
          size: queueStatus.size,
          pending: queueStatus.pending,
          active: queueStatus.activeProcesses?.length || 0
        },
        metrics: {
          ...optimizedMetrics,
          healthStatus: optimizedMetrics.errors === 0 ? 'healthy' : 
                      optimizedMetrics.errors < 5 ? 'warning' : 'critical'
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[VideoFix] Error getting status overview:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
