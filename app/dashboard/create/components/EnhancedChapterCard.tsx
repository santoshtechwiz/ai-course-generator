"use client"

import { cn } from "@/lib/utils"
import React, { useEffect, useState, useMemo } from "react"
import { Loader2, CheckCircle, PlayCircle, Video, Eye } from "lucide-react"
import type { Chapter } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useVideoProcessing, type VideoStatus } from "../hooks/useVideoProcessing"
import { useToast } from "@/hooks"
import VideoPlayer from "./VideoPlayer"
import { VideoProgressIndicator } from "./VideoProgressIndicator"
import type { ChapterGenerationStatus } from "../hooks/useCourseEditor"

type Props = {
  chapter: Chapter
  chapterIndex: number
  onChapterComplete: (chapterId: string) => void
  isCompleted: boolean
  isGenerating: boolean
  onVideoChange?: (unitId: number, chapterId: number, videoId: string) => void
  onPreviewVideo?: (videoId: string, title: string) => void
  onRemove?: (unitId: number, chapterId: number) => void
  unitId?: number
  hideVideoControls?: boolean
  generationStatus?: ChapterGenerationStatus
  onGenerateVideo?: (chapter: Chapter) => Promise<boolean>
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
      onChapterComplete,
      isCompleted,
      isGenerating,
      onVideoChange,
      onPreviewVideo,
      onRemove,
      unitId,
      hideVideoControls = false,
      generationStatus,
      onGenerateVideo,
      isFree = false,
    },
    ref,
  ) => {
    const { toast } = useToast()
    const [showVideo, setShowVideo] = useState(false)
    const [userInitiatedGeneration, setUserInitiatedGeneration] = useState(false)

    // Use our enhanced video processing hook
    const { processVideo, cancelProcessing, retryVideo, statuses, isProcessing, initializeChapterStatus } =
      useVideoProcessing({
        useEnhancedService: false, // Use standard API instead of enhanced
        onComplete: (status) => {
          console.log(`Video for chapter ${chapter.id} completed:`, status)

          if (status.videoId) {
            if (onVideoChange && unitId) {
              onVideoChange(unitId, chapter.id, status.videoId)
            }
            onChapterComplete(String(chapter.id))

            toast({
              title: "Video Generated",
              description: "Video has been successfully generated",
              variant: "default",
            })
          }
          setUserInitiatedGeneration(false)
        },
        onError: (status) => {
          console.error(`Video for chapter ${chapter.id} failed:`, status)

          toast({
            title: "Video Generation Failed",
            description: status.message || "Failed to generate video",
            variant: "destructive",
          })
          setUserInitiatedGeneration(false)
        },
        pollingInterval: 3000, // Start with a shorter polling interval
      })

    // Convert from old status format to new if needed
    const videoStatus: VideoStatus | undefined = useMemo(() => {
      // First, check if we have a status from the hook
      const existingStatus = statuses[chapter.id]

      if (existingStatus) {
        console.log(`Chapter ${chapter.id} using hook status:`, existingStatus.status)
        return existingStatus
      }

      // If chapter has videoId, it should be completed
      if (chapter.videoId) {
        console.log(`Chapter ${chapter.id} has videoId ${chapter.videoId}, should be completed`)
        return {
          chapterId: chapter.id,
          status: "completed",
          videoId: chapter.videoId,
          message: "Video already exists",
        }
      }

      // Fall back to generation status if provided
      if (generationStatus) {
        console.log(`Chapter ${chapter.id} using generation status:`, generationStatus.status)
        return {
          chapterId: chapter.id,
          status: generationStatus.status as "processing" | "completed" | "error" | "queued",
          videoId: chapter.videoId || undefined,
          message: generationStatus.message,
        }
      }

      return undefined
    }, [statuses, chapter.id, chapter.videoId, generationStatus])

    // Auto-set userInitiatedGeneration when video status indicates processing has started
    useEffect(() => {
        if (videoStatus && (videoStatus.status === "queued" || videoStatus.status === "processing")) {
            setUserInitiatedGeneration(true)
        } else if (videoStatus && videoStatus.status === "completed") {
            // Keep it true if completed to show the video
            setUserInitiatedGeneration(true)
        } else if (videoStatus && videoStatus.status === "error") {
            // Keep it true if error to show retry option
            setUserInitiatedGeneration(true)
        }
    }, [videoStatus?.status])

    // Implementation of the ref's trigger method
    React.useImperativeHandle(ref, () => ({
      triggerLoad: async () => {
        if (chapter.videoId) {
          // Already has video
          onChapterComplete(String(chapter.id))
          return
        }

        // Only generate if user explicitly requested it
        console.log(`🎬 User explicitly requested video generation for chapter: ${chapter.title}`)
        setUserInitiatedGeneration(true)
        await handleGenerateVideo()
      },
    }))

    // Generate video - only when user explicitly requests it
    const handleGenerateVideo = async () => {
      if (isProcessing[chapter.id] || isGenerating) {
        toast({
          title: "Already Processing",
          description: "Video generation is already in progress",
          variant: "default",
        })
        return
      }

      try {
        console.log(`🎬 Starting user-initiated video generation for chapter: ${chapter.title}`)
        setUserInitiatedGeneration(true)

        // If the component has an onGenerateVideo prop, use that
        if (onGenerateVideo) {
          await onGenerateVideo(chapter)
          return
        }

        // Otherwise use our enhanced video processing
        await processVideo(chapter.id)
      } catch (error) {
        console.error(`Error in handleGenerateVideo for chapter ${chapter.id}:`, error)
        toast({
          title: "Generation Failed",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive",
        })
        setUserInitiatedGeneration(false)
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

    // Handle cancel
    const handleCancelProcessing = async () => {
      await cancelProcessing(chapter.id)
      setUserInitiatedGeneration(false)
    }

    // Initialize status for chapters that already have videos - but don't auto-process
    useEffect(() => {
      console.log(`Chapter ${chapter.id} mount check:`, {
        hasVideoId: !!chapter.videoId,
        videoId: chapter.videoId,
        hasStatus: !!statuses[chapter.id],
        currentStatus: statuses[chapter.id]?.status,
        generationStatus: generationStatus?.status,
        isProcessingCurrent: isProcessing[chapter.id],
      })

      if (chapter.videoId) {
        // If chapter has videoId, it should definitely be marked as completed
        const currentStatus = statuses[chapter.id]

        if (!currentStatus || currentStatus.status !== "completed") {
          console.log(`🔧 Force-initializing status for chapter ${chapter.id} with existing video: ${chapter.videoId}`)
          initializeChapterStatus(chapter.id, chapter.videoId)
        }
      }
    }, [chapter.id, chapter.videoId, statuses, initializeChapterStatus, generationStatus, isProcessing])

    // Remove automatic retry logic - only retry when user explicitly requests it

    return (
      <Card className={cn("transition-all duration-200", isFree && "border-primary border-2")}>
        <CardHeader className="p-4">
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>Chapter {chapterIndex + 1}</span>
              {isFree && <Badge className="ml-2">Free Preview</Badge>}
              {isCompleted && <CheckCircle className="h-4 w-4 text-green-500 ml-2" />}
            </div>
          </CardTitle>
        </CardHeader>        <CardContent className="px-4 py-2 space-y-3">
          {/* Video Generation Status - show progress if video exists, user initiated, or chapter is being processed */}
          {userInitiatedGeneration || chapter.videoId || (videoStatus && (videoStatus.status === "queued" || videoStatus.status === "processing")) ? (
            <VideoProgressIndicator
              status={videoStatus}
              onRetry={() => {
                setUserInitiatedGeneration(true)
                retryVideo(chapter.id)
              }}
              onCancel={handleCancelProcessing}
              showControls={!hideVideoControls}
            />
          ) : (
            <div className="flex items-center space-x-2">
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Ready to generate video</span>
            </div>
          )}

          {/* Video preview when available */}
          {chapter.videoId && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Video className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Video Ready</span>
              </div>

              {!hideVideoControls && (
                <Button variant="ghost" size="sm" onClick={handlePreviewVideo} className="h-7 px-2 flex items-center">
                  <Eye className="h-3 w-3 mr-1" /> Preview
                </Button>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <div className="w-full flex justify-between items-center">
            <div className="text-sm">{chapter.title}</div>

            {!hideVideoControls && !chapter.videoId && !isProcessing[chapter.id] && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateVideo}
                disabled={isGenerating}
                className="ml-auto flex items-center h-7 px-2 bg-transparent"
              >
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <PlayCircle className="h-3 w-3 mr-1" />
                )}
                Generate Video
              </Button>
            )}
          </div>
        </CardFooter>

        {/* Video preview modal */}
        {showVideo && chapter.videoId && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-3xl p-4">
              <h3 className="font-medium mb-2">{chapter.title}</h3>
              <VideoPlayer videoId={chapter.videoId} />
              <div className="mt-4 flex justify-end">
                <Button onClick={() => setShowVideo(false)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    )
  },
)

EnhancedChapterCard.displayName = "EnhancedChapterCard"

export default EnhancedChapterCard
