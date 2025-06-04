"use client"

import { useState, useEffect, useCallback, Suspense, useRef } from "react"
import EnhancedVideoPlayer from "./EnhancedVideoPlayer"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, PlayCircle, Clock } from "lucide-react"
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
import { cn } from "@/lib/utils"
import { FullCourseType, FullChapterType, CourseProgress } from "@/app/types/types"

interface MainContentProps {
  slug: string;
  initialVideoId?: string;
  nextVideoId?: string;
  prevVideoId?: string;
  onVideoEnd: () => void;
  onVideoSelect: (videoId: string) => void;
  currentChapter?: FullChapterType;
  currentTime?: number;
  onWatchAnotherCourse: () => void;
  onTimeUpdate?: (time: number) => void;
  planId?: string;
  isLastVideo?: boolean;
  autoPlay?: boolean;
  progress?: CourseProgress;
  onChapterComplete?: () => void;
  courseCompleted?: boolean;
  course: FullCourseType;
}

export default function MainContent({
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
}: MainContentProps) {
  const [activeTab, setActiveTab] = useState("notes")
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false)
  const [nextVideoCountdown, setNextVideoCountdown] = useState<number | null>(null)
  const dispatch = useAppDispatch()
  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)
  const autoplayEnabled = useAppSelector((state) => state.course.autoplayEnabled)
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const isAuthenticated = status === "authenticated"
  const bookmarks = useAppSelector((state) => state.course.bookmarks[currentVideoId || ''] || [])
  const didSetInitialVideo = useRef(false)

  // Effect to show completion overlay when courseCompleted changes
  useEffect(() => {
    if (courseCompleted) {
      setShowCompletionOverlay(true);
    }
  }, [courseCompleted]);

  // Set initial video only once on mount or when dependencies change
  useEffect(() => {
    if (
      !didSetInitialVideo.current &&
      !currentVideoId &&
      (initialVideoId || (course?.courseUnits && course.courseUnits.length > 0))
    ) {
      if (initialVideoId) {
        dispatch(setCurrentVideoApi(initialVideoId));
      } else {
        const firstVideoId = course?.courseUnits?.flatMap((unit) =>
          unit.chapters).find((chapter) => !!chapter.videoId)?.videoId;

        if (firstVideoId) {
          dispatch(setCurrentVideoApi(firstVideoId));
        }
      }
      didSetInitialVideo.current = true;
    }
  }, [currentVideoId, initialVideoId, dispatch, course.courseUnits]);

  // Debug: log autoplay state
  useEffect(() => {
    console.debug("[MainContent] autoplayEnabled:", autoplayEnabled);
  }, [autoplayEnabled]);

  const handleNextVideo = useCallback(() => {
    if (nextVideoId) {
      dispatch(setCurrentVideoApi(nextVideoId))
      onVideoSelect(nextVideoId)
      toast({ title: "Next Video", description: "Playing the next video." })
    } else if (isLastVideo) {
      dispatch(setCourseCompletionStatus(true))
    }
  }, [nextVideoId, isLastVideo, dispatch, onVideoSelect, toast])

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

  // Handle playlist video selection
  const handlePlaylistVideoSelect = useCallback(
    (videoId: string) => {
      // Debug: log playlist video selection
      console.debug("[MainContent] Playlist video selected:", videoId);
      
      dispatch(setCurrentVideoApi(videoId));
      dispatch(setAutoplayEnabled(true));
      
      // Call parent handler if available
      if (typeof onVideoSelect === "function") {
        onVideoSelect(videoId);
      }
    },
    [dispatch, onVideoSelect]
  )

  return (
    <div className="space-y-6">
      {/* Video Player */}
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
            bookmarks={bookmarks}
            isAuthenticated={isAuthenticated}
            onChapterComplete={onChapterComplete || (() => currentChapter && dispatch(markChapterAsCompleted(currentChapter.id)))}
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
      
      {/* Autoplay Controls */}
      {nextVideoCountdown !== null && (
        <div className="text-center text-sm text-muted-foreground">
          <Clock className="inline-block h-4 w-4 mr-1" />
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
        <span className={cn("text-sm flex items-center", autoplayEnabled ? "text-primary" : "text-muted-foreground")}>
          <PlayCircle className={cn("inline-block h-4 w-4 mr-1", autoplayEnabled ? "text-primary" : "text-muted-foreground")} />
          Autoplay is {autoplayEnabled ? "On" : "Off"}
        </span>
        <Button
          variant={autoplayEnabled ? "primary" : "outline"}
          size="sm"
          className="transition-all"
          onClick={() => dispatch(setAutoplayEnabled(!autoplayEnabled))}
        >
          {autoplayEnabled ? "Disable Autoplay" : "Enable Autoplay"}
        </Button>
      </div>

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

      {showCompletionOverlay && (
        <CourseCompletionOverlay
          courseName={course?.title || ""}
          onClose={() => setShowCompletionOverlay(false)}
          onWatchAnotherCourse={onWatchAnotherCourse}
        />
      )}
    </div>
  )
}
