"use client"

import { cn } from "@/lib/utils"
import React, { useEffect, useState, useMemo, useCallback } from "react"
import { Loader2, CheckCircle, PlayCircle, Video, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useVideoProcessing, type VideoStatus } from "../hooks/useVideoProcessing"
import { useToast } from "@/hooks"
import { VideoProgressIndicator } from "./VideoProgressIndicator"

import type { Chapter } from "@/app/types/course-types"
import type { ChapterGenerationStatus } from "../types"
import VideoPreview from "./VideoPreview"

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

    const { processVideo, cancelProcessing, retryVideo, statuses, isProcessing, initializeChapterStatus } =
      useVideoProcessing({
        useEnhancedService: false,
        onComplete: (status) => {
          if (status.videoId) {
            if (onVideoChange && unitId) {
              onVideoChange(unitId, chapter.id, status.videoId)
            }
            onChapterComplete(String(chapter.id))

            toast({
              title: "Video Generated",
              description: "Your video is ready to preview",
              variant: "default",
            })
          }
          setUserInitiatedGeneration(false)
        },
        onError: (status) => {
          toast({
            title: "Video Generation Failed",
            description: status.message || "Failed to generate video. Please try again.",
            variant: "destructive",
          })
          setUserInitiatedGeneration(false)
        },
        pollingInterval: 3000,
      })

    const videoStatus: VideoStatus | undefined = useMemo(() => {
      const existingStatus = statuses[chapter.id]

      if (existingStatus) {
        return existingStatus
      }

      if (chapter.videoId) {
        return {
          chapterId: chapter.id,
          status: "completed",
          videoId: chapter.videoId,
          message: "Video already exists",
        }
      }

      if (generationStatus) {
        return {
          chapterId: chapter.id,
          status: generationStatus.status as "processing" | "completed" | "error" | "queued",
          videoId: chapter.videoId || undefined,
          message: generationStatus.message,
        }
      }

      return undefined
    }, [statuses, chapter.id, chapter.videoId, generationStatus])

    useEffect(() => {
      if (videoStatus && (videoStatus.status === "queued" || videoStatus.status === "processing")) {
        setUserInitiatedGeneration(true)
      } else if (videoStatus && videoStatus.status === "completed") {
        setUserInitiatedGeneration(true)
      } else if (videoStatus && videoStatus.status === "error") {
        setUserInitiatedGeneration(true)
      }
    }, [videoStatus])

    React.useImperativeHandle(ref, () => ({
      triggerLoad: async () => {
        if (chapter.videoId) {
          onChapterComplete(String(chapter.id))
          return
        }

        setUserInitiatedGeneration(true)
        await handleGenerateVideo()
      },
    }))

    const handleGenerateVideo = useCallback(async () => {
      if (isProcessing[chapter.id] || isGenerating) {
        toast({
          title: "Already Processing",
          description: "Video generation is already in progress for this chapter",
          variant: "default",
        })
        return
      }

      try {
        setUserInitiatedGeneration(true)

        if (onGenerateVideo) {
          await onGenerateVideo(chapter)
          return
        }

        await processVideo(chapter.id)
      } catch (error) {
        toast({
          title: "Generation Failed",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive",
        })
        setUserInitiatedGeneration(false)
      }
    }, [chapter, isProcessing, isGenerating, onGenerateVideo, processVideo, toast])

    const handlePreviewVideo = useCallback(() => {
      if (chapter.videoId) {
        if (onPreviewVideo) {
          onPreviewVideo(chapter.videoId, chapter.title)
        } else {
          setShowVideo(true)
        }
      }
    }, [chapter.videoId, chapter.title, onPreviewVideo])

    const handleCancelProcessing = useCallback(async () => {
      await cancelProcessing(chapter.id)
      setUserInitiatedGeneration(false)
    }, [chapter.id, cancelProcessing])

    useEffect(() => {
      if (chapter.videoId) {
        const currentStatus = statuses[chapter.id]

        if (!currentStatus || currentStatus.status !== "completed") {
          initializeChapterStatus(chapter.id, chapter.videoId)
        }
      }
    }, [chapter.id, chapter.videoId, statuses, initializeChapterStatus])

    return (
      <Card
        className={cn(
          "transition-all duration-200 border-2 border-border shadow-neo bg-card",
          isFree && "border-accent",
        )}
      >
        <CardHeader className="p-4 border-b-2 border-border">
          <CardTitle className="text-sm font-semibold flex items-center justify-between text-foreground">
            <div className="flex items-center space-x-2">
              <span>Chapter {chapterIndex + 1}</span>
              {isFree && (
                <Badge className="ml-2 border-2 border-border bg-accent text-background font-semibold text-xs">
                  Free Preview
                </Badge>
              )}
              {isCompleted && <CheckCircle className="h-4 w-4 text-accent ml-2" />}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-3 space-y-3">
          {userInitiatedGeneration ||
          chapter.videoId ||
          (videoStatus && (videoStatus.status === "queued" || videoStatus.status === "processing")) ? (
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
              <span className="text-xs text-muted-foreground">Ready to generate video</span>
            </div>
          )}

          {chapter.videoId && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Video className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium text-foreground">Video Ready</span>
              </div>

              {!hideVideoControls && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePreviewVideo}
                  className="h-7 px-2 flex items-center border-2 border-border shadow-neo text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" /> Preview
                </Button>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0 border-t-2 border-border">
          <div className="w-full flex justify-between items-center">
            <div className="text-xs text-foreground font-medium truncate">{chapter.title}</div>

            {!hideVideoControls && !chapter.videoId && !isProcessing[chapter.id] && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateVideo}
                disabled={isGenerating}
                className="ml-auto flex items-center h-7 px-2 bg-card border-2 border-border shadow-neo text-xs font-semibold"
              >
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <PlayCircle className="h-3 w-3 mr-1" />
                )}
                Generate
              </Button>
            )}
          </div>
        </CardFooter>

        {showVideo && chapter.videoId && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-lg w-full max-w-3xl p-4 border-2 border-border shadow-neo">
              <h3 className="font-semibold mb-3 text-card-foreground text-sm">{chapter.title}</h3>
              <VideoPreview videoId={chapter.videoId} />
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => setShowVideo(false)}
                  className="border-2 border-border shadow-neo text-xs font-semibold"
                >
                  Close
                </Button>
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
