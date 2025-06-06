"use client"

import type { ReactNode } from "react"
import { useState, useEffect } from "react"
import { BookOpen, Menu, X, ChevronLeft, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAppSelector } from "@/store/hooks"
import FloatingCourseActions from "./components/FloatingCourseActions"
import VideoNavigationSidebar from "./components/VideoNavigationSidebar"

// Enhanced TypeScript interfaces
interface CoursePageLayoutProps {
  children: ReactNode
  slug: string
}

interface CourseState {
  currentCourse?: {
    title?: string
    courseUnits?: Array<{
      chapters: Array<{ id: string }>
    }>
  }
  currentChapterId?: string
  courseProgress?: {
    completedChapters?: string[]
  }
  currentVideoId?: string
  nextVideoId?: string
  prevVideoId?: string
  isAuthenticated?: boolean
}

interface MediaQueryState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

// Custom hook for responsive breakpoints
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const media = window.matchMedia(query)
    const updateMatch = (): void => setMatches(media.matches)

    updateMatch()
    media.addEventListener("change", updateMatch)

    return () => media.removeEventListener("change", updateMatch)
  }, [query])

  return matches
}

// Enhanced responsive hook
const useResponsiveLayout = (): MediaQueryState => {
  const isMobile: boolean = useMediaQuery("(max-width: 768px)")
  const isTablet: boolean = useMediaQuery("(min-width: 769px) and (max-width: 1024px)")
  const isDesktop: boolean = useMediaQuery("(min-width: 1025px)")

  return { isMobile, isTablet, isDesktop }
}

export default function CoursePageLayout({ children, slug }: CoursePageLayoutProps) {
  // State management with proper typing
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [isScrolled, setIsScrolled] = useState<boolean>(false)

  // Responsive breakpoints
  const { isMobile, isTablet, isDesktop } = useResponsiveLayout()

  // Redux state with proper typing and fallbacks
  const courseState: CourseState = useAppSelector((state) => state.course || {})

  // Safely extract course data with proper defaults
  const currentCourse = courseState.currentCourse || {}
  const courseTitle: string = currentCourse.title || "Course"
  const courseUnits = currentCourse.courseUnits || []
  const currentChapterId: string = courseState.currentChapterId || ""
  const courseProgress = courseState.courseProgress || {}
  const completedChapters: string[] = courseProgress.completedChapters || []
  const currentVideoId: string = courseState.currentVideoId || ""
  const nextVideoId: string | undefined = courseState.nextVideoId
  const prevVideoId: string | undefined = courseState.prevVideoId
  const isAuthenticated: boolean = courseState.isAuthenticated || false

  // Calculate progress with proper error handling
  const totalChapters: number = courseUnits.reduce((acc, unit) => {
    return acc + (unit.chapters?.length || 0)
  }, 0)

  const completedChaptersCount: number = completedChapters.length
  const progressPercentage: number = totalChapters > 0 ? Math.round((completedChaptersCount / totalChapters) * 100) : 0

  // Find current chapter with proper error handling
  const currentChapter = courseUnits
    .flatMap((unit) => unit.chapters || [])
    .find((chapter) => chapter.id === currentChapterId)

  // Handle scroll detection for header styling
  useEffect(() => {
    const handleScroll = (): void => {
      const scrollTop: number = window.scrollY
      setIsScrolled(scrollTop > 10)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    if (!isMobile || !sidebarOpen) return

    const handleClickOutside = (event: MouseEvent): void => {
      const sidebar = document.getElementById("course-sidebar")
      const target = event.target as Node

      if (sidebar && !sidebar.contains(target)) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMobile, sidebarOpen])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [currentVideoId, isMobile])

  // Auto-close sidebar on desktop when not needed
  useEffect(() => {
    if (isDesktop && sidebarOpen) {
      setSidebarOpen(false)
    }
  }, [isDesktop, sidebarOpen])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") {
        return
      }

      switch (e.key) {
        case "Escape":
          if (sidebarOpen) {
            setSidebarOpen(false)
          }
          break
        case "s":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setSidebarOpen(!sidebarOpen)
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [sidebarOpen])

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Enhanced Top Navigation Bar */}
      <header
        className={cn(
          "sticky top-0 z-30 w-full border-b transition-all duration-300",
          isScrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-background/80 backdrop-blur-sm",
        )}
      >
        <div className="flex h-14 md:h-16 items-center px-3 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            {/* Mobile Menu Toggle */}
            {(isMobile || isTablet) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
                className="shrink-0 h-8 w-8 md:h-9 md:w-9"
              >
                {sidebarOpen ? <X className="h-4 w-4 md:h-5 md:w-5" /> : <Menu className="h-4 w-4 md:h-5 md:w-5" />}
              </Button>
            )}

            {/* Course Title with Back Navigation */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <ChevronLeft className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium truncate text-sm md:text-base max-w-[150px] sm:max-w-[200px] md:max-w-[300px] lg:max-w-none">
                {courseTitle}
              </span>
            </div>
          </div>

          {/* Progress and Actions */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {/* Progress Display - Hidden on small mobile */}
            <div className="hidden sm:flex items-center text-xs md:text-sm">
              <BookOpen className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden md:inline">
                {completedChaptersCount} of {totalChapters} lessons
              </span>
              <span className="md:hidden">
                {completedChaptersCount}/{totalChapters}
              </span>
              <span className="mx-1 md:mx-2 text-muted-foreground">•</span>
              <span className="text-primary font-medium">{progressPercentage}%</span>
            </div>

            {/* Floating Actions */}
            <FloatingCourseActions slug={slug} />
          </div>
        </div>

        {/* Mobile Progress Bar */}
        {isMobile && (
          <div className="px-3 pb-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>
                {completedChaptersCount} of {totalChapters} completed
              </span>
              <span className="text-primary font-medium">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Overlay for Mobile */}
        {(isMobile || isTablet) && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          id="course-sidebar"
          className={cn(
            "border-r bg-background z-50 transition-all duration-300 ease-in-out",
            // Desktop styles
            isDesktop && "w-80 relative",
            // Tablet styles
            isTablet && [
              "w-80 fixed inset-y-0 left-0 top-14 shadow-xl",
              sidebarOpen ? "translate-x-0" : "-translate-x-full",
            ],
            // Mobile styles
            isMobile && [
              "w-full max-w-sm fixed inset-y-0 left-0 top-14 shadow-xl",
              sidebarOpen ? "translate-x-0" : "-translate-x-full",
            ],
          )}
        >
          <div className="h-full overflow-hidden flex flex-col">
            {/* Sidebar Header - Mobile/Tablet only */}
            {(isMobile || isTablet) && (
              <div className="p-4 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm">Course Content</h2>
                  <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Sidebar Content */}
            <div className="flex-1 overflow-hidden">
              <VideoNavigationSidebar
                course={currentCourse}
                currentChapter={currentChapter}
                courseId={courseState.currentCourseId || ""}
                onVideoSelect={() => {
                  if (isMobile || isTablet) {
                    setSidebarOpen(false)
                  }
                }}
                currentVideoId={currentVideoId}
                isAuthenticated={isAuthenticated}
                progress={courseProgress}
                completedChapters={completedChapters}
                nextVideoId={nextVideoId}
                prevVideoId={prevVideoId}
              />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto",
            // Responsive padding
            "px-3 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8",
            // Ensure proper spacing on different screen sizes
            isMobile && "pb-safe-area-inset-bottom",
          )}
        >
          <div className="max-w-none">{children}</div>
        </main>
      </div>

      {/* Quick Access Floating Button - Mobile only */}
      {isMobile && !sidebarOpen && (
        <Button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-4 right-4 z-30 h-12 w-12 rounded-full shadow-lg"
          size="icon"
          aria-label="Open course navigation"
        >
          <Play className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}
