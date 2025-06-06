"use client"

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react"
import EnhancedVideoPlayer from "./EnhancedVideoPlayer"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, PlayCircle, BookOpen, MessageSquare, Star, Info } from "lucide-react"
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
import KeyboardShortcutsModal from "./KeyboardShortcutsModal"

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
  isProgressLoading: boolean // Add loading prop
  profileError: string | null // Add profile error prop
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
  isProgressLoading, // Add loading prop
  profileError, // Add profile error prop
}: MainContentProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false)
  const [autoplayOverlay, setAutoplayOverlay] = useState(false)
  const [autoplayCountdown, setAutoplayCountdown] = useState(5)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
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

  const [showQuizPrompt, setShowQuizPrompt] = useState(false)
  const [chapterCompleted, setChapterCompleted] = useState(false)

  // Add keyboard shortcut for showing keyboard shortcuts modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault()
        setShowKeyboardShortcuts(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current)
      }
    }
  }, [])

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

  const isCurrentChapterCompleted = useCallback(() => {
    if (!currentChapter || !progress || !progress.completedChapters) return false
    return progress.completedChapters.includes(+currentChapter.id)
  }, [currentChapter, progress])

  const handleNextVideo = useCallback(() => {
    try {
      if (nextVideoId) {
        dispatch(setCurrentVideoApi(nextVideoId))
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

  const handleCancelAutoplay = useCallback(() => {
    setAutoplayOverlay(false)
    setAutoplayCountdown(5)
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current)
    }
  }, [])

  const handlePlaylistVideoSelect = useCallback(
    (videoId: string) => {
      try {
        dispatch(setCurrentVideoApi(videoId))
        dispatch(setAutoplayEnabled(true))

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

  const handleCreateQuiz = useCallback(() => {
    if (currentChapter) {
      router.push(
        `/dashboard/create/quiz?topic=${encodeURIComponent(currentChapter.title || "")}&videoId=${currentVideoId || ""}&chapterId=${currentChapter.id || ""}`,
      )
    }
  }, [router, currentChapter, currentVideoId])

  const handleVideoEnd = useCallback(() => {
    setChapterCompleted(true)

    if (isLastVideo || isLastChapterInUnit()) {
      setShowQuizPrompt(true)
    }

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
        setAutoplayOverlay(false)
      }
    } else if (isLastVideo) {
      setShowCompletionOverlay(true)
    }

    if (typeof onVideoEnd === "function") {
      onVideoEnd()
    }
  }, [nextVideoId, autoplayEnabled, isLastVideo, onVideoEnd, handleNextVideo, isLastChapterInUnit])

  useEffect(() => {
    setChapterCompleted(false)
    setShowQuizPrompt(false)

    if (isCurrentChapterCompleted()) {
      setChapterCompleted(true)

      if (isLastVideo || isLastChapterInUnit()) {
        setShowQuizPrompt(true)
      }
    }
  }, [currentChapter?.id, isCurrentChapterCompleted, isLastVideo, isLastChapterInUnit])

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

  // Add recovery for stuck loading state
  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (isProgressLoading) {
      timeout = setTimeout(() => {
        console.log("[MainContent] Forcing progress due to timeout")

        if (typeof onChapterComplete === "function" && currentChapter) {
          onChapterComplete()
        }
      }, 8000)
    }

    return () => {
      clearTimeout(timeout)
    }
  }, [isProgressLoading, onChapterComplete, currentChapter])

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">About this lesson</h3>
              <p className="text-muted-foreground leading-relaxed">
                {currentChapter?.description || "No description available for this lesson."}
              </p>
            </div>

            {currentChapter?.objectives && currentChapter.objectives.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Learning objectives</h3>
                <ul className="space-y-2">
                  {currentChapter.objectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      case "notes":
        return planId === "PRO" || planId === "ULTIMATE" ? (
          <Suspense
            fallback={
              <div className="space-y-4">
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
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
            <p className="text-muted-foreground mb-4">Upgrade to access AI-generated notes and summaries.</p>
            <Button onClick={() => router.push("/dashboard/subscription")}>Upgrade Now</Button>
          </div>
        )
      case "quiz":
        return planId === "PRO" || planId === "ULTIMATE" ? (
          <Suspense
            fallback={
              <div className="space-y-4">
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
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
            <p className="text-muted-foreground mb-4">Upgrade to access interactive quizzes.</p>
            <Button onClick={() => router.push("/dashboard/subscription")}>Upgrade Now</Button>
          </div>
        )
      default:
        return (
          <div className="flex items-center justify-center w-full py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading content...</p>
          </div>
        )
    }
  }

  const showCourseComplete = isLastVideo && showCompletionOverlay && courseCompleted

  const videoId = initialVideoId || ""
  const hasVideoId = !!videoId

  const LoadingUI = () => (
    <div className="flex flex-col w-full h-full aspect-video bg-muted animate-pulse">
      <div className="flex-1 flex items-center justify-center">
        <div className="space-y-4 text-center">
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50 mx-auto" />
          </motion.div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Loading your lesson...</p>
            <div className="w-48 h-1 mx-auto bg-muted-foreground/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  repeat: Infinity,
                  duration: 1,
                  ease: "linear",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  function handleAddBookmark(time: number): void {
    throw new Error("Function not implemented.")
  }

  return (
    <div className="flex flex-col w-full">
      {/* Video player takes full width within its container */}
      <div className="w-full">
        {!hasVideoId ? (
          <LoadingUI />
        ) : isProgressLoading || profileError ? (
          <div className="relative">
            <LoadingUI error={profileError || "Loading..."} />
            <div className="absolute inset-0 bg-transparent" />
          </div>
        ) : (
          <EnhancedVideoPlayer
            videoId={videoId}
            onEnded={handleVideoEnd}
            onVideoSelect={handlePlaylistVideoSelect}
            courseName={course.title}
            nextVideoId={nextVideoId}
            onBookmark={handleAddBookmark}
            bookmarks={bookmarks}
            isAuthenticated={isAuthenticated}
            onChapterComplete={onChapterComplete}
            playerConfig={{
              showRelatedVideos: false,
              rememberPosition: true,
              rememberMute: true,
              showCertificateButton: !!isLastVideo,
            }}
            courseCompleted={courseCompleted}
            isMobile={false}
            autoPlay={autoPlay}
          />
        )}
      </div>

      {/* Chapter Title and Info */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{currentChapter?.title || "Loading..."}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {currentChapter?.duration && (
            <span className="flex items-center gap-1">
              <PlayCircle className="h-4 w-4" />
              {Math.floor(currentChapter.duration / 60)}:{(currentChapter.duration % 60).toString().padStart(2, "0")}
            </span>
          )}
          <span className="hidden sm:inline">•</span>
          {course.courseUnits ? (
            <span>
              Lesson{" "}
              {course.courseUnits?.flatMap((unit) => unit.chapters).findIndex((ch) => ch.id === currentChapter?.id) + 1 || 1}{" "}
              of {course.courseUnits?.flatMap((unit) => unit.chapters).length || 0}
            </span>
          ) : (
            <span className="h-4 w-16 bg-muted animate-pulse rounded"></span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => setShowKeyboardShortcuts(true)}
            >
              <Info className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Keyboard shortcuts</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Autoplay Toggle */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg mb-6">
        <div className="flex items-center gap-3">
          <Switch
            checked={autoplayEnabled}
            onCheckedChange={(checked) => dispatch(setAutoplayEnabled(checked))}
            id="autoplay-switch"
          />
          <label htmlFor="autoplay-switch" className="flex items-center gap-2 cursor-pointer select-none text-sm">
            {autoplayEnabled ? (
              <PlayCircle className="h-4 w-4 text-primary" />
            ) : (
              <PauseCircle className="h-4 w-4 text-muted-foreground" />
            )}
            Autoplay {autoplayEnabled ? "On" : "Off"}
          </label>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:block">
          Automatically play the next lesson when this one ends
        </span>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4 bg-muted/30 rounded-lg p-1 w-full">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all flex items-center gap-2"
          >
            <Star className="h-4 w-4" />
            <span>Notes</span>
          </TabsTrigger>
          <TabsTrigger
            value="quiz"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Quiz</span>
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
            <TabsContent value="overview" className="bg-background rounded-lg p-5 border shadow-sm">
              {renderTabContent()}
            </TabsContent>
            <TabsContent value="notes" className="bg-background rounded-lg p-5 border shadow-sm">
              {renderTabContent()}
            </TabsContent>
            <TabsContent value="quiz" className="bg-background rounded-lg p-5 border shadow-sm">
              {renderTabContent()}
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>

      {/* Course Completion Overlay */}
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

      {showCompletionOverlay && (
        <CourseCompletionOverlay
          courseName={course?.title || ""}
          onClose={() => setShowCompletionOverlay(false)}
          onWatchAnotherCourse={onWatchAnotherCourse}
          fetchRelatedCourses={async () => relatedCourses}
        />
      )}

      {/* Keyboard shortcuts modal */}
      {showKeyboardShortcuts && <KeyboardShortcutsModal onClose={() => setShowKeyboardShortcuts(false)} />}
    </div>
  )
}

export default React.memo(MainContent)
