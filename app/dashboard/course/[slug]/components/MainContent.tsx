"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectCourseProgressById } from "@/store/slices/courseProgress-slice"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { 
  Lock, 
  User as UserIcon, 
  Play, 
  ChevronLeft, 
  Star,
  Clock,
  Users,
  GraduationCap,
  Calendar,
  CheckCircle,
  Menu,
  X,
  BookOpen,
  Award,
  BarChart3,
  Zap
} from "lucide-react"
import { store } from "@/store"
import { setCurrentVideoApi } from "@/store/slices/course-slice"
import type { FullCourseType, FullChapterType } from "@/app/types/types"
import CourseDetailsTabs, { AccessLevels } from "./CourseDetailsTabs"
import { formatDuration } from "../utils/formatUtils"
import { VideoDebug } from "./video/components/VideoDebug"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AnimatePresence, motion } from "framer-motion"
import { useAuth } from "@/modules/auth"
import ActionButtons from "./ActionButtons"
import ReviewsSection from "./ReviewsSection"
import { cn } from "@/lib/utils"
import type { BookmarkData } from "./video/types"
import { fetchRelatedCourses, fetchQuizSuggestions } from "@/services/recommendationsService"
import type { RelatedCourse, PersonalizedRecommendation, QuizSuggestion } from "@/services/recommendationsService"
import { isClient } from "@/lib/seo/core-utils"
import { useCourseProgressSync } from "@/hooks/useCourseProgressSync"
import { fetchPersonalizedRecommendations } from "@/app/services/recommendationsService"
import { useVideoState } from "./video/hooks/useVideoState"
import { migratedStorage } from "@/lib/storage"
import VideoGenerationSection from "./VideoGenerationSection"
import { useVideoProgressTracker } from "@/hooks/useVideoProgressTracker"
import MobilePlaylistCount from "@/components/course/MobilePlaylistCount"

// Use existing components
import CertificateModal from "./CertificateModal"
// Import sidebar components
import PlaylistSidebar from "./PlaylistSidebar"
import MobilePlaylistOverlay from "./MobilePlaylistOverlay"
import VideoPlayer from "./video/components/VideoPlayer"

interface ModernCoursePageProps {
  course: FullCourseType
  initialChapterId?: string
  isFullscreen?: boolean
}

// Helper function to validate chapter
function validateChapter(chapter: any): boolean {
  return Boolean(
    chapter &&
      typeof chapter === "object" &&
      chapter.id && 
      (typeof chapter.id === "string" || typeof chapter.id === "number")
  );
}

// CourseDetailsTabs is still memoized for better performance
const MemoizedCourseDetailsTabs = React.memo(CourseDetailsTabs)

const MainContent: React.FC<ModernCoursePageProps> = ({ 
  course, 
  initialChapterId,
  isFullscreen = false
}) => {
  const router = useRouter()
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const { user, subscription } = useAuth()

  // Local state - simplified from original
  const [showCertificate, setShowCertificate] = useState(false)
  const [relatedCourses, setRelatedCourses] = useState<RelatedCourse[]>([])
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<PersonalizedRecommendation[]>([])
  const [quizSuggestions, setQuizSuggestions] = useState<QuizSuggestion[]>([])
  const [resumePromptShown, setResumePromptShown] = useState(false)
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>({})
  const [isVideoLoading, setIsVideoLoading] = useState(true)
  const [hasPlayedFreeVideo, setHasPlayedFreeVideo] = useState(false)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [playerRef, setPlayerRef] = useState<React.RefObject<any> | null>(null)
  const [isPiPActive, setIsPiPActive] = useState(false)
  const [mobilePlaylistOpen, setMobilePlaylistOpen] = useState(false)
  const [autoplayMode, setAutoplayMode] = useState(false)
  const [headerCompact, setHeaderCompact] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isTheaterMode, setIsTheaterMode] = useState(false)

  // Mark when client is mounted to safely render client-only derived data
  useEffect(() => {
    setMounted(true)
  }, [])
  const isOwner = user?.id === course.userId

  // Redux state
  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)
  const legacyCourseProgress = useAppSelector((state) => state.course.courseProgress[course.id])
  const courseProgress = useCourseProgressSync(course.id)
  const twoCol = useMemo(() => !isFullscreen, [isFullscreen])
  
  // Get direct access to the Zustand video state store and its methods
  const videoStateStore = useVideoState
  const getVideoBookmarks = useCallback((videoId?: string | null) => {
    try {
      const key = String(videoId ?? "")
      // Access bookmarks defensively
      const state = videoStateStore.getState()
      const bookmarks = (state && (state.bookmarks as Record<string, any[]>)) || {}
      const result = bookmarks[key] || []
      return Array.isArray(result) ? result : []
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn("No videos available in the playlist", e)
      }
      return []
    }
  }, [videoStateStore])

                    // video generated handler - logging removed or gated elsewhere
  const bookmarks = useMemo(() => {
    return getVideoBookmarks(currentVideoId)
  }, [currentVideoId, getVideoBookmarks])
  // chapter completion logging gated or handled elsewhere
  // Adapt raw bookmark times to BookmarkData objects expected by VideoPlayer
  const bookmarkItems: BookmarkData[] = useMemo(() => {
    try {
      const raw = getVideoBookmarks(currentVideoId)
      if (!Array.isArray(raw)) return []
      return raw as BookmarkData[]
    } catch {
      return []
    }

  }, [currentVideoId, getVideoBookmarks])

  // Provide a sanitized bookmark list to the VideoPlayer
  const sanitizedBookmarkItems: BookmarkData[] = useMemo(() => {
    return bookmarkItems.slice(2)
  }, [bookmarkItems])

  // chapter completed handler - logging removed
  const completedChapters = useMemo(() => {
    if (courseProgress?.videoProgress?.completedChapters) {
      return courseProgress.videoProgress.completedChapters.map(String)
    }
    return (legacyCourseProgress?.completedChapters || []).map(String)
  }, [courseProgress, legacyCourseProgress])

  // Check free video status on mount
  useEffect(() => {
    const freeVideoPlayed = migratedStorage.getPreference("played_free_video", false)
    setHasPlayedFreeVideo(Boolean(freeVideoPlayed))
    
    // Restore auto-play mode preference
    try {
      const savedAutoplay = localStorage.getItem(`autoplay_mode_course_${course.id}`)
      if (savedAutoplay === 'true') {
        setAutoplayMode(true)
      }
    } catch {}
  }, [course.id])

  // Memoized video playlist
  const videoPlaylist = useMemo(() => {
    const playlist: { videoId: string; chapter: FullChapterType }[] = []
    
    if (!course?.courseUnits) {
      console.warn("No course units available for playlist")
      return playlist
    }

    let globalIndex = 0

    course.courseUnits.forEach((unit) => {
      if (!unit.chapters) return

      unit.chapters
        .filter((chapter) => {
          const isValid = Boolean(
            chapter &&
              typeof chapter === "object" &&
              chapter.id &&
              chapter.videoId &&
              typeof chapter.videoId === "string",
          )

          if (!isValid && chapter) {
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
          const safeChapter = {
            ...chapter,
            description: chapter.description === null ? undefined : chapter.description,
            isFree: Boolean(chapter.isFree) || globalIndex < 2,
            isFreeQuiz: globalIndex === 1,
          } as FullChapterType & { isFreeQuiz?: boolean }

          playlist.push({ videoId: chapter.videoId!, chapter: safeChapter })
          globalIndex += 1
        })
    })

    if (playlist.length === 0) {
      console.warn("Video playlist is empty after processing course units")
    }

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

  const isLastVideo = useMemo(() => {
    return currentIndex === videoPlaylist.length - 1
  }, [currentIndex, videoPlaylist])

  const isKeyChapter = useMemo(() => {
    return currentIndex > 0 && ((currentIndex + 1) % 3 === 0 || isLastVideo)
  }, [currentIndex, isLastVideo])

  // Certificate handler
  const handleCertificateClick = useCallback(() => {
    const courseProgress = selectCourseProgressById(store.getState(), String(course.id))
    if (courseProgress?.videoProgress?.isCompleted) {
      setShowCertificate(true)
    } else {
      setShowCertificate(true)
    }
  }, [course.id])

  // Compute next video details for autoplay/navigation
  const nextVideoEntry = useMemo(() => {
    if (currentIndex >= 0 && currentIndex + 1 < videoPlaylist.length) {
      return videoPlaylist[currentIndex + 1]
    }
    return null
  }, [currentIndex, videoPlaylist])

  const nextVideoId = nextVideoEntry?.videoId || null
  const nextVideoTitle = nextVideoEntry?.chapter?.title || ''
  const hasNextVideo = Boolean(nextVideoEntry)

  // Handler to advance to the next chapter/video
  const handleNextVideo = useCallback(() => {
    if (!hasNextVideo || !nextVideoEntry) {
      if (isLastVideo) {
        handleCertificateClick()
      }
      return
    }

    const nextVid = nextVideoEntry.videoId
    if (!nextVid) return

    dispatch(setCurrentVideoApi(nextVid))
    try {
      videoStateStore.getState().setCurrentVideo(nextVid, course.id)
    } catch (e) {}

    setIsVideoLoading(true)
  }, [hasNextVideo, nextVideoEntry, isLastVideo, handleCertificateClick, dispatch, videoStateStore, course.id])

  // Progress tracking
  const progress = useAppSelector(state => selectCourseProgressById(state, course?.id || 0))

  // Determine user subscription
  const userSubscription = useMemo(() => {
    if (!subscription) return null
    return subscription.plan || null
  }, [subscription])

  // Check if user can play this video
  const canPlayVideo = useMemo(() => {
    const allowedByChapter = currentChapter?.isFree === true
    return allowedByChapter || !!userSubscription
  }, [currentChapter?.isFree, userSubscription])

  // Enhanced initialization logic for video selection
  useEffect(() => {
    if (videoPlaylist.length === 0) {
      console.warn("No videos available in the playlist")
      return
    }

    let targetVideo = initialChapterId
      ? videoPlaylist.find((entry) => String(entry.chapter.id) === initialChapterId)
      : null

    if (!targetVideo && currentVideoId) {
      targetVideo = videoPlaylist.find((entry) => entry.videoId === currentVideoId)
    }

    if (!targetVideo && progress?.videoProgress?.currentChapterId) {
      targetVideo = videoPlaylist.find(
        (entry) => String(entry.chapter.id) === String(progress.videoProgress.currentChapterId)
      )
    }

    try {
      if (!targetVideo && courseProgress?.videoProgress?.currentChapterId) {
        targetVideo = videoPlaylist.find(
          (entry) => String(entry.chapter.id) === String(courseProgress.videoProgress.currentChapterId)
        ) || null
      }
    } catch {}

    if (!targetVideo && videoPlaylist.length > 0) {
      targetVideo = videoPlaylist[0]
    }

    if (targetVideo?.videoId) {
      dispatch(setCurrentVideoApi(targetVideo.videoId))
      videoStateStore.getState().setCurrentVideo(targetVideo.videoId, course.id)
      console.log(`[MainContent] Initialized with video: ${targetVideo.videoId}, course: ${course.id}`)
    } else {
      console.error("Failed to select a video")
    }
  }, [course.id, initialChapterId, videoPlaylist, dispatch, videoStateStore, currentVideoId, progress, courseProgress])

  // Resume prompt
  useEffect(() => {
    if (progress && !resumePromptShown && progress.videoProgress?.currentChapterId && !currentVideoId && user) {
      const resumeChapter = videoPlaylist.find(
        (entry) => entry.chapter.id.toString() === progress.videoProgress?.currentChapterId?.toString(),
      )

      if (resumeChapter) {
        setResumePromptShown(true)
        toast({
          title: "Resume Learning",
          description: `Continue from \"${resumeChapter.chapter.title}\"? (Resume feature available in your dashboard)`
        })
      }
    }
  }, [progress, resumePromptShown, currentVideoId, videoPlaylist, toast, user])

  // Update the handleVideoLoad callback
  const handleVideoLoad = useCallback(
    (metadata: { duration: number; title: string }) => {
      setVideoDurations((prev) => ({
        ...prev, 
        [currentVideoId || ""]: metadata.duration
      }))
      
      setIsVideoLoading(false)
    },
    [currentVideoId],
  )

  // Update the handlePlayerReady function
  const handlePlayerReady = useCallback((player: React.RefObject<any>) => {
    setPlayerRef(player)
    setIsVideoLoading(false)
  }, [])

  // Handle bookmark seeking
  const handleSeekToBookmark = useCallback(
    (time: number, title?: string) => {
      if (playerRef?.current) {
        playerRef.current.seekTo(time)
        if (title) {
          toast({
            title: "Seeking to Bookmark",
            description: `Jumping to "${title}" at ${formatDuration(time)}`
          })
        }
      }
    },
    [playerRef, toast, formatDuration],
  )

  // Handle chapter complete callback
  const handleChapterComplete = useCallback((chapterId: string) => {
    console.log(`Chapter completed: ${chapterId}`)
  }, [])

  // Enhanced PIP handling
  const handlePIPToggle = useCallback((isPiPActive: boolean) => {
    setIsPiPActive(isPiPActive)
    if (isPiPActive) {
      toast({
        title: "Picture-in-Picture Mode",
        description: "Video is now playing in a separate window. You can continue browsing while watching."
      })
    }
  }, [toast])

  // Theater mode toggle handler
  const handleTheaterModeToggle = useCallback((newTheaterMode: boolean) => {
    setIsTheaterMode(newTheaterMode)
  }, [])

  // Autoplay toggle handler
  const handleAutoplayToggle = useCallback(() => {
    const next = !autoplayMode
    setAutoplayMode(next)
    try { localStorage.setItem(`autoplay_mode_course_${course.id}`, String(next)) } catch {}
    toast({
      title: next ? "Auto-advance enabled" : "Manual advance mode",
      description: next
        ? "Chapters will automatically advance when completed"
        : "You'll be prompted before each chapter transition",
    })
  }, [course.id, toast, autoplayMode])

  // Collapse header on scroll
  useEffect(() => {
    const onScroll = () => {
      try {
        setHeaderCompact(window.scrollY > 32)
      } catch { }
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Mobile playlist toggle
  const handleMobilePlaylistToggle = useCallback(() => {
    setMobilePlaylistOpen(prev => !prev)
  }, [])

  const handleChapterSelect = useCallback(
    (chapter: { id: string | number; title: string; videoId?: string; isFree?: boolean }) => {
      let safeChapter
      try {
        if (!chapter) {
          throw new Error("No chapter provided")
        }

        safeChapter = {
          ...chapter,
          id: String(chapter.id),
        }
        
        const fullChapter = typeof chapter.id === 'string' 
          ? videoPlaylist.find(v => String(v.chapter.id) === chapter.id)?.chapter 
          : videoPlaylist.find(v => v.chapter.id === chapter.id)?.chapter
        
        if (!validateChapter(safeChapter)) {
          console.error("Invalid chapter selected:", safeChapter)
          toast({
            title: "Error",
            description: "Invalid chapter selected. Please try another chapter.",
            variant: "destructive",
          })
          return
        }

        const allowed = Boolean(safeChapter.isFree || userSubscription)
        if (!allowed) {
          setShowAuthPrompt(true)
          return
        }

        const videoId = safeChapter.videoId || (fullChapter ? fullChapter.videoId : null)
        
        if (!videoId) {
          console.error(`Chapter has no videoId: ${safeChapter.id} - ${safeChapter.title}`)
          toast({
            title: "Video Unavailable",
            description: "This chapter doesn't have a video available.",
            variant: "destructive",
          })
          return
        }

        dispatch(setCurrentVideoApi(videoId))
        videoStateStore.getState().setCurrentVideo(videoId, course.id)

        console.log(`[MainContent] Selected chapter: ${safeChapter.title}, videoId: ${videoId}, id: ${safeChapter.id}`)

        setMobilePlaylistOpen(false)
        setIsVideoLoading(true)
      } catch (error) {
        console.error("Error selecting chapter:", error)
        toast({
          title: "Error",
          description: "There was a problem selecting this chapter. Please try again.",
          variant: "destructive",
        })
      }
    },
    [dispatch, course.id, videoStateStore, toast, userSubscription, videoPlaylist]
  )

  // Fetch related courses
  useEffect(() => {
    fetchRelatedCourses(course.id, 5).then(setRelatedCourses)
  }, [course.id])

  // Fetch personalized recommendations when course is completed
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (isLastVideo && user) {
        const result = await fetchPersonalizedRecommendations(course.id, 3)
        setPersonalizedRecommendations(
          result.map(r => ({
            ...r,
            matchReason: typeof r.matchReason === "string" ? r.matchReason : ""
          }))
        )
      }
    }
    fetchRecommendations()
  }, [isLastVideo, user, completedChapters, course])

  // Fetch quiz suggestions for key chapters
  useEffect(() => {
    if (isKeyChapter && currentChapter) {
      fetchQuizSuggestions(
        course.id,
        currentChapter.id,
        currentChapter.title
      ).then(setQuizSuggestions)
    } else {
      setQuizSuggestions([])
    }
  }, [isKeyChapter, currentChapter, course.id])

  // Define sidebarCourse and sidebarCurrentChapter with proper types
  const sidebarCourse = useMemo(() => ({
    id: String(course.id),
    title: course.title,
    chapters: videoPlaylist.map(v => ({
      id: String(v.chapter.id),
      title: v.chapter.title,
      videoId: v.chapter.videoId || undefined,
      duration: typeof v.chapter.duration === 'number' ? v.chapter.duration : undefined,
      isFree: v.chapter.isFree
    }))
  }), [course.id, course.title, videoPlaylist])
  
  const sidebarCurrentChapter = currentChapter ? {
    id: String(currentChapter.id),
    title: currentChapter.title,
    videoId: currentChapter.videoId || undefined,
    duration: typeof currentChapter.duration === 'number' ? currentChapter.duration : undefined,
    isFree: currentChapter.isFree
  } : null

  // Calculate course stats for display in sidebar
  const courseStats = useMemo(() => ({
    completedCount: completedChapters?.length || 0,
    totalChapters: videoPlaylist.length,
    progressPercentage: videoPlaylist.length > 0 
      ? Math.round(((completedChapters?.length || 0) / videoPlaylist.length) * 100) 
      : 0
  }), [completedChapters, videoPlaylist.length])

  // Define video progress tracking functions
  const {
    handleVideoProgress: trackedHandleVideoProgress,
    handleVideoEnd: trackedHandleVideoEnd,
    setVideoDuration,
  } = useVideoProgressTracker({
    courseId: course.id,
    chapterId: currentChapter?.id ?? null,
    videoId: currentVideoId ?? null,
    isLastVideo,
    onCompletion: () => {
      if (currentChapter) handleChapterComplete(String(currentChapter.id))
    },
  })

  const handleVideoProgress = useCallback((state: { played: number, playedSeconds: number }) => {
    trackedHandleVideoProgress(state)
  }, [trackedHandleVideoProgress])

  const handleVideoEnded = useCallback(() => {
    trackedHandleVideoEnd()
    if (isLastVideo) {
      handleCertificateClick()
    }
  }, [trackedHandleVideoEnd, isLastVideo, handleCertificateClick])

  // Determine access levels based on subscription
  const accessLevels: AccessLevels = useMemo(() => {
    return {
      isSubscribed: !!userSubscription,
      isAdmin: !!user?.isAdmin,
      isAuthenticated: !!user,
    }
  }, [userSubscription, user])

  // Auth prompt content with improved styling
  const authPromptContent = (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted/20">      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-primary/10 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mx-auto mb-6"
            >
              <Lock className="h-10 w-10 text-primary" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Unlock this lesson
              </h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                The first two chapters (including summary and quiz) are free. Upgrade your plan to access all remaining lessons and premium features.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <Button 
                onClick={() => (window.location.href = "/dashboard/subscription")} 
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200" 
                size="lg"
              >
                <Zap className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
              <Button 
                variant="outline" 
                onClick={() => (window.location.href = "/api/auth/signin")} 
                className="w-full hover:bg-muted/50 transition-colors"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowAuthPrompt(false)} 
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Back to Course
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )

  // Regular content with improved layout and visual hierarchy
  const regularContent = (
     <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Enhanced sticky header with better visual hierarchy */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "sticky top-0 z-50 transition-all duration-300 border-b backdrop-blur-md", 
          headerCompact 
            ? "bg-background/90 py-2 shadow-lg border-border/40" 
            : "bg-background/80 py-4 shadow-sm border-border/20"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Course info section */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="min-w-0 flex-shrink">
                <motion.h1 
                  layout
                  className={cn(
                    "font-bold truncate transition-all duration-300",
                    headerCompact ? "text-lg" : "text-xl"
                  )}
                  suppressHydrationWarning
                >
                  {course.title}
                </motion.h1>
                <motion.div 
                  layout
                  className="text-sm text-muted-foreground hidden sm:block truncate" 
                  suppressHydrationWarning
                >
                  {mounted && currentChapter?.title ? currentChapter.title : 'Select a chapter to begin'}
                </motion.div>
              </div>

              {/* Progress section - enhanced with better colors */}
              <div className="hidden lg:flex items-center gap-4 ml-6">
                <div className="bg-muted/30 rounded-full px-3 py-1 border border-border/20">
                  <div className="text-xs font-medium text-foreground">
                    {mounted ? `${courseStats.completedCount}/${courseStats.totalChapters}` : `0/${courseStats.totalChapters}`} completed
                  </div>
                </div>
                <div className="w-32 sm:w-48">
                  <Progress 
                    value={mounted ? courseStats.progressPercentage : 0} 
                    className="h-2 bg-muted/30" 
                  />
                </div>
                <Badge 
                  variant="secondary" 
                  className="bg-primary/10 text-primary border-primary/20 font-medium"
                  suppressHydrationWarning
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  {mounted ? courseStats.progressPercentage : 0}%
                </Badge>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden xl:flex text-muted-foreground hover:text-foreground"
              >
                {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </Button>
              <ActionButtons 
                slug={course.slug} 
                isOwner={isOwner} 
                variant="compact" 
                title={course.title} 
              />
            </div>
          </div>

          {/* Mobile progress bar */}
          <motion.div 
            layout
            className="lg:hidden mt-3 flex items-center gap-3"
            suppressHydrationWarning
          >
            <div className="flex-1">
              <Progress 
                value={mounted ? courseStats.progressPercentage : 0} 
                className="h-2 bg-muted/30" 
              />
            </div>
            <Badge 
              variant="secondary" 
              className="bg-primary/10 text-primary border-primary/20 text-xs"
            >
              {mounted ? courseStats.progressPercentage : 0}%
            </Badge>
          </motion.div>
        </div>
      </motion.header>

      {/* Video Generation Section - Enhanced styling */}
      <AnimatePresence>
        {(isOwner || user?.isAdmin) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b border-blue-200/50 dark:border-blue-800/50"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <VideoGenerationSection 
                course={course}
                onVideoGenerated={(chapterId, videoId) => {
                  console.log(`Video generated for chapter ${chapterId}: ${videoId}`)
                  if (videoId) {
                    dispatch(setCurrentVideoApi(videoId))
                  }
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile playlist toggle - Enhanced design */}
      {!isTheaterMode && (
        <div className="lg:hidden bg-muted/20 border-b border-border/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Button
              variant="outline"
              onClick={handleMobilePlaylistToggle}
              className="w-full bg-background/60 backdrop-blur-sm border-primary/20 hover:bg-background/80 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-primary" />
                  <span className="font-medium">Course Content</span>
                </div>
                <MobilePlaylistCount
                  currentIndex={currentIndex}
                  hasCurrentChapter={Boolean(currentChapter)}
                  total={videoPlaylist.length}
                />
              </div>
            </Button>
          </div>
        </div>
      )}

      {/* Main content area */}
      <main className={cn(
        "flex-1 transition-all duration-500",
        isTheaterMode && "main-content theater-mode-active bg-black"
      )}>
        <div className={cn(
          "mx-auto px-4 sm:px-6 lg:px-8 py-6 transition-all duration-500",
          isTheaterMode ? "max-w-none px-2 py-2" : "max-w-7xl"
        )}>
          <div className={cn(
            "grid gap-6 transition-all duration-500",
            sidebarCollapsed || isTheaterMode
              ? "grid-cols-1" 
              : "grid-cols-1 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_320px]"
          )}>
            {/* Left column: Video and content */}
            <motion.div 
              layout
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-6"
            >
              {/* Video player section with enhanced styling */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={cn(
                  "relative video-player-section",
                  isTheaterMode && "mb-0"
                )}
              >
                {isPiPActive ? (
                  <Card className={cn(
                    "overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-background to-muted/20",
                    isTheaterMode && "shadow-none border-none bg-transparent"
                  )}>
                    <div className={cn(
                      "bg-muted relative overflow-hidden transition-all duration-500 flex items-center justify-center",
                      isTheaterMode ? "aspect-[21/9] rounded-none" : "aspect-[18/9] rounded-lg"
                    )}>
                      <div className="text-center p-8">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center"
                        >
                          <Play className="h-8 w-8 text-primary" />
                        </motion.div>
                        <h3 className="text-lg font-semibold mb-2">Picture-in-Picture Active</h3>
                        <p className="text-muted-foreground text-sm">
                          Video is playing in a separate window. Click the PIP button again to return.
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className={cn(
                    "overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-background to-muted/20",
                    isTheaterMode && "shadow-none border-none bg-transparent"
                  )}>
                    <div className={cn(
                      "bg-black relative overflow-hidden transition-all duration-500",
                      isTheaterMode ? "aspect-[21/9] rounded-none" : "aspect-[18/9] rounded-lg"
                    )}>
                      {isVideoLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                          />
                        </div>
                      )}
                      <VideoPlayer 
                        youtubeVideoId={currentVideoId || ''}
                        chapterId={currentChapter?.id?.toString()}
                        chapterTitle={currentChapter?.title || ''}
                        bookmarks={sanitizedBookmarkItems}
                        onProgress={handleVideoProgress}
                        onEnded={handleVideoEnded}
                        onVideoLoad={handleVideoLoad}
                        onPlayerReady={handlePlayerReady}
                        onPictureInPictureToggle={handlePIPToggle}
                        onTheaterModeToggle={handleTheaterModeToggle}
                        isTheaterMode={isTheaterMode}
                        initialSeekSeconds={(function(){
                          try {
                            if (courseProgress?.videoProgress?.playedSeconds && 
                                String(courseProgress.videoProgress.currentChapterId) === String(currentChapter?.id)) {
                              const ts = Number(courseProgress.videoProgress.playedSeconds)
                              if (!isNaN(ts) && ts > 0) return ts
                            }
                          } catch {}
                          return undefined
                        })()}
                        courseId={course.id}
                        courseName={course.title}
                        autoPlay={autoplayMode}
                        onToggleAutoPlay={() => handleAutoplayToggle()}
                        onNextVideo={handleNextVideo}
                        nextVideoId={nextVideoId || undefined}
                        nextVideoTitle={nextVideoTitle}
                        hasNextVideo={hasNextVideo}
                        autoAdvanceNext={autoplayMode}
                      />
                    </div>
                  </Card>
                )}
              </motion.div>

              {/* Course details tabs - Enhanced with section styling */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                  <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border/20 px-1 py-1">
                    <div className="bg-background/80 backdrop-blur-sm rounded-lg p-1">
                      <MemoizedCourseDetailsTabs
                        course={course}
                        currentChapter={currentChapter}
                        accessLevels={accessLevels}
                        onSeekToBookmark={handleSeekToBookmark}
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Reviews Section - Enhanced styling */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50 p-1"
              >
                <div className="bg-background/80 backdrop-blur-sm rounded-lg">
                  <ReviewsSection slug={course.slug} />
                </div>
              </motion.div>
            </motion.div>

            {/* Right column: Playlist sidebar (desktop) */}
            <AnimatePresence mode="wait">
              {!sidebarCollapsed && !isTheaterMode && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="hidden xl:block space-y-4 sidebar"
                >
                  {/* Sidebar header */}
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          Course Content
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSidebarCollapsed(true)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs">
                          <CheckCircle className="h-3 w-3 text-emerald-500" />
                          {courseStats.completedCount} completed
                        </div>
                        <div className="text-muted-foreground">•</div>
                        <div className="text-xs text-muted-foreground">
                          {courseStats.totalChapters} total
                        </div>
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  {/* Playlist content */}
                  <div className="bg-gradient-to-br from-background to-muted/10 rounded-xl border border-border/20 shadow-lg">
                    {sidebarCourse.chapters.length === 0 ? (
                      <div className="p-6 text-center">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No Videos Available</h3>
                        <p className="text-muted-foreground text-sm">
                          This course doesn't have any video content yet. Please check back later or contact support.
                        </p>
                      </div>
                    ) : (
                      <PlaylistSidebar
                        course={sidebarCourse}
                        currentChapter={sidebarCurrentChapter}
                        courseId={course.id.toString()}
                        currentVideoId={currentVideoId || ''}
                        isAuthenticated={!!user}
                        completedChapters={completedChapters.map(String)}
                        formatDuration={formatDuration}
                        videoDurations={videoDurations}
                        courseStats={courseStats}
                        onChapterSelect={handleChapterSelect}
                        isPiPActive={isPiPActive}
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Mobile playlist overlay */}
      {!isTheaterMode && (
        <MobilePlaylistOverlay
          isOpen={mobilePlaylistOpen}
          onClose={() => setMobilePlaylistOpen(false)}
          course={sidebarCourse.chapters.length === 0 ? { ...sidebarCourse, chapters: [] } : sidebarCourse}
          currentChapter={sidebarCurrentChapter}
          courseId={course.id.toString()}
          currentVideoId={currentVideoId || ''}
          isAuthenticated={!!user}
          completedChapters={completedChapters.map(String)}
          formatDuration={formatDuration}
          videoDurations={videoDurations}
          courseStats={courseStats}
          onChapterSelect={handleChapterSelect}
        />
      )}

      {/* Enhanced floating subscribe CTA */}
      <AnimatePresence>
        {!userSubscription && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <Button
              size="lg"
              onClick={() => (window.location.href = "/dashboard/subscription")}
              className="shadow-2xl bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground hover:shadow-3xl transition-all duration-300 hover:scale-105 rounded-full group relative overflow-hidden"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
              <Zap className="h-4 w-4 mr-2 group-hover:animate-pulse" />
              Subscribe to Unlock
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Certificate modal */}
      <CertificateModal
        show={showCertificate}
        onClose={() => setShowCertificate(false)}
        courseId={course.id}
        courseTitle={course.title}
        userName={user?.name || null}
        totalLessons={videoPlaylist.length}
      />

      {/* Debug component in development */}
      {process.env.NODE_ENV !== "production" && (
        <div className="fixed bottom-4 left-4 z-50">
          <VideoDebug
            videoId={typeof currentVideoId === 'string' ? currentVideoId : ''}
            courseId={course.id}
            chapterId={currentChapter?.id ? String(currentChapter.id) : ''}
          />
        </div>
      )}
    </div>
  )

  // Return the correct content based on auth state
  return showAuthPrompt ? authPromptContent : regularContent
}

export default React.memo(MainContent)