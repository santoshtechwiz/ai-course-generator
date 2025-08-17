"use client"

import { useState, useCallback, useMemo } from "react"
import { createSelector } from "@reduxjs/toolkit"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, MessageSquare, BarChart3, Award, TrendingUp, BookmarkIcon, File, BookOpen, ListChecks } from "lucide-react"

import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { type RootState } from "@/store"
import { addBookmark, removeBookmark, type BookmarkItem, type CourseProgress } from "@/store/slices/course-slice"
import type { FullCourseType, FullChapterType } from "@/app/types/types"
import CourseDetailsQuiz from "./CourseQuiz"
import CourseAISummary from "./CourseSummary"
import CertificateGenerator from "./CertificateGenerator"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { Badge } from "@/components/ui/badge"
import { CircularProgress } from "@/components/ui/circular-progress"

export interface AccessLevels {
  isSubscribed: boolean
  isAuthenticated: boolean
  isAdmin: boolean
}

interface CourseDetailsTabsProps {
  course: FullCourseType
  currentChapter?: FullChapterType
  accessLevels?: AccessLevels // New prop for standardized access control
  onSeekToBookmark?: (time: number, title?: string) => void
}

export default function CourseDetailsTabs({
  course,
  currentChapter,
  accessLevels,
  onSeekToBookmark,
}: CourseDetailsTabsProps) {
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState("summary")

  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)
  
  // Memoized selectors to prevent unnecessary re-renders caused by new object references
  // Previously: state.course.bookmarks[currentVideoId || ""] || [] would create a new array on each render
  const selectBookmarks = useMemo(
    () => createSelector(
      [(state: RootState) => state.course.bookmarks, (state: RootState) => currentVideoId],
      (bookmarks: Record<string, BookmarkItem[]>, videoId: string | null): BookmarkItem[] => {
        if (!videoId || !bookmarks[videoId]) {
          return []
        }
        return bookmarks[videoId]
      }
    ),
    [currentVideoId]
  )
  
  const bookmarks = useAppSelector(selectBookmarks)
  
  // Create memoized selector for course progress to prevent unnecessary re-renders
  const selectCourseProgress = useMemo(
    () => createSelector(
      [(state: RootState) => state.course.courseProgress, () => course.id],
      (courseProgressMap: Record<string | number, CourseProgress>, courseId: string | number): CourseProgress | undefined => {
        return courseProgressMap[courseId]
      }
    ),
    [course.id]
  )
  
  const courseProgress = useAppSelector(selectCourseProgress)

  const courseStats = useMemo(() => {
    const totalChapters = course.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0) || 0
    const completedChapters = courseProgress?.completedChapters?.length || 0
    const progressPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0

    return {
      totalChapters,
      completedChapters,
      progressPercentage,
    }
  }, [course.courseUnits, courseProgress?.completedChapters])

  const formatTime = useCallback((seconds: number): string => {
    if (isNaN(seconds)) return "0:00"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`
  }, [])


  const handleRemoveBookmark = useCallback(
    (bookmarkId: string) => {
      if (currentVideoId) {
        dispatch(removeBookmark({ videoId: currentVideoId, bookmarkId }))
      }
    },
    [currentVideoId, dispatch],
  )

  const handleSeekToBookmark = useCallback(
    (time: number) => {
      if (onSeekToBookmark) {
        onSeekToBookmark(time)
      }
    },
    [onSeekToBookmark],
  )

  // Add a tab for bookmarks, if they don't exist already
  const tabs = [
    { id: "overview", label: "Overview", icon: <FileText className="h-4 w-4 mr-2" /> },
    { id: "notes", label: "Notes", icon: <MessageSquare className="h-4 w-4 mr-2" /> },
    { id: "transcripts", label: "Transcript", icon: <FileText className="h-4 w-4 mr-2" /> },
    { id: "bookmarks", label: "Bookmarks", icon: <BookmarkIcon className="h-4 w-4 mr-2" /> },
    { id: "resources", label: "Resources", icon: <File className="h-4 w-4 mr-2" /> },
  ]

  function CertificateButton({ courseTitle }: { courseTitle: string }) {
    const safeCourse = courseTitle?.trim() || "Course"
    const fileName = `${safeCourse.replace(/\s+/g, "_")}_Certificate.pdf`
    return (
      <PDFDownloadLink
        document={<CertificateGenerator courseName={safeCourse} userName={undefined} />}
        fileName={fileName}
        className="w-full"
      >
        {({ loading }) => (
          <Button disabled={loading} className="w-full">
            {loading ? "Preparing..." : (
              <>
                <Award className="h-4 w-4 mr-2" />
                Download Certificate
              </>
            )}
          </Button>
        )}
      </PDFDownloadLink>
    )
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Course Info header block */}
      <div className="flex items-start justify-between p-4 bg-card rounded-lg border mb-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold leading-tight truncate">{course.title}</h2>
          {course.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{course.description}</p>
          )}
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <Badge variant="secondary" className="text-xs inline-flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Course Progress
            </Badge>
            <Badge variant="outline" className="text-xs inline-flex items-center gap-1">
              <ListChecks className="h-3 w-3" />
              {courseStats.totalChapters} Chapters
            </Badge>
          </div>
        </div>
        <div className="flex-shrink-0 ml-4">
          <CircularProgress
            value={courseStats.progressPercentage}
            size={64}
            strokeWidth={8}
            label={courseStats.progressPercentage === 100 ? "✅" : `${courseStats.progressPercentage}%`}
            sublabel={courseStats.progressPercentage === 0 ? "Start" : undefined}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full w-full flex flex-col overflow-hidden">
        {/* Tab Navigation */}
        <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/20 rounded-none flex-shrink-0">
          <TabsTrigger value="summary" className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-primary" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-purple-500" />
            Quiz
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="flex items-center gap-2 text-sm">
            <BookmarkIcon className="h-4 w-4 text-amber-600" />
            Bookmarks
          </TabsTrigger>
        </TabsList>

        {/* Tabs Content */}
        <TabsContent value="summary" className="h-full overflow-auto p-4">
          {currentChapter ? (
            <CourseAISummary
              chapterId={currentChapter.id}
              name={currentChapter.title || currentChapter.name || "Chapter Summary"}
              existingSummary={currentChapter.summary || null}
              hasAccess={Boolean(accessLevels?.isSubscribed || currentChapter?.isFree)}
              isAdmin={accessLevels?.isAdmin}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Chapter Selected</h3>
                <p className="text-sm">Select a chapter to view AI-generated summary</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="quiz" className="h-full overflow-auto p-4">
          {currentChapter ? (
            <CourseDetailsQuiz
              key={currentChapter.id}
              course={course}
              chapter={currentChapter}
              accessLevels={{
                ...accessLevels!,
                // Gate quiz: allow if subscribed or this chapter flagged as free quiz
                isSubscribed: Boolean(accessLevels?.isSubscribed || (currentChapter as any)?.isFreeQuiz === true),
              }}
              isPublicCourse={course.isPublic || false}
              chapterId={currentChapter.id.toString()}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Chapter Selected</h3>
                <p className="text-sm">Select a chapter to take the quiz</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="h-full overflow-auto p-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Learning Progress
              </CardTitle>
              <CardDescription>Track your progress through the course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {courseStats.totalChapters === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <p className="font-medium">Start your learning journey — your progress will appear here.</p>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Course Completion</span>
                      <span className="font-medium">{courseStats.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${courseStats.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-xl font-bold text-primary">{courseStats.completedChapters}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-xl font-bold">{courseStats.totalChapters}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-xl font-bold text-green-600">{bookmarks.length}</div>
                      <div className="text-xs text-muted-foreground">Bookmarks</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-xl font-bold text-yellow-600">
                        {courseStats.progressPercentage === 100 ? "1" : "0"}
                      </div>
                      <div className="text-xs text-muted-foreground">Certificates</div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookmarks" className="h-full overflow-auto p-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookmarkIcon className="h-5 w-5" />
                Bookmarks
              </CardTitle>
              <CardDescription>
                {bookmarks.length > 0
                  ? "Jump to specific parts of the video you've saved"
                  : "You haven't saved any bookmarks for this video yet"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {accessLevels?.isAuthenticated && bookmarks.length > 0 ? (
                <div className="space-y-3">
                  {bookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      onClick={() => handleSeekToBookmark(bookmark.time)}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/20 text-primary font-medium rounded px-2 py-1 text-xs">
                          {formatTime(bookmark.time)}
                        </div>
                        <span className="line-clamp-1">{bookmark.title}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveBookmark(bookmark.id)
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : accessLevels?.isAuthenticated ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookmarkIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No bookmarks yet</p>
                  <p className="text-sm">Press 'B' while watching to add a bookmark</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Sign in to save video bookmarks</p>
                  <Button variant="outline" className="mt-4 bg-transparent">
                    Sign In
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
