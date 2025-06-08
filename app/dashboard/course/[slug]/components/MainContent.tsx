"use client"

import type React from "react"
import { useState, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Play, Menu, X, ChevronLeft, ChevronRight, Clock, Award, Lock, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import VideoPlayer from "./video/components/VideoPlayer"
import VideoNavigationSidebar from "./video/components/VideoNavigationSidebar"
import AnimatedCourseAILogo from "./video/components/AnimatedCourseAILogo"
import AutoplayOverlay from "./AutoplayOverlay"

import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setCurrentVideoApi, markChapterAsCompleted } from "@/store/slices/courseSlice"
import { useAuth } from "@/hooks"
import useProgress from "@/hooks/useProgress"
import type { FullCourseType, FullChapterType } from "@/app/types/types"
import CourseDetailsTabs from "./CourseDetailsTabs"

interface ModernCoursePageProps {
  course: FullCourseType
  initialChapterId?: string
}

export const MainContent: React.FC<ModernCoursePageProps> = ({ course, initialChapterId }) => {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const { user } = useAuth()

  // Local state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [videoEnding, setVideoEnding] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)
  const [resumePromptShown, setResumePromptShown] = useState(false)
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>({})
  const [isVideoLoading, setIsVideoLoading] = useState(true)
  const [hasPlayedFreeVideo, setHasPlayedFreeVideo] = useState(false)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [autoplayCountdown, setAutoplayCountdown] = useState(0)
  const [showAutoplayOverlay, setShowAutoplayOverlay] = useState(false)
  const [showLogoOverlay, setShowLogoOverlay] = useState(false)

  // Redux state
  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)
  const courseProgress = useAppSelector((state) => state.course.courseProgress[course.id])

  // Check free video status on mount
  useEffect(() => {
    const freeVideoPlayed = localStorage.getItem("hasPlayedFreeVideo")
    setHasPlayedFreeVideo(freeVideoPlayed === "true")
  }, [])

  // Memoized video playlist
  const videoPlaylist = useMemo(() => {
    const playlist: { videoId: string; chapter: FullChapterType }[] = []
    course.courseUnits?.forEach((unit) => {
      unit.chapters
        .filter((chapter): chapter is FullChapterType => Boolean(chapter.videoId))
        .forEach((chapter) => {
          if (chapter.videoId) {
            playlist.push({ videoId: chapter.videoId, chapter })
          }
        })
    })
    return playlist
  }, [course.courseUnits])

  // Current chapter and navigation
  const currentChapter = useMemo(() => {
    if (!currentVideoId) return undefined
    return videoPlaylist.find((entry) => entry.videoId === currentVideoId)?.chapter
  }, [currentVideoId, videoPlaylist])

  const currentIndex = useMemo(() => {
    return videoPlaylist.findIndex((entry) => entry.videoId === currentVideoId)
  }, [currentVideoId, videoPlaylist])

  const nextChapter = useMemo(() => {
    return currentIndex < videoPlaylist.length - 1 ? videoPlaylist[currentIndex + 1] : null
  }, [currentIndex, videoPlaylist])

  const prevChapter = useMemo(() => {
    return currentIndex > 0 ? videoPlaylist[currentIndex - 1] : null
  }, [currentIndex, videoPlaylist])

  const isLastVideo = useMemo(() => {
    return currentIndex === videoPlaylist.length - 1
  }, [currentIndex, videoPlaylist])

  // Progress tracking
  const { progress, updateProgress } = useProgress({
    courseId: Number(course.id),
    currentChapterId: currentChapter?.id?.toString(),
  })

  // Check if user can play video
  const canPlayVideo = useMemo(() => {
    return !!session || !hasPlayedFreeVideo
  }, [session, hasPlayedFreeVideo])

  // Initialize video on mount
  useEffect(() => {
    const initialVideo = initialChapterId
      ? videoPlaylist.find((entry) => entry.chapter.id.toString() === initialChapterId)
      : videoPlaylist[0]

    if (initialVideo && !currentVideoId) {
      dispatch(setCurrentVideoApi(initialVideo.videoId))
    }
  }, [dispatch, initialChapterId, videoPlaylist, currentVideoId])

  // Resume prompt
  useEffect(() => {
    if (progress && !resumePromptShown && progress.currentChapterId && !currentVideoId && session) {
      const resumeChapter = videoPlaylist.find(
        (entry) => entry.chapter.id.toString() === progress.currentChapterId?.toString(),
      )

      if (resumeChapter) {
        setResumePromptShown(true)
        toast({
          title: "Resume Learning",
          description: `Continue from "${resumeChapter.chapter.title}"?`,
          action: (
            <Button
              size="sm"
              onClick={() => {
                dispatch(setCurrentVideoApi(resumeChapter.videoId))
              }}
            >
              Resume
            </Button>
          ),
        })
      }
    }
  }, [progress, resumePromptShown, currentVideoId, videoPlaylist, dispatch, toast, session])

  // Handle video load to get duration from YouTube API
  const handleVideoLoad = useCallback(
    (metadata: { duration: number; title: string }) => {
      setIsVideoLoading(false)
      if (currentVideoId && metadata.duration) {
        setVideoDurations((prev) => ({
          ...prev,
          [currentVideoId]: metadata.duration,
        }))
      }
    },
    [currentVideoId],
  )

  // Autoplay countdown logic
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (showAutoplayOverlay && autoplayCountdown > 0) {
      interval = setInterval(() => {
        setAutoplayCountdown((prev) => {
          if (prev <= 1) {
            setShowAutoplayOverlay(false)
            handleNextVideo()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [showAutoplayOverlay, autoplayCountdown])

  // Video event handlers
  const handleVideoEnd = useCallback(() => {
    if (currentChapter) {
      // Mark chapter as completed
      dispatch(markChapterAsCompleted({ courseId: Number(course.id), chapterId: Number(currentChapter.id) }))

      // Update progress
      updateProgress({
        currentChapterId: Number(currentChapter.id),
        completedChapters: [...(progress?.completedChapters || []), Number(currentChapter.id)],
        isCompleted: isLastVideo,
        lastAccessedAt: new Date(),
      })

      // Mark free video as played if not authenticated
      if (!session && !hasPlayedFreeVideo) {
        localStorage.setItem("hasPlayedFreeVideo", "true")
        setHasPlayedFreeVideo(true)
      }

      if (isLastVideo) {
        setShowCertificate(true)
      } else if (nextChapter) {
        // Show autoplay overlay for next video
        setAutoplayCountdown(5)
        setShowAutoplayOverlay(true)
      }
    }
  }, [
    currentChapter,
    dispatch,
    course.id,
    updateProgress,
    progress,
    isLastVideo,
    nextChapter,
    session,
    hasPlayedFreeVideo,
  ])

  const handleVideoProgress = useCallback(
    (progressState: { played: number; playedSeconds: number }) => {
      // Show logo animation when video is about to end (last 10-15 seconds)
      if (progressState.playedSeconds > 0 && currentChapter) {
        const videoDuration = videoDurations[currentVideoId] || 300
        const timeRemaining = videoDuration - progressState.playedSeconds

        // Show CourseAI logo overlay in last 10 seconds
        if (timeRemaining <= 10 && timeRemaining > 0 && !videoEnding) {
          setVideoEnding(true)
          setShowLogoOverlay(true)
        }

        // Reset for next video
        if (timeRemaining > 10 && videoEnding) {
          setVideoEnding(false)
          setShowLogoOverlay(false)
        }
      }

      // Update progress periodically
      if (currentChapter && progressState.played > 0.1) {
        updateProgress({
          currentChapterId: Number(currentChapter.id),
          progress: progressState.played,
          lastAccessedAt: new Date(),
        })
      }
    },
    [currentChapter, videoEnding, updateProgress, videoDurations, currentVideoId],
  )

  const handleChapterSelect = useCallback(
    (chapter: FullChapterType) => {
      // Check if user can play this video
      if (!canPlayVideo) {
        setShowAuthPrompt(true)
        return
      }

      if (chapter.videoId) {
        dispatch(setCurrentVideoApi(chapter.videoId))
        setSidebarOpen(false)
        setVideoEnding(false)
        setShowLogoOverlay(false)
        setIsVideoLoading(true)
      }
    },
    [dispatch, canPlayVideo],
  )

  const handleNextVideo = useCallback(() => {
    if (!canPlayVideo) {
      setShowAuthPrompt(true)
      return
    }

    if (nextChapter) {
      dispatch(setCurrentVideoApi(nextChapter.videoId))
      setVideoEnding(false)
      setShowLogoOverlay(false)
      setShowAutoplayOverlay(false)
      setIsVideoLoading(true)
    }
  }, [nextChapter, dispatch, canPlayVideo])

  const handlePrevVideo = useCallback(() => {
    if (prevChapter) {
      dispatch(setCurrentVideoApi(prevChapter.videoId))
      setVideoEnding(false)
      setShowLogoOverlay(false)
      setIsVideoLoading(true)
    }
  }, [prevChapter, dispatch])

  // Cancel autoplay
  const handleCancelAutoplay = useCallback(() => {
    setShowAutoplayOverlay(false)
    setAutoplayCountdown(0)
  }, [])

  // Certificate handler
  const handleCertificateClick = useCallback(() => {
    router.push(`/certificate/${course.id}`)
  }, [router, course.id])

  // Course stats
  const courseStats = useMemo(() => {
    const totalChapters = videoPlaylist.length
    const completedChapters = progress?.completedChapters?.length || 0
    const progressPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0

    return {
      totalChapters,
      completedChapters,
      progressPercentage,
    }
  }, [videoPlaylist.length, progress?.completedChapters])

  // Format duration helper
  const formatDuration = useCallback(
    (videoId: string) => {
      const duration = videoDurations[videoId]
      if (!duration) return "Loading..."

      const minutes = Math.floor(duration / 60)
      const seconds = Math.floor(duration % 60)
      return `${minutes}:${seconds.toString().padStart(2, "0")}`
    },
    [videoDurations],
  )

  // Authentication prompt overlay
  if (showAuthPrompt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sign in to continue watching</h3>
            <p className="text-muted-foreground mb-6">
              You've used your free video preview. Sign in to access all course content and features.
            </p>
            <div className="space-y-3">
              <Button onClick={() => (window.location.href = "/api/auth/signin")} className="w-full" size="lg">
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <Button variant="outline" onClick={() => setShowAuthPrompt(false)} className="w-full">
                Back to Course
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden border-b bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="text-left line-clamp-2">{course.title}</SheetTitle>
              </SheetHeader>
              <VideoNavigationSidebar
                course={course}
                currentChapter={currentChapter}
                onChapterSelect={handleChapterSelect}
                progress={progress}
                isAuthenticated={!!session}
                videoDurations={videoDurations}
                formatDuration={formatDuration}
                courseStats={courseStats}
              />
            </SheetContent>
          </Sheet>

          <div className="flex-1 mx-4">
            <h1 className="font-semibold text-lg line-clamp-1">{course.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{courseStats.progressPercentage}% Complete</Badge>
              <span className="text-sm text-muted-foreground">
                {courseStats.completedChapters}/{courseStats.totalChapters} chapters
              </span>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-6xl mx-auto p-4 lg:p-6">
            {/* Video player section */}
            <div className="space-y-6">
              {/* Video player */}
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {currentVideoId ? (
                  <>
                    <VideoPlayer
                      videoId={currentVideoId}
                      onEnded={handleVideoEnd}
                      onProgress={handleVideoProgress}
                      onVideoLoad={handleVideoLoad}
                      autoPlay={false}
                      isAuthenticated={!!session}
                      onChapterComplete={() => {}}
                      onNextVideo={canPlayVideo ? handleNextVideo : undefined}
                      nextVideoTitle={nextChapter?.chapter.title}
                      courseName={course.title}
                      showControls={true}
                      rememberPlaybackPosition={true}
                      rememberPlaybackSettings={true}
                      height="100%"
                      width="100%"
                      className="w-full h-full"
                    />

                    {/* CourseAI Logo Overlay */}
                    <AnimatedCourseAILogo
                      show={showLogoOverlay}
                      videoEnding={videoEnding}
                      onAnimationComplete={() => setShowLogoOverlay(false)}
                    />

                    {/* Autoplay Overlay */}
                    {showAutoplayOverlay && nextChapter && (
                      <AutoplayOverlay
                        countdown={autoplayCountdown}
                        onCancel={handleCancelAutoplay}
                        onNextVideo={handleNextVideo}
                        nextVideoTitle={nextChapter.chapter.title}
                      />
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-white">
                      <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-medium mb-2">Select a Chapter</h3>
                      <p className="text-white/70">Choose a chapter from the playlist to start learning</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Chapter navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevVideo}
                  disabled={!prevChapter}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="text-center">
                  {currentChapter && (
                    <div>
                      <h2 className="text-xl font-semibold mb-1">{currentChapter.title}</h2>
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{isVideoLoading ? "Loading..." : formatDuration(currentVideoId)}</span>
                        {currentChapter.isFree && <Badge variant="secondary">Free</Badge>}
                        {!session && !hasPlayedFreeVideo && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Preview
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={handleNextVideo}
                  disabled={!nextChapter}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Course tabs */}
              <CourseDetailsTabs
                course={course}
                currentChapter={currentChapter}
                isAuthenticated={!!session}
                isPremium={user?.subscription?.planId === "premium"}
                isAdmin={user?.isAdmin}
              />
            </div>
          </div>
        </main>

        {/* Desktop sidebar - Using VideoNavigationSidebar */}
        <aside className="hidden lg:block w-96 border-l bg-background/50 backdrop-blur-sm">
          <VideoNavigationSidebar
            course={course}
            currentChapter={currentChapter}
            onChapterSelect={handleChapterSelect}
            progress={progress}
            isAuthenticated={!!session}
            videoDurations={videoDurations}
            formatDuration={formatDuration}
            courseStats={courseStats}
          />
        </aside>
      </div>

      {/* Certificate modal */}
      <AnimatePresence>
        {showCertificate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-background rounded-lg p-8 max-w-md w-full text-center"
            >
              <div className="mb-6">
                <Award className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
                <p className="text-muted-foreground">
                  You've successfully completed "{course.title}". Your certificate is ready!
                </p>
              </div>
              <div className="space-y-3">
                <Button onClick={handleCertificateClick} className="w-full">
                  <Award className="h-4 w-4 mr-2" />
                  View Certificate
                </Button>
                <Button variant="outline" onClick={() => setShowCertificate(false)} className="w-full">
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MainContent
