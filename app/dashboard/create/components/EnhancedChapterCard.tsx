/**
 * app/dashboard/create/components/EnhancedChapterCard.tsx
 * 
 * OPTIMIZED: Stable chapter card with instant progress updates
 * - Memoized to prevent unnecessary re-renders
 * - Stable refs for callbacks
 * - Real-time progress visualization
 */

"use client"

import { cn } from "@/lib/utils"
import React, { useState, useMemo, memo } from "react"
import { Loader2, CheckCircle, PlayCircle, Video, Eye, XCircle, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { VideoStatus } from "../hooks/useVideoProcessing"
import VideoPlayer from "../../course/[slug]/components/video/components/VideoPlayer"
import { VideoProgressIndicator } from "./VideoProgressIndicator"
import { Chapter } from "@/app/types/course-types"
import VideoPreview from "./VideoPreview"

type Props = {
  chapter: Chapter
  chapterIndex: number
  videoStatus?: VideoStatus
  isProcessing: boolean
  onGenerateVideo?: () => Promise<void>
  onCancelProcessing?: () => Promise<void>
  onRetryVideo?: () => Promise<void>
  onPreviewVideo?: (videoId: string, title: string) => void
  isFree?: boolean
}

export type ChapterCardHandler = {
  triggerLoad: () => Promise<void>
}

const EnhancedChapterCard = React.forwardRef<ChapterCardHandler, Props>(
  (
    {
      chapter,
      chapterIndex,
      videoStatus,
      isProcessing,
      onGenerateVideo,
      onCancelProcessing,
      onRetryVideo,
      onPreviewVideo,
      isFree = false,
    },
    ref,
  ) => {
    const [showVideo, setShowVideo] = useState(false)

    // Implement ref handler - memoized
    React.useImperativeHandle(ref, () => ({
      triggerLoad: async () => {
        if (!chapter.videoId && onGenerateVideo) {
          await onGenerateVideo()
        }
      },
    }), [chapter.videoId, onGenerateVideo])

    // Memoize current status to prevent recalculation
    const currentStatus = useMemo(() => {
      if (videoStatus) return videoStatus.status
      if (chapter.videoId) return "completed"
      return "idle"
    }, [videoStatus?.status, chapter.videoId])
    
    // Memoize progress value
    const progressValue = useMemo(() => {
      return videoStatus?.progress ?? 0
    }, [videoStatus?.progress])

    // Memoize status display
    const statusDisplay = useMemo(() => {
      const icons = {
        queued: <Clock className="h-4 w-4 text-warning animate-pulse" />,
        processing: <Loader2 className="h-4 w-4 text-primary animate-spin" />,
        completed: <CheckCircle className="h-4 w-4 text-success" />,
        error: <XCircle className="h-4 w-4 text-error" />,
        idle: <PlayCircle className="h-4 w-4 text-muted-foreground" />
      }
      
      const messages = {
        queued: videoStatus?.message || 'Queued',
        processing: videoStatus?.message || 'Processing',
        completed: 'Ready',
        error: videoStatus?.message || 'Failed',
        idle: 'Not started'
      }
      
      return {
        icon: icons[currentStatus],
        message: messages[currentStatus],
        progress: progressValue
      }
    }, [currentStatus, videoStatus?.message, progressValue])

    // Stable callback for preview
    const handlePreviewVideo = React.useCallback(() => {
      if (chapter.videoId) {
        if (onPreviewVideo) {
          onPreviewVideo(chapter.videoId, chapter.title)
        } else {
          setShowVideo(true)
        }
      }
    }, [chapter.videoId, chapter.title, onPreviewVideo])

    return (
      <>
        <Card 
          className={cn(
            "transition-all duration-200 border-4",
            isFree && "border-primary bg-primary/5"
          )}
        >
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-medium flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-bold">Chapter {chapterIndex + 1}</span>
                {isFree && (
                  <Badge className="ml-2 bg-primary text-primary-foreground">
                    Free Preview
                  </Badge>
                )}
              </div>
              {statusDisplay.icon}
            </CardTitle>
          </CardHeader>

          <CardContent className="px-4 py-2 space-y-3">
            {/* Title */}
            <p className="text-sm font-medium text-foreground">{chapter.title}</p>

            {/* Real-time Progress Indicator */}
            {(currentStatus !== "idle" || chapter.videoId) && (
              <VideoProgressIndicator
                status={videoStatus}
                onRetry={onRetryVideo}
                onCancel={onCancelProcessing}
                showControls={true}
                size="sm"
              />
            )}

            {/* Video Ready State */}
            {chapter.videoId && (
              <div className="flex items-center justify-between p-2 rounded-none bg-success/10 border-2 border-success/20">
                <div className="flex items-center space-x-2">
                  <Video className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-success">Video Ready</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handlePreviewVideo}
                  className="h-7 px-2"
                >
                  <Eye className="h-3 w-3 mr-1" /> Preview
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-4 pt-2">
            {!chapter.videoId && !isProcessing && currentStatus === "idle" && (
              <Button
                variant="outline"
                size="sm"
                onClick={onGenerateVideo}
                className="w-full border-2"
              >
                <PlayCircle className="h-3 w-3 mr-2" />
                Generate Video
              </Button>
            )}

            {currentStatus === "error" && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetryVideo}
                className="w-full border-2 border-error/50 text-error hover:bg-error/10"
              >
                <PlayCircle className="h-3 w-3 mr-2" />
                Retry Generation
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Video Preview Modal */}
        {showVideo && chapter.videoId && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-none w-full max-w-3xl p-6 border-6 border-border shadow-neo">
              <h3 className="font-bold text-lg mb-4">{chapter.title}</h3>
              <VideoPreview videoId={chapter.videoId} />
              <div className="mt-4 flex justify-end">
                <Button onClick={() => setShowVideo(false)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  },
)

EnhancedChapterCard.displayName = "EnhancedChapterCard"

// Memoize component to prevent unnecessary re-renders
export default memo(EnhancedChapterCard, (prev, next) => {
  // Only re-render if these specific props change
  return (
    prev.chapter.id === next.chapter.id &&
    prev.chapter.videoId === next.chapter.videoId &&
    prev.chapter.title === next.chapter.title &&
    prev.videoStatus?.status === next.videoStatus?.status &&
    prev.videoStatus?.progress === next.videoStatus?.progress &&
    prev.videoStatus?.message === next.videoStatus?.message &&
    prev.isProcessing === next.isProcessing &&
    prev.isFree === next.isFree
  )
})