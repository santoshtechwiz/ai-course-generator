"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { useChapterSummary } from "@/hooks/useChapterSummary"
import { Loader2, BookOpen, RefreshCcw } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

import { useAuth } from "@/hooks"
import { AdminSummaryPanel } from "./AdminSummaryPanel"
import { NoResults } from "@/components/ui/no-results"
import { MarkdownRenderer } from "./markdownUtils"
import { useFeatureAccess } from "@/hooks/useFeatureAccess"
import { SignInPrompt, SubscriptionUpgrade } from "@/components/shared"
import { Lock } from "lucide-react"
import { motion } from "framer-motion"

interface CourseSummaryProps {
  chapterId: number | string
  name: string
  isAdmin?: boolean
  existingSummary: string | null
}

const CourseAISummary: React.FC<CourseSummaryProps> = ({
  chapterId,
  name,
  isAdmin = false,
  existingSummary = null,
}) => {
  // Use centralized feature access system
  const { canAccess: hasSummaryAccess, reason: accessDenialReason, requiredPlan } = useFeatureAccess('course-videos')

  // Convert chapterId to number if it's a string
  const normalizedChapterId = typeof chapterId === "string" ? Number.parseInt(chapterId, 10) : chapterId

  // Use auth to verify admin status
  const { isAuthenticated } = useAuth()

  // Local state
  const [summary, setSummary] = useState<string>(existingSummary || "")

  // Reset summary when chapterId changes
  useEffect(() => {
    setSummary(existingSummary || "")
  }, [normalizedChapterId, existingSummary])

  // Get authorized admin status - require both prop and user verification
  const hasAdminAccess = isAdmin

  // Use the optimized hook from useChapterSummary.ts
  const { data: summaryResponse, refetch, isLoading, isError, isRefetching } = useChapterSummary(normalizedChapterId)

  // Always update summary from API when new data arrives
  useEffect(() => {
    if (summaryResponse && typeof summaryResponse === 'object' && 'data' in summaryResponse) {
      setSummary(summaryResponse.data as string)
    }
  }, [summaryResponse])

  // Handle refresh
  const handleGenerateSummary = () => {
    refetch()
      .then((result) => {
        if (result && typeof result === 'object' && result.data && typeof result.data === 'object') {
          if ('data' in result.data && result.data.data) {
            setSummary(result.data.data as string)
            toast.success("Summary refreshed successfully!")
          } else if ('message' in result.data && result.data.message) {
            toast.error(`Failed to refresh: ${result.data.message}`)
          }
        }
      })
      .catch((err) => {
        console.error("Error refreshing summary:", err)
        toast.error("Failed to refresh summary. Please try again.")
      })
  }

  // Render loading state
  if (isLoading && !existingSummary && !summary) {
    return (
      <Card className="w-full rounded-xl shadow-lg border border-purple-200 dark:border-purple-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-purple-700 dark:text-purple-300">
            <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <span>{name} Summary</span>
          </CardTitle>
          <CardDescription className="text-purple-600/80 dark:text-purple-300/80">
            Loading AI-generated summary...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8 p-6 bg-purple-50/30 dark:bg-purple-950/20 rounded-b-xl">
          <div className="flex flex-col items-center gap-2 text-center">
            <Loader2 className="h-8 w-8 text-primary" />
            <p className="text-sm text-muted-foreground">Generating summary for this chapter...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render error state
  if (isError && !summary) {
    return (
      <NoResults
        variant="error"
        title="Summary Error"
        description="Unable to load chapter summary"
        action={{
          label: "Try Again",
          onClick: handleGenerateSummary,
          icon: <RefreshCcw className="mr-2 h-4 w-4" />,
        }}
        minimal={false}
        className="w-full rounded-xl shadow-lg border border-purple-200 dark:border-purple-900"
      />
    )
  }

  // If the user is an admin, show the admin panel
  if (hasAdminAccess) {
    return (
      <AdminSummaryPanel
        chapterId={normalizedChapterId}
        name={name}
        summary={summary}
        setSummary={setSummary}
        onRefresh={handleGenerateSummary}
        isRefetching={isRefetching}
      />
    )
  }

  // Main content that will be access controlled
  const summaryContent = (
    <Card className="w-full shadow-md rounded-lg border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
            <BookOpen className="h-6 w-6 text-primary" />
            <span>{name} Summary</span>
          </CardTitle>
          <CardDescription>
            AI-generated summary of the chapter content
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-4 p-6">
        {summary ? (
          <MarkdownRenderer content={summary} />
        ) : (
          <NoResults
            variant="empty"
            title="No Summary Available"
            description="No summary available for this chapter yet"
            action={
              isAuthenticated
                ? {
                    label: isRefetching ? "Generating..." : "Generate Summary",
                    onClick: handleGenerateSummary,
                    icon: isRefetching ? (
                      <Loader2 className="mr-2 h-4 w-4" />
                    ) : (
                      <RefreshCcw className="mr-2 h-4 w-4" />
                    ),
                  }
                : undefined
            }
            minimal={true}
            className="bg-transparent"
          />
        )}
      </CardContent>

      {/* Show refresh button for regular users only if summary exists */}
      {summary && isAuthenticated && (
        <CardFooter className="p-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSummary}
            disabled={isRefetching}
            className="ml-auto"
          >
            {isRefetching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh Summary
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  )

  // Handle access denial with appropriate prompts
  if (!hasSummaryAccess) {
    if (accessDenialReason === 'auth') {
      // Show sign-in prompt for unauthenticated users
      return (
        <Card className="w-full shadow-md rounded-lg border">
          <CardContent className="p-6">
            <SignInPrompt
              variant="inline"
              context="course"
              feature="course-videos"
              customMessage="Sign in to view AI-generated summaries"
              showBenefits={true}
              className="max-w-2xl mx-auto"
              callbackUrl={typeof window !== 'undefined' ? window.location.href : undefined}
            />
          </CardContent>
        </Card>
      )
    }
    
    if (accessDenialReason === 'subscription' || accessDenialReason === 'expired') {
      // Show partial content with upgrade prompt
      return (
        <Card className="w-full shadow-md rounded-lg border relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
                <BookOpen className="h-6 w-6 text-primary" />
                <span>{name} Summary</span>
              </CardTitle>
              <CardDescription>
                AI-generated summary of the chapter content
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-4 p-6 relative">
            {/* Partial content preview */}
            {summary && summary.length > 0 ? (
              <div className="relative">
                <div className="prose prose-sm max-w-none opacity-50 blur-sm pointer-events-none">
                  <MarkdownRenderer content={summary.substring(0, 200) + "..."} />
                </div>
                
                {/* Lock overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 rounded-xl p-6 shadow-2xl max-w-md"
                  >
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                        <Lock className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">Unlock Full Summary</h3>
                        <p className="text-sm text-muted-foreground">
                          Upgrade to {requiredPlan || 'BASIC'} to access AI-generated chapter summaries
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            ) : (
              <NoResults
                variant="empty"
                title="No Summary Available"
                description="No summary available for this chapter yet"
                minimal={true}
                className="bg-transparent"
              />
            )}
            
            {/* Upgrade prompt */}
            <div className="mt-6">
              <SubscriptionUpgrade
                variant="inline"
                feature="course-videos"
                requiredPlan={requiredPlan || 'BASIC'}
                customMessage="Unlock AI Summaries"
                showFeatureList={false}
                className=""
              />
            </div>
          </CardContent>
        </Card>
      )
    }
  }

  // User has access - show full content
  return summaryContent
}
export default CourseAISummary
