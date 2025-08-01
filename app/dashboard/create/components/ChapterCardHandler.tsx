"use client"

import { cn } from "@/lib/tailwindUtils"
import React, { useEffect, useMemo, useState } from "react"
import { Loader2, CheckCircle, PlayCircle, Edit, Video, Eye } from "lucide-react"
import type { Chapter } from "@prisma/client"
import { useChapterProcessing } from "../hooks/useChapterProcessing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
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
  hideVideoControls?: boolean // Add this prop
}

export type ChapterCardHandler = {
  triggerLoad: () => Promise<void>
}

const ChapterCard = React.memo(
  React.forwardRef<ChapterCardHandler, Props>(
    ({ chapter, chapterIndex, onChapterComplete, isCompleted, isGenerating, ...props }, ref) => {
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

      React.useImperativeHandle(ref, () => ({
        triggerLoad: async () => {
          if (!isCompleted && state.videoStatus !== "processing") {
            await triggerProcessing()
          }
        },
      }))

      const { isProcessing, isSuccess, isError } = useMemo(
        () => ({
          isProcessing: state.videoStatus === "processing" || isLoading || isGenerating,
          isSuccess: state.videoStatus === "success",
          isError: state.videoStatus === "error",
        }),
        [state.videoStatus, isLoading, isGenerating],
      )

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
          // This would typically be an API call, but we'll just update the local state for now
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

      return (
        <Card className={cardClassName}>
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
              <StatusIndicator icon={PlayCircle} label="Video" status={state.videoStatus} />

              {!isEditingVideo ? (
                <div className="flex gap-2 mt-2">
                  {!props.hideVideoControls && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setIsEditingVideo(true)}
                      data-sidebar="video-button"
                    >
                      <Video className="h-3.5 w-3.5 mr-1" />
                      {chapter.videoId ? "Change Video" : "Add Video"}
                    </Button>
                  )}
                  {chapter.videoId && (
                    <Button variant="outline" size="sm" className="text-xs" onClick={handlePreviewVideo}>
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
                <Button size="sm" variant="outline" className="mt-2" onClick={() => setShowVideoPreview(false)}>
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
              triggerProcessing={triggerProcessing}
            />
          </CardFooter>
        </Card>
      )
    },
  ),
)

ChapterCard.displayName = "ChapterCard"

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

interface ActionButtonProps {
  isSuccess: boolean
  isProcessing: boolean
  isGenerating: boolean
  triggerProcessing: () => Promise<void>
}

const ActionButton: React.FC<ActionButtonProps> = React.memo(
  ({ isSuccess, isProcessing, isGenerating, triggerProcessing }) => {
    if (isSuccess) {
      return (
        <Button disabled variant="outline" className="w-full sm:w-auto">
          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
          Completed
        </Button>
      )
    }

    if (isProcessing || isGenerating) {
      return (
        <Button disabled variant="secondary" className="w-full sm:w-auto">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </Button>
      )
    }

    return (
      <Button onClick={() => triggerProcessing()} className="w-full sm:w-auto" data-sidebar="generate-button">
        Generate
      </Button>
    )
  },
)

ActionButton.displayName = "ActionButton"

const StatusIndicator: React.FC<StatusIndicatorProps> = React.memo(({ icon: Icon, label, status }) => {
  const iconClassName = cn("h-5 w-5", {
    "text-muted-foreground": status === "idle",
    "text-primary animate-pulse": status === "processing",
    "text-green-500": status === "success",
    "text-destructive": status === "error",
  })

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="flex items-center space-x-2">
          <Icon className={iconClassName} />
          <span className="text-sm font-medium">{label}:</span>
          <span className="text-sm text-muted-foreground capitalize">{status}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getStatusDescription(status)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

StatusIndicator.displayName = "StatusIndicator"

interface StatusIndicatorProps {
  icon: React.ElementType
  label: string
  status: "idle" | "processing" | "success" | "error"
}

function getStatusDescription(status: "idle" | "processing" | "success" | "error"): string {
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

export default ChapterCard
