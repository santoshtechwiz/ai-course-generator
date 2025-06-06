"use client"

import React, { useEffect, useMemo, useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import MainContent from "./MainContent"
import VideoNavigationSidebar from "./VideoNavigationSidebar"
import type { FullCourseType, FullChapterType } from "@/app/types/types"
import { throttle } from "lodash"
import { Loader2, X } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/tailwindUtils"
import { CourseCompletionOverlay } from "./CourseCompletionOverlay"
import MobilePlayList from "./MobilePlayList"
import { useAuth } from "@/hooks"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { 
  setCurrentVideoApi, 
  initializeCourseState, 
  setCourseCompletionStatus,
  updateProgress as updateProgressAction,
  markChapterAsCompleted as markChapterAsCompletedAction,
  setNextVideoId,
  setPrevVideoId
} from "@/store/slices/courseSlice"
import useProgress from "@/hooks/useProgress"
import YouTubeOptimizer from './YouTubeOptimizer'

// Custom Hook for Video Playlist
function useVideoPlaylist(course: FullCourseType) {
  return useMemo(() => {
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
}

export default function CoursePage({ course, initialChapterId }: {
  course: FullCourseType
  initialChapterId?: string
}) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const { user, isLoading: isProfileLoading } = useAuth()
  
  // These hooks must be called in the same order every time,
  // so we define all state hooks first
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false)
  const [forceShowContent, setForceShowContent] = useState(false)
  
  // Then define all refs
  const hasInitialized = useRef(false)
  const forceShowTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const prevNextRef = useRef({ prev: null, next: null })
  const updateProgressRef = useRef<any>(null)
  const sessionUserIdRef = useRef(session?.user?.id)
  const currentChapterIdRef = useRef<string | undefined>(undefined)
  const pendingProgressUpdatesRef = useRef<{[key: string]: any}>({})
  const progressUpdateTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastChapterIdRef = useRef<string | undefined>()
  const lastTimeProgressRef = useRef<number>(0)
  const lastSelectedVideoRef = useRef<string | null>(null)
  
  // Redux selectors
  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)
  const nextVideoId = useAppSelector((state) => state.course.nextVideoId)
  const prevVideoId = useAppSelector((state) => state.course.prevVideoId)
  const courseProgress = useAppSelector((state) => state.course.courseProgress[course.id])
  const isLoading = useAppSelector((state) => state.course.isLoading)
  const courseCompleted = useAppSelector((state) => state.course.courseCompletionStatus)

  // Data processing with useMemo
  const videoPlaylist = useVideoPlaylist(course)
  const currentChapter = useMemo(() => {
    if (!currentVideoId) return undefined
    return videoPlaylist.find((entry) => entry.videoId === currentVideoId)?.chapter
  }, [currentVideoId, videoPlaylist])
  
  const isLastVideo = useMemo(() => {
    if (!currentVideoId) return false
    const currentIndex = videoPlaylist.findIndex((entry) => entry.videoId === currentVideoId)
    return currentIndex === videoPlaylist.length - 1
  }, [currentVideoId, videoPlaylist])
  
  const courseId = useMemo(() => +course.id, [course.id])
  const currentChapterId = useMemo(() => currentChapter?.id?.toString(), [currentChapter?.id])
  
  // Use the progress hook with memoized values
  const { progress, isLoading: isProgressLoading, updateProgress } = useProgress({
    courseId,
    initialProgress: undefined,
    currentChapterId,
  })
  
  // Add pre-existing callbacks before adding the new ones
  // First, add the processPendingProgressUpdates callback
  const processPendingProgressUpdates = useCallback(() => {
    const pendingUpdates = pendingProgressUpdatesRef.current;
    if (Object.keys(pendingUpdates).length === 0) return;
    
    // Get the latest update (most important one)
    const keys = Object.keys(pendingUpdates).sort();
    const latestUpdate = pendingUpdates[keys[keys.length - 1]];
    
    // Reset pending updates
    pendingProgressUpdatesRef.current = {};
    
    // Call the progress update function with the latest data
    if (sessionUserIdRef.current && latestUpdate) {
      console.debug("[CoursePage] Processing batched progress update:", latestUpdate);
      
      updateProgressRef.current(latestUpdate)
        .catch((error: Error) => {
          console.error("[CoursePage] Error processing progress update:", error);
        });
    }
  }, []);
  
  // Now add the throttledUpdateProgress callback
  const throttledUpdateProgress = useCallback(
    (updateData: {
      currentChapterId?: number | string
      completedChapters?: number[]
      progress?: number
      currentUnitId?: number
      isCompleted?: boolean
      lastAccessedAt?: Date
    }) => {
      if (!sessionUserIdRef.current) return;
      
      // Ensure currentChapterId is present
      if (!updateData.currentChapterId && currentChapterIdRef.current) {
        updateData.currentChapterId = Number(currentChapterIdRef.current);
      }
      
      // Store update with timestamp key for ordering
      const updateKey = `${Date.now()}_${updateData.currentChapterId || 0}`;
      pendingProgressUpdatesRef.current[updateKey] = updateData;
      
      // If this is a critical update (like chapter completion), process immediately
      const isCriticalUpdate = updateData.isCompleted === true || 
                               (updateData.lastAccessedAt !== undefined);
      
      if (isCriticalUpdate) {
        if (progressUpdateTimerRef.current) {
          clearTimeout(progressUpdateTimerRef.current);
        }
        
        // Schedule immediate update (give a tiny delay for batching)
        progressUpdateTimerRef.current = setTimeout(() => {
          processPendingProgressUpdates();
          progressUpdateTimerRef.current = null;
        }, 50);
      }
    },
    [processPendingProgressUpdates]
  );
  
  // Add markChapterAsCompleted callback
  const markChapterAsCompleted = useCallback(() => {
    if (!currentChapter) return;

    const chapterId = Number(currentChapter.id);
    if (isNaN(chapterId)) {
      console.error("[CoursePage] Invalid chapter ID:", currentChapter.id);
      return;
    }

    // Use Redux action to mark chapter as completed
    dispatch(markChapterAsCompletedAction({ 
      courseId, 
      chapterId 
    }));
    
    // Check if course is now completed
    const updatedCompletedChapters = [
      ...(courseProgress?.completedChapters || []),
      chapterId
    ];
    
    const isAllChaptersCompleted = videoPlaylist.length > 0 && 
      updatedCompletedChapters.length >= videoPlaylist.length;
    
    if (isAllChaptersCompleted && !courseCompleted) {
      dispatch(setCourseCompletionStatus(true));
    }
    
    // Track this as a critical update - send to backend
    throttledUpdateProgress({
      currentChapterId: chapterId,
      completedChapters: updatedCompletedChapters,
      isCompleted: isAllChaptersCompleted,
      lastAccessedAt: new Date()
    });
    
  }, [courseId, currentChapter, courseProgress, dispatch, videoPlaylist.length, throttledUpdateProgress, courseCompleted]);
  
  // Add handleVideoEnd callback
  const handleVideoEnd = useCallback(() => {
    if (currentChapter) {
      markChapterAsCompleted();
    }
    
    if (nextVideoId) {
      dispatch(setCurrentVideoApi(nextVideoId));
    } else if (isLastVideo) {
      // Last video completed
      dispatch(setCourseCompletionStatus(true));
      setShowCompletionOverlay(true);
    }
  }, [nextVideoId, dispatch, markChapterAsCompleted, isLastVideo, currentChapter]);
  
  // Add handleVideoSelect callback
  const handleVideoSelect = useCallback(
    (videoId: string) => {
      try {
        // Skip if we're already on this video or selected it very recently
        if (currentVideoId === videoId || lastSelectedVideoRef.current === videoId) return;
        
        // Remember this selection to prevent duplicates
        lastSelectedVideoRef.current = videoId;
        setTimeout(() => {
          if (lastSelectedVideoRef.current === videoId) {
            lastSelectedVideoRef.current = null;
          }
        }, 1000);
        
        // If we're changing videos, mark current chapter complete
        if (currentVideoId && currentVideoId !== videoId && currentChapter) {
          markChapterAsCompleted();
        }

        // Update Redux state with selected video
        dispatch(setCurrentVideoApi(videoId));
        
        // Update progress in backend
        const selectedChapter = videoPlaylist.find((entry) => entry.videoId === videoId)?.chapter;
        if (selectedChapter) {
          throttledUpdateProgress({
            currentChapterId: Number(selectedChapter.id),
            lastAccessedAt: new Date(),
          });
        }
      } catch (error) {
        console.error("[CoursePage] Error in handleVideoSelect:", error);
      }
    },
    [currentChapter, currentVideoId, markChapterAsCompleted, dispatch, throttledUpdateProgress, videoPlaylist]
  );
  
  // Now add the new functions in the correct order
  const handleWatchAnotherCourse = useCallback(() => {
    router.push('/dashboard/courses')
  }, [router]);
  
  const handleCloseCompletionOverlay = useCallback(() => {
    setShowCompletionOverlay(false)
  }, []);
  
  // Add fetchRelatedCourses callback
  const fetchRelatedCourses = useCallback(async () => {
    try {
      const response = await fetch("/api/courses?limit=3")
      if (response.ok) {
        const data = await response.json()
        return data.courses
      }
      return []
    } catch (error) {
      console.error("Error fetching related courses:", error)
      return []
    }
  }, []);
  
  // Update refs when values change
  useEffect(() => {
    updateProgressRef.current = updateProgress;
    sessionUserIdRef.current = session?.user?.id;
    currentChapterIdRef.current = currentChapterId;
  }, [updateProgress, session?.user?.id, currentChapterId]);
  
  // Initialize course state in Redux - only once
  useEffect(() => {
    if (!hasInitialized.current) {
      const initialVideo = initialChapterId
        ? videoPlaylist.find((entry) => entry.chapter.id.toString() === initialChapterId)
        : videoPlaylist[0]

      dispatch(initializeCourseState({
        courseId: course.id,
        courseSlug: course.slug,
        initialVideoId: initialVideo?.videoId,
      }))
      
      hasInitialized.current = true
    }
  }, [dispatch, course.id, course.slug, initialChapterId, videoPlaylist]);

  // Get real video ID for initial load to avoid empty player
  const initialOrFirstVideoId = useMemo(() => currentVideoId || videoPlaylist[0]?.videoId, [currentVideoId, videoPlaylist]);

  // Update next and previous video IDs in Redux with proper comparison
  useEffect(() => {
    if (currentVideoId) {
      const currentIndex = videoPlaylist.findIndex(entry => entry.videoId === currentVideoId);
      const nextVideo = currentIndex < videoPlaylist.length - 1 ? videoPlaylist[currentIndex + 1]?.videoId : undefined;
      const prevVideo = currentIndex > 0 ? videoPlaylist[currentIndex - 1]?.videoId : undefined;

      // Only dispatch if values actually changed and are valid
      if (nextVideo !== prevNextRef.current.next && nextVideo !== undefined) {
        prevNextRef.current.next = nextVideo;
        dispatch(setNextVideoId(nextVideo));
      }
      
      if (prevVideo !== prevNextRef.current.prev && prevVideo !== undefined) {
        prevNextRef.current.prev = prevVideo;
        dispatch(setPrevVideoId(prevVideo));
      }
    }
  }, [currentVideoId, videoPlaylist, dispatch]);

  // Set up batch processing interval
  useEffect(() => {
    // Process updates every 10 seconds
    const interval = setInterval(processPendingProgressUpdates, 10000);
    
    return () => {
      clearInterval(interval);
      // Process any pending updates before unmounting
      processPendingProgressUpdates();
    };
  }, [processPendingProgressUpdates]);
  
  // Only update progress when chapter changes - now with smarter change detection
  useEffect(() => {
    if (!currentChapter || !session || !currentChapter.id) return;
    
    const chapterId = currentChapter.id.toString();
    const now = Date.now();
    
    // Update in any of these cases:
    // 1. Chapter ID changed
    // 2. It's been more than 30 seconds since last update for this chapter
    if (chapterId !== lastChapterIdRef.current || 
        now - lastTimeProgressRef.current > 30000) {
      
      lastChapterIdRef.current = chapterId;
      lastTimeProgressRef.current = now;
      
      throttledUpdateProgress({
        currentChapterId: Number(chapterId),
        lastAccessedAt: new Date(),
      });
    }
  }, [currentChapter?.id, session, throttledUpdateProgress]);

  // Add auto-timeout to force content display if loading gets stuck
  useEffect(() => {
    // Force content to show after 5 seconds regardless of loading state
    forceShowTimeoutRef.current = setTimeout(() => {
      if (isLoading || isProgressLoading) {
        console.warn("[CoursePage] Force showing content after timeout - loading got stuck");
        setForceShowContent(true);
      }
    }, 5000);
    
    return () => {
      if (forceShowTimeoutRef.current) {
        clearTimeout(forceShowTimeoutRef.current);
        forceShowTimeoutRef.current = null;
      }
    };
  }, [isLoading, isProgressLoading]);

  // Clean up event listeners and pending operations
  useEffect(() => {
    return () => {
      if (progressUpdateTimerRef.current) {
        clearTimeout(progressUpdateTimerRef.current);
        processPendingProgressUpdates();
      }
    };
  }, [processPendingProgressUpdates]);

  // Responsive Sidebar Handling
  useEffect(() => {
    const handleResize = () => {
      const smallScreen = window.innerWidth < 1024
      setIsSmallScreen(smallScreen)
      // Only auto-close on small screens when first loading
      if (!isSidebarOpen && !smallScreen) {
        setIsSidebarOpen(true)
      } else if (smallScreen && isSidebarOpen) {
        setIsSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [isSidebarOpen]);

  // Add a state to track profile loading error
  const [profileError, setProfileError] = useState<string | null>(null);

  // Use useEffect to catch profile loading errors
  useEffect(() => {
    if (isProfileLoading) {
      setProfileError(null); // Clear any previous errors while loading
    } else if (!user && !isProfileLoading) {
      setProfileError("Failed to load user profile.");
      toast({
        title: "Profile Error",
        description: "Failed to load user profile. Some features may be limited.",
        variant: "destructive",
      });
    } else {
      setProfileError(null); // Clear error if user is loaded successfully
    }
  }, [user, isProfileLoading, toast]);

  // Update loading condition to include forceShowContent and profileError
  const shouldShowSkeleton = (isLoading || isProfileLoading) && !forceShowContent && !profileError;

  // Improve the loading state with more realistic skeleton
  if (shouldShowSkeleton) {
    return (
      <div className="min-h-screen bg-background">
        <div className="lg:hidden">
          <div className="h-14 w-full bg-background border-b flex items-center px-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-6 w-40 ml-3" />
            <Skeleton className="h-8 w-8 rounded-full ml-auto" />
          </div>
        </div>
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1">
            <div className="aspect-video w-full bg-muted/50 flex items-center justify-center">
              <Loader2 className="h-12 w-12 text-muted-foreground/50 animate-spin" />
            </div>
            <div className="p-6">
              <Skeleton className="h-8 w-[300px] mb-4" />
              <Skeleton className="h-4 w-full max-w-[600px] mb-2" />
              <Skeleton className="h-4 w-full max-w-[500px]" />
            </div>
          </div>
          <div className="hidden lg:block w-[400px] border-l">
            <div className="p-4 border-b">
              <Skeleton className="h-8 w-[200px]" />
            </div>
            <div className="p-4">
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-8 w-full mb-3" />
              <Skeleton className="h-8 w-full mb-3" />
              <Skeleton className="h-8 w-full mb-3" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* YouTube Optimizer */}
      <YouTubeOptimizer />
      
      <div className="lg:hidden">
        <MobilePlayList courseName={course.title} onSidebarOpen={() => setIsSidebarOpen(true)} />
      </div>

      <div className="flex flex-col lg:flex-row">
        <main className="flex-1 min-w-0">
          <div className="relative">
            <div className="aspect-video w-full bg-background">
              <MainContent
                slug={course.slug}
                initialVideoId={initialOrFirstVideoId || undefined}
                nextVideoId={nextVideoId || undefined}
                prevVideoId={prevVideoId || undefined}
                onVideoEnd={handleVideoEnd}
                onVideoSelect={handleVideoSelect}
                currentChapter={currentChapter || videoPlaylist[0]?.chapter}
                currentTime={0}
                onWatchAnotherCourse={handleWatchAnotherCourse}
                planId={"FREE"}
                isLastVideo={isLastVideo}
                courseCompleted={courseCompleted}
                course={course}
                relatedCourses={[]}
                isProgressLoading={isProgressLoading && !forceShowContent}
              />
            </div>
          </div>
        </main>

        <AnimatePresence mode="wait">
          {(isSidebarOpen || !isSmallScreen) && (
            <motion.aside
              className={cn(
                "fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-background lg:relative",
                "lg:w-[400px] lg:border-l",
                "max-w-sm lg:max-w-none",
                isSmallScreen && "shadow-lg",
              )}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 150 }}
            >
              {isSmallScreen && (
                <div className="border-b p-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(false)}
                    className="ml-auto"
                    aria-label="Close sidebar"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex-1 overflow-hidden">
                <VideoNavigationSidebar
                  course={course}
                  currentChapter={currentChapter}
                  courseId={course.id.toString()}
                  onVideoSelect={(videoId) => {
                    handleVideoSelect(videoId)
                    if (isSmallScreen) setIsSidebarOpen(false)
                  }}
                  currentVideoId={currentVideoId || ""}
                  isAuthenticated={!!session}
                  progress={progress || null}
                  nextVideoId={nextVideoId || undefined}
                  prevVideoId={prevVideoId || undefined}
                  completedChapters={(progress?.completedChapters || []).map((chapter) => Number(chapter)).filter((chapter) => !isNaN(chapter))}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
      {showCompletionOverlay && (
        <CourseCompletionOverlay
          courseName={course.title}
          onClose={handleCloseCompletionOverlay}
          onWatchAnotherCourse={handleWatchAnotherCourse}
          fetchRelatedCourses={fetchRelatedCourses}
        />
      )}
    </div>
  )
}
