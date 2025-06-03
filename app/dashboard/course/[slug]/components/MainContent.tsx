"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import EnhancedVideoPlayer from "./EnhancedVideoPlayer"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, CheckCircle, Bookmark, Loader2, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import CourseDetailsQuiz from "./CourseDetailsQuiz"
import CourseAISummary from "./CourseAISummary"
import CourseCompletionOverlay from "./CourseCompletionOverlay"
import type { FullCourseType, FullChapterType } from "@/app/types/types"
import { markdownToHtml } from "./markdownUtils"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import FloatingCourseActions from "./FloatingCourseActions"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  fetchCourseDataApi,
  setCurrentChapterApi,
  setCurrentVideoApi,
  markChapterAsCompleted,
  addBookmark,
  setCourseCompletionStatus,
} from "@/store/slices/courseSlice"

interface MainContentProps {
  slug: string
  initialVideoId?: string
  nextVideoId?: string
  prevVideoId?: string
  onVideoEnd: () => void
  onVideoSelect: (videoId: string) => void
  currentTime?: number
  onWatchAnotherCourse: () => void
  onTimeUpdate?: (time: number) => void
  planId?: string
  isLastVideo?: boolean
}

export default function MainContent({
  slug,
  initialVideoId,
  nextVideoId,
  prevVideoId,
  onVideoEnd,
  onVideoSelect,
  currentTime = 0,
  onWatchAnotherCourse,
  onTimeUpdate,
  planId = "FREE",
  isLastVideo = false,
}: MainContentProps) {
  const [activeTab, setActiveTab] = useState("notes")
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false)
  const [htmlContent, setHtmlContent] = useState("")
  const [autoplayEnabled, setAutoplayEnabled] = useState(true)
  const [nextVideoCountdown, setNextVideoCountdown] = useState<number | null>(null)
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const isAuthenticated = status === "authenticated"
  const dispatch = useAppDispatch()
  const courseState = useAppSelector((state) => state.course)
  const currentChapter = courseState.currentCourse?.courseUnits
    ?.flatMap((unit) => unit.chapters)
    ?.find((chapter) => chapter.id === courseState.currentChapterId)

  useEffect(() => {
    dispatch(fetchCourseDataApi(slug))
  }, [slug, dispatch])

  useEffect(() => {
    if (currentChapter?.description) {
      const processMarkdown = async () => {
        const html = await markdownToHtml(currentChapter.description || "")
        setHtmlContent(html)
      }
      processMarkdown()
    }
  }, [currentChapter])

  useEffect(() => {
    if (courseState.courseCompletionStatus) {
      setShowCompletionOverlay(true)
    }
  }, [courseState.courseCompletionStatus])

  const handleNextVideo = useCallback(() => {
    if (nextVideoId) {
      dispatch(setCurrentVideoApi(nextVideoId))
      onVideoSelect(nextVideoId)
    } else if (isLastVideo) {
      dispatch(setCourseCompletionStatus(true))
    }
  }, [nextVideoId, isLastVideo, dispatch, onVideoSelect])

  const handleVideoEnd = useCallback(() => {
    if (nextVideoId) {
      setNextVideoCountdown(5) // Start countdown for next video
      const countdownInterval = setInterval(() => {
        setNextVideoCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval)
            if (autoplayEnabled) handleNextVideo()
            return null
          }
          return prev - 1
        })
      }, 1000)
    } else if (isLastVideo) {
      dispatch(setCourseCompletionStatus(true))
    }
  }, [nextVideoId, isLastVideo, dispatch, handleNextVideo, autoplayEnabled])

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
              chapterId={currentChapter?.id.toString() || ""}
              name={currentChapter?.title || ""}
              existingSummary={currentChapter?.summary || ""}
              isPremium={planId === "PRO" || planId === "ULTIMATE"}
              isAdmin={session?.user?.isAdmin ?? false}
            />
          </Suspense>
        ) : (
          <UnauthenticatedContentFallback type="summary" onUpgrade={() => router.push("/dashboard/subscription")} />
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
              isPublicCourse={courseState.currentCourse?.isPublic || false}
              chapter={currentChapter || {}}
              course={courseState.currentCourse || {}}
            />
          </Suspense>
        ) : (
          <UnauthenticatedContentFallback type="quiz" onUpgrade={() => router.push("/dashboard/subscription")} />
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

  return (
    <div className="flex flex-col w-full">
      <div className="relative rounded-lg overflow-hidden border border-border">
        {initialVideoId ? (
          <EnhancedVideoPlayer
            videoId={initialVideoId}
            onEnded={handleVideoEnd}
            autoPlay={autoplayEnabled}
            onProgress={onTimeUpdate}
            initialTime={currentTime}
            isLastVideo={isLastVideo}
            onVideoSelect={onVideoSelect}
            courseName={courseState.currentCourse?.title || ""}
            nextVideoId={nextVideoId}
            bookmarks={courseState.bookmarks[initialVideoId] || []}
            isAuthenticated={isAuthenticated}
            onChapterComplete={() => dispatch(markChapterAsCompleted(currentChapter?.id || ""))}
            playerConfig={{
              showRelatedVideos: false,
              rememberPosition: true,
              rememberMute: true,
              showCertificateButton: isLastVideo,
            }}
          />
        ) : (
          <div className="flex items-center justify-center w-full aspect-video bg-background rounded-lg">
            <Loader2 className="h-10 w-10 mb-4 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading video...</p>
          </div>
        )}
      </div>

      {nextVideoCountdown !== null && (
        <div className="text-center text-sm text-muted-foreground mt-4">
          Next video starts in {nextVideoCountdown} seconds...
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={() => {
              setNextVideoCountdown(null)
              handleNextVideo()
            }}
          >
            Skip
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-muted-foreground">Autoplay is {autoplayEnabled ? "On" : "Off"}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAutoplayEnabled((prev) => !prev)}
        >
          Toggle Autoplay
        </Button>
      </div>

      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-2">{currentChapter?.title}</h1>
        <div className="flex items-center text-sm text-muted-foreground mb-6">
          <BookOpen className="mr-2 h-4 w-4" />
          <span>
            Chapter {courseState.courseProgress?.completedChapters.length || 0} of{" "}
            {courseState.currentCourse?.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0) || 0}
          </span>
          {courseState.courseProgress?.completedChapters.includes(currentChapter?.id || "") && (
            <span className="ml-4 flex items-center text-green-600 dark:text-green-400">
              <CheckCircle className="mr-1 h-4 w-4" />
              Completed
            </span>
          )}
        </div>

        <div ref={tabsRef}>
          <Tabs defaultValue="notes" value={activeTab} onValueChange={handleTabChange} className="w-full">
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
                  className="space-y-4 bg-background rounded-lg p-4 border border-border/30"
                >
                  {renderTabContent()}
                </TabsContent>
                <TabsContent value="quiz" className="bg-background rounded-lg p-4 border border-border/30">
                  {renderTabContent()}
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </div>
      </div>

      {showCompletionOverlay && (
        <CourseCompletionOverlay
          courseName={courseState.currentCourse?.title || ""}
          onClose={handleCloseCompletionOverlay}
          onWatchAnotherCourse={onWatchAnotherCourse}
        />
      )}
      <FloatingCourseActions slug={slug}></FloatingCourseActions>
    </div>
  )
}
