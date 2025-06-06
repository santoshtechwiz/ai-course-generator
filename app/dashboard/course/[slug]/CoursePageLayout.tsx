"use client"

import { FullCourseType } from "@/app/types/types"
import { type ReactNode, useState, useEffect, useCallback, useMemo } from "react"
import { 
  BookOpen, 
  Menu, 
  X, 
  ChevronLeft, 
  AlertCircle, 
  Clock, 
  Users, 
  Star,
  Maximize2,
  Minimize2,
  Settings,
  HelpCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/tailwindUtils"
import { useAppSelector } from "@/store/hooks"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { motion, AnimatePresence } from "framer-motion"
import FloatingCourseActions from "./components/FloatingCourseActions"
import VideoNavigationSidebar from "./components/VideoNavigationSidebar"
import CoursePage from "./components/CoursePage"

interface CoursePageLayoutProps {
  course: FullCourseType
  children?: ReactNode
  params?: {
    slug?: string
  }
  searchParams?: {
    chapterId?: string
  }
}

// Loading skeleton component
const HeaderSkeleton = () => (
  <div className="flex h-14 items-center px-4 animate-pulse">
    <div className="flex items-center gap-2 md:gap-4 flex-1">
      <div className="h-5 w-5 bg-muted rounded"></div>
      <div className="h-4 w-32 bg-muted rounded"></div>
    </div>
    <div className="flex items-center gap-4">
      <div className="hidden md:flex items-center gap-2">
        <div className="h-4 w-4 bg-muted rounded"></div>
        <div className="h-4 w-24 bg-muted rounded"></div>
        <div className="h-4 w-16 bg-muted rounded"></div>
      </div>
    </div>
  </div>
)

// Enhanced progress display component
const ProgressDisplay = ({ 
  completedChapters, 
  totalChapters, 
  progressPercentage,
  isMobile = false 
}: {
  completedChapters: number
  totalChapters: number
  progressPercentage: number
  isMobile?: boolean
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
          "flex items-center gap-2 text-sm",
          isMobile ? "flex-col items-start" : "flex-row"
        )}>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="font-medium">
              {completedChapters} of {totalChapters} lessons
            </span>
          </div>
          
          {!isMobile && (
            <>
              <span className="text-muted-foreground">•</span>
              <Badge variant="secondary" className="text-xs">
                {progressPercentage}% complete
              </Badge>
            </>
          )}
          
          {isMobile && (
            <div className="w-full">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-primary">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Course completion progress</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

// Enhanced error component
const CourseErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="container mx-auto p-6 max-w-2xl"
  >
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Unable to Load Course</AlertTitle>
      <AlertDescription className="mt-2">
        The course data appears to be incomplete or corrupted. This could be due to a network issue or server problem.
      </AlertDescription>
    </Alert>
    
    <div className="text-center space-y-4">
      <div className="text-muted-foreground">
        <p>What you can try:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
          <li>Refresh the page</li>
          <li>Check your internet connection</li>
          <li>Clear your browser cache</li>
          <li>Contact support if the problem persists</li>
        </ul>
      </div>
      
      <div className="flex gap-3 justify-center">
        <Button onClick={onRetry} className="gap-2">
          <Clock className="h-4 w-4" />
          Try Again
        </Button>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ChevronLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>
    </div>
  </motion.div>
)

export default function CoursePageLayout({
  course,
  params,
  searchParams,
}: CoursePageLayoutProps) {
  const courseState = useAppSelector((state) => state.course)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isTheaterMode, setIsTheaterMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const isMobile = useMediaQuery("(max-width: 1024px)")
  const isTablet = useMediaQuery("(max-width: 1280px)")

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Enhanced click outside handler with better performance
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const sidebar = document.getElementById("course-sidebar")
    const target = event.target as Node
    
    if (isMobile && sidebarOpen && sidebar && !sidebar.contains(target)) {
      // Check if click is on a button or interactive element
      const isInteractiveElement = (target as Element)?.closest('button, a, [role="button"]')
      if (!isInteractiveElement) {
        setSidebarOpen(false)
      }
    }
  }, [isMobile, sidebarOpen])

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [handleClickOutside])

  // Memoized calculations for better performance
  const courseMetrics = useMemo(() => {
    const currentChapter = courseState.currentCourse?.courseUnits
      ?.flatMap((unit) => unit.chapters)
      ?.find((chapter) => chapter.id === courseState.currentChapterId)

    const totalChapters = courseState.currentCourse?.courseUnits?.reduce(
      (acc, unit) => acc + unit.chapters.length, 0
    ) || 0

    const completedChapters = courseState.courseProgress?.completedChapters?.length || 0
    const progressPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0

    return {
      currentChapter,
      totalChapters,
      completedChapters,
      progressPercentage
    }
  }, [courseState])

  // Enhanced validation with better error handling
  const courseValidation = useMemo(() => {
    const isCourseValid = course && 
                         course.id && 
                         course.title && 
                         course.slug && 
                         Array.isArray(course.courseUnits)

    const hasValidUnits = isCourseValid && 
                         course.courseUnits?.length > 0 && 
                         course.courseUnits.some(unit => 
                           Array.isArray(unit.chapters) && unit.chapters.length > 0
                         )
    
    return { isCourseValid, hasValidUnits }
  }, [course])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case 'Escape':
          if (sidebarOpen) {
            setSidebarOpen(false)
          }
          break
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setSidebarOpen(!sidebarOpen)
          }
          break
        case 't':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setIsTheaterMode(!isTheaterMode)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen, isTheaterMode])

  const handleRetry = useCallback(() => {
    setIsLoading(true)
    window.location.reload()
  }, [])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur">
          <HeaderSkeleton />
        </header>
        <div className="flex flex-1">
          <div className="w-80 border-r bg-background animate-pulse">
            <div className="p-4 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
          <div className="flex-1 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state if course is invalid
  if (!courseValidation.isCourseValid || !courseValidation.hasValidUnits) {
    return <CourseErrorState onRetry={handleRetry} />
  }

  const initialChapterId = searchParams?.chapterId
  const slug = params?.slug || course.slug

  return (
    <div className={cn(
      "flex flex-col min-h-screen bg-background transition-all duration-300",
      isTheaterMode && "bg-black"
    )}>
      {/* Enhanced Top Navigation Bar */}
      <header className={cn(
        "sticky top-0 z-30 w-full border-b transition-all duration-300",
        isTheaterMode 
          ? "bg-black/95 border-gray-800" 
          : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      )}>
        <div className="flex h-14 items-center px-4">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            {/* Mobile menu button */}
            <AnimatePresence>
              {isMobile && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                    className={cn(
                      "transition-colors",
                      isTheaterMode && "text-white hover:bg-white/10"
                    )}
                  >
                    <motion.div
                      animate={{ rotate: sidebarOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </motion.div>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Course title with breadcrumb */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className={cn(
                  "gap-1 text-sm",
                  isTheaterMode && "text-white hover:bg-white/10"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn(
                  "h-2 w-2 rounded-full bg-primary",
                  isTheaterMode && "bg-white"
                )} />
                <h1 className={cn(
                  "font-semibold truncate text-sm md:text-base",
                  isTheaterMode && "text-white"
                )}>
                  {courseState.currentCourse?.title || course.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Progress display - hidden on mobile, shown in sidebar instead */}
            <div className="hidden lg:block">
              <ProgressDisplay
                completedChapters={courseMetrics.completedChapters}
                totalChapters={courseMetrics.totalChapters}
                progressPercentage={courseMetrics.progressPercentage}
              />
            </div>

            {/* Theater mode toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsTheaterMode(!isTheaterMode)}
                    className={cn(
                      "hidden md:flex",
                      isTheaterMode && "text-white hover:bg-white/10"
                    )}
                  >
                    {isTheaterMode ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isTheaterMode ? "Exit theater mode" : "Enter theater mode"}</p>
                  <p className="text-xs text-muted-foreground">Ctrl+T</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Course actions */}
            <FloatingCourseActions slug={slug} />
          </div>
        </div>

        {/* Mobile progress bar */}
        {isMobile && (
          <div className="px-4 pb-2">
            <ProgressDisplay
              completedChapters={courseMetrics.completedChapters}
              totalChapters={courseMetrics.totalChapters}
              progressPercentage={courseMetrics.progressPercentage}
              isMobile={true}
            />
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar overlay for mobile */}
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-10 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Enhanced Sidebar */}
        <motion.aside
          id="course-sidebar"
          initial={false}
          animate={{
            x: isMobile && !sidebarOpen ? "-100%" : "0%",
            width: isTablet ? "320px" : "360px"
          }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={cn(
            "border-r bg-background z-20 flex flex-col",
            "transition-shadow duration-300",
            isMobile ? "fixed inset-y-0 left-0 shadow-2xl" : "relative",
            isTheaterMode && "bg-gray-900 border-gray-800"
          )}
          style={{
            top: isMobile ? "56px" : "0", // Account for mobile header height
            height: isMobile ? "calc(100vh - 56px)" : "100%"
          }}
        >
          <VideoNavigationSidebar
            course={courseState.currentCourse}
            currentChapter={courseMetrics.currentChapter}
            courseId={courseState.currentCourseId || ""}
            onVideoSelect={() => {
              if (isMobile) setSidebarOpen(false)
            }}
            currentVideoId={courseState.currentVideoId || ""}
            isAuthenticated={!!courseState.isAuthenticated}
            progress={courseState.courseProgress}
            completedChapters={courseState.courseProgress?.completedChapters || []}
            nextVideoId={courseState.nextVideoId}
            prevVideoId={courseState.prevVideoId}
          />
        </motion.aside>

        {/* Enhanced Main Content */}
        <main className={cn(
          "flex-1 overflow-y-auto transition-all duration-300",
          "px-4 py-6 md:px-6 lg:px-8",
          isTheaterMode && "bg-black px-0 py-0"
        )}>
          <motion.div
            layout
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              isTheaterMode && "h-full flex items-center justify-center"
            )}
          >
            <CoursePage 
              course={course} 
              initialChapterId={initialChapterId}
              isTheaterMode={isTheaterMode}
            />
          </motion.div>
        </main>
      </div>

      {/* Keyboard shortcuts help - only show when not in theater mode */}
      {!isTheaterMode && (
        <div className="fixed bottom-4 right-4 z-50">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-background/80 backdrop-blur"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <p><kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+S</kbd> Toggle sidebar</p>
                  <p><kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+T</kbd> Theater mode</p>
                  <p><kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> Close sidebar</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  )
}

