"use client"

import React, { useEffect, useState } from "react"
import { useChapterSummary } from "@/hooks/useChapterSummary"
import { MarkdownRenderer } from "./markdownUtils"
import { AdminSummaryPanel } from "./AdminSummaryPanel"
import { useFeatureAccess } from "@/hooks/useFeatureAccess"
import { useAuth } from "@/hooks"

interface CourseSummaryProps {
  chapterId: number | string
  name: string
  isAdmin?: boolean
  existingSummary: string | null
}

// Simplified Course Summary - text-only display for clarity
const CourseAISummary: React.FC<CourseSummaryProps> = ({ chapterId, name, isAdmin = false, existingSummary = null }) => {
  const normalizedChapterId = typeof chapterId === "string" ? Number.parseInt(chapterId, 10) : chapterId
  const { data: summaryResponse, refetch, isLoading, isError, isRefetching } = useChapterSummary(normalizedChapterId)
  const [summary, setSummary] = useState<string>(existingSummary || "")
  const { canAccess: hasSummaryAccess } = useFeatureAccess("course-videos")
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (summaryResponse && typeof summaryResponse === "object" && "data" in summaryResponse) {
      setSummary(summaryResponse.data as string)
    }
  }, [summaryResponse])

  // Keep admin editor available for admins
  const hasAdminAccess = Boolean(isAdmin)
  if (hasAdminAccess) {
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

  // Minimal text-only UI for the summary content
  if (isLoading && !summary) return <div className="prose p-6">Loading summary...</div>
  if (isError && !summary) return <div className="prose p-6 text-red-600">Unable to load summary.</div>

  return (
    <section aria-label={`${name} Summary`} className="prose max-w-none p-6 text-foreground">
      {summary ? (
        <MarkdownRenderer content={summary} />
      ) : (
        <p className="text-muted-foreground">No summary available for this chapter.</p>
      )}
    </section>
  )
}

export default CourseAISummary
