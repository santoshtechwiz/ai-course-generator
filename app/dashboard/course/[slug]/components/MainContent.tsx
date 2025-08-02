"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useProgress, useToast } from "@/hooks" // Fix: Changed from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Play, Lock, User as UserIcon, Award, Badge, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setCurrentVideoApi, markChapterAsCompleted } from "@/store/slices/course-slice"
import type { FullCourseType, FullChapterType } from "@/app/types/types"
import CourseDetailsTabs, { AccessLevels } from "./CourseDetailsTabs"
import { formatDuration } from "../utils/formatUtils"
import VideoPlayer from "./video/components/VideoPlayer"
import VideoNavigationSidebar from "./video/components/VideoNavigationSidebar"
import { migratedStorage } from "@/lib/storage"
import AnimatedCourseAILogo from "./video/components/AnimatedCourseAILogo"
import AutoplayOverlay from "./AutoplayOverlay"
import VideoGenerationSection from "./VideoGenerationSection"

import { useVideoState, getVideoBookmarks } from "./video/hooks/useVideoState"
import { VideoDebug } from "./video/components/VideoDebug"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatePresence, motion } from "framer-motion"
import { User } from "@/modules/auth"
import { useAuth } from "@/modules/auth"
import { isAdmin } from "@/lib/auth"
import CourseActions from "./CourseActions"

interface ModernCoursePageProps {
  course: FullCourseType
  initialChapterId?: string
  theatreMode?: boolean
  isFullscreen?: boolean
  onTheaterModeToggle?: () => void
}

function validateChapter(chapter: any): boolean {
  return Boolean(
    chapter &&
      typeof chapter === "object" &&
      chapter.id && 
      (typeof chapter.id === "string" || typeof chapter.id === "number") // Allow number IDs too
  );
}

const MainContent: React.FC<ModernCoursePageProps> = ({ 
  course, 
  initialChapterId,
  theatreMode = false,
  isFullscreen = false,
  onTheaterModeToggle
}) => {
  // Always define all hooks at the top level - no early returns or conditions before hooks
  console.log(course);
  const router = useRouter()
  // Remove useSession  // const { data: session } = useSession()
  const { toast } = useToast() // Fix: Properly destructure toast from useToast hook
  const dispatch = useAppDispatch()
  // Use new auth system
  const { user, subscription } = useAuth()

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
  const [playerRef, setPlayerRef] = useState<React.RefObject<any> | null>(null)

  // Redux state
  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)
  const courseProgress = useAppSelector((state) => state.course.courseProgress[course.id])

  // Get bookmarks for the current video - this is more reliable than trying to get them from Redux
  const bookmarks = useMemo(() => {
    return getVideoBookmarks(currentVideoId)
  }, [currentVideoId])

  // Fix: Initialize completedChapters safely so it's always defined
  // Use courseProgress.completedChapters if available, otherwise empty array
  const completedChapters = useMemo(() => {
    return courseProgress?.completedChapters || []
  }, [courseProgress])

  // Check free video status on mount
  useEffect(() => {
    const freeVideoPlayed = migratedStorage.getPreference("played_free_video", false)
    setHasPlayedFreeVideo(Boolean(freeVideoPlayed))
  }, [])

  // Memoized video playlist
  const videoPlaylist = useMemo(() => {
    const playlist: { videoId: string; chapter: FullChapterType }[] = []

    if (!course?.courseUnits) {
      return playlist
    }

    course.courseUnits.forEach((unit) => {
      if (!unit.chapters) return

      unit.chapters
        .filter((chapter) => {
          // Enhanced validation to make sure we have valid chapters
          const isValid = Boolean(
            chapter &&
              typeof chapter === "object" &&
              chapter.id &&
              chapter.videoId &&
              typeof chapter.videoId === "string",
          )

          if (!isValid && chapter) {
            // Log invalid chapter in development for debugging
            if (process.env.NODE_ENV !== "production") {
              console.debug(`Skipping invalid chapter:`, {
                id: chapter.id,
                title: chapter.title,
                hasVideoId: !!chapter.videoId,
              })
            }
          }

          return isValid
        })
        .forEach((chapter) => {
          // Ensure description is never null, only string or undefined
          const safeChapter = {
            ...chapter,
            description: chapter.description === null ? undefined : chapter.description,
          }
          playlist.push({ videoId: chapter.videoId!, chapter: safeChapter })
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
  const { progress, updateProgress, isLoading: progressLoading } = useProgress({
    courseId: Number(course.id),
    currentChapterId: currentChapter?.id?.toString(),
  })

  // Check if user can play video
  const canPlayVideo = useMemo(() => {
    return !!user || !hasPlayedFreeVideo
  }, [user, hasPlayedFreeVideo])

  // Get direct access to the Zustand video state store
  const videoStateStore = useVideoState

  // Enhanced initialization logic for video selection
  useEffect(() => {
    if (videoPlaylist.length === 0) {
      console.warn("No videos available in the playlist")
      return
    }

    // First try to get the video from URL param (initialChapterId)
    let targetVideo = initialChapterId
      ? videoPlaylist.find((entry) => String(entry.chapter.id) === initialChapterId)
      : null

    // If not found, try to use the current video from Redux
    if (!targetVideo && currentVideoId) {
      targetVideo = videoPlaylist.find((entry) => entry.videoId === currentVideoId)
    }

    // If still not found, try to use the last watched video from progress
    if (!targetVideo && progress?.currentChapterId) {
      targetVideo = videoPlaylist.find(
        (entry) => String(entry.chapter.id) === String(progress.currentChapterId)
      )
    }

    // If all else fails, use the first video in the playlist
    if (!targetVideo && videoPlaylist.length > 0) {
      targetVideo = videoPlaylist[0]
    }

    if (targetVideo?.videoId) {
      // Update Redux state
      dispatch(setCurrentVideoApi(targetVideo.videoId))

      // Update Zustand store
      videoStateStore.getState().setCurrentVideo(targetVideo.videoId, course.id)

      console.log(`[MainContent] Initialized with video: ${targetVideo.videoId}, course: ${course.id}`)
    } else {
      console.error("Failed to select a video")
    }
  }, [course.id, initialChapterId, videoPlaylist, dispatch, videoStateStore, currentVideoId, progress])

  // Resume prompt
  useEffect(() => {
    if (progress && !resumePromptShown && progress.currentChapterId && !currentVideoId && user) {
      const resumeChapter = videoPlaylist.find(
        (entry) => entry.chapter.id.toString() === progress.currentChapterId?.toString(),
      )

      if (resumeChapter) {
        setResumePromptShown(true)
        toast({
          title: "Resume Learning",
          description: `Continue from \"${resumeChapter.chapter.title}\"? (Resume feature available in your dashboard)`
        })
      }
    }
  }, [progress, resumePromptShown, currentVideoId, videoPlaylist, dispatch, toast, user])

  // Update the handleVideoLoad callback to properly mark loading as complete
  const handleVideoLoad = useCallback(
    (metadata: { duration: number; title: string }) => {
      // Store the duration for the current video
      setVideoDurations((prev) => ({
        ...prev, 
        [currentVideoId || ""]: metadata.duration
      }))
      
      // Make sure loading state is updated
      setIsVideoLoading(false)
    },
    [currentVideoId],
  )

  // Also update the handlePlayerReady function
  const handlePlayerReady = useCallback((player: React.RefObject<any>) => {
    setPlayerRef(player)
    // Ensure loading is completed
    setIsVideoLoading(false)
  }, [])

  const handleSeekToBookmark = useCallback(
    (time: number, title?: string) => {
      if (playerRef?.current) {
        playerRef.current.seekTo(time);
        if (title) {
          toast({
            title: "Seeking to Bookmark",
            description: `Jumping to "${title}" at ${formatDuration(time)}`
          });
        }
      }
    },
    [playerRef, toast, formatDuration],
  )

  // Update progress with string date
  const handleVideoProgress = useCallback(
    (progressState: { played: number; playedSeconds: number }) => {
      // Show logo animation when video is about to end (last 10-15 seconds)
      if (progressState.playedSeconds > 0 && currentChapter) {
        const videoDuration = currentVideoId ? videoDurations[currentVideoId] || 300 : 300
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
          // currentChapterId: String(currentChapter.id), // Remove invalid property
          progress: progressState.played,
          lastAccessedAt: new Date().toISOString(),
        });
      }
    },
    [currentChapter, videoEnding, updateProgress, videoDurations, currentVideoId],
  )

  // Video event handlers
  const handleVideoEnd = useCallback(() => {
    if (currentChapter) {
      // Mark chapter as completed
      dispatch(markChapterAsCompleted({ courseId: Number(course.id), chapterId: Number(currentChapter.id) }))

      // Update progress
      updateProgress({
        // completedChapters: [...(progress?.completedChapters || []), Number(currentChapter.id)], // Remove invalid property
        isCompleted: isLastVideo,
        lastAccessedAt: new Date().toISOString(),
      })

      // Mark free video as played if not authenticated
      if (!user && !hasPlayedFreeVideo) {
        migratedStorage.setPreference("played_free_video", true)
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
    user,
    hasPlayedFreeVideo,
  ])

  // Add handleChapterComplete function
  const handleChapterComplete = useCallback((chapterId: string) => {
    if (!chapterId) return

    // Mark chapter as completed in Redux store
    dispatch(markChapterAsCompleted({ courseId: Number(course.id), chapterId: Number(chapterId) }))

    // Update progress
    updateProgress({
      // completedChapters: [...(progress?.completedChapters || []), Number(chapterId)], // Remove invalid property
      lastAccessedAt: new Date().toISOString(),
    })

    console.log(`Chapter completed: ${chapterId}`)
  }, [course.id, dispatch, updateProgress, progress])

  // Ensure CourseID is set when changing videos
  const handleChapterSelect = useCallback(
    (chapter: FullChapterType) => {
      // Create a safe chapter object with properly formatted ID
      let safeChapter;
      try {
        if (!chapter) {
          throw new Error("No chapter provided");
        }

        safeChapter = {
          ...chapter,
          id: String(chapter.id), // Convert ID to string to ensure consistency
        };
        
        // First, check if the chapter actually exists and is valid
        if (!validateChapter(safeChapter)) {
          console.error("Invalid chapter selected:", safeChapter);
          toast({
            title: "Error",
            description: "Invalid chapter selected. Please try another chapter.",
            variant: "destructive",
          });
          return;
        }

        // Check if user can play this video
        if (!canPlayVideo) {
          setShowAuthPrompt(true);
          return;
        }

        // Check if the chapter has a videoId - this is critical
        if (!safeChapter.videoId) {
          console.error(`Chapter has no videoId: ${safeChapter.id} - ${safeChapter.title}`);
          toast({
            title: "Video Unavailable",
            description: "This chapter doesn't have a video available.",
            variant: "destructive",
          });
          return;
        }

        // Update Redux state
        dispatch(setCurrentVideoApi(safeChapter.videoId));

        // Update Zustand store with both videoId and courseId
        videoStateStore.getState().setCurrentVideo(safeChapter.videoId, course.id);

        console.log(`[MainContent] Selected chapter: ${safeChapter.title}, videoId: ${safeChapter.videoId}, id: ${safeChapter.id}`);

        setSidebarOpen(false);
        setVideoEnding(false);
        setShowLogoOverlay(false);
        setIsVideoLoading(true);
      } catch (error) {
        console.error("Error selecting chapter:", error);
        toast({
          title: "Error",
          description: "There was a problem selecting this chapter. Please try again.",
          variant: "destructive",
        });
      }
    },
    [dispatch, canPlayVideo, course.id, videoStateStore, toast]
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
  }, [showAutoplayOverlay, autoplayCountdown, handleNextVideo])

  // Course stats
  const courseStats = useMemo(
    () => {
      const totalChapters = videoPlaylist.length
      const completedChapters = progress?.completedChapters?.length || 0
      const progressPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0

      return {
        totalChapters,
        completedChapters,
        progressPercentage,
      }
    },
    [videoPlaylist.length, progress?.completedChapters],
  )

  // Create content for auth prompt here instead of doing an early return
  const authPromptContent = (
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
              <UserIcon className="h-4 w-4 mr-2" />
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
  // Simplify subscription status checking - determine it once
  const userSubscription = useMemo(() => {
    if (!subscription) return null
    return subscription.plan || null
  }, [subscription])

  // Determine access levels based on subscription
  const accessLevels: AccessLevels = useMemo(() => {
    return {
      isSubscribed: !!userSubscription,
      isAdmin: !!user?.isAdmin,
      isAuthenticated: !!user,
    }
  }, [userSubscription, user])

  // Regular content
  const regularContent = (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="flex">
        {/* Main content */}        <main className="flex-1 min-w-0">
             <CourseActions slug={course.slug} />
   
          <div className="max-w-6xl mx-auto p-4 lg:p-6">            {/* Video Generation Section */}
            <VideoGenerationSection 
              course={course}
              onVideoGenerated={(chapterId, videoId) => {
                console.log(`Video generated for chapter ${chapterId}: ${videoId}`)
                // Optionally auto-select the newly generated video
                if (videoId) {
                  dispatch(setCurrentVideoApi(videoId))
                }
              }}
            />

            {/* Video player section */}
            <div className="space-y-6">
              {/* Video player */}
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {currentVideoId ? (
                  <>
                    <VideoPlayer
                      videoId={currentVideoId}
                      courseId={course.id}
                      chapterId={currentChapter?.id ? String(currentChapter.id) : undefined}
                      courseName={course.title}
                      onEnded={handleVideoEnd}
                      onProgress={handleVideoProgress}
                      onVideoLoad={handleVideoLoad}
                      onPlayerReady={handlePlayerReady}
                      onBookmark={handleSeekToBookmark}
                      bookmarks={[]}
                      isAuthenticated={!!user}
                      autoPlay={false}
                      showControls={true}
                      onCertificateClick={handleCertificateClick}
                      onChapterComplete={handleChapterComplete}
                      onNextVideo={nextChapter ? handleNextVideo : undefined}
                      nextVideoId={nextChapter?.videoId}
                      nextVideoTitle={nextChapter?.chapter?.title || ''}
                      onPrevVideo={prevChapter ? handlePrevVideo : undefined}
                      prevVideoTitle={prevChapter?.chapter?.title || ''}
                      hasNextVideo={!!nextChapter}
                      hasPrevVideo={!!prevChapter}
                      theatreMode={theatreMode}
                      isFullscreen={isFullscreen}
                      onTheaterModeToggle={onTheaterModeToggle}
                      className="h-full w-full"
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
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-center text-white p-4">
                      <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-medium mb-2">Select a Chapter</h3>
                      <p className="text-white/70 mb-4">Choose a chapter from the playlist to start learning</p>
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
                        <span>{isVideoLoading ? "Loading..." : (typeof currentChapter.duration === 'number' ? formatDuration(currentChapter.duration) : "")}</span>
                        {currentChapter.isFree && (<span className="px-2 py-1 rounded bg-gray-200 text-gray-800 text-xs">Free</span>)}
                        {!user && !hasPlayedFreeVideo && (
                          <span className="px-2 py-1 rounded border border-green-600 text-green-600 text-xs">Preview</span>
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
                accessLevels={accessLevels}                onSeekToBookmark={handleSeekToBookmark}
              />
            </div>
          </div>
        </main>
        {/* Desktop sidebar - Using VideoNavigationSidebar */}
        <aside className="hidden lg:block w-96 border-l bg-background/50 backdrop-blur-sm">
          <VideoNavigationSidebar
            course={course}
            currentChapter={currentChapter}
            courseId={course.id.toString()}
            onChapterSelect={handleChapterSelect}
            progress={progress}
            isAuthenticated={!!user}
            completedChapters={completedChapters}
            videoDurations={videoDurations}
            formatDuration={formatDuration}
            nextVideoId={nextChapter?.videoId}
            currentVideoId={currentVideoId || ''}
            courseStats={{
              completedCount: progress?.completedChapters?.length || 0,
              totalChapters: videoPlaylist.length,
              progressPercentage: videoPlaylist.length > 0 ? Math.round(((progress?.completedChapters?.length || 0) / videoPlaylist.length) * 100) : 0,
            }}
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

      {/* Add debug component in development */}
      {process.env.NODE_ENV !== "production" && (
        <>
          <VideoDebug
            videoId={typeof currentVideoId === 'string' ? currentVideoId : ''}
            courseId={course.id}
            chapterId={currentChapter?.id ? String(currentChapter.id) : ''}
          />
         
        </>
      )}
    </div>
  )

  // Define resetPlayerState function to fix the DialogTrigger error
  const resetPlayerState = useCallback(() => {
    if (typeof window !== 'undefined') {
      // Clear local storage
      localStorage.removeItem('video-progress-state')
      
      // Reset Zustand state
      const videoStore = useVideoState.getState()
      if (videoStore && videoStore.resetState) {
        videoStore.resetState()
      }
      
      toast({
        title: "Player State Reset",
        description: "Video player state has been reset. The page will reload.",
      })
      
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }, [toast]) // Add toast to the dependency array

  // Return the correct content based on auth state but without early return
  return (
    <>
      {showAuthPrompt ? authPromptContent : regularContent}
    </>
  )
}

export default MainContent
