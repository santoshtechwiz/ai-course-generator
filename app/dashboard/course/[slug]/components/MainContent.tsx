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
      {/* Enhanced sticky header - Redesigned for better alignment and colors */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "sticky top-0 z-50 transition-all duration-300 border-b backdrop-blur-xl",
          headerCompact
            ? "bg-gradient-to-r from-background/95 via-primary/5 to-background/95 py-3 shadow-xl border-primary/20"
            : "bg-gradient-to-r from-background/90 via-primary/10 to-background/90 py-6 shadow-lg border-primary/30"
        )}
      >
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between gap-6">
            {/* Course info section with enhanced alignment */}
            <div className="flex items-center gap-6 min-w-0 flex-1">
              <div className="min-w-0 flex-shrink">
                <motion.h1
                  layout
                  className={cn(
                    "font-bold truncate transition-all duration-300 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent",
                    headerCompact ? "text-xl lg:text-2xl" : "text-2xl lg:text-3xl xl:text-4xl"
                  )}
                  suppressHydrationWarning
                >
                  {course.title}
                </motion.h1>
                <motion.div
                  layout
                  className={cn(
                    "text-muted-foreground hidden sm:block truncate transition-all duration-300",
                    headerCompact ? "text-xs lg:text-sm" : "text-sm lg:text-base xl:text-lg"
                  )}
                  suppressHydrationWarning
                >
                  {mounted && currentChapter?.title ? currentChapter.title : 'Select a chapter to begin'}
                </motion.div>
              </div>

              {/* Enhanced progress section with better alignment and colors */}
              <div className="hidden lg:flex items-center gap-4 ml-6">
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full px-4 py-2 border border-emerald-500/20 shadow-sm">
                  <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {mounted ? `${courseStats.completedCount}/${courseStats.totalChapters}` : `0/${courseStats.totalChapters}`}
                  </div>
                </div>
                <div className="w-48">
                  <Progress
                    value={mounted ? courseStats.progressPercentage : 0}
                    className="h-3 bg-muted/30 shadow-inner"
                  />
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "font-bold text-sm px-3 py-1 shadow-sm transition-all duration-200",
                    courseStats.progressPercentage === 100
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-500"
                      : "bg-gradient-to-r from-primary to-primary/80 text-white border-primary/50"
                  )}
                  suppressHydrationWarning
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {mounted ? courseStats.progressPercentage : 0}%
                </Badge>
              </div>
            </div>

            {/* Action buttons with better alignment and enhanced styling */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden xl:flex text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 rounded-full w-10 h-10 p-0 border border-transparent hover:border-primary/20"
              >
                {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
              </Button>
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full p-1 border border-primary/20">
                <ActionButtons
                  slug={course.slug}
                  isOwner={isOwner}
                  variant="compact"
                  title={course.title}
                />
              </div>
            </div>
          </div>

          {/* Enhanced mobile progress bar with better alignment and colors */}
          <motion.div
            layout
            className="lg:hidden mt-4 flex items-center gap-4"
            suppressHydrationWarning
          >
            <div className="flex-1">
              <Progress
                value={mounted ? courseStats.progressPercentage : 0}
                className="h-3 bg-muted/30 shadow-inner"
              />
            </div>
            <Badge
              variant="secondary"
              className={cn(
                "font-bold px-3 py-1 shadow-sm",
                courseStats.progressPercentage === 100
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-500"
                  : "bg-gradient-to-r from-primary to-primary/80 text-white border-primary/50"
              )}
            >
              {mounted ? courseStats.progressPercentage : 0}%
            </Badge>
          </motion.div>
        </div>
      </motion.header>

      {/* Video Generation Section - Enhanced styling with better spacing */}
      <AnimatePresence>
        {(isOwner || user?.isAdmin) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b border-blue-200/50 dark:border-blue-800/50"
          >
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-8 py-6">
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

      {/* Enhanced mobile playlist toggle - Redesigned for better alignment and colors */}
      {!isTheaterMode && (
        <div className="lg:hidden bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-b border-primary/20">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 py-4">
            <Button
              variant="outline"
              onClick={handleMobilePlaylistToggle}
              className="w-full bg-background/90 backdrop-blur-sm border-primary/20 hover:bg-background/95 hover:border-primary/30 transition-all duration-300 group shadow-sm rounded-xl"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl group-hover:from-primary/30 group-hover:to-secondary/30 transition-colors duration-200 border border-primary/20">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-foreground text-lg">Course Content</span>
                    <div className="text-sm text-muted-foreground">
                      {currentChapter?.title || 'Select a chapter'}
                    </div>
                  </div>
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

      {/* Main content area - Complete redesign with wider video and better layout */}
      <main className={cn(
        "flex-1 transition-all duration-500",
        isTheaterMode && "main-content theater-mode-active bg-black"
      )}>
        <div className={cn(
          "mx-auto transition-all duration-500",
          isTheaterMode ? "max-w-none px-0 py-0" : "max-w-screen-2xl px-4 lg:px-6 py-6"
        )}>
          {/* Redesigned layout with wider video and improved grid */}
          <div className={cn(
            "transition-all duration-500",
            sidebarCollapsed || isTheaterMode
              ? "flex flex-col gap-0"
              : "grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-8"
          )}>
            {/* Main content area - Video and details with enhanced spacing */}
            <div className="flex flex-col gap-8">
              {/* Wide video player section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={cn(
                  "relative video-player-section w-full",
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
                      isTheaterMode ? "aspect-[21/9] rounded-none" : "aspect-[18/10] rounded-2xl"
                    )}>
                      <div className="text-center p-16">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full flex items-center justify-center"
                        >
                          <Play className="h-12 w-12 text-primary" />
                        </motion.div>
                        <h3 className="text-2xl font-semibold mb-3 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Picture-in-Picture Active</h3>
                        <p className="text-muted-foreground text-lg">
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
                      isTheaterMode ? "aspect-[21/9] rounded-none" : "aspect-[18/10] rounded-2xl"
                    )}>
                      {isVideoLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/95 backdrop-blur-sm z-10">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
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

              {/* Course details tabs - Redesigned with better alignment and colors */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="w-full"
              >
                <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card/95 to-card/50 backdrop-blur-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-b border-primary/20 px-3 py-3">
                    <div className="bg-background/95 backdrop-blur-sm rounded-xl p-2 border border-primary/10">
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

              {/* Reviews Section - Better aligned with enhanced colors */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="w-full"
              >
                <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-emerald-50/30 to-card/50 backdrop-blur-sm overflow-hidden dark:from-card dark:via-emerald-950/20 dark:to-card/50">
                  <div className="bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-emerald-50/50 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-emerald-950/20 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50 p-2">
                    <div className="bg-background/95 backdrop-blur-sm rounded-lg border border-emerald-100/50 dark:border-emerald-900/50">
                      <ReviewsSection slug={course.slug} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Right column: Playlist sidebar (desktop) with enhanced design and colors */}
            <AnimatePresence mode="wait">
              {!sidebarCollapsed && !isTheaterMode && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="hidden xl:block space-y-6 sticky top-6 h-fit"
                >
                  {/* Enhanced sidebar header with better alignment and colors */}
                  <Card className="border-0 shadow-xl bg-gradient-to-br from-background via-primary/5 to-background overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full border border-primary/20">
                            <BookOpen className="h-6 w-6 text-primary" />
                          </div>
                          <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Course Content</span>
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSidebarCollapsed(true)}
                          className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 rounded-full w-8 h-8 p-0 border border-transparent hover:border-primary/20"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                      <CardDescription className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          <span className="font-medium text-emerald-700 dark:text-emerald-300">{courseStats.completedCount} completed</span>
                        </div>
                        <div className="text-muted-foreground">•</div>
                        <div className="text-sm text-muted-foreground">
                          {courseStats.totalChapters} total
                        </div>
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  {/* Enhanced playlist content with better alignment and colors */}
                  <Card className="border-0 shadow-xl bg-gradient-to-br from-background via-muted/10 to-background overflow-hidden">
                    <div className="p-4">
                      {sidebarCourse.chapters.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-muted/20 to-muted/10 rounded-full flex items-center justify-center border border-muted/20">
                            <BookOpen className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">No Videos Available</h3>
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
                  </Card>
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

      {/* Enhanced floating subscribe CTA with better animations */}
      <AnimatePresence>
        {!userSubscription && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-8 right-8 z-40"
          >
            <Button
              size="lg"
              onClick={() => (window.location.href = "/dashboard/subscription")}
              className="shadow-2xl bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground hover:shadow-3xl transition-all duration-300 hover:scale-105 rounded-full group relative overflow-hidden px-6 py-3"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
              <Zap className="h-5 w-5 mr-3 group-hover:animate-pulse" />
              <span className="font-semibold">Subscribe to Unlock</span>
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