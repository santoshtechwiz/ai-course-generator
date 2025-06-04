"use client"

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react"
import EnhancedVideoPlayer from "./EnhancedVideoPlayer"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, PlayCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import CourseDetailsQuiz from "./CourseDetailsQuiz"
import CourseAISummary from "./CourseAISummary"
import CourseCompletionOverlay from "./CourseCompletionOverlay"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  setCurrentVideoApi,
  markChapterAsCompleted,
  setCourseCompletionStatus,
  setAutoplayEnabled,
} from "@/store/slices/courseSlice"
import { motion, AnimatePresence } from "framer-motion"
import type { FullCourseType, FullChapterType, CourseProgress } from "@/app/types/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { PauseCircle } from "lucide-react"
import CertificateGenerator from "./CertificateGenerator"
import { Award } from "lucide-react"
import { useRouter } from "next/navigation"
import { PlusCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import AutoplayOverlay from "./AutoplayOverlay"

interface MainContentProps {
  slug: string
  initialVideoId?: string
  nextVideoId?: string
  prevVideoId?: string
  onVideoEnd: () => void
  onVideoSelect: (videoId: string) => void
  currentChapter?: FullChapterType
  currentTime?: number
  onWatchAnotherCourse: () => void
  onTimeUpdate?: (time: number) => void
  planId?: string
  isLastVideo?: boolean
  autoPlay?: boolean
  progress?: CourseProgress
  onChapterComplete?: () => void
  courseCompleted?: boolean
  course: FullCourseType
  relatedCourses?: Array<{
    id: string | number
    title: string
    slug: string
    category?: { name: string }
    image?: string
  }>
}

function MainContent({
  slug,
  initialVideoId,
  nextVideoId,
  prevVideoId,
  onVideoEnd,
  onVideoSelect,
  currentChapter,
  currentTime = 0,
  onWatchAnotherCourse,
  onTimeUpdate,
  planId = "FREE",
  isLastVideo = false,
  autoPlay = false,
  progress,
  onChapterComplete,
  courseCompleted = false,
  course,
  relatedCourses = [],
}: MainContentProps) {
  const [activeTab, setActiveTab] = useState("notes")
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false)
  const [autoplayOverlay, setAutoplayOverlay] = useState(false)
  const [autoplayCountdown, setAutoplayCountdown] = useState(5)
  const dispatch = useAppDispatch()
  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)
  const autoplayEnabled = useAppSelector((state) => state.course.autoplayEnabled)
  const { data: session } = useSession()
  const { toast } = useToast()
  const isAuthenticated = !!session
  const bookmarks = useAppSelector((state) => state.course.bookmarks[currentVideoId || ""] || [])
  const didSetInitialVideo = useRef(false)
  const autoplayTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Improve quiz prompt visibility state with additional flag for completed status
  const [showQuizPrompt, setShowQuizPrompt] = useState(false)
  const [chapterCompleted, setChapterCompleted] = useState(false)

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current)
      }
    }
  }, [])

  // 1. Define isLastChapterInUnit first since it's used in handleVideoEnd
  const isLastChapterInUnit = useCallback(() => {
    if (!currentChapter) return false

    const currentUnitIndex = course.courseUnits.findIndex((unit) =>
      unit.chapters.some((chapter) => chapter.id === currentChapter.id),
    )

    if (currentUnitIndex === -1) return false

    const currentUnit = course.courseUnits[currentUnitIndex]
    const chapterIndex = currentUnit.chapters.findIndex((chapter) => chapter.id === currentChapter.id)

    return chapterIndex === currentUnit.chapters.length - 1
  }, [currentChapter, course.courseUnits])

  // Check if the current chapter is already completed
  const isCurrentChapterCompleted = useCallback(() => {
    if (!currentChapter || !progress || !progress.completedChapters) return false
    return progress.completedChapters.includes(+currentChapter.id)
  }, [currentChapter, progress])

  // 2. Define handleNextVideo with proper error handling
  const handleNextVideo = useCallback(() => {
    try {
      if (nextVideoId) {
        dispatch(setCurrentVideoApi(nextVideoId))
        // Add a small delay before calling onVideoSelect to avoid race conditions
        setTimeout(() => {
          if (typeof onVideoSelect === "function") {
            onVideoSelect(nextVideoId)
          }
        }, 10)

        toast({ title: "Next Video", description: "Playing the next video." })
      } else if (isLastVideo) {
        dispatch(setCourseCompletionStatus(true))
      }
    } catch (error) {
      console.error("[MainContent] Error in handleNextVideo:", error)
      toast({
        title: "Error",
        description: "Failed to play next video. Please try again.",
        variant: "destructive",
      })
    }
  }, [nextVideoId, isLastVideo, dispatch, onVideoSelect, toast])

  // 3. Cancel autoplay overlay
  const handleCancelAutoplay = useCallback(() => {
    setAutoplayOverlay(false)
    setAutoplayCountdown(5)
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current)
    }
  }, [])

  // Handle playlist video selection with error handling
  const handlePlaylistVideoSelect = useCallback(
    (videoId: string) => {
      try {
        console.debug("[MainContent] Playlist video selected:", videoId)
        // First update redux state
        dispatch(setCurrentVideoApi(videoId))

        // Then enable autoplay if needed
        dispatch(setAutoplayEnabled(true))

        // Finally call the parent handler after a small delay
        setTimeout(() => {
          if (typeof onVideoSelect === "function") {
            onVideoSelect(videoId)
          }
        }, 10)
      } catch (error) {
        console.error("[MainContent] Error in handlePlaylistVideoSelect:", error)
        toast({
          title: "Error",
          description: "Failed to select video. Please try again.",
          variant: "destructive",
        })
      }
    },
    [dispatch, onVideoSelect, toast],
  )
  // 4. Define handleCreateQuiz
  const handleCreateQuiz = useCallback(() => {
    // Navigate to quiz creation page with context
    if (currentChapter) {
      router.push(
        `/dashboard/create/quiz?topic=${encodeURIComponent(currentChapter.title || "")}&videoId=${currentVideoId || ""}&chapterId=${currentChapter.id || ""}`,
      )
    }
  }, [router, currentChapter, currentVideoId])

  // 5. Then define handleVideoEnd which uses handleNextVideo
  const handleVideoEnd = useCallback(() => {
    setChapterCompleted(true) // Mark the chapter as completed

    // Only show quiz prompt when the chapter is completed
    if (isLastVideo || isLastChapterInUnit()) {
      setShowQuizPrompt(true)
    }

    // Handle autoplay logic
    if (nextVideoId && autoplayEnabled) {
      try {
        setAutoplayOverlay(true)
        setAutoplayCountdown(5)

        if (autoplayTimeoutRef.current) {
          clearTimeout(autoplayTimeoutRef.current)
        }

        let count = 5
        const tick = () => {
          setAutoplayCountdown((prev) => {
            if (prev <= 1) {
              // Handle next video action
              handleNextVideo()
              setAutoplayOverlay(false)
              return 5
            }
            return prev - 1
          })
          count--
          if (count > 0) {
            autoplayTimeoutRef.current = setTimeout(tick, 1000)
          }
        }

        autoplayTimeoutRef.current = setTimeout(tick, 1000)
      } catch (error) {
        console.error("[MainContent] Error in autoplay handling:", error)
        // Fallback behavior if autoplay fails
        setAutoplayOverlay(false)
      }
    } else if (isLastVideo) {
      setShowCompletionOverlay(true)
    }

    // Always call parent handler
    if (typeof onVideoEnd === "function") {
      onVideoEnd()
    }
  }, [nextVideoId, autoplayEnabled, isLastVideo, onVideoEnd, handleNextVideo, isLastChapterInUnit])

  // Fix: Reset chapterCompleted state when video is changed
  useEffect(() => {
    setChapterCompleted(false)
    setShowQuizPrompt(false)

    // Check if current chapter is already completed to show quiz prompt
    if (isCurrentChapterCompleted()) {
      setChapterCompleted(true)

      if (isLastVideo || isLastChapterInUnit()) {
        setShowQuizPrompt(true)
      }
    }
  }, [currentChapter?.id, isCurrentChapterCompleted, isLastVideo, isLastChapterInUnit])

  // Set initial video only once on mount or when dependencies change
  useEffect(() => {
    if (
      !didSetInitialVideo.current &&
      !currentVideoId &&
      (initialVideoId || (course?.courseUnits && course.courseUnits.length > 0))
    ) {
      if (initialVideoId) {
        dispatch(setCurrentVideoApi(initialVideoId))
      } else {
        const firstVideoId = course?.courseUnits
          ?.flatMap((unit) => unit.chapters)
          .find((chapter) => !!chapter.videoId)?.videoId

        if (firstVideoId) {
          dispatch(setCurrentVideoApi(firstVideoId))
        }
      }
      didSetInitialVideo.current = true
    }
  }, [currentVideoId, initialVideoId, dispatch, course.courseUnits])

  // Debug: log autoplay state
  useEffect(() => {
    console.debug("[MainContent] autoplayEnabled:", autoplayEnabled)
  }, [autoplayEnabled])

  // Fix the renderTabContent function to ensure it never returns undefined
  const renderTabContent = () => {
    switch (activeTab) {
      case "notes":
        return planId === "PRO" || planId === "ULTIMATE" ? (
          <Suspense
            fallback={
              <div className="space-y-4 p-4">
                <Skeleton className="h-8 w-1/3 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-2" />
                <Skeleton className="h-4 w-4/6 mb-6" />
                <Skeleton className="h-32 w-full rounded-md" />
              </div>
            }
          >
            <CourseAISummary
              chapterId={currentChapter?.id?.toString() || ""}
              name={currentChapter?.title || ""}
              existingSummary={currentChapter?.summary || ""}
              isPremium={planId === "PRO" || planId === "ULTIMATE"}
              isAdmin={session?.user?.isAdmin ?? false}
            />
          </Suspense>
        ) : (
          <div className="text-center text-muted-foreground">Upgrade to access AI summaries.</div>
        )
      case "quiz":
        return planId === "PRO" || planId === "ULTIMATE" ? (
          <Suspense
            fallback={
              <div className="space-y-4 p-4">
                <Skeleton className="h-8 w-1/3 mb-4" />
                <Skeleton className="h-12 w-full mb-3" />
                <Skeleton className="h-12 w-full mb-3" />
                <Skeleton className="h-12 w-full mb-3" />
                <Skeleton className="h-12 w-full" />
              </div>
            }
          >
            <CourseDetailsQuiz
              isPremium={planId === "PRO" || planId === "ULTIMATE"}
              isPublicCourse={course?.isPublic || false}
              chapter={currentChapter || {}}
              course={course || {}}
            />
          </Suspense>
        ) : (
          <div className="text-center text-muted-foreground">Upgrade to access quizzes.</div>
        )
      default:
        return (
          <div className="flex items-center justify-center w-full aspect-video bg-background rounded-lg">
            <Loader2 className="h-10 w-10 mb-4 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading video...</p>
          </div>
        )
    }
  }

  // Autoplay toggle UI (ShadCN Switch + Button)
  const AutoplayToggle = (
    <div className="flex items-center gap-3">
      <Switch
        checked={autoplayEnabled}
        onCheckedChange={(checked) => dispatch(setAutoplayEnabled(checked))}
        id="autoplay-switch"
      />
      <label htmlFor="autoplay-switch" className="flex items-center gap-2 cursor-pointer select-none text-sm">
        {autoplayEnabled ? (
          <PlayCircle className="h-5 w-5 text-primary" />
        ) : (
          <PauseCircle className="h-5 w-5 text-muted-foreground" />
        )}
        Autoplay {autoplayEnabled ? "On" : "Off"}
      </label>
    </div>
  )

  // Related Courses Section (ShadCN Card grid)
  const RelatedCoursesSection =
    relatedCourses && relatedCourses.length > 0 ? (
      <div className="mt-8">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Related Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {relatedCourses.map((course) => (
                <a
                  key={course.id}
                  href={`/dashboard/course/${course.slug}`}
                  className="block group"
                  tabIndex={0}
                  aria-label={`Go to course ${course.title}`}
                >
                  <Card className="transition-all hover:shadow-lg hover:border-primary/60 group-hover:scale-105">
                    <CardContent className="p-4">
                      <div className="font-medium mb-1 truncate">{course.title}</div>
                      <div className="text-sm text-muted-foreground">{course.category?.name || "Uncategorized"}</div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    ) : null

  // Show course completion overlay/modal when last video ends
  const showCourseComplete = isLastVideo && showCompletionOverlay && courseCompleted

  return (
    <div className="space-y-6 relative">
      {/* Quiz Creation Floating Button - Only show after video completion */}
      {chapterCompleted && showQuizPrompt && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                className="fixed right-6 bottom-24 sm:bottom-10 z-40 bg-primary text-primary-foreground shadow-lg rounded-full p-3 flex items-center gap-2"
                onClick={handleCreateQuiz}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 15,
                  delay: 0.2,
                }}
              >
                <PlusCircle className="h-5 w-5" />
                <span className="hidden sm:inline">Create Quiz</span>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={10}>
              <p>Create a custom quiz based on this chapter</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Autoplay Overlay */}
      <AnimatePresence>
        {autoplayOverlay && (
          <AutoplayOverlay
            countdown={autoplayCountdown}
            onCancel={handleCancelAutoplay}
            onNextVideo={handleNextVideo}
            nextVideoTitle={
              nextVideoId
                ? course.courseUnits
                    ?.flatMap((unit) => unit.chapters)
                    .find((chapter) => chapter.videoId === nextVideoId)?.title
                : undefined
            }
          />
        )}
      </AnimatePresence>

      {/* Video Player - Fix the props we pass to ensure no undefined/invalid objects */}
      <div className="relative rounded-lg overflow-hidden border border-border shadow-md">
        {currentVideoId ? (
          <EnhancedVideoPlayer
            videoId={currentVideoId}
            onEnded={handleVideoEnd}
            autoPlay={autoPlay || autoplayEnabled}
            onProgress={onTimeUpdate}
            initialTime={currentTime}
            isLastVideo={isLastVideo}
            onVideoSelect={handlePlaylistVideoSelect}
            courseName={course?.title || ""}
            nextVideoId={nextVideoId}
            bookmarks={bookmarks || []}
            isAuthenticated={!!isAuthenticated}
            onChapterComplete={
              onChapterComplete ||
              (() => {
                if (currentChapter) {
                  dispatch(markChapterAsCompleted(currentChapter.id))
                  setChapterCompleted(true)
                }
              })
            }
            playerConfig={{
              showRelatedVideos: false,
              rememberPosition: true,
              rememberMute: true,
              showCertificateButton: !!isLastVideo,
              enableKeyboardShortcuts: true, // Add this line
              enableTheaterMode: true, // Add this line
              enablePictureInPicture: true, // Add this line
              enableSubtitles: true, // Add this line
            }}
          />
        ) : (
          <div className="flex items-center justify-center w-full aspect-video bg-background rounded-lg">
            <Loader2 className="h-10 w-10 mb-4 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading video...</p>
          </div>
        )}
      </div>

      <div className="mt-2 text-xs text-muted-foreground flex items-center justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => {
            toast({
              title: "Keyboard Shortcuts",
              description: (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>Space/K: Play/Pause</div>
                  <div>J: Rewind 10s</div>
                  <div>L: Forward 10s</div>
                  <div>F: Fullscreen</div>
                  <div>M: Mute/Unmute</div>
                  <div>↑: Volume Up</div>
                  <div>↓: Volume Down</div>
                </div>
              ),
              duration: 5000,
            })
          }}
        >
          Keyboard Shortcuts
        </Button>
      </div>

      {/* Autoplay Toggle */}
      <div className="flex items-center justify-between mt-4">{AutoplayToggle}</div>

      {/* Tabs for Notes and Quiz */}
      <Tabs defaultValue="notes" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6 bg-background border border-border/30 rounded-lg p-1">
          <TabsTrigger
            value="notes"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
          >
            AI Summary
          </TabsTrigger>
          <TabsTrigger
            value="quiz"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
          >
            Quiz
          </TabsTrigger>
        </TabsList>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent
              value="notes"
              className="space-y-4 bg-background rounded-lg p-4 border border-border/30 shadow-sm"
            >
              {renderTabContent()}
            </TabsContent>
            <TabsContent value="quiz" className="bg-background rounded-lg p-4 border border-border/30 shadow-sm">
              {renderTabContent()}
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>

      {/* Course Completion Overlay/Modal */}
      <AnimatePresence>
        {showCourseComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <Card className="w-full max-w-lg mx-auto shadow-2xl relative">
              <CardHeader className="flex flex-col items-center">
                <Award className="h-16 w-16 text-primary mb-4 animate-bounce" />
                <CardTitle className="text-3xl font-bold text-center mb-2">Course Completed!</CardTitle>
                <div className="text-muted-foreground text-center mb-2">
                  Congratulations on finishing <span className="font-semibold text-foreground">{course?.title}</span>!
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <CertificateGenerator courseName={course?.title || "Course"} />
                </div>
                {RelatedCoursesSection}
                <Button
                  variant="secondary"
                  className="w-full mt-6"
                  onClick={() => {
                    setShowCompletionOverlay(false)
                    onWatchAnotherCourse()
                  }}
                >
                  Explore More Courses
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Related Courses Section (for non-final video view) */}
      {!showCourseComplete && RelatedCoursesSection}

      {showCompletionOverlay && (
        <CourseCompletionOverlay
          courseName={course?.title || ""}
          onClose={() => setShowCompletionOverlay(false)}
          onWatchAnotherCourse={onWatchAnotherCourse}
          fetchRelatedCourses={async () => relatedCourses}
        />
      )}
    </div>
  )
}

// Use React.memo for performance optimization
const MemoizedMainContent = React.memo(MainContent)
MemoizedMainContent.displayName = "MainContent" // Add displayName for better debugging
export default MemoizedMainContent
