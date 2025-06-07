"use client"

import type React from "react"
import { useState, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Play,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  Lock,
  Award,
  BookOpen,
  Users,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import VideoPlayer from "./video/components/VideoPlayer"

import AnimatedCourseAILogo from "./video/components/AnimatedCourseAILogo"

import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setCurrentVideoApi, markChapterAsCompleted } from "@/store/slices/courseSlice"
import { useAuth } from "@/hooks"
import useProgress from "@/hooks/useProgress"
import type { FullCourseType, FullChapterType } from "@/app/types/types"
import { PlayerControls } from "./video"
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

  // Redux state
  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)
  const courseProgress = useAppSelector((state) => state.course.courseProgress[course.id])

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
    if (progress && !resumePromptShown && progress.currentChapterId && !currentVideoId) {
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
  }, [progress, resumePromptShown, currentVideoId, videoPlaylist, dispatch, toast])

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

      if (isLastVideo) {
        setShowCertificate(true)
      } else if (nextChapter) {
        // Auto-advance to next video after 3 seconds
        setTimeout(() => {
          dispatch(setCurrentVideoApi(nextChapter.videoId))
        }, 3000)
      }
    }
  }, [currentChapter, dispatch, course.id, updateProgress, progress, isLastVideo, nextChapter])

  const handleVideoProgress = useCallback(
    (progressState: { played: number; playedSeconds: number }) => {
      // Show logo animation when video is about to end (last 5 seconds)
      if (progressState.playedSeconds > 0 && currentChapter) {
        const timeRemaining = (currentChapter.duration || 300) - progressState.playedSeconds
        if (timeRemaining <= 5 && timeRemaining > 0 && !videoEnding) {
          setVideoEnding(true)
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
    [currentChapter, videoEnding, updateProgress],
  )

  const handleChapterSelect = useCallback(
    (chapter: FullChapterType) => {
      if (chapter.videoId) {
        dispatch(setCurrentVideoApi(chapter.videoId))
        setSidebarOpen(false)
        setVideoEnding(false)
      }
    },
    [dispatch],
  )

  const handleNextVideo = useCallback(() => {
    if (nextChapter) {
      dispatch(setCurrentVideoApi(nextChapter.videoId))
      setVideoEnding(false)
    }
  }, [nextChapter, dispatch])

  const handlePrevVideo = useCallback(() => {
    if (prevChapter) {
      dispatch(setCurrentVideoApi(prevChapter.videoId))
      setVideoEnding(false)
    }
  }, [prevChapter, dispatch])

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
              <CoursePlaylist
                course={course}
                videoPlaylist={videoPlaylist}
                currentChapter={currentChapter}
                onChapterSelect={handleChapterSelect}
                progress={progress}
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
                      autoPlay={false}
                      isAuthenticated={!!session}
                      onChapterComplete={() => {}}
                      onNextVideo={handleNextVideo}
                      nextVideoTitle={nextChapter?.chapter.title}
                      courseName={course.title}
                      showControls={false} // We'll use our custom controls
                    />

                    {/* Custom controls overlay */}
                    <PlayerControls
                      playing={false} // This will be managed by the VideoPlayer
                      muted={false}
                      volume={0.8}
                      playbackRate={1}
                      played={0}
                      loaded={0}
                      duration={0}
                      isFullscreen={false}
                      isBuffering={false}
                      bufferHealth={100}
                      onPlayPause={() => {}}
                      onMute={() => {}}
                      onVolumeChange={() => {}}
                      onSeekChange={() => {}}
                      onPlaybackRateChange={() => {}}
                      onToggleFullscreen={() => {}}
                      formatTime={(seconds) => {
                        const h = Math.floor(seconds / 3600)
                        const m = Math.floor((seconds % 3600) / 60)
                        const s = Math.floor(seconds % 60)
                        return h > 0
                          ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
                          : `${m}:${s.toString().padStart(2, "0")}`
                      }}
                      isAuthenticated={!!session}
                      onNextVideo={handleNextVideo}
                    />

                    {/* Animated CourseAI logo */}
                    <AnimatedCourseAILogo
                      show={true}
                      videoEnding={videoEnding}
                      onAnimationComplete={() => setVideoEnding(false)}
                    />
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
                        <span>{currentChapter.duration || "5 min"}</span>
                        {currentChapter.isFree && <Badge variant="secondary">Free</Badge>}
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
                isPremium={user?.planId === "premium"}
                isAdmin={user?.role === "admin"}
              />
            </div>
          </div>
        </main>

        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-96 border-l bg-background/50 backdrop-blur-sm">
          <CoursePlaylist
            course={course}
            videoPlaylist={videoPlaylist}
            currentChapter={currentChapter}
            onChapterSelect={handleChapterSelect}
            progress={progress}
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

// Course playlist component
interface CoursePlaylistProps {
  course: FullCourseType
  videoPlaylist: { videoId: string; chapter: FullChapterType }[]
  currentChapter?: FullChapterType
  onChapterSelect: (chapter: FullChapterType) => void
  progress: any
  courseStats: {
    totalChapters: number
    completedChapters: number
    progressPercentage: number
  }
}

const CoursePlaylist: React.FC<CoursePlaylistProps> = ({
  course,
  videoPlaylist,
  currentChapter,
  onChapterSelect,
  progress,
  courseStats,
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg mb-2 line-clamp-2">{course.title}</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{courseStats.progressPercentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${courseStats.progressPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{courseStats.completedChapters} completed</span>
            <span>{courseStats.totalChapters} total</span>
          </div>
        </div>
      </div>

      {/* Course stats */}
      <div className="p-4 border-b bg-muted/30">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center mb-1">
              <BookOpen className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-sm font-medium">{courseStats.totalChapters}</div>
            <div className="text-xs text-muted-foreground">Chapters</div>
          </div>
          <div>
            <div className="flex items-center justify-center mb-1">
              <Users className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-sm font-medium">12.5k</div>
            <div className="text-xs text-muted-foreground">Students</div>
          </div>
          <div>
            <div className="flex items-center justify-center mb-1">
              <Star className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="text-sm font-medium">4.8</div>
            <div className="text-xs text-muted-foreground">Rating</div>
          </div>
        </div>
      </div>

      {/* Chapter list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {course.courseUnits?.map((unit, unitIndex) => (
            <div key={unit.id} className="mb-4">
              <div className="px-3 py-2 text-sm font-medium text-muted-foreground bg-muted/50 rounded-lg mb-2">
                {unit.title}
              </div>
              <div className="space-y-1">
                {unit.chapters.map((chapter, chapterIndex) => {
                  const isActive = currentChapter?.id === chapter.id
                  const isCompleted = progress?.completedChapters?.includes(Number(chapter.id))
                  const isLocked = !chapter.isFree && !progress?.completedChapters?.length

                  return (
                    <button
                      key={chapter.id}
                      onClick={() => !isLocked && onChapterSelect(chapter)}
                      disabled={isLocked}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-all duration-200",
                        "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                        isActive && "bg-primary/10 border border-primary/20",
                        isLocked && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : isLocked ? (
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          ) : isActive ? (
                            <Play className="h-5 w-5 text-primary" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground">
                              {unitIndex + 1}.{chapterIndex + 1}
                            </span>
                            {chapter.isFree && (
                              <Badge variant="outline" className="text-xs">
                                Free
                              </Badge>
                            )}
                          </div>
                          <h4 className={cn("text-sm font-medium line-clamp-2", isActive && "text-primary")}>
                            {chapter.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{chapter.duration || "5 min"}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export default MainContent
