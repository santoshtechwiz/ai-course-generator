"use client"

import { cn } from "@/lib/utils"
import React, { useEffect, useState, useMemo } from "react"
import { Loader2, CheckCircle, PlayCircle, Video, Eye, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useVideoProcessing, type VideoStatus } from "../hooks/useVideoProcessing"
import { useToast } from "@/hooks"
import { VideoProgressIndicator } from "./VideoProgressIndicator"
import type { ChapterGenerationStatus } from "../hooks/useEnhancedCourseEditor"
import { Chapter } from "@/app/types/course-types"
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
  onStatusUpdate?: (chapterId: number, status: VideoStatus) => void
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
      onStatusUpdate,
      isFree = false,
    },
    ref,
  ) => {
    const { toast } = useToast()
    const [showVideo, setShowVideo] = useState(false)
    const [userInitiatedGeneration, setUserInitiatedGeneration] = useState(false)

    const { processVideo, cancelProcessing, retryVideo, statuses, isProcessing, initializeChapterStatus, steps } =
      useVideoProcessing({
        useEnhancedService: false,
        onComplete: (status) => {
          if (status.videoId) {
            if (onVideoChange && unitId) {
              onVideoChange(unitId, chapter.id, status.videoId)
            }
            onChapterComplete(String(chapter.id))
          }
          // Notify parent of status update
          onStatusUpdate?.(chapter.id, status)
          setUserInitiatedGeneration(false)
        },
        onError: (status) => {
          // Notify parent of status update
          onStatusUpdate?.(chapter.id, status)
          setUserInitiatedGeneration(false)
        },
        onStatusChange: (status) => {
          // Notify parent of status update
          onStatusUpdate?.(chapter.id, status)
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
          message: "Video ready",
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
    }, [videoStatus?.status])

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

    const handleGenerateVideo = async () => {
      if (isProcessing[chapter.id] || isGenerating) {
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
        setUserInitiatedGeneration(false)
      }
    }

    const handlePreviewVideo = () => {
      if (chapter.videoId) {
        if (onPreviewVideo) {
          onPreviewVideo(chapter.videoId, chapter.title)
        } else {
          setShowVideo(true)
        }
      }
    }

    const handleCancelProcessing = async () => {
      await cancelProcessing(chapter.id)
      setUserInitiatedGeneration(false)
    }

    useEffect(() => {
      if (chapter.videoId) {
        const currentStatus = statuses[chapter.id]

        if (!currentStatus || currentStatus.status !== "completed") {
          initializeChapterStatus(chapter.id, chapter.videoId)
        }
      }
    }, [chapter.id, chapter.videoId, statuses, initializeChapterStatus, generationStatus, isProcessing])

    return (
      <>
        <Card className={cn(
          "transition-all duration-200 border-3 border-border shadow-neo rounded-none bg-card",
          isFree && "border-primary"
        )}>
          <CardHeader className="p-4 border-b-3 border-border bg-muted/30">
            <CardTitle className="text-base font-black flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-foreground">Chapter {chapterIndex + 1}</span>
                {isFree && (
                  <Badge className="ml-2 bg-primary text-background font-black border-0 rounded-none px-2 py-0.5 text-xs">
                    FREE
                  </Badge>
                )}
                {isCompleted && (
                  <CheckCircle className="h-4 w-4 text-success ml-2" />
                )}
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="px-4 py-3 space-y-3">
            {userInitiatedGeneration || chapter.videoId || (videoStatus && (videoStatus.status === "queued" || videoStatus.status === "processing")) ? (
              <VideoProgressIndicator
                status={videoStatus}
                steps={steps[chapter.id]}
                onRetry={() => {
                  setUserInitiatedGeneration(true)
                  retryVideo(chapter.id)
                }}
                onCancel={handleCancelProcessing}
                showControls={!hideVideoControls}
              />
            ) : (
              <div className="flex items-center gap-2 p-3 bg-muted/50 border-2 border-border rounded-none">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-bold text-muted-foreground">Ready to generate video</span>
              </div>
            )}

            {chapter.videoId && (
              <div className="flex items-center justify-between p-3 bg-success/10 border-2 border-success rounded-none">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-success" />
                  <span className="text-sm font-bold text-success">Video Ready</span>
                </div>

                {!hideVideoControls && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handlePreviewVideo} 
                    className="h-8 px-3 font-black border-2 border-success text-success hover:bg-success hover:text-background rounded-none"
                  >
                    <Eye className="h-3 w-3 mr-1" /> Preview
                  </Button>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="p-4 pt-0 border-t-3 border-border bg-muted/30">
            <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="text-sm font-bold text-foreground">{chapter.title}</div>

              {!hideVideoControls && !chapter.videoId && !isProcessing[chapter.id] && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateVideo}
                  disabled={isGenerating}
                  className="w-full sm:w-auto flex items-center justify-center h-9 px-4 font-black border-3 border-border rounded-none shadow-neo hover:shadow-neo-hover bg-primary text-background hover:bg-primary/90 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <PlayCircle className="h-4 w-4 mr-2" />
                  )}
                  Generate Video
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Inline video preview - shown below card */}
        {showVideo && chapter.videoId && (
          <div className="mt-3 border-3 border-border p-4 bg-card rounded-none shadow-neo">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-foreground">{chapter.title}</h3>
                <Button 
                  onClick={() => setShowVideo(false)}
                  variant="outline"
                  size="sm"
                  className="font-black border-2 border-border rounded-none"
                >
                  Close
                </Button>
              </div>
              <div className="aspect-video bg-black rounded-none overflow-hidden border-2 border-border">
                <VideoPreview videoId={chapter.videoId} />
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