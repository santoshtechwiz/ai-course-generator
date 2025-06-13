"use client"

import { useState, useEffect, useMemo } from "react"
import { useChapterSummary } from "@/hooks/useChapterSummary"
import { Loader2, BookOpen, RefreshCcw } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"

import { useAuth } from "@/hooks"
import { AdminSummaryPanel } from "./AdminSummaryPanel"
import { NoResults } from "@/components/ui/no-results"
import { AccessControl } from "@/components/ui/access-control"

interface CourseSummaryProps {
  chapterId: number | string
  name: string
  isPremium?: boolean // Keep original prop for backward compatibility
  isAdmin?: boolean
  existingSummary: string | null
  hasAccess?: boolean // New prop for access control
}

const CourseAISummary: React.FC<CourseSummaryProps> = ({
  chapterId,
  name,
  isPremium = false,
  isAdmin = false,
  existingSummary = null,
  hasAccess = false, // Default to false for safety
}) => {
  // Use isPremium for backwards compatibility
  const hasSummaryAccess = hasAccess || isPremium;
  
  // Convert chapterId to number if it's a string
  const normalizedChapterId = typeof chapterId === "string" ? parseInt(chapterId, 10) : chapterId
  
  // Use auth to verify admin status
  const { isAuthenticated, isAdmin: isUserAdmin } = useAuth()
  
  // Local state
  const [summary, setSummary] = useState<string>(existingSummary || "")
  
  // Get authorized admin status - require both prop and user verification
  const hasAdminAccess = useMemo(() => isAdmin && isUserAdmin, [isAdmin, isUserAdmin])

  // Use the optimized hook from useChapterSummary.ts
  const {
    data: summaryResponse,
    refetch,
    isLoading,
    isError,
    isRefetching,
  } = useChapterSummary(normalizedChapterId)

  // Update summary from API or props
  useEffect(() => {
    if (summaryResponse?.data && !summary) {
      setSummary(summaryResponse.data)
    } else if (existingSummary && !summary) {
      setSummary(existingSummary)
    }
  }, [summaryResponse, existingSummary, summary])

  // Handle refresh
  const handleGenerateSummary = () => {
    refetch()
      .then((result) => {
        if (result.data?.data) {
          setSummary(result.data.data)
          toast.success("Summary refreshed successfully!")
        } else if (result.data?.message) {
          toast.error(`Failed to refresh: ${result.data.message}`)
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
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <span>{name} Summary</span>
          </CardTitle>
          <CardDescription>Loading AI-generated summary...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        className="w-full"
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
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <span>{name} Summary</span>
          </CardTitle>
          <CardDescription>
            AI-generated summary of the chapter content
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {summary ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              className="markdown-body"
            >
              {summary}
            </Markdown>
          </div>
        ) : (
          <NoResults
            variant="empty"
            title="No Summary Available"
            description="No summary available for this chapter yet"
            action={
              isAuthenticated ? {
                label: isRefetching ? "Generating..." : "Generate Summary",
                onClick: handleGenerateSummary,
                icon: isRefetching ? 
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                  <RefreshCcw className="mr-2 h-4 w-4" />
              } : undefined
            }
            minimal={true}
          />
        )}
      </CardContent>
      
      {/* Show refresh button for regular users only if summary exists */}
      {(summary && isAuthenticated) && (
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSummary}
            disabled={isRefetching}
            className="ml-auto"
          >
            {isRefetching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
  );

  // Render the AccessControl component with proper brackets
 return (
  <AccessControl
    hasAccess={hasSummaryAccess}
    featureTitle="Premium Summary Feature"
    showPreview={!!summary && summary.length > 0}
    previewContent={
      summary ? (
        <div className="prose prose-sm max-w-none opacity-70">
          <Markdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            className="markdown-body"
          >
            {summary.substring(0, 150) + "..."}
          </Markdown>
        </div>
      ) : null
    }
  >
    {summaryContent}
  </AccessControl>
)

}
export default CourseAISummary