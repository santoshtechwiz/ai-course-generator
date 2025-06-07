"use client"

import { useState, useCallback, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  BookOpen,
  FileText,
  MessageSquare,
  BarChart3,
  Bookmark,
  Users,
  Star,
  Clock,
  Award,
  CheckCircle,
  Play,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Import existing components
import CourseDetailsQuiz from "./CourseDetailsQuiz"
import CourseAISummary from "./CourseAISummary"
import BookmarkManager from "./video/components/BookmarkManager"

import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { addBookmark, removeBookmark } from "@/store/slices/courseSlice"
import type { FullCourseType, FullChapterType } from "@/app/types/types"

interface CourseDetailsTabsProps {
  course: FullCourseType
  currentChapter?: FullChapterType
  isAuthenticated: boolean
  isPremium?: boolean
  isAdmin?: boolean
}

export default function CourseDetailsTabs({
  course,
  currentChapter,
  isAuthenticated,
  isPremium = false,
  isAdmin = false,
}: CourseDetailsTabsProps) {
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState("overview")

  // Get current video data from Redux
  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)
  const bookmarks = useAppSelector((state) => state.course.bookmarks[currentVideoId || ""] || [])
  const courseProgress = useAppSelector((state) => state.course.courseProgress[course.id])

  // Calculate course statistics
  const courseStats = useMemo(() => {
    const totalChapters = course.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0) || 0
    const completedChapters = courseProgress?.completedChapters?.length || 0
    const progressPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0

    return {
      totalChapters,
      completedChapters,
      progressPercentage,
      totalDuration: "2h 30m", // This could be calculated from chapter durations
      studentsEnrolled: 1234, // This would come from the course data
      rating: 4.8, // This would come from the course data
    }
  }, [course, courseProgress])

  // Format time helper
  const formatTime = useCallback((seconds: number): string => {
    if (isNaN(seconds)) return "0:00"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`
  }, [])

  // Bookmark handlers
  const handleAddBookmark = useCallback(
    (time: number, title?: string) => {
      if (currentVideoId) {
        dispatch(
          addBookmark({
            videoId: currentVideoId,
            time,
            title: title || `Bookmark at ${formatTime(time)}`,
            id: `${currentVideoId}-${time}-${Date.now()}`,
          }),
        )
      }
    },
    [currentVideoId, dispatch, formatTime],
  )

  const handleRemoveBookmark = useCallback(
    (bookmarkId: string) => {
      if (currentVideoId) {
        dispatch(removeBookmark({ videoId: currentVideoId, bookmarkId }))
      }
    },
    [currentVideoId, dispatch],
  )

  const handleSeekToBookmark = useCallback((time: number) => {
    // This would trigger seeking in the video player
    // The video player component should listen for this action
    console.log("Seek to bookmark:", time)
  }, [])

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">AI Summary</span>
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            <span className="hidden sm:inline">Bookmarks</span>
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Quiz</span>
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Progress</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview" className="space-y-6">
            {/* Course Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Overview
                </CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{courseStats.studentsEnrolled.toLocaleString()} students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{courseStats.rating} rating</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{courseStats.totalDuration} total</span>
                  </div>
                </div>

                {/* Course Units */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Course Content</h3>
                  {course.courseUnits?.map((unit, unitIndex) => (
                    <Card key={unit.id} className="border-l-4 border-l-primary/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          Unit {unitIndex + 1}: {unit.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {unit.chapters.map((chapter, chapterIndex) => {
                            const isCompleted = courseProgress?.completedChapters?.includes(Number(chapter.id))
                            const isCurrent = currentChapter?.id === chapter.id

                            return (
                              <div
                                key={chapter.id}
                                className={cn(
                                  "flex items-center gap-3 p-2 rounded-md transition-colors",
                                  isCurrent && "bg-primary/10 border border-primary/20",
                                  "hover:bg-muted/50",
                                )}
                              >
                                <div className="flex-shrink-0">
                                  {isCompleted ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : isCurrent ? (
                                    <Play className="h-4 w-4 text-primary" />
                                  ) : (
                                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium line-clamp-1">{chapter.title}</span>
                                    {chapter.isFree && (
                                      <Badge variant="outline" className="text-xs">
                                        Free
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>{chapter.duration || "5 min"}</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary">
            {currentChapter ? (
              <CourseAISummary course={course} currentChapter={currentChapter} isAuthenticated={isAuthenticated} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-40">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Select a chapter to view AI summary</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bookmarks">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bookmark className="h-5 w-5" />
                  Video Bookmarks
                </CardTitle>
                <CardDescription>
                  {currentChapter
                    ? `Bookmarks for "${currentChapter.title}"`
                    : "Select a chapter to view and manage bookmarks"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentVideoId && currentChapter ? (
                  <BookmarkManager
                    videoId={currentVideoId}
                    bookmarks={bookmarks}
                    currentTime={0} // This should come from the video player
                    duration={300} // This should come from the video player
                    onSeekToBookmark={handleSeekToBookmark}
                    onAddBookmark={handleAddBookmark}
                    onRemoveBookmark={handleRemoveBookmark}
                    formatTime={formatTime}
                  />
                ) : (
                  <div className="text-center py-8">
                    <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Video Selected</h3>
                    <p className="text-muted-foreground">
                      Select a chapter from the course content to view and manage bookmarks.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quiz">
            {currentChapter ? (
              <CourseDetailsQuiz
                course={course}
                chapter={currentChapter}
                isPremium={isPremium}
                isPublicCourse={course.isPublic || false}
                chapterId={currentChapter.id.toString()}
              />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-40">
                  <div className="text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Select a chapter to take the quiz</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="progress">
            <div className="space-y-6">
              {/* Overall Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Learning Progress
                  </CardTitle>
                  <CardDescription>Track your progress through the course</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Course Completion</span>
                        <span className="font-medium">{courseStats.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${courseStats.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{courseStats.completedChapters}</div>
                        <div className="text-sm text-muted-foreground">Completed</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{courseStats.totalChapters}</div>
                        <div className="text-sm text-muted-foreground">Total Chapters</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{bookmarks.length}</div>
                        <div className="text-sm text-muted-foreground">Bookmarks</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {courseStats.progressPercentage === 100 ? "1" : "0"}
                        </div>
                        <div className="text-sm text-muted-foreground">Certificates</div>
                      </div>
                    </div>

                    {/* Achievement */}
                    {courseStats.progressPercentage === 100 && (
                      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                        <CardContent className="flex items-center gap-4 p-4">
                          <Award className="h-8 w-8 text-yellow-600" />
                          <div>
                            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Course Completed!</h3>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                              Congratulations! You've completed all chapters in this course.
                            </p>
                          </div>
                          <Button variant="outline" className="ml-auto">
                            <Award className="h-4 w-4 mr-2" />
                            View Certificate
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Chapter Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Chapter Progress</CardTitle>
                  <CardDescription>Detailed progress for each chapter</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {course.courseUnits?.map((unit) =>
                        unit.chapters.map((chapter, index) => {
                          const isCompleted = courseProgress?.completedChapters?.includes(Number(chapter.id))
                          const isCurrent = currentChapter?.id === chapter.id

                          return (
                            <div
                              key={chapter.id}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                                isCurrent && "bg-primary/10 border border-primary/20",
                                isCompleted && "bg-green-50 dark:bg-green-950/20",
                              )}
                            >
                              <div className="flex-shrink-0">
                                {isCompleted ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : isCurrent ? (
                                  <Play className="h-5 w-5 text-primary" />
                                ) : (
                                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{chapter.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>{chapter.duration || "5 min"}</span>
                                  {isCompleted && (
                                    <>
                                      <Separator orientation="vertical" className="h-3" />
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                      <span className="text-green-600">Completed</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        }),
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
