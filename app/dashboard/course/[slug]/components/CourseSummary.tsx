"use client"

import { useEffect, useState, useCallback } from "react"
import { useChapterSummary } from "@/hooks/useChapterSummary"
import { MarkdownRenderer } from "./markdownUtils"
import { AdminSummaryPanel } from "./AdminSummaryPanel"
import { useFeatureAccess } from "@/hooks/useFeatureAccess"
import { useAuth } from "@/hooks"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCcw, Sparkles, BookOpen, AlertCircle, Video, Zap, Info } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CourseSummaryProps {
  chapterId: number | string
  name: string
  isAdmin?: boolean
  existingSummary: string | null
}

type GenerationStep = "idle" | "fetching_transcript" | "generating" | "complete" | "error"

const GENERATION_STEPS = [
  {
    id: "fetching_transcript" as const,
    icon: Video,
    label: "Fetching Transcript",
    description: "Retrieving video transcript..."
  },
  {
    id: "generating" as const,
    icon: Zap,
    label: "Generating Summary",
    description: "AI analyzing content and extracting key concepts..."
  }
]

const CourseAISummary = ({ 
  chapterId, 
  name, 
  isAdmin = false, 
  existingSummary = null 
}: CourseSummaryProps) => {
  const normalizedChapterId = typeof chapterId === "string" ? parseInt(chapterId, 10) : chapterId
  const { data: summaryResponse, refetch, isLoading, isError, isRefetching } = useChapterSummary(normalizedChapterId)
  const [summary, setSummary] = useState(existingSummary || "")
  const [generationStep, setGenerationStep] = useState<GenerationStep>("idle")
  const { canAccess: hasSummaryAccess } = useFeatureAccess("course-videos")
  const { isAuthenticated } = useAuth()

  // Reset state on chapter change
  useEffect(() => {
    setSummary(existingSummary || "")
    setGenerationStep("idle")
  }, [normalizedChapterId, existingSummary])

  // Auto-generate on mount if missing and user has access
  useEffect(() => {
    if (!existingSummary && hasSummaryAccess && isAuthenticated && !isLoading && !summary) {
      handleGenerateSummary()
    }
  }, [existingSummary, hasSummaryAccess, isAuthenticated])

  // Update summary from API response
  useEffect(() => {
    if (summaryResponse?.data) {
      setSummary(summaryResponse.data)
      setGenerationStep("complete")
      toast.success("Summary generated successfully")
    }
  }, [summaryResponse])

  // Track generation progress
  useEffect(() => {
    if (isLoading || isRefetching) {
      if (generationStep === "idle") {
        setGenerationStep("fetching_transcript")
      }
      const timer = setTimeout(() => {
        if (isLoading || isRefetching) {
          setGenerationStep("generating")
        }
      }, 1500)
      return () => clearTimeout(timer)
    } else if (!isLoading && !isRefetching) {
      if (summary) {
        setGenerationStep("complete")
      } else if (isError) {
        setGenerationStep("error")
      }
    }
  }, [isLoading, isRefetching, summary, isError, generationStep])

  const handleGenerateSummary = useCallback(async () => {
    if (!hasSummaryAccess || !isAuthenticated) {
      toast.error("Sign in to generate summaries")
      return
    }

    setGenerationStep("fetching_transcript")
    
    try {
      await refetch()
    } catch (error) {
      console.error("Summary generation error:", error)
      toast.error("Failed to generate summary")
      setGenerationStep("error")
    }
  }, [hasSummaryAccess, isAuthenticated, refetch])

  if (isAdmin) {
    return (
      <AdminSummaryPanel
        chapterId={normalizedChapterId}
        name={name}
        summary={summary}
        setSummary={setSummary}
        onRefresh={refetch}
        isRefetching={isRefetching}
      />
    )
  }

  const isLoadingState = isLoading || isRefetching
  const hasContent = !!summary
  const showProgress = isLoadingState && !hasContent
  const showError = isError && !hasContent

  return (
    <section aria-label={`${name} Summary`} className="space-y-0">
      {/* Header - Simplified */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6 border-b-3 border-[hsl(var(--border))] bg-[hsl(var(--surface))]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[hsl(var(--warning))] border-3 border-[hsl(var(--border))] flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-black uppercase tracking-tight text-base sm:text-lg mb-0.5 truncate">
              {name} Summary
            </h3>
            <p className="text-xs font-bold text-[hsl(var(--foreground))]/60 flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-[hsl(var(--accent))]" />
              AI-generated from video transcript
            </p>
          </div>
        </div>

        {hasSummaryAccess && isAuthenticated && (
          <Button
            onClick={handleGenerateSummary}
            disabled={isLoadingState}
            size="sm"
            className={cn(
              "bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90",
              "font-black border-3 border-[hsl(var(--border))] shadow-neo",
              "hover:shadow-neo-hover hover:-translate-y-0.5",
              "uppercase text-xs gap-2 px-4 py-2 transition-all",
              isLoadingState && "opacity-60 cursor-not-allowed"
            )}
          >
            {isLoadingState ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Generating...</span>
              </>
            ) : hasContent ? (
              <>
                <RefreshCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Regenerate</span>
                <span className="sm:hidden">Refresh</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Generate</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Content - Simplified */}
      <div className="p-4 sm:p-6 bg-[hsl(var(--background))]">
        {showProgress ? (
          <GenerationProgress step={generationStep} />
        ) : showError ? (
          <ErrorState onRetry={handleGenerateSummary} hasAccess={hasSummaryAccess && isAuthenticated} />
        ) : hasContent ? (
          <SummaryContent content={summary} />
        ) : (
          <EmptyState onGenerate={handleGenerateSummary} hasAccess={hasSummaryAccess && isAuthenticated} />
        )}
      </div>
    </section>
  )
}

// Progress indicator component - Simplified
const GenerationProgress = ({ step }: { step: GenerationStep }) => {
  const currentIndex = GENERATION_STEPS.findIndex(s => s.id === step)
  const progress = currentIndex === -1 ? 0 : ((currentIndex + 1) / GENERATION_STEPS.length) * 100

  return (
    <div className="space-y-6">
      {/* Simple progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-[hsl(var(--muted))] border-2 border-[hsl(var(--border))] overflow-hidden">
          <div 
            className="h-full bg-[hsl(var(--accent))] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-black text-[hsl(var(--accent))] whitespace-nowrap min-w-[3.5rem] tabular-nums">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Clean step cards */}
      <div className="space-y-3">
        {GENERATION_STEPS.map((stepInfo, index) => {
          const StepIcon = stepInfo.icon
          const isActive = index === currentIndex
          const isCompleted = index < currentIndex
          const isPending = index > currentIndex
          
          return (
            <div 
              key={stepInfo.id}
              className={cn(
                "flex items-start gap-4 p-4 border-3 transition-all",
                isActive && "border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10",
                isCompleted && "border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5 opacity-60",
                isPending && "border-[hsl(var(--border))] opacity-40"
              )}
            >
              <div className={cn(
                "w-10 h-10 border-3 flex items-center justify-center flex-shrink-0",
                isActive && "bg-[hsl(var(--accent))] border-[hsl(var(--accent))]",
                isCompleted && "bg-[hsl(var(--success))] border-[hsl(var(--success))]",
                isPending && "bg-[hsl(var(--muted))] border-[hsl(var(--border))]"
              )}>
                {isActive ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <StepIcon className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black uppercase text-sm mb-1">
                  {stepInfo.label}
                </h4>
                <p className="text-xs font-medium text-[hsl(var(--foreground))]/70 leading-relaxed">
                  {stepInfo.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Error state component - Simplified
const ErrorState = ({ onRetry, hasAccess }: { onRetry: () => void; hasAccess: boolean }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
    <div className="w-16 h-16 bg-[hsl(var(--error))]/10 border-3 border-[hsl(var(--error))] flex items-center justify-center">
      <AlertCircle className="h-8 w-8 text-[hsl(var(--error))]" />
    </div>
    <div className="space-y-2 max-w-md">
      <h4 className="font-black uppercase tracking-tight text-lg">
        Summary Unavailable
      </h4>
      <p className="text-sm font-medium text-[hsl(var(--foreground))]/70 leading-relaxed">
        Unable to generate summary. Video transcript may not be available for this chapter.
      </p>
    </div>
    {hasAccess && (
      <Button
        onClick={onRetry}
        variant="outline"
        size="sm"
        className="border-3 font-black uppercase text-xs mt-2"
      >
        <RefreshCcw className="h-3.5 w-3.5 mr-2" />
        Try Again
      </Button>
    )}
  </div>
)

// Empty state component - Simplified
const EmptyState = ({ onGenerate, hasAccess }: { onGenerate: () => void; hasAccess: boolean }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
    <div className="w-16 h-16 bg-[hsl(var(--muted))] border-3 border-[hsl(var(--border))] flex items-center justify-center">
      <BookOpen className="h-8 w-8 text-[hsl(var(--foreground))]/40" />
    </div>
    <div className="space-y-2 max-w-md">
      <h4 className="font-black uppercase tracking-tight text-lg">
        No Summary Yet
      </h4>
      <p className="text-sm font-medium text-[hsl(var(--foreground))]/70 leading-relaxed">
        Generate an AI-powered summary from the video transcript to enhance your learning
      </p>
    </div>
    {hasAccess && (
      <Button
        onClick={onGenerate}
        size="sm"
        className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 font-black border-3 border-[hsl(var(--border))] shadow-neo hover:shadow-neo-hover hover:-translate-y-0.5 uppercase text-sm gap-2 mt-2"
      >
        <Sparkles className="h-4 w-4" />
        Generate Summary
      </Button>
    )}
  </div>
)

// Summary content component - Simplified
const SummaryContent = ({ content }: { content: string }) => (
  <div className="space-y-6">
    {/* Simple AI Disclaimer */}
    <div className="flex items-start gap-3 p-4 border-2 border-[hsl(var(--warning))]/40 bg-[hsl(var(--warning))]/5">
      <Info className="h-5 w-5 text-[hsl(var(--warning))] flex-shrink-0 mt-0.5" />
      <p className="text-xs font-medium text-[hsl(var(--foreground))]/80 leading-relaxed">
        <strong className="font-black text-[hsl(var(--warning))] uppercase">AI-Generated:</strong>{" "}
        This summary was created from the video transcript. Use it as a study aid alongside the video content.
      </p>
    </div>

    {/* Markdown content */}
    <div className="prose-wrapper max-w-none">
      <MarkdownRenderer content={content} />
    </div>
  </div>
)

export default CourseAISummary