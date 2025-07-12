"use client"

import { cn } from "@/lib/tailwindUtils"
import React, { useEffect, useMemo, useState } from "react"
import { Loader2, CheckCircle, PlayCircle, Edit, Video, Eye, RefreshCw } from "lucide-react"
import type { Chapter } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"

import type { ChapterGenerationStatus } from "../hooks/useCourseEditor"
import { Badge } from "@/components/ui/badge"
import { useChapterProcessing } from "../hooks/useChapterProcessing"
import { useToast } from "@/hooks"
import VideoPlayer from "./VideoPlayer"

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
  isFree?: boolean // Add this property for first chapters
}

export type ChapterCardHandler = {
  triggerLoad: () => Promise<void>
}

// Status indicator component
interface StatusIndicatorProps {
  icon: React.ElementType
  label: string
  status: "idle" | "processing" | "success" | "error"
  message?: string
}

const StatusIndicator: React.FC<StatusIndicatorProps> = React.memo(({ icon: Icon, label, status, message }) => {
  const iconClassName = cn("h-5 w-5", {
    "text-muted-foreground": status === "idle",
    "text-primary animate-pulse": status === "processing",
    "text-green-500": status === "success",
    "text-destructive": status === "error",
  })

  const getStatusDescription = (status: "idle" | "processing" | "success" | "error", message?: string): string => {
    if (message) return message

    switch (status) {
      case "idle":
        return "Ready to generate"
      case "processing":
        return "Generation in progress"
      case "success":
        return "Successfully generated"
      case "error":
        return "Error during generation"
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="flex items-center space-x-2">
          <Icon className={iconClassName} />
          <span className="text-sm font-medium">{label}:</span>
          <span className="text-sm text-muted-foreground capitalize">{status}</span>
          {message && (
            <Badge variant="outline" className="ml-2 text-xs">
              {message}
            </Badge>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p>{getStatusDescription(status, message)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

StatusIndicator.displayName = "StatusIndicator"

// Completion icon component
const CompletionIcon: React.FC = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <CheckCircle className="h-5 w-5 text-green-500" />
      </TooltipTrigger>
      <TooltipContent>
        <p>Chapter completed</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

// Action button component
interface ActionButtonProps {
  isSuccess: boolean
  isProcessing: boolean
  isGenerating: boolean
  triggerProcessing: () => Promise<void>
  generationStatus?: ChapterGenerationStatus
}

const ActionButton: React.FC<ActionButtonProps> = React.memo(
  ({ isSuccess, isProcessing, isGenerating, triggerProcessing, generationStatus }) => {
    // If we have a specific generation status, use it
    const status = generationStatus?.status || (isSuccess ? "success" : isProcessing ? "processing" : "idle")

    // Add a timeout to prevent infinite loading
    const [isTimeout, setIsTimeout] = useState(false)

    useEffect(() => {
      let timeoutId: NodeJS.Timeout

      if (status === "processing") {
        // Set a timeout of 30 seconds for processing
        timeoutId = setTimeout(() => {
          setIsTimeout(true)
        }, 30000)
      } else {
        setIsTimeout(false)
      }

      return () => {
        if (timeoutId) clearTimeout(timeoutId)
      }
    }, [status])

    if (status === "success") {
      return (
        <Button disabled variant="outline" className="w-full sm:w-auto bg-transparent">
          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
          Video Ready
        </Button>
      )
    }

    if ((status === "processing" || isGenerating) && !isTimeout) {
      return (
        <Button disabled variant="secondary" className="w-full sm:w-auto">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating Video...
        </Button>
      )
    }

    // If processing timed out or there was an error
    if (status === "error" || isTimeout) {
      return (
        <Button onClick={() => triggerProcessing()} variant="destructive" className="w-full sm:w-auto">
          <RefreshCw className="mr-2 h-4 w-4" />
          {isTimeout ? "Timed Out - Retry" : "Retry Generation"}
        </Button>
      )
    }

    return (
      <Button onClick={() => triggerProcessing()} className="w-full sm:w-auto" data-sidebar="generate-button">
        <PlayCircle className="mr-2 h-4 w-4" />
        Generate Video
      </Button>
    )
  },
)

ActionButton.displayName = "ActionButton"

const ChapterCard = React.memo(
  React.forwardRef<ChapterCardHandler, Props>(
    ({ chapter, chapterIndex, onChapterComplete, isCompleted, isGenerating, isFree = false, ...props }, ref) => {
      const { toast } = useToast()
      const { state, triggerProcessing, isLoading, validateVideoId } = useChapterProcessing(chapter)
      const [isEditing, setIsEditing] = useState(false)
      const [editedTitle, setEditedTitle] = useState(chapter.title)
      const [videoId, setVideoId] = useState(chapter.videoId || "")
      const [isEditingVideo, setIsEditingVideo] = useState(false)
      const [isValidatingVideo, setIsValidatingVideo] = useState(false)
      const [showVideoPreview, setShowVideoPreview] = useState(false)

      useEffect(() => {
        if (state.videoStatus === "success" && !isCompleted) {
          onChapterComplete(String(chapter.id))
        }
      }, [state.videoStatus, isCompleted, onChapterComplete, chapter.id])

      // Update videoId when chapter.videoId changes
      useEffect(() => {
        setVideoId(chapter.videoId || "")
      }, [chapter.videoId])

      React.useImperativeHandle(ref, () => ({
        triggerLoad: async () => {
          // Only generate video if explicitly requested and chapter doesn't have video
          if (!isCompleted && state.videoStatus !== "processing" && !chapter.videoId) {
            console.log(`🎬 User explicitly requested video generation for chapter: ${chapter.title}`)
            if (props.onGenerateVideo) {
              await props.onGenerateVideo(chapter)
            } else {
              await triggerProcessing()
            }
          } else if (chapter.videoId) {
            console.log(`✅ Chapter ${chapter.title} already has video: ${chapter.videoId}`)
            onChapterComplete(String(chapter.id))
          }
        },
      }))

      const { isProcessing, isSuccess, isError } = useMemo(() => {
        // If we have a specific generation status, use it
        if (props.generationStatus) {
          return {
            isProcessing: props.generationStatus.status === "processing",
            isSuccess: props.generationStatus.status === "success" || !!chapter.videoId,
            isError: props.generationStatus.status === "error",
          }
        }

        // Otherwise use the state from useChapterProcessing
        return {
          isProcessing: state.videoStatus === "processing" || isLoading || isGenerating,
          isSuccess: state.videoStatus === "success" || !!chapter.videoId,
          isError: state.videoStatus === "error",
        }
      }, [state.videoStatus, isLoading, isGenerating, props.generationStatus, chapter.videoId])

      const cardClassName = cn("transition-all duration-300", {
        "border-primary": isProcessing,
        "border-destructive": isError,
        "border-green-500": isSuccess,
      })

      const handleSaveTitle = async () => {
        if (!editedTitle.trim()) {
          toast({
            title: "Error",
            description: "Chapter title cannot be empty",
            variant: "destructive",
          })
          return
        }

        try {
          // Update chapter title
          chapter.title = editedTitle
          chapter.youtubeSearchQuery = editedTitle
          setIsEditing(false)

          toast({
            title: "Success",
            description: "Chapter title updated successfully",
          })
        } catch (error) {
          console.error("Error updating chapter title:", error)
          toast({
            title: "Error",
            description: "Failed to update chapter title",
            variant: "destructive",
          })
        }
      }

      const handleVideoChange = async () => {
        if (!videoId.trim()) {
          toast({
            title: "Error",
            description: "Video ID cannot be empty",
            variant: "destructive",
          })
          return
        }

        setIsValidatingVideo(true)

        try {
          // Extract video ID if a full URL was pasted
          let extractedVideoId = videoId
          if (videoId.includes("youtube.com") || videoId.includes("youtu.be")) {
            const url = new URL(videoId)
            if (videoId.includes("youtube.com")) {
              extractedVideoId = url.searchParams.get("v") || ""
            } else {
              extractedVideoId = url.pathname.substring(1)
            }
          }

          // Validate the video ID format
          const isValid = await validateVideoId(extractedVideoId)

          if (!isValid) {
            toast({
              title: "Error",
              description: "Invalid YouTube video ID format",
              variant: "destructive",
            })
            setIsValidatingVideo(false)
            return
          }

          // Update chapter video ID
          chapter.videoId = extractedVideoId
          setVideoId(extractedVideoId)
          setIsEditingVideo(false)

          // Mark as completed
          onChapterComplete(String(chapter.id))

          // Call the parent's onVideoChange if provided
          if (props.onVideoChange && props.unitId) {
            props.onVideoChange(props.unitId, chapter.id, extractedVideoId)
          }

          toast({
            title: "Success",
            description: "Video added successfully",
          })
        } catch (error) {
          console.error("Error validating video ID:", error)
          toast({
            title: "Error",
            description: "Failed to validate video ID",
            variant: "destructive",
          })
        } finally {
          setIsValidatingVideo(false)
        }
      }

      const handlePreviewVideo = () => {
        if (chapter.videoId) {
          if (props.onPreviewVideo) {
            props.onPreviewVideo(chapter.videoId, chapter.title)
          } else {
            setShowVideoPreview(true)
          }
        } else {
          toast({
            title: "No Video",
            description: "There is no video to preview",
            variant: "destructive",
          })
        }
      }

      const handleGenerateVideo = async () => {
        if (props.onGenerateVideo) {
          await props.onGenerateVideo(chapter)
        } else {
          await triggerProcessing()
        }
      }

      return (
        <Card className={cardClassName}>
          {/* Card content */}
          {/* You can conditionally display a "Free" badge based on isFree prop */}
          {isFree && (
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                Free
              </Badge>
            </div>
          )}
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              {isEditing ? (
                <div className="flex w-full gap-2">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-base"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSaveTitle}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false)
                      setEditedTitle(chapter.title)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-2">
                    Chapter {chapterIndex + 1}: {chapter.title}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => setIsEditing(true)}
                      data-sidebar="chapter-title"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                  {isSuccess && <CompletionIcon />}
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              {" "}
              <StatusIndicator
                icon={PlayCircle}
                label="Video"
                status={props.generationStatus?.status || state.videoStatus}
                message={props.generationStatus?.message}
              />
              {!isEditingVideo ? (
                <div className="flex gap-2 mt-2">
                  {!props.hideVideoControls && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs bg-transparent"
                      onClick={() => setIsEditingVideo(true)}
                      data-sidebar="video-button"
                    >
                      <Video className="h-3.5 w-3.5 mr-1" />
                      {chapter.videoId ? "Change Video" : "Add Video"}
                    </Button>
                  )}
                  {chapter.videoId && (
                    <Button variant="outline" size="sm" className="text-xs bg-transparent" onClick={handlePreviewVideo}>
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Preview
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex w-full gap-2 mt-2">
                  <Input
                    value={videoId}
                    onChange={(e) => setVideoId(e.target.value)}
                    placeholder="Enter YouTube video ID or URL"
                    className="text-sm"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleVideoChange} disabled={isValidatingVideo}>
                    {isValidatingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingVideo(false)
                      setVideoId(chapter.videoId || "")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {showVideoPreview && chapter.videoId && (
              <div className="mt-4">
                <VideoPlayer
                  videoId={chapter.videoId}
                  title={`Preview: ${chapter.title}`}
                  className="w-full"
                  fallbackMessage="Video not available"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 bg-transparent"
                  onClick={() => setShowVideoPreview(false)}
                >
                  Close Preview
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-2">
            <ActionButton
              isSuccess={isSuccess}
              isProcessing={isProcessing}
              isGenerating={isGenerating}
              triggerProcessing={handleGenerateVideo}
              generationStatus={props.generationStatus}
            />
          </CardFooter>
        </Card>
      )
    },
  ),
)

ChapterCard.displayName = "ChapterCard"

export default ChapterCard
