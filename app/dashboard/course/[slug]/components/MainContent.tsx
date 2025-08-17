"use client"

import React from "react"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { useProgress } from "@/hooks"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Play, Lock, User as UserIcon, Award, Badge, ChevronLeft, ChevronRight, Clock, Maximize2, Minimize2, Download, Share2, AlertTriangle } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { store } from "@/store"
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
import { MarkdownRenderer } from "./markdownUtils"


import { useVideoState, getVideoBookmarks } from "./video/hooks/useVideoState"
import { VideoDebug } from "./video/components/VideoDebug"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatePresence, motion } from "framer-motion"
import { User } from "@/modules/auth"
import { useAuth } from "@/modules/auth"
import { isAdmin } from "@/lib/auth"
import CourseActions from "./CourseActions"
import ActionButtons from "./ActionButtons"
import CourseInfo from "./CourseInfo"
import ReviewsSection from "./ReviewsSection"
import { setLastPosition, markLectureCompleted as markLectureCompletedProgress, setIsCourseCompleted, setCertificateDownloaded } from "@/store/slices/courseProgress-slice"
import { cn } from "@/lib/utils"
import { PDFDownloadLink } from "@react-pdf/renderer"
import CertificateGenerator from "./CertificateGenerator"
import RecommendedSection from "@/components/shared/RecommendedSection"
import type { BookmarkData } from "./video/types"
import { fetchRelatedCourses, fetchPersonalizedRecommendations, fetchQuizSuggestions } from "@/services/recommendationsService"
import type { RelatedCourse, PersonalizedRecommendation, QuizSuggestion } from "@/services/recommendationsService"
import ProgressTracker from "./ProgressTracker"
import EngagementPrompts from "./EngagementPrompts"

interface ModernCoursePageProps {
  course: FullCourseType
  initialChapterId?: string
  isFullscreen?: boolean
  onFullscreenToggle?: () => void
}

function validateChapter(chapter: any): boolean {
  return Boolean(
    chapter &&
      typeof chapter === "object" &&
      chapter.id && 
      (typeof chapter.id === "string" || typeof chapter.id === "number") // Allow number IDs too
  );
}

// Memoized components for better performance
const MemoizedVideoNavigationSidebar = React.memo(VideoNavigationSidebar)
const MemoizedVideoPlayer = React.memo(VideoPlayer)
const MemoizedCourseDetailsTabs = React.memo(CourseDetailsTabs)
const MemoizedAnimatedCourseAILogo = React.memo(AnimatedCourseAILogo)

  const MainContent: React.FC<ModernCoursePageProps> = ({ 
    course, 
    initialChapterId,
    isFullscreen = false,
    onFullscreenToggle
  }) => {
    // Early validation of course data
    if (!course || !course.id) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold">Course Not Found</h2>
            <p className="text-muted-foreground">The requested course could not be loaded.</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </div>
      )
    }
  // Always define all hooks at the top level - no early returns or conditions before hooks
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
  const [relatedCourses, setRelatedCourses] = useState<RelatedCourse[]>([])
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<PersonalizedRecommendation[]>([])
  const [quizSuggestions, setQuizSuggestions] = useState<QuizSuggestion[]>([])
  const [resumePromptShown, setResumePromptShown] = useState(false)
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>({})
  const [isVideoLoading, setIsVideoLoading] = useState(true)
  const [hasPlayedFreeVideo, setHasPlayedFreeVideo] = useState(false)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)


  const [showLogoOverlay, setShowLogoOverlay] = useState(false)
  const [playerRef, setPlayerRef] = useState<React.RefObject<any> | null>(null)
  const [wideMode, setWideMode] = useState(false)
  const [isPiPActive, setIsPiPActive] = useState(false) // Add PIP state tracking
  const isOwner = user?.id === course.userId;
  
  // Performance optimization: use ref for PIP state to prevent unnecessary re-renders
  const pipStateRef = useRef(false)
  
  // Mobile playlist state
  const [mobilePlaylistOpen, setMobilePlaylistOpen] = useState(false)
  
  // Auto-play mode state
  const [autoplayMode, setAutoplayMode] = useState(false)
  const [showAutoplayOverlay, setShowAutoplayOverlay] = useState(false)
  const [autoplayCountdown, setAutoplayCountdown] = useState(0)

  
  // Redux state
  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)
  const courseProgress = useAppSelector((state) => state.course.courseProgress[course.id])
  const twoCol = useMemo(() => !isFullscreen, [isFullscreen])

  // Get bookmarks for the current video - this is more reliable than trying to get them from Redux
  const bookmarks = useMemo(() => {
    return getVideoBookmarks(currentVideoId)
  }, [currentVideoId])

  // Adapt raw bookmark times to BookmarkData objects expected by VideoPlayer/BookmarkManager
  const bookmarkItems: BookmarkData[] = useMemo(() => {
    if (!currentVideoId) return []
    return (bookmarks || []).map((time, idx) => ({
      id: `${currentVideoId}-${time}-${idx}`,
      videoId: currentVideoId,
      time,
      title: `Bookmark ${formatDuration(time)}`,
      createdAt: new Date().toISOString(),
      description: undefined,
    }))
  }, [bookmarks, currentVideoId])

  // Fix: Initialize completedChapters safely so it's always defined
  const completedChapters = useMemo(() => {
    return (courseProgress?.completedChapters || []).map((id: number) => Number(id)).filter((n: number) => !isNaN(n))
  }, [courseProgress])

  // Check free video status on mount
  useEffect(() => {
    const freeVideoPlayed = migratedStorage.getPreference("played_free_video", false)
    setHasPlayedFreeVideo(Boolean(freeVideoPlayed))
    // Restore wide mode preference per course
    try {
      const saved = localStorage.getItem(`wide_mode_course_${course.id}`)
      if (saved === 'true') {
        setWideMode(true)
      } else if (typeof window !== 'undefined') {
        // Default to wide mode on desktop if no preference is set
        if (window.innerWidth >= 1280) {
          setWideMode(true)
        }
      }
    } catch {}
    
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
    
    if (!course?.courseUnits || course.courseUnits.length === 0) {
      return playlist
    }

    // Global index across all units/chapters to support implicit free gating
    let globalIndex = 0

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
            // Implicit free gating for first two videos
            isFree: Boolean(chapter.isFree) || globalIndex < 2,
            // Unlock only the first quiz (after two free videos we unlock the first quiz slot)
            // Here we choose the quiz tied to the second video (index 1)
            isFreeQuiz: globalIndex === 1,
          } as FullChapterType & { isFreeQuiz?: boolean }

          playlist.push({ videoId: chapter.videoId!, chapter: safeChapter })
          globalIndex += 1
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

  // Determine if current chapter is a key chapter (every 3rd chapter or last chapter)
  const isKeyChapter = useMemo(() => {
    return currentIndex > 0 && ((currentIndex + 1) % 3 === 0 || isLastVideo)
  }, [currentIndex, isLastVideo])

  // Progress tracking
  const { progress, updateProgress, isLoading: progressLoading } = useProgress({
    courseId: Number(course.id),
    currentChapterId: currentChapter?.id?.toString(),
  })

  // Determine user subscription once (used for gating below)
  const userSubscription = useMemo(() => {
    if (!subscription) return null
    return subscription.plan || null
  }, [subscription])

  // Check if user can play this video: allowed if chapter is free or user is subscribed
  const canPlayVideo = useMemo(() => {
    const allowedByChapter = currentChapter?.isFree === true
    return allowedByChapter || !!userSubscription
  }, [currentChapter?.isFree, userSubscription])

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

    // If still not found, try to use the last watched video from progress (API hook)
    if (!targetVideo && progress?.currentChapterId) {
      targetVideo = videoPlaylist.find(
        (entry) => String(entry.chapter.id) === String(progress.currentChapterId)
      )
    }

    // If still not found, try to use the current chapter from Redux progress slice
    try {
      if (!targetVideo && courseProgress?.currentChapterId) {
        targetVideo = videoPlaylist.find(
          (entry) => String(entry.chapter.id) === String(courseProgress.currentChapterId)
        ) || null
      }
    } catch {}

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
  }, [course.id, initialChapterId, videoPlaylist, dispatch, videoStateStore, currentVideoId, progress, courseProgress?.currentChapterId])

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
        // Persist last position in Redux slice (throttled internally via state comparisons)
        dispatch(
          setLastPosition({
            courseId: String(course.id),
            lectureId: String(currentChapter.id),
            timestamp: Math.floor(progressState.playedSeconds || 0),
          })
        )
      }
    },
    [currentChapter, videoEnding, updateProgress, videoDurations, currentVideoId, course.id, dispatch],
  )

  // Video event handlers
  const handleVideoEnd = useCallback(() => {
    if (currentChapter) {
      // Mark chapter as completed in legacy slice
      dispatch(markChapterAsCompleted({ courseId: Number(course.id), chapterId: Number(currentChapter.id) }))
      // Mark in new progress slice
      dispatch(
        markLectureCompletedProgress({
          courseId: String(course.id),
          lectureId: String(currentChapter.id),
        })
      )

      // Update progress
      updateProgress({
        // completedChapters: [...(progress?.completedChapters || []), Number(currentChapter.id)], // Remove invalid property
        isCompleted: isLastVideo,
        lastAccessedAt: new Date().toISOString(),
      })

      // If all lectures are completed, mark course completed in new slice
      try {
        const totalLectures = videoPlaylist.length
        const completed = (completedChapters?.length || 0) + 1 // include current
        if (totalLectures > 0 && completed >= totalLectures) {
          dispatch(setIsCourseCompleted({ courseId: String(course.id), isCourseCompleted: true }))
        }
      } catch {}

      // Mark free video as played if not authenticated
      if (!user && !hasPlayedFreeVideo) {
        // keep legacy preference but not relied upon for gating anymore
        migratedStorage.setPreference("played_free_video", true)
        setHasPlayedFreeVideo(true)
      }

      if (isLastVideo) {
        // Only show certificate if not already downloaded for this completion
        const courseProgress = store.getState().courseProgress.byCourseId[String(course.id)]
        if (!courseProgress?.certificateDownloaded) {
          setShowCertificate(true)
        }
        // The video player will handle the final chapter overlay, no need for additional logic here
      }
      // Auto-play logic is now handled by the video player's corner notification
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
    autoplayMode,
    videoPlaylist.length,
    completedChapters?.length,
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

  // Enhanced PIP handling with wide mode consideration
  const handlePIPToggle = useCallback((isPiPActive: boolean) => {
    // Only update state if it actually changed
    if (pipStateRef.current !== isPiPActive) {
      pipStateRef.current = isPiPActive
      setIsPiPActive(isPiPActive)
      
      // If PIP is activated and we're in wide mode, ensure video moves to top
      if (isPiPActive && wideMode) {
        // Scroll to top smoothly when PIP is activated in wide mode
        window.scrollTo({ top: 0, behavior: 'smooth' })
        
        // Add a small delay to ensure smooth transition
        setTimeout(() => {
          // Force a reflow to ensure smooth animation
          document.body.offsetHeight
        }, 100)
      }
    }
  }, [wideMode])

  // Auto-play mode toggle with persistence
  const handleAutoplayToggle = useCallback(() => {
    const newAutoplayMode = !autoplayMode
    setAutoplayMode(newAutoplayMode)
    
    // Save preference to localStorage
    try {
      localStorage.setItem(`autoplay_mode_course_${course.id}`, String(newAutoplayMode))
    } catch {}
    
    // Show feedback toast
    toast({
      title: newAutoplayMode ? "Auto-play Enabled" : "Auto-play Disabled",
      description: newAutoplayMode 
        ? "Chapters will automatically advance when completed" 
        : "You'll be prompted before each chapter transition",
    })
  }, [autoplayMode, course.id, toast])

  // Mobile playlist toggle
  const handleMobilePlaylistToggle = useCallback(() => {
    setMobilePlaylistOpen(prev => !prev)
  }, [])

  // Keyboard shortcuts for PIP and other controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.key.toLowerCase()) {
        case 'p':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            // Toggle PIP if video is playing
            if (currentVideoId && !isPiPActive) {
              handlePIPToggle(true)
            } else if (isPiPActive) {
              handlePIPToggle(false)
            }
          }
          break
        case 'escape':
          if (isPiPActive) {
            event.preventDefault()
            handlePIPToggle(false)
          }
          // Also close overlays
          
          break
        case 'a':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            handleAutoplayToggle()
          }
          break
        case 'space':
          // Prevent space from scrolling when video is focused
          if (currentVideoId) {
            event.preventDefault()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentVideoId, isPiPActive, handlePIPToggle, handleAutoplayToggle])

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

        // Check if user can play the selected video (free chapter or subscribed)
        const allowed = Boolean(safeChapter.isFree || userSubscription)
        if (!allowed) {
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



  // Cancel autoplay
  const handleCancelAutoplay = useCallback(() => {
    setShowAutoplayOverlay(false)
    setAutoplayCountdown(0)
  }, [])

  // Certificate handler - only show if not already downloaded for this completion
  const handleCertificateClick = useCallback(() => {
    const courseProgress = store.getState().courseProgress.byCourseId[String(course.id)]
    if (courseProgress?.isCourseCompleted && !courseProgress?.certificateDownloaded) {
      setShowCertificate(true)
    } else if (!courseProgress?.isCourseCompleted) {
      // Allow manual access if course not completed yet (for testing/admin)
      setShowCertificate(true)
    }
  }, [course.id])



  // Fetch related courses
  useEffect(() => {
    fetchRelatedCourses(course.id, 5).then(setRelatedCourses)
  }, [course.id])

  // Fetch personalized recommendations when course is completed
  useEffect(() => {
    if (isLastVideo && user) {
      fetchPersonalizedRecommendations(
        user.id,
        completedChapters?.map(String) || [],
        course,
        3
      ).then(setPersonalizedRecommendations)
    }
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

  // Memoized course stats for better performance
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

  // Enhanced next video navigation handler
  const handleNextVideo = useCallback(() => {
    if (!currentChapter || !videoPlaylist.length) return
    
    const currentIndex = videoPlaylist.findIndex(item => item.videoId === currentVideoId)
    if (currentIndex === -1 || currentIndex >= videoPlaylist.length - 1) return
    
    const nextVideo = videoPlaylist[currentIndex + 1]
    if (nextVideo && nextVideo.chapter) {
      console.log('Navigating to next video:', nextVideo.chapter.title)
      handleChapterSelect(nextVideo.chapter)
    }
  }, [currentChapter, videoPlaylist, currentVideoId, handleChapterSelect])

  // Enhanced previous video navigation handler
  const handlePrevVideo = useCallback(() => {
    if (!currentChapter || !videoPlaylist.length) return
    
    const currentIndex = videoPlaylist.findIndex(item => item.videoId === currentVideoId)
    if (currentIndex <= 0) return
    
    const prevVideo = videoPlaylist[currentIndex - 1]
    if (prevVideo && prevVideo.chapter) {
      console.log('Navigating to previous video:', prevVideo.chapter.title)
      handleChapterSelect(prevVideo.chapter)
    }
  }, [currentChapter, videoPlaylist, currentVideoId, handleChapterSelect])

  // Get next and previous video info
  const nextVideoInfo = useMemo(() => {
    if (!currentVideoId || !videoPlaylist.length) return null
    
    const currentIndex = videoPlaylist.findIndex(item => item.videoId === currentVideoId)
    if (currentIndex === -1 || currentIndex >= videoPlaylist.length - 1) return null
    
    const nextVideo = videoPlaylist[currentIndex + 1]
    return nextVideo ? {
      id: nextVideo.videoId,
      title: nextVideo.chapter?.title || 'Next Chapter'
    } : null
  }, [currentVideoId, videoPlaylist])

  const prevVideoInfo = useMemo(() => {
    if (!currentVideoId || !videoPlaylist.length) return null
    
    const currentIndex = videoPlaylist.findIndex(item => item.videoId === currentVideoId)
    if (currentIndex <= 0) return null
    
    const prevVideo = videoPlaylist[currentIndex - 1]
    return prevVideo ? {
      id: prevVideo.videoId,
      title: prevVideo.chapter?.title || 'Previous Chapter'
    } : null
  }, [currentVideoId, videoPlaylist])

  // Memoized sidebar props to prevent unnecessary re-renders
  const sidebarProps = useMemo(() => ({
    course,
    currentChapter,
    courseId: course.id.toString(),
    onChapterSelect: handleChapterSelect,
    progress,
    isAuthenticated: !!user,
    isSubscribed: !!userSubscription,
    completedChapters,
    formatDuration,
    nextVideoId: undefined,
    currentVideoId: currentVideoId || '',
    isPlaying: Boolean(currentVideoId),
    courseStats: {
      completedCount: progress?.completedChapters?.length || 0,
      totalChapters: videoPlaylist.length,
      progressPercentage: videoPlaylist.length > 0 ? Math.round(((progress?.completedChapters?.length || 0) / videoPlaylist.length) * 100) : 0,
    }
  }), [
    course,
    currentChapter,
    progress,
    user,
    userSubscription,
    completedChapters,
    formatDuration,
    currentVideoId,
    videoPlaylist.length
  ])

  // Memoized video player props
  const videoPlayerProps = useMemo(() => ({
    videoId: currentVideoId || '',
    courseId: course.id,
    chapterId: currentChapter?.id ? String(currentChapter.id) : undefined,
    courseName: course.title,
    chapterTitle: currentChapter?.title,
    onEnded: handleVideoEnd,
    onProgress: handleVideoProgress,
    onVideoLoad: handleVideoLoad,
    onPlayerReady: handlePlayerReady,
    onBookmark: handleSeekToBookmark,
    bookmarks: bookmarkItems,
    isAuthenticated: !!user,
    autoPlay: false,
    showControls: true,
    onCertificateClick: handleCertificateClick,
    onChapterComplete: handleChapterComplete,
    onNextVideo: handleNextVideo,
    nextVideoId: nextVideoInfo?.id || undefined,
    nextVideoTitle: nextVideoInfo?.title || '',
    onPrevVideo: handlePrevVideo,
    prevVideoTitle: prevVideoInfo?.title || '',
    hasNextVideo: !!nextVideoInfo,
    hasPrevVideo: !!prevVideoInfo,
    isFullscreen,
    onFullscreenToggle,
    onPictureInPictureToggle: handlePIPToggle,
    className: "h-full w-full",
     initialSeekSeconds: (function(){
       try {
         if (courseProgress?.currentChapterId && String(courseProgress.currentChapterId) === String(currentChapter?.id)) {
           const ts = Number(courseProgress.resumePoint || 0)
           if (!isNaN(ts) && ts > 0) return ts
         }
       } catch {}
       return undefined
     })(),
     // Enhanced overlay props
     relatedCourses: relatedCourses,
     progressStats: {
       completedCount: completedChapters?.length || 0,
       totalChapters: videoPlaylist.length,
       progressPercentage: videoPlaylist.length > 0 ? Math.round(((completedChapters?.length || 0) / videoPlaylist.length) * 100) : 0
     },
     quizSuggestions: quizSuggestions,
     personalizedRecommendations: personalizedRecommendations,
     isKeyChapter: isKeyChapter,
   }), [
     currentVideoId,
     course.id,
     currentChapter?.id,
     course.title,
     handleVideoEnd,
     handleVideoProgress,
     handleVideoLoad,
     handlePlayerReady,
     handleSeekToBookmark,
     bookmarkItems,
     user,
     handleCertificateClick,
     handleChapterComplete,
     handleNextVideo,
     handlePrevVideo,
     nextVideoInfo,
     prevVideoInfo,
     isFullscreen,
     onFullscreenToggle,
     handlePIPToggle,
     courseProgress?.currentChapterId,
     courseProgress?.resumePoint,
     completedChapters,
     videoPlaylist.length,
     isKeyChapter,
     currentChapter?.id,
     relatedCourses,
     personalizedRecommendations,
     quizSuggestions
   ])

  // Memoized wide mode toggle handler for better performance
  const handleWideModeToggle = useCallback(() => {
    setWideMode((v) => {
      const next = !v
      try { 
        localStorage.setItem(`wide_mode_course_${course.id}`, String(next)) 
      } catch {}
      return next
    })
  }, [course.id])

  // Create content for auth prompt here instead of doing an early return
  const authPromptContent = (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Unlock this lesson</h3>
          <p className="text-muted-foreground mb-6">
            The first two chapters (including summary and quiz) are free. Upgrade your plan to access all remaining lessons.
          </p>
          <div className="space-y-3">
            <Button onClick={() => (window.location.href = "/dashboard/subscription")} className="w-full" size="lg">
              Upgrade Now
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/api/auth/signin")} className="w-full">
              <UserIcon className="h-4 w-4 mr-2" />
              Sign In
            </Button>
            <Button variant="ghost" onClick={() => setShowAuthPrompt(false)} className="w-full">
              Back to Course
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  // Determine access levels based on subscription
  const accessLevels: AccessLevels = useMemo(() => {
    return {
      isSubscribed: !!userSubscription,
      isAdmin: !!user?.isAdmin,
      isAuthenticated: !!user,
    }
  }, [userSubscription, user])

  // Memoized grid layout classes for better performance
  const gridLayoutClasses = useMemo(() => {
    if (isPiPActive) {
      // When PIP is active, use single column layout to move video to top
      return "grid-cols-1"
    }
    
    if (twoCol) {
      // Udemy-style layout: video/content left, playlist right
      return "md:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px]"
    }
    
    return "grid-cols-1"
  }, [twoCol, isPiPActive])

  // Enhanced grid container with smooth transitions
  const gridContainerClasses = useMemo(() => {
    return cn(
      "grid gap-4 transition-all duration-300 ease-in-out",
      gridLayoutClasses
    )
  }, [gridLayoutClasses])

  // Regular content
  const regularContent = (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="flex">
                 {/* Main content */}        <main className="flex-1 min-w-0">
             {/* Top toolbar: width toggle and keys hint */}
             <div className="mx-auto py-3 px-4 sm:px-6 lg:px-8 max-w-7xl flex items-center justify-between">
               <div className="flex items-center gap-3">
                 {/* PIP Status Indicator */}
                 {isPiPActive && (
                   <motion.div
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-md border border-primary/20"
                   >
                     <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                     PIP Active
                   </motion.div>
                 )}
               </div>
               
               <span className="ml-2 hidden md:inline text-xs text-muted-foreground">
                 Video controls: F Fullscreen • B Bookmark • P PiP • Space Play/Pause • Esc Close
               </span>
             </div>
             <ActionButtons slug={course.slug} isOwner={isOwner} variant="compact" title={course.title} />

            {/* Removed CourseInfo to avoid title duplication; header H1 remains the single source. */}

            {/* Video Generation Section */}
            {(isOwner || user?.isAdmin) && (
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
            )}

            {/* Above playlist: Remove duplicate autoplay toggle and keep only mobile playlist toggle */}
            <div className="mb-4 flex items-center justify-end">
              {/* Right: Mobile playlist toggle */}
              <div className="md:hidden w-full">
                <Button
                  variant="outline"
                  onClick={handleMobilePlaylistToggle}
                  className="w-full bg-gradient-to-r from-background/90 to-background/80 backdrop-blur-sm border-primary/30 hover:border-primary/50 hover:bg-background/95 relative overflow-hidden shadow-sm transition-all duration-300"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <ChevronLeft className="h-4 w-4 mr-2 text-primary" />
                      <span className="font-medium">Course Content</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {currentChapter ? `${currentIndex + 1}/${videoPlaylist.length}` : `0/${videoPlaylist.length}`}
                        </span>
                        {currentChapter && (
                          <div className="w-20 h-2 bg-muted/50 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                              style={{ width: `${((currentIndex + 1) / videoPlaylist.length) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Video player section */}
            <div className={gridContainerClasses}> 
              {/* Right column: Video and tabs (main content) */}
              <motion.div 
                key="video-content"
                layout
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="min-w-0"
              >
                 
                 {/* Video player */}
                 <div className="w-full">
                   {/* Autoplay banner removed in favor of compact toggle inside player controls */}
                    
                    <div 
                      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden ring-1 ring-primary/20 shadow-sm ai-glass dark:ai-glass-dark focus-within:ring-2 focus-within:ring-primary/50 transition-all duration-300"
                      tabIndex={-1}
                      role="region"
                      aria-label="Video player"
                    >
                      {(!currentVideoId || isVideoLoading || progressLoading) ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 bg-gradient-to-br from-black/80 to-black/60">
                          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                          <div className="text-center space-y-2">
                            <div className="h-4 w-32 bg-white/20 rounded animate-pulse mx-auto" />
                            <div className="h-3 w-24 bg-white/15 rounded animate-pulse mx-auto" />
                            <p className="text-white/70 text-sm">Loading video content...</p>
                          </div>
                        </div>
                      ) : null}
                      {currentVideoId ? (
                        <>
                          <MemoizedVideoPlayer {...videoPlayerProps} />
                          {/* CourseAI Logo Overlay */}
                          <MemoizedAnimatedCourseAILogo
                            show={showLogoOverlay}
                            videoEnding={videoEnding}
                            onAnimationComplete={() => setShowLogoOverlay(false)}
                          />
                        </>
                      ) : videoPlaylist.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-900 to-black">
                          <div className="text-center text-white p-6 max-w-md">
                            <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                              <AlertTriangle className="h-10 w-10 text-yellow-500" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-3">No Content Available</h3>
                            <p className="text-white/70 mb-6 leading-relaxed">
                              This course doesn't have any video content yet. Please check back later or contact the instructor.
                            </p>
                            <div className="flex items-center justify-center gap-2 text-sm text-white/50">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                              <span>Content coming soon</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-900 to-black">
                          <div className="text-center text-white p-6 max-w-md">
                            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                              <Play className="h-10 w-10 text-primary" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-3">Ready to Learn?</h3>
                            <p className="text-white/70 mb-6 leading-relaxed">
                              Choose a chapter from the course content to begin your learning journey. 
                              The first two chapters are free to preview!
                            </p>
                            <div className="flex items-center justify-center gap-2 text-sm text-white/50">
                              <div className="w-2 h-2 bg-primary rounded-full" />
                              <span>Select any chapter to start</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
  
                  {/* Chapter Progress Indicator */}
                  {currentChapter && !isLastVideo && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-5 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                          <div>
                            <span className="text-sm font-semibold text-foreground">
                              Chapter {currentIndex + 1} of {videoPlaylist.length}
                            </span>
                            <div className="text-xs text-muted-foreground mt-1">
                              {currentChapter.title}
                            </div>
                          </div>
                        </div>
                        {nextChapter && (
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground mb-1">Next up:</div>
                            <div className="text-sm font-medium text-foreground line-clamp-1 max-w-48">
                              {nextChapter.chapter.title}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-muted/30 rounded-full h-2 mb-3">
                        <div 
                          className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${((currentIndex + 1) / videoPlaylist.length) * 100}%` }}
                        />
                      </div>
                      
                      {/* Chapter info */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {currentChapter.duration ? formatDuration(currentChapter.duration) : '~5 min'}
                        </span>
                        {nextChapter && (
                          <div className="flex items-center gap-2">
                            <span>Next chapter:</span>
                            <span className="font-medium text-primary">
                              {nextChapter.chapter.duration ? formatDuration(nextChapter.chapter.duration) : '~5 min'}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
  
                  {/* Tabs below video: Summary, Quiz, Bookmarks, etc */}
                  <div className="rounded-xl border bg-card/60 ai-glass dark:ai-glass-dark mt-4 overflow-hidden">
                    {progressLoading ? (
                      <div className="p-6 animate-pulse space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-primary/20 rounded-full" />
                          <div className="h-6 bg-muted/50 rounded w-1/3" />
                        </div>
                        <div className="space-y-3">
                          <div className="h-4 bg-muted/40 rounded w-full" />
                          <div className="h-4 bg-muted/40 rounded w-2/3" />
                          <div className="h-4 bg-muted/40 rounded w-4/5" />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <div className="h-8 bg-muted/30 rounded w-16" />
                          <div className="h-8 bg-muted/30 rounded w-20" />
                          <div className="h-8 bg-muted/30 rounded w-24" />
                        </div>
                      </div>
                    ) : (
                      <MemoizedCourseDetailsTabs
                        course={course}
                        currentChapter={currentChapter}
                        accessLevels={accessLevels}
                        onSeekToBookmark={handleSeekToBookmark}
                      />
                    )}
                  </div>
 
                  {/* Reviews Section */}
                  <ReviewsSection slug={course.slug} />
  
                </motion.div>
 
               {/* Right column: Playlist (desktop) */}
               <AnimatePresence mode="wait">
                 {!isPiPActive && (
                   <motion.div 
                     key="sidebar-right"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 20 }}
                     transition={{ duration: 0.3, ease: "easeInOut" }}
                     className="hidden md:block"
                   >
                     <div className="sticky top-4">
                       <div className="rounded-xl border bg-card/60 ai-glass dark:ai-glass-dark">
                         {progressLoading ? (
                           <div className="p-4 animate-pulse space-y-4">
                             <div className="flex items-center gap-2 mb-3">
                               <div className="w-3 h-3 bg-primary/20 rounded-full" />
                               <div className="h-4 bg-muted/50 rounded w-1/2" />
                             </div>
                             <div className="space-y-2">
                               <div className="h-3 bg-muted/40 rounded w-full" />
                               <div className="h-3 bg-muted/40 rounded w-3/4" />
                               <div className="h-3 bg-muted/40 rounded w-2/3" />
                               <div className="h-3 bg-muted/40 rounded w-4/5" />
                               <div className="h-3 bg-muted/40 rounded w-1/2" />
                             </div>
                           </div>
                         ) : (
                           <div className="space-y-4">
                             <MemoizedVideoNavigationSidebar {...sidebarProps} />
                             
                             {/* Progress Tracker */}
                             <div className="rounded-xl border bg-card/60 ai-glass dark:ai-glass-dark p-4">
                               <ProgressTracker
                                 courseId={course.id}
                                 currentChapterId={currentChapter?.id ? String(currentChapter.id) : undefined}
                                 totalChapters={videoPlaylist.length}
                                 completedChapters={completedChapters.map(id => String(id))}
                                 onProgressUpdate={(progress) => {
                                   // Update any global progress state if needed
                                   console.log('Progress updated:', progress)
                                 }}
                                 onChapterComplete={(chapterId) => {
                                   // Handle chapter completion
                                   console.log('Chapter completed:', chapterId)
                                 }}
                                 onCourseComplete={() => {
                                   // Handle course completion
                                   console.log('Course completed!')
                                 }}
                               />
                             </div>
                             
                             {/* Engagement Prompts */}
                             <EngagementPrompts
                               courseId={String(course.id)}
                               currentChapterId={currentChapter?.id ? String(currentChapter.id) : undefined}
                               completedChapters={completedChapters.map(id => String(id))}
                               totalChapters={videoPlaylist.length}
                               onDismiss={(promptId) => {
                                 // Handle prompt dismissal
                                 console.log('Prompt dismissed:', promptId)
                               }}
                             />
                           </div>
                         )}
                       </div>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>

            {/* Mobile playlist overlay */}
            <AnimatePresence>
              {mobilePlaylistOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                  onClick={() => setMobilePlaylistOpen(false)}
                >
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background border-l shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-4 border-b bg-card/80 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Course Content</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMobilePlaylistOpen(false)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 space-y-4">
                      <MemoizedVideoNavigationSidebar {...sidebarProps} />
                      
                      {/* Progress Tracker for Mobile */}
                      <div className="rounded-xl border bg-card/60 ai-glass dark:ai-glass-dark p-4">
                        <ProgressTracker
                          courseId={course.id}
                          currentChapterId={currentChapter?.id ? String(currentChapter.id) : undefined}
                          totalChapters={videoPlaylist.length}
                          completedChapters={completedChapters.map(id => String(id))}
                          onProgressUpdate={(progress) => {
                            console.log('Progress updated:', progress)
                          }}
                          onChapterComplete={(chapterId) => {
                            console.log('Chapter completed:', chapterId)
                          }}
                          onCourseComplete={() => {
                            console.log('Course completed!')
                          }}
                        />
                      </div>
                      
                      {/* Engagement Prompts for Mobile */}
                      <EngagementPrompts
                        courseId={String(course.id)}
                        currentChapterId={currentChapter?.id ? String(currentChapter.id) : undefined}
                        completedChapters={completedChapters.map(id => String(id))}
                        totalChapters={videoPlaylist.length}
                        onDismiss={(promptId) => {
                          console.log('Prompt dismissed:', promptId)
                        }}
                      />
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {false && (
              <div className="rounded-xl border bg-card/50 lg:hidden" />
            )}

              {/* Related courses recommendation */}
              {Array.isArray((course as any)?.relatedCourses) && (course as any).relatedCourses.length > 0 && (
                <RecommendedSection title="Recommended for you" className="mt-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {(course as any).relatedCourses.slice(0, 3).map((c: any, idx: number) => (
                      <div key={c.id || idx}>
                        <div className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-background/60">
                          <div className="p-4">
                            <div className="font-semibold line-clamp-2">{c.title}</div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{c.description}</p>
                            <Button
                              variant="outline"
                              className="mt-3 w-full"
                              onClick={() => (window.location.href = `/dashboard/course/${c.slug}`)}
                            >
                              View Course
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </RecommendedSection>
              )}
          
        </main>
        {/* Sticky mobile Next Lesson CTA removed per request */}
                 {/* Sidebar responsive tweaks */}
          {false && (
            <aside className="hidden lg:block w-full max-w-[24rem] border-l bg-background/50 backdrop-blur-sm">
              <MemoizedVideoNavigationSidebar {...sidebarProps} />
            </aside>
          )}
       </div>

      {/* Floating subscribe CTA for guests/free users */}
      {!userSubscription && (
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <Button
            size="lg"
            onClick={() => (window.location.href = "/dashboard/subscription")}
            className="shadow-2xl bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 transition-all duration-300 hover:scale-[1.05] rounded-full px-6 py-3 font-semibold text-base"
          >
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              <span>Unlock All Content</span>
            </div>
          </Button>
        </motion.div>
      )}

      {/* Enhanced Certificate modal */}
      <AnimatePresence>
        {showCertificate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowCertificate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 300,
                duration: 0.3 
              }}
              className="bg-background rounded-2xl shadow-2xl border border-border/50 max-w-lg w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with celebration animation */}
              <div className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-6 text-white text-center overflow-hidden">
                {/* Floating celebration elements */}
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  className="absolute top-2 right-2"
                >
                  <span className="text-2xl">🎉</span>
                </motion.div>
                
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="absolute top-2 left-2"
                >
                  <span className="text-2xl">🏆</span>
                </motion.div>

                {/* Main header content */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="relative z-10"
                >
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <Award className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">
                    Congratulations!
                  </h2>
                  <p className="text-lg text-white/90 font-medium">
                    You've completed the course
                  </p>
                </motion.div>

                {/* Course title with gradient text */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="mt-4"
                >
                  <h3 className="text-xl font-semibold bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
                    "{course.title}"
                  </h3>
                </motion.div>
              </div>

              {/* Certificate content */}
              <div className="p-6 space-y-6">
                {/* Achievement stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="text-center p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {videoPlaylist.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Lessons Completed
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      100%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Course Progress
                    </div>
                  </div>
                </motion.div>

                {/* Certificate preview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                      Your Certificate
                    </h4>
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">CA</span>
                    </div>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    A professional certificate showcasing your achievement in {course.title}
                  </p>
                </motion.div>

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.5 }}
                  className="space-y-3"
                >
                  {/* Download Certificate Button */}
                  <PDFDownloadLink
                    document={<CertificateGenerator courseName={course.title} userName={user?.name || "Student"} />}
                    fileName={`${(course.title || 'Course').replace(/\s+/g, '_')}_Certificate.pdf`}
                    className="w-full"
                  >
                    {({ loading }) => (
                      <Button 
                        disabled={loading} 
                        className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                        onClick={() => {
                          // Mark certificate as downloaded to prevent repeated showing
                          dispatch(setCertificateDownloaded({ courseId: String(course.id), downloaded: true }))
                          toast({
                            title: "Certificate Downloaded!",
                            description: "Your course completion certificate has been downloaded successfully.",
                          })
                        }}
                      >
                        {loading ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                            />
                            Generating Certificate...
                          </>
                        ) : (
                          <>
                            <Download className="h-5 w-5 mr-2" />
                            Download Certificate
                          </>
                        )}
                      </Button>
                    )}
                  </PDFDownloadLink>

                  {/* Share Certificate Button */}
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      // Share functionality
                      if (navigator.share) {
                        navigator.share({
                          title: `I completed ${course.title} on CourseAI!`,
                          text: `Check out my certificate for completing ${course.title} on CourseAI!`,
                          url: window.location.href,
                        })
                      } else {
                        // Fallback to clipboard
                        navigator.clipboard.writeText(window.location.href)
                        toast({
                          title: "Link Copied!",
                          description: "Course link copied to clipboard",
                        })
                      }
                    }}
                    className="w-full h-12 border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
                  >
                    <Share2 className="h-5 w-5 mr-2" />
                    Share Achievement
                  </Button>

                  {/* Continue Learning Button */}
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowCertificate(false)}
                    className="w-full h-12 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300"
                  >
                    Continue Learning
                  </Button>
                </motion.div>

                {/* Social sharing suggestions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  className="text-center pt-4 border-t border-border/50"
                >
                  <p className="text-sm text-muted-foreground mb-3">
                    Share your achievement with the world!
                  </p>
                  <div className="flex justify-center space-x-4">
                    {['LinkedIn', 'Twitter', 'Facebook'].map((platform) => (
                      <button
                        key={platform}
                        className="w-10 h-10 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors duration-300"
                        onClick={() => {
                          const url = `https://www.${platform.toLowerCase()}.com/share?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`I just completed ${course.title} on CourseAI!`)}`
                          window.open(url, '_blank')
                        }}
                      >
                        <span className="text-xs font-medium text-muted-foreground hover:text-primary">
                          {platform.charAt(0)}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
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
}

export default React.memo(MainContent)
