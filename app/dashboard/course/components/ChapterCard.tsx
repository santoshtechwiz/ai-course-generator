"use client"

import { cn } from "@/lib/utils"
import React, { useEffect, useMemo } from "react"
import { Loader2, CheckCircle, PlayCircle } from "lucide-react"
import type { Chapter } from "@prisma/client"
import { useChapterProcessing } from "@/hooks/useChapterProcessing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Props = {
  chapter: Chapter
  chapterIndex: number
  onChapterComplete: (chapterId: string) => void
  isCompleted: boolean
}

export type ChapterCardHandler = {
  triggerLoad: () => void
}

const ChapterCard = React.memo(
  React.forwardRef<ChapterCardHandler, Props>(({ chapter, chapterIndex, onChapterComplete, isCompleted }, ref) => {
    const { state, triggerProcessing, isLoading } = useChapterProcessing(chapter)

    useEffect(() => {
      if (state.videoStatus === "success" && !isCompleted) {
        onChapterComplete(chapter.id.toString())
      }
    }, [state.videoStatus, isCompleted, onChapterComplete, chapter.id])

    React.useImperativeHandle(ref, () => ({
      triggerLoad: triggerProcessing,
    }))

    const { isProcessing, isSuccess, isError } = useMemo(
      () => ({
        isProcessing: state.videoStatus === "processing" || isLoading,
        isSuccess: state.videoStatus === "success",
        isError: state.videoStatus === "error",
      }),
      [state.videoStatus, isLoading],
    )

    const cardClassName = useMemo(
      () =>
        cn("transition-all duration-300", {
          "bg-card": !isSuccess && !isError,
          "border-destructive/50 bg-destructive/10": isError,
          "border-success/50 bg-success/10": isSuccess,
        }),
      [isSuccess, isError],
    )

    return (
      <Card className={cardClassName}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span>
              Chapter {chapterIndex + 1}: {chapter.name}
            </span>
            {isSuccess && <CompletionIcon />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <StatusIndicator icon={PlayCircle} label="Video" status={state.videoStatus} />
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <ActionButton isSuccess={isSuccess} isProcessing={isProcessing} triggerProcessing={triggerProcessing} />
        </CardFooter>
      </Card>
    )
  }),
)

ChapterCard.displayName = "ChapterCard"

const CompletionIcon: React.FC = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <CheckCircle className="h-5 w-5 text-success" />
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
  triggerProcessing: () => void
}

const ActionButton: React.FC<ActionButtonProps> = React.memo(({ isSuccess, isProcessing, triggerProcessing }) => {
  if (isSuccess) {
    return (
      <Button disabled variant="outline" className="w-full sm:w-auto">
        Completed
      </Button>
    )
  }

  if (isProcessing) {
    return (
      <Button disabled variant="secondary" className="w-full sm:w-auto">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Processing...
      </Button>
    )
  }

  return (
    <Button onClick={triggerProcessing} className="w-full sm:w-auto">
      Generate
    </Button>
  )
})

ActionButton.displayName = "ActionButton"

const StatusIndicator: React.FC<StatusIndicatorProps> = React.memo(({ icon: Icon, label, status }) => {
  const iconClassName = useMemo(
    () =>
      cn("h-5 w-5", {
        "text-muted-foreground": status === "idle",
        "text-primary animate-pulse": status === "processing",
        "text-success": status === "success",
        "text-destructive": status === "error",
      }),
    [status],
  )

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

