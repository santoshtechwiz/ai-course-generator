"use client"

import React, { useEffect, useState } from "react"
import { useChapterSummary } from "@/hooks/useChapterSummary"
import { MarkdownRenderer } from "./markdownUtils"
import { AdminSummaryPanel } from "./AdminSummaryPanel"
import { useFeatureAccess } from "@/hooks/useFeatureAccess"
import { useAuth } from "@/hooks"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCcw, Sparkles, BookOpen, AlertCircle, FileText, Video, Zap, Info } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CourseSummaryProps {
  chapterId: number | string
  name: string
  isAdmin?: boolean
  existingSummary: string | null
}

type GenerationStep = 
  | "idle" 
  | "fetching_transcript" 
  | "transcript_found" 
  | "generating_from_transcript" 
  | "generating_from_metadata" 
  | "complete" 
  | "error"

const CourseAISummary: React.FC<CourseSummaryProps> = ({ 
  chapterId, 
  name, 
  isAdmin = false, 
  existingSummary = null 
}) => {
  const normalizedChapterId = typeof chapterId === "string" ? Number.parseInt(chapterId, 10) : chapterId
  const { data: summaryResponse, refetch, isLoading, isError, isRefetching } = useChapterSummary(normalizedChapterId)
  const [summary, setSummary] = useState<string>(existingSummary || "")
  const { canAccess: hasSummaryAccess } = useFeatureAccess("course-videos")
  const { isAuthenticated } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState<GenerationStep>("idle")
  const [buttonDisabled, setButtonDisabled] = useState(false)

  // Reset state when chapter changes
  useEffect(() => {
    setSummary(existingSummary || "")
    setGenerationStep("idle")
    setIsGenerating(false)
    setButtonDisabled(false)
  }, [normalizedChapterId, existingSummary])

  // Auto-generate summary on mount if missing
  useEffect(() => {
    if (!existingSummary && hasSummaryAccess && isAuthenticated && !isLoading && summary === "") {
      setGenerationStep("fetching_transcript")
      refetch()
    }
  }, [existingSummary, hasSummaryAccess, isAuthenticated, refetch, isLoading, summary])

  useEffect(() => {
    if (summaryResponse && typeof summaryResponse === "object" && "data" in summaryResponse) {
      setSummary(summaryResponse.data as string)
      setGenerationStep("complete")
      setIsGenerating(false)
      // Keep button disabled for a moment to show completion
      setButtonDisabled(true)
      setTimeout(() => setButtonDisabled(false), 1000)
    }
  }, [summaryResponse])

  // Track generation progress through states
  useEffect(() => {
    if (isLoading || isRefetching || isGenerating) {
      // Start with fetching transcript
      if (generationStep === "idle") {
        setGenerationStep("fetching_transcript")
      }
      
      // Simulate realistic progress steps
      const timer1 = setTimeout(() => {
        if (isLoading || isRefetching || isGenerating) {
          setGenerationStep("generating_from_transcript")
        }
      }, 1500)
      
      return () => {
        clearTimeout(timer1)
      }
    } else if (!isLoading && !isRefetching && !isGenerating) {
      if (summary) {
        setGenerationStep("complete")
      } else if (isError) {
        setGenerationStep("error")
      }
    }
  }, [isLoading, isRefetching, isGenerating, summary, isError, generationStep])

  const handleGenerateSummary = async () => {
    if (!hasSummaryAccess || !isAuthenticated) {
      toast.error("You need to be logged in to generate summaries")
      return
    }

    setIsGenerating(true)
    setGenerationStep("fetching_transcript")
    
    try {
      await refetch()
      toast.success("Summary generated successfully!")
      setGenerationStep("complete")
    } catch (error) {
      console.error("Error generating summary:", error)
      toast.error("Failed to generate summary. Please try again.")
      setGenerationStep("error")
    } finally {
      setTimeout(() => {
        setIsGenerating(false)
      }, 500)
    }
  }

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

  const isLoadingState = isGenerating || isRefetching || isLoading || buttonDisabled

  const renderGenerationProgress = () => {
    const steps = [
      {
        id: "fetching_transcript",
        icon: Video,
        label: "Fetching Video Transcript",
        description: "Retrieving transcript from video source..."
      },
      {
        id: "generating_from_transcript",
        icon: Zap,
        label: "Analyzing Content",
        description: "AI is analyzing the chapter content and extracting key concepts..."
      }
    ]

    const currentStepIndex = steps.findIndex(s => s.id === generationStep)
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-1 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] overflow-hidden">
            <div 
              className="h-full bg-[hsl(var(--accent))] transition-all duration-500"
              style={{ 
                width: currentStepIndex === -1 ? '0%' : 
                       currentStepIndex === 0 ? '50%' : 
                       currentStepIndex === 1 ? '100%' : '100%'
              }}
            />
          </div>
          <span className="text-xs font-black text-[hsl(var(--foreground))]/60 whitespace-nowrap">
            {currentStepIndex + 1} / {steps.length}
          </span>
        </div>

        {steps.map((step, index) => {
          const StepIcon = step.icon
          const isActive = index === currentStepIndex
          const isCompleted = index < currentStepIndex
          const isPending = index > currentStepIndex
          
          return (
            <div 
              key={step.id}
              className={cn(
                "flex items-start gap-4 p-4 border-2 transition-all duration-300",
                isActive && "border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10 shadow-[4px_4px_0px_0px_hsl(var(--accent))]",
                isCompleted && "border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5 opacity-60",
                isPending && "border-[hsl(var(--border))] opacity-40"
              )}
            >
              <div className={cn(
                "w-10 h-10 border-3 flex items-center justify-center shadow-neo flex-shrink-0 transition-all",
                isActive && "bg-[hsl(var(--accent))] border-[hsl(var(--accent))] animate-pulse",
                isCompleted && "bg-[hsl(var(--success))] border-[hsl(var(--success))]",
                isPending && "bg-[hsl(var(--muted))] border-[hsl(var(--border))]"
              )}>
                {isActive ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--foreground))]" />
                ) : (
                  <StepIcon className={cn(
                    "h-5 w-5",
                    isActive && "text-[hsl(var(--foreground))]",
                    isCompleted && "text-[hsl(var(--success-foreground))]",
                    isPending && "text-[hsl(var(--muted-foreground))]"
                  )} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={cn(
                  "font-black uppercase tracking-tight text-sm mb-1",
                  isActive && "text-[hsl(var(--foreground))]",
                  isCompleted && "text-[hsl(var(--foreground))]/70",
                  isPending && "text-[hsl(var(--foreground))]/40"
                )}>
                  {step.label}
                </h4>
                <p className={cn(
                  "text-xs font-medium leading-relaxed",
                  isActive && "text-[hsl(var(--foreground))]/80",
                  isCompleted && "text-[hsl(var(--foreground))]/50",
                  isPending && "text-[hsl(var(--foreground))]/30"
                )}>
                  {step.description}
                </p>
                {isActive && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[hsl(var(--accent))] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-[hsl(var(--accent))] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-[hsl(var(--accent))] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs font-bold text-[hsl(var(--accent))] uppercase">Processing</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <section
      aria-label={`${name} Summary`}
      className="bg-[hsl(var(--surface))] border-3 border-[hsl(var(--border))] shadow-neo rounded-none"
    >
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b-3 border-[hsl(var(--border))]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[hsl(var(--warning))] border-3 border-[hsl(var(--border))] flex items-center justify-center shadow-neo flex-shrink-0">
            <BookOpen className="h-5 w-5 text-[hsl(var(--foreground))]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black uppercase tracking-tight text-base sm:text-lg text-[hsl(var(--foreground))] truncate">
              {name} Summary
            </h3>
            <p className="text-xs font-bold text-[hsl(var(--foreground))]/60">
              AI-generated chapter overview
            </p>
          </div>
        </div>

        {hasSummaryAccess && isAuthenticated && (
          <Button
            onClick={handleGenerateSummary}
            disabled={isLoadingState}
            variant="default"
            size="sm"
            className={cn(
              "bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90",
              "text-[hsl(var(--foreground))] font-black",
              "border-3 border-[hsl(var(--border))] shadow-neo",
              "hover:shadow-neo-hover hover:translate-x-[-1px] hover:translate-y-[-1px]",
              "transition-all uppercase text-xs gap-2 flex-shrink-0",
              isLoadingState && "opacity-70 cursor-not-allowed"
            )}
          >
            {isLoadingState ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Generating...</span>
              </>
            ) : summary ? (
              <>
                <RefreshCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Generate</span>
              </>
            )}
          </Button>
        )}
      </header>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {(isLoadingState || generationStep === "fetching_transcript" || generationStep === "generating_from_transcript") && !summary ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="w-16 h-16 bg-[hsl(var(--accent))]/20 border-3 border-[hsl(var(--accent))] flex items-center justify-center shadow-neo">
                <Sparkles className="h-8 w-8 text-[hsl(var(--accent))] animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <h4 className="font-black uppercase tracking-tight text-lg text-[hsl(var(--foreground))]">
                  Generating Summary
                </h4>
                <p className="text-sm font-bold text-[hsl(var(--foreground))]/60 max-w-md">
                  Please wait while we analyze this chapter
                </p>
              </div>
            </div>

            {renderGenerationProgress()}
          </div>
        ) : isError && !summary ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-12 h-12 bg-[hsl(var(--error))]/20 border-3 border-[hsl(var(--error))] flex items-center justify-center shadow-neo">
              <AlertCircle className="h-6 w-6 text-[hsl(var(--error))]" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="font-black uppercase tracking-tight text-[hsl(var(--foreground))]">
                Summary Unavailable
              </h4>
              <p className="text-sm font-bold text-[hsl(var(--foreground))]/60 max-w-md">
                Unable to generate summary. No transcript available for this chapter.
              </p>
            </div>
            {hasSummaryAccess && isAuthenticated && (
              <Button
                onClick={handleGenerateSummary}
                variant="outline"
                className="border-3 border-[hsl(var(--border))] shadow-neo hover:shadow-neo-hover font-black uppercase text-xs"
              >
                Try Again
              </Button>
            )}
          </div>
        ) : summary ? (
          <div className="space-y-4">
            {/* AI Disclaimer */}
            <div className="flex items-start gap-3 p-3 border-2 border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5">
              <Info className="h-5 w-5 text-[hsl(var(--warning))] flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[hsl(var(--foreground))]/80 leading-relaxed">
                  <strong className="text-[hsl(var(--warning))] uppercase">AI-Generated Summary:</strong> This summary was automatically created by artificial intelligence based on the chapter content. It may not capture all nuances and should be used as a study aid alongside the original material.
                </p>
              </div>
            </div>

            {/* Summary Content */}
            <div className="prose-wrapper max-w-none">
              <MarkdownRenderer content={summary} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-12 h-12 bg-[hsl(var(--muted))] border-3 border-[hsl(var(--border))] flex items-center justify-center shadow-neo">
              <BookOpen className="h-6 w-6 text-[hsl(var(--foreground))]/40" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="font-black uppercase tracking-tight text-[hsl(var(--foreground))]">
                No Summary Yet
              </h4>
              <p className="text-sm font-bold text-[hsl(var(--foreground))]/60 max-w-md">
                Generate an AI summary to help you understand this chapter
              </p>
            </div>
            {hasSummaryAccess && isAuthenticated && (
              <Button
                onClick={handleGenerateSummary}
                className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] font-black border-3 border-[hsl(var(--border))] shadow-neo hover:shadow-neo-hover hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all uppercase text-sm gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Generate Summary
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default CourseAISummary
