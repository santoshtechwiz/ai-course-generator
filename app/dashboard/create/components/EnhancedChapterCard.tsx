/**
 * app/dashboard/create/components/EnhancedChapterCard.tsx
 * 
 * REFACTORED: Simplified chapter card with stable state management
 * - Removed redundant useEffect hooks
 * - Single source of truth from parent hook
 * - Consistent Nerobrutal theme styling
 * - Clear progress indicators
 */

"use client"

import { cn } from "@/lib/utils"
import React, { useState, useMemo } from "react"
import { Loader2, CheckCircle, PlayCircle, Video, Eye, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { VideoStatus } from "../hooks/useVideoProcessing"
import VideoPlayer from "../../course/[slug]/components/video/components/VideoPlayer"
import { VideoProgressIndicator } from "./VideoProgressIndicator"
import { Chapter } from "@/app/types/course-types"

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

    // Implement ref handler
    React.useImperativeHandle(ref, () => ({
      triggerLoad: async () => {
        if (!chapter.videoId && onGenerateVideo) {
          await onGenerateVideo()
        }
      },
    }))

    // Determine current status
    const currentStatus = useMemo(() => {
      if (videoStatus) return videoStatus.status
      if (chapter.videoId) return "completed"
      return "idle"
    }, [videoStatus, chapter.videoId])

    // Status icon
    const StatusIcon = () => {
      switch (currentStatus) {
        case "queued":
          return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
        case "processing":
          return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
        case "completed":
          return <CheckCircle className="h-4 w-4 text-green-500" />
        case "error":
          return <XCircle className="h-4 w-4 text-red-500" />
        default:
          return <PlayCircle className="h-4 w-4 text-muted-foreground" />
      }
    }

    // Handle video preview
    const handlePreviewVideo = () => {
      if (chapter.videoId) {
        if (onPreviewVideo) {
          onPreviewVideo(chapter.videoId, chapter.title)
        } else {
          setShowVideo(true)
        }
      }
    }

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
              <StatusIcon />
            </CardTitle>
          </CardHeader>

          <CardContent className="px-4 py-2 space-y-3">
            {/* Title */}
            <p className="text-sm font-medium text-foreground">{chapter.title}</p>

            {/* Progress Indicator */}
            {(currentStatus !== "idle" || chapter.videoId) && (
              <VideoProgressIndicator
                status={videoStatus}
                onRetry={onRetryVideo}
                onCancel={onCancelProcessing}
                showControls={true}
                size="sm"
              />
            )}

            {/* Video Ready */}
            {chapter.videoId && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-success/10 border-2 border-success/20">
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
                className="w-full border-2 border-red-200 text-red-600 hover:bg-red-50"
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
            <div className="bg-card rounded-lg w-full max-w-3xl p-6 border-6 border-border shadow-neo">
              <h3 className="font-bold text-lg mb-4">{chapter.title}</h3>
              <VideoPlayer videoId={chapter.videoId} />
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

export default EnhancedChapterCard