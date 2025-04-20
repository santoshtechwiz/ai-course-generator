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
import type { FullCourseType, FullChapterType, CourseProgress } from "@/app/types/types"
import { markdownToHtml } from "./markdownUtils"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import CourseActions from "./CourseActions"
import FloatingCourseActions from "./FloatingCourseActions"

interface MainContentProps {
  course: FullCourseType
  initialVideoId?: string
  nextVideoId?: string
  prevVideoId?: string
  onVideoEnd: () => void
  onVideoSelect: (videoId: string) => void
  currentChapter?: FullChapterType
  currentTime?: number
  onWatchAnotherCourse: () => void
  onTimeUpdate?: (time: number) => void
  progress?: CourseProgress
  onChapterComplete?: () => void
  planId?: string
  isLastVideo?: boolean
  courseCompleted?: boolean
}

export default function MainContent({
  course,
  initialVideoId,
  nextVideoId,
  prevVideoId,
  onVideoEnd,
  onVideoSelect,
  currentChapter,
  currentTime = 0,
  onWatchAnotherCourse,
  onTimeUpdate,
  progress,
  onChapterComplete,
  planId = "FREE",
  isLastVideo = false,
  courseCompleted = false,
}: MainContentProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false)
  const [htmlContent, setHtmlContent] = useState("")
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [isTabChanging, setIsTabChanging] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const isAuthenticated = status === "authenticated"
  const tabsRef = useRef<HTMLDivElement>(null)
  const isPremium = planId === "PRO" || planId === "ULTIMATE"
  const [played, setPlayed] = useState(0)
  const nextVideoIdRef = useRef(nextVideoId)
  const [playing, setPlaying] = useState(true)
  const playerRef = useRef<any>(null)
  const { playerConfig, autoplayNext } = { playerConfig: { rememberPosition: true }, autoplayNext: true }

  useEffect(() => {
    nextVideoIdRef.current = nextVideoId
  }, [nextVideoId])

  // Process markdown content
  useEffect(() => {
    if (currentChapter?.description) {
      const processMarkdown = async () => {
        const html = await markdownToHtml(currentChapter.description || "")
        setHtmlContent(html)
      }
      processMarkdown()
    }
  }, [currentChapter])

  // Show completion overlay when course is completed
  useEffect(() => {
    if (courseCompleted) {
      setShowCompletionOverlay(true)
    }
  }, [courseCompleted])

  // Add this additional check for isLastVideo:
  useEffect(() => {
    if (courseCompleted || (isLastVideo && played > 0.95)) {
      setShowCompletionOverlay(true)
    }
  }, [courseCompleted, isLastVideo, played])

  // Load bookmarks from localStorage
  useEffect(() => {
    if (initialVideoId && typeof window !== "undefined") {
      const savedBookmarks = localStorage.getItem(`bookmarks-${initialVideoId}`)
      if (savedBookmarks) {
        try {
          setBookmarks(JSON.parse(savedBookmarks))
        } catch (e) {
          console.error("Error parsing bookmarks:", e)
        }
      } else {
        setBookmarks([])
      }
    }
  }, [initialVideoId])

  // Smooth scroll to active tab content
  useEffect(() => {
    if (isTabChanging && tabsRef.current) {
      const activeElement = tabsRef.current.querySelector('[data-state="active"]')
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      setIsTabChanging(false)
    }
  }, [activeTab, isTabChanging])

  // Update the handleTabChange function
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)
    setIsTabChanging(true)
  }, [])

  const handleNextVideo = useCallback(() => {
    const currentNextVideoId = nextVideoIdRef.current
    if (currentNextVideoId) {
      onVideoSelect(currentNextVideoId)
    } else if (isLastVideo) {
      setShowCompletionOverlay(true)
    }
  }, [onVideoSelect, isLastVideo])

  const handlePrevVideo = useCallback(() => {
    if (prevVideoId) {
      onVideoSelect(prevVideoId)
    }
  }, [prevVideoId, onVideoSelect])

  const handleCloseCompletionOverlay = () => {
    setShowCompletionOverlay(false)
  }

  const handleAddBookmark = useCallback(
    (time: number) => {
      if (initialVideoId && typeof window !== "undefined") {
        const newBookmarks = [...bookmarks, time].sort((a, b) => a - b)
        setBookmarks(newBookmarks)
        localStorage.setItem(`bookmarks-${initialVideoId}`, JSON.stringify(newBookmarks))
      }
    },
    [bookmarks, initialVideoId],
  )

  // Calculate chapter position based on order
  const getChapterPosition = useCallback(() => {
    if (!currentChapter || !course.courseUnits) return 1

    let position = 1
    let found = false

    for (const unit of course.courseUnits) {
      for (const chapter of unit.chapters) {
        if (chapter.id === currentChapter.id) {
          found = true
          break
        }
        position++
      }
      if (found) break
    }

    return position
  }, [currentChapter, course.courseUnits])

  // Calculate total chapters
  const getTotalChapters = useCallback(() => {
    if (!course.courseUnits) return 0
    return course.courseUnits.reduce((acc, unit) => acc + unit.chapters.length, 0)
  }, [course.courseUnits])

  // Teaser content for non-premium users
  const renderTeaserContent = () => (
    <div className="bg-muted/30 p-6 rounded-lg border border-primary/20 text-center">
      <Lock className="h-12 w-12 text-primary/50 mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">Premium Content</h3>
      <p className="text-muted-foreground mb-4">
        Upgrade to our premium plan to access full course content including AI summaries and interactive quizzes.
      </p>
      <Button onClick={() => router.push("/dashboard/subscription")} className="bg-primary hover:bg-primary/90">
        Upgrade Now
      </Button>
    </div>
  )

  if (!initialVideoId || !currentChapter) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">No video available</h2>
          <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    )
  }

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
              chapterId={currentChapter.id.toString()}
              name={currentChapter.title}
              existingSummary={currentChapter.summary}
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
              isPublicCourse={course.isPublic}
              chapter={currentChapter}
              course={course}
            />
          </Suspense>
        ) : (
          <UnauthenticatedContentFallback type="quiz" onUpgrade={() => router.push("/dashboard/subscription")} />
        )
      default:
        return (
          <div
            className="prose prose-slate dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )
    }
  }

  // Add a new component for unauthenticated users
  const UnauthenticatedContentFallback = ({ type, onUpgrade }: { type: "summary" | "quiz"; onUpgrade: () => void }) => {
    return (
      <div className="space-y-6">
        <div className="bg-card/30 border border-border rounded-lg p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
          <p className="text-muted-foreground mb-6">
            {type === "summary"
              ? "AI-generated summaries help you quickly review key concepts from each chapter."
              : "Test your knowledge with AI-generated quizzes for each chapter."}{" "}
            Upgrade to PRO to access this feature.
          </p>

          {/* Preview content with blur effect */}
          <div className="relative mb-6 overflow-hidden rounded-lg">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card z-10"></div>
            <div className="filter blur-sm p-4 text-left bg-card/20">
              {type === "summary" ? (
                <>
                  <h4 className="font-medium mb-2">Chapter Summary</h4>
                  <p>
                    This chapter covers the fundamental concepts of programming including variables, data types, and
                    control structures. We explore how to write efficient code and implement best practices.
                  </p>
                  <p>
                    Key points include understanding the difference between primitive and reference types, how to use
                    conditional statements effectively, and the importance of code organization.
                  </p>
                </>
              ) : (
                <>
                  <h4 className="font-medium mb-2">Sample Quiz Questions</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-md bg-background/50">
                      What is the primary purpose of variables in programming?
                    </div>
                    <div className="p-3 border rounded-md bg-background/50">
                      Which of the following is not a primitive data type?
                    </div>
                    <div className="p-3 border rounded-md bg-background/50">
                      How do you declare a constant in JavaScript?
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex space-x-4">
            <Button onClick={onUpgrade} className="flex-1">
              Upgrade to PRO
            </Button>
            <Button variant="outline" onClick={() => signIn()} className="flex-1">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleVideoEnd = useCallback(() => {
    const currentNextVideoId = nextVideoIdRef.current
    if (currentNextVideoId) {
      onVideoSelect(currentNextVideoId)
    } else if (isLastVideo) {
      setShowCompletionOverlay(true)
    }
  }, [onVideoSelect, isLastVideo])

  // Add this effect to pause the video when the completion overlay is shown
  useEffect(() => {
    if (showCompletionOverlay && playerRef.current) {
      setPlaying(false)
    }
  }, [showCompletionOverlay])

  // Modify the handleVideoEnd function to ensure video pauses
  const handleVideoEndUpdated = useCallback(() => {
    // Pause the video
    setPlaying(false)

    // Mark video as completed by setting position to end
    if (playerConfig.rememberPosition && typeof window !== "undefined") {
      localStorage.setItem(`video-position-${initialVideoId}`, "1.0")
    }

    if (autoplayNext && nextVideoId) {
      onVideoEnd()
    } else if (isLastVideo) {
      setShowCompletionOverlay(true)
    }
  }, [
    onVideoEnd,
    nextVideoId,
    autoplayNext,
    playerConfig.rememberPosition,
    initialVideoId,
    isLastVideo,
    setPlaying,
    setShowCompletionOverlay,
  ])

  return (
    <div className="flex flex-col w-full">
      <div className="relative rounded-lg overflow-hidden border border-border">
        {initialVideoId ? (
          <EnhancedVideoPlayer
            videoId={initialVideoId}
            onEnded={handleVideoEndUpdated}
            autoPlay={true}
            onProgress={onTimeUpdate}
            initialTime={currentTime}
            isLastVideo={isLastVideo}
            onVideoSelect={onVideoSelect}
            courseName={course.title}
            nextVideoId={nextVideoId}
            onBookmark={handleAddBookmark}
            bookmarks={bookmarks}
            isAuthenticated={isAuthenticated}
            onChapterComplete={onChapterComplete}
            playerConfig={{
              showRelatedVideos: false,
              rememberPosition: true,
              rememberMute: true,
              showCertificateButton: isLastVideo,
            }}
            onProgressChange={(progress) => setPlayed(progress)}
          />
        ) : (
          <div className="flex items-center justify-center w-full aspect-video bg-background rounded-lg">
            <div className="text-center p-4">
              <Loader2 className="h-10 w-10 mb-4 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Loading video...</p>
            </div>
          </div>
        )}

        {/* Chapter info and completion status */}
        <div className="flex justify-between items-center p-3 bg-background border-t">
          <div className="flex items-center space-x-2">
            {bookmarks.length > 0 && (
              <span className="text-xs text-muted-foreground flex items-center">
                <Bookmark className="h-3 w-3 mr-1" />
                {bookmarks.length} bookmark{bookmarks.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="flex items-center">
            {progress?.completedChapters.includes(currentChapter.id) && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isLastVideo && !nextVideoId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompletionOverlay(true)}
                className="text-primary hover:text-primary/90"
              >
                <span className="text-sm">Complete Course</span>
                <CheckCircle className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-2">{currentChapter.title}</h1>
        <div className="flex items-center text-sm text-muted-foreground mb-6">
          <BookOpen className="mr-2 h-4 w-4" />
          <span>
            Chapter {getChapterPosition()} of {getTotalChapters()}
          </span>
          {progress?.completedChapters.includes(currentChapter.id) && (
            <span className="ml-4 flex items-center text-green-600 dark:text-green-400">
              <CheckCircle className="mr-1 h-4 w-4" />
              Completed
            </span>
          )}
        </div>

        <div ref={tabsRef}>
          <Tabs defaultValue="overview" value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6 bg-background border border-border/30 rounded-lg p-1">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
              >
                Overview
              </TabsTrigger>
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
                  value="overview"
                  className="space-y-4 bg-background rounded-lg p-4 border border-border/30"
                >
                  {renderTabContent()}
                </TabsContent>
                <TabsContent value="notes" className="bg-background rounded-lg p-4 border border-border/30">
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
          courseName={course.title}
          onClose={handleCloseCompletionOverlay}
          onWatchAnotherCourse={onWatchAnotherCourse}
        />
      )}
      <FloatingCourseActions slug={course.slug ?? ""}></FloatingCourseActions>
    </div>
  )
}
