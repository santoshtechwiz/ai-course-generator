"use client"

import React from "react"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { useProgress } from "@/hooks"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Play, Lock, User as UserIcon, Award, Badge, ChevronLeft, ChevronRight, Clock, Maximize2, Minimize2, Download, Share2 } from "lucide-react"
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
import { setLastPosition, markLectureCompleted as markLectureCompletedProgress, setIsCourseCompleted, makeSelectCourseProgressById } from "@/store/slices/courseProgress-slice"
import { cn } from "@/lib/utils"
import { PDFDownloadLink } from "@react-pdf/renderer"
import CertificateGenerator from "./CertificateGenerator"
import RecommendedSection from "@/components/shared/RecommendedSection"
import type { BookmarkData } from "./video/types"

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

// Memoized components for better performance
const MemoizedVideoNavigationSidebar = React.memo(VideoNavigationSidebar)
const MemoizedVideoPlayer = React.memo(VideoPlayer)
const MemoizedCourseDetailsTabs = React.memo(CourseDetailsTabs)
const MemoizedAnimatedCourseAILogo = React.memo(AnimatedCourseAILogo)

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

  const [showAutoplayOverlay, setShowAutoplayOverlay] = useState(false)
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
  const [autoplayCountdown, setAutoplayCountdown] = useState(5)
  const [nextChapterInfo, setNextChapterInfo] = useState<{
    title: string
    description?: string
    thumbnail?: string
    duration?: number
  } | null>(null)
  const [showChapterTransition, setShowChapterTransition] = useState(false)
  
  // Redux state
  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)
  const legacyCourseProgress = useAppSelector((state) => state.course.courseProgress[course.id])
  const selectCourseProgress = useMemo(() => makeSelectCourseProgressById(), [])
  const courseProgress = useAppSelector((state) => selectCourseProgress(state as any, course.id))
  const twoCol = useMemo(() => !theatreMode && !isFullscreen, [theatreMode, isFullscreen])

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
  // Use courseProgress.completedChapters if available, otherwise empty array
  const completedChapters = useMemo(() => {
    if (courseProgress?.completedLectures) return courseProgress.completedLectures.map((id: string) => Number(id)).filter((n: number) => !isNaN(n))
    return (legacyCourseProgress?.completedChapters || []).map((id: number) => Number(id)).filter((n: number) => !isNaN(n))
  }, [courseProgress, legacyCourseProgress])

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
    
    if (!course?.courseUnits) {
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

    // If still not found, try to use the last watched lecture from Redux progress slice
    try {
      if (!targetVideo && courseProgress?.lastLectureId) {
        targetVideo = videoPlaylist.find(
          (entry) => String(entry.chapter.id) === String(courseProgress.lastLectureId)
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
  }, [course.id, initialChapterId, videoPlaylist, dispatch, videoStateStore, currentVideoId, progress, courseProgress?.lastLectureId])

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
        setShowCertificate(true)
      } else if (nextChapter && autoplayMode) {
        // Show chapter transition overlay with countdown
        setNextChapterInfo({
          title: nextChapter.chapter.title,
          description: nextChapter.chapter.description,
          duration: nextChapter.chapter.duration,
        })
        setShowChapterTransition(true)
        setAutoplayCountdown(5)
        // Start countdown timer
        const countdownInterval = setInterval(() => {
          setAutoplayCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval)
              // Auto-advance to next chapter
              handleChapterSelect(nextChapter.chapter)
              setShowChapterTransition(false)
              setNextChapterInfo(null)
              return 5
            }
            return prev - 1
          })
        }, 1000)
      } else if (nextChapter && !autoplayMode) {
        // Show manual autoplay prompt
        setNextChapterInfo({
          title: nextChapter.chapter.title,
          description: nextChapter.chapter.description,
          duration: nextChapter.chapter.duration,
        })
        setShowAutoplayOverlay(true)
        setAutoplayCountdown(5)
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
          if (showChapterTransition) {
            setShowChapterTransition(false)
            setNextChapterInfo(null)
            setAutoplayCountdown(5)
          }
          if (showAutoplayOverlay) {
            setShowAutoplayOverlay(false)
            setNextChapterInfo(null)
            setAutoplayCountdown(5)
          }
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
  }, [currentVideoId, isPiPActive, handlePIPToggle, showChapterTransition, showAutoplayOverlay, handleAutoplayToggle])

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

  const handleNextVideo = useCallback(() => {
    /* Next navigation removed per request */
  }, [])

  const handlePrevVideo = useCallback(() => {
    /* Prev navigation removed per request */
  }, [])

  // Cancel autoplay
  const handleCancelAutoplay = useCallback(() => {
    setShowAutoplayOverlay(false)
    setAutoplayCountdown(0)
  }, [])

  // Certificate handler
  const handleCertificateClick = useCallback(() => {
    setShowCertificate(true)
  }, [])

  // Autoplay logic removed per request
  useEffect(() => {
    setShowAutoplayOverlay(false)
    setAutoplayCountdown(0)
  }, [])

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
    videoId: currentVideoId,
    courseId: course.id,
    chapterId: currentChapter?.id ? String(currentChapter.id) : undefined,
    courseName: course.title,
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
    onNextVideo: undefined,
    nextVideoId: undefined,
    nextVideoTitle: '',
    onPrevVideo: undefined,
    prevVideoTitle: '',
    hasNextVideo: false,
    theatreMode,
    isFullscreen,
    onTheaterModeToggle,
    onPictureInPictureToggle: handlePIPToggle,
         className: "h-full w-full",
     initialSeekSeconds: (function(){
       try {
         if (courseProgress?.lastLectureId && String(courseProgress.lastLectureId) === String(currentChapter?.id)) {
           const ts = Number(courseProgress.lastTimestamp)
           if (!isNaN(ts) && ts > 0) return ts
         }
       } catch {}
       return undefined
     })(),
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
     theatreMode,
     isFullscreen,
     onTheaterModeToggle,
     handlePIPToggle,
     courseProgress?.lastLectureId,
     courseProgress?.lastTimestamp
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
      // Udemy-style layout: video on left, playlist on right
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
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={handleWideModeToggle}
                   className="gap-2"
                 >
                   {wideMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                   {wideMode ? "Normal width" : "Wider video"}
                 </Button>
                 
                 {/* Auto-play Mode Toggle */}
                 <Button
                   variant={autoplayMode ? "default" : "outline"}
                   size="sm"
                   onClick={handleAutoplayToggle}
                   className={cn(
                     "gap-2 transition-all duration-300",
                     autoplayMode && "bg-green-600 hover:bg-green-700 text-white"
                   )}
                 >
                   <div className={cn(
                     "w-2 h-2 rounded-full transition-all duration-300",
                     autoplayMode ? "bg-white" : "bg-green-500"
                   )} />
                   {autoplayMode ? "Auto-play ON" : "Auto-play OFF"}
                 </Button>
                 
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
                 Keys: T Theater • F Fullscreen • B Bookmark • Ctrl+P PIP • Ctrl+A Auto-play • Esc Close
               </span>
             </div>
             <ActionButtons slug={course.slug} isOwner={isOwner} variant="compact" title={course.title} />

              {/* Course info header */}
              <CourseInfo
                course={course}
                progressPercentage={(() => {
                  const total = videoPlaylist.length
                  const done = (completedChapters?.length || 0)
                  return total > 0 ? Math.round((done / total) * 100) : 0
                })()}
              />

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

            {/* Mobile playlist toggle button - positioned above video for better UX */}
            <div className="md:hidden mb-4">
              <Button
                variant="outline"
                onClick={handleMobilePlaylistToggle}
                className="w-full bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-background/90 relative overflow-hidden"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    <span>Course Content</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{currentChapter ? `${currentIndex + 1}/${videoPlaylist.length}` : `0/${videoPlaylist.length}`}</span>
                    {currentChapter && (
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${((currentIndex + 1) / videoPlaylist.length) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Button>
            </div>

            {/* Video player section */}
            <div className={gridContainerClasses}> 
              {/* Left column: Video and tabs (main content) */}
              <motion.div 
                key="video-content"
                layout
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="min-w-0"
              >
 
                {/* Video player */}
                <div className="w-full">
                 {/* Auto-play mode indicator */}
                 {autoplayMode && (
                   <motion.div
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="mb-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between"
                   >
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                       <span className="text-sm font-medium text-green-800 dark:text-green-200">
                         Auto-play Mode Active
                       </span>
                       <span className="text-xs text-green-600 dark:text-green-400">
                         Chapters will automatically advance
                       </span>
                     </div>
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={handleAutoplayToggle}
                       className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/50"
                     >
                       Disable
                     </Button>
                   </motion.div>
                 )}
                 
                 <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden ring-1 ring-primary/20 shadow-sm ai-glass dark:ai-glass-dark">
                    {(!currentVideoId || isVideoLoading || progressLoading) ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                        <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
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
                </div>
 
                {/* Chapter Progress Indicator */}
                {currentChapter && !isLastVideo && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-muted/30 rounded-xl border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="text-sm font-medium text-foreground">
                          Chapter {currentIndex + 1} of {videoPlaylist.length}
                        </span>
                      </div>
                      {nextChapter && (
                        <div className="text-xs text-muted-foreground">
                          Next: {nextChapter.chapter.title}
                        </div>
                      )}
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-muted rounded-full h-2 mb-3">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full"
                      />
                    </div>
                    
                    {/* Chapter info */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{currentChapter.title}</span>
                      {nextChapter && (
                        <div className="flex items-center gap-2">
                          <span>Next chapter in:</span>
                          <span className="font-medium text-primary">
                            {nextChapter.chapter.duration ? formatDuration(nextChapter.chapter.duration) : '~5 min'}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
 
                {/* Tabs below video: Summary, Quiz, Bookmarks, etc */}
                <div className="rounded-xl border bg-card/60 ai-glass dark:ai-glass-dark mt-4">
                  {progressLoading ? (
                    <div className="p-4 animate-pulse space-y-3">
                      <div className="h-8 bg-muted/50 rounded" />
                      <div className="h-5 bg-muted/40 rounded w-1/2" />
                      <div className="h-5 bg-muted/40 rounded w-2/3" />
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

              {/* Right column: Playlist (desktop) - Udemy style */}
              <AnimatePresence mode="wait">
                {!isPiPActive && (
                  <motion.div 
                    key="sidebar"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="hidden md:block"
                  >
                    <div className="sticky top-4">
                      <div className="rounded-xl border bg-card/60 ai-glass dark:ai-glass-dark">
                        {progressLoading ? (
                          <div className="p-4 animate-pulse space-y-3">
                            <div className="h-4 bg-muted/50 rounded w-3/5" />
                            <div className="h-4 bg-muted/40 rounded w-2/5" />
                            <div className="h-4 bg-muted/40 rounded w-4/5" />
                          </div>
                        ) : (
                          <MemoizedVideoNavigationSidebar {...sidebarProps} />
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
                    <div className="p-4">
                      <MemoizedVideoNavigationSidebar {...sidebarProps} />
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
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            size="lg"
            onClick={() => (window.location.href = "/dashboard/subscription")}
            className="shadow-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90 transition-transform hover:scale-[1.02] rounded-full"
          >
            Subscribe to Unlock
          </Button>
        </div>
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

      {/* Chapter Transition Overlay - Auto-play mode */}
      <AnimatePresence>
        {showChapterTransition && nextChapterInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
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
              className="bg-background rounded-2xl shadow-2xl border border-border/50 max-w-md w-full text-center overflow-hidden"
            >
              {/* Header with next chapter info */}
              <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white">
                {/* Countdown timer */}
                <div className="absolute top-4 right-4">
                  <motion.div
                    key={autoplayCountdown}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30"
                  >
                    <span className="text-xl font-bold">{autoplayCountdown}</span>
                  </motion.div>
                </div>

                {/* Next chapter icon */}
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <ChevronRight className="h-8 w-8 text-white" />
                </div>

                <h2 className="text-2xl font-bold mb-2">Next Chapter</h2>
                <p className="text-white/90">Auto-playing in {autoplayCountdown} seconds</p>
              </div>

              {/* Chapter content */}
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-semibold text-foreground">
                  {nextChapterInfo.title}
                </h3>
                
                {nextChapterInfo.description && (
                  <p className="text-muted-foreground text-sm">
                    {nextChapterInfo.description}
                  </p>
                )}

                {nextChapterInfo.duration && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(nextChapterInfo.duration)}</span>
                  </div>
                )}

                {/* Progress indicator */}
                <div className="w-full bg-muted rounded-full h-2">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${((5 - autoplayCountdown) / 5) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowChapterTransition(false)
                      setNextChapterInfo(null)
                      setAutoplayCountdown(5)
                    }}
                    className="flex-1"
                  >
                    Cancel Auto-play
                  </Button>
                  
                  <Button
                    onClick={() => {
                      if (nextChapter) {
                        handleChapterSelect(nextChapter.chapter)
                        setShowChapterTransition(false)
                        setNextChapterInfo(null)
                        setAutoplayCountdown(5)
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    Play Now
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Autoplay Overlay - Manual mode */}
      <AnimatePresence>
        {showAutoplayOverlay && nextChapterInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
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
              className="bg-background rounded-2xl shadow-2xl border border-border/50 max-w-md w-full text-center overflow-hidden"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <Play className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Next Chapter Ready</h2>
                <p className="text-white/90">Would you like to continue?</p>
              </div>

              {/* Chapter content */}
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-semibold text-foreground">
                  {nextChapterInfo.title}
                </h3>
                
                {nextChapterInfo.description && (
                  <p className="text-muted-foreground text-sm">
                    {nextChapterInfo.description}
                  </p>
                )}

                {nextChapterInfo.duration && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(nextChapterInfo.duration)}</span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAutoplayOverlay(false)
                      setNextChapterInfo(null)
                      setAutoplayCountdown(5)
                    }}
                    className="flex-1"
                  >
                    Stay Here
                  </Button>
                  
                  <Button
                    onClick={() => {
                      if (nextChapter) {
                        handleChapterSelect(nextChapter.chapter)
                        setShowAutoplayOverlay(false)
                        setNextChapterInfo(null)
                        setAutoplayCountdown(5)
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  >
                    Continue Learning
                  </Button>
                </div>

                {/* Enable auto-play option */}
                <div className="pt-4 border-t border-border/50">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setAutoplayMode(true)
                      toast({
                        title: "Auto-play Enabled",
                        description: "Chapters will automatically advance from now on",
                      })
                    }}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Enable Auto-play for future chapters
                  </Button>
                </div>
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

export default React.memo(MainContent)
