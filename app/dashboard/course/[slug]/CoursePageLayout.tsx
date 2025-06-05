"use client"

import { type ReactNode, useState, useEffect } from "react"
import { BookOpen, Menu, X, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/tailwindUtils"
import { useAppSelector } from "@/store/hooks"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import FloatingCourseActions from "./components/FloatingCourseActions"
import VideoNavigationSidebar from "./components/VideoNavigationSidebar"

interface CoursePageLayoutProps {
  children: ReactNode
  slug: string
}

export default function CoursePageLayout({ children, slug }: CoursePageLayoutProps) {
  const courseState = useAppSelector((state) => state.course)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 1024px)")

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("course-sidebar")
      if (isMobile && sidebarOpen && sidebar && !sidebar.contains(event.target as Node)) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMobile, sidebarOpen])

  // Get current chapter info
  const currentChapter = courseState.currentCourse?.courseUnits
    ?.flatMap((unit) => unit.chapters)
    ?.find((chapter) => chapter.id === courseState.currentChapterId)

  // Calculate progress percentage
  const totalChapters =
    courseState.currentCourse?.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0) || 0

  const completedChapters = courseState.courseProgress?.completedChapters?.length || 0
  const progressPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <div className="flex items-center gap-2 md:gap-4 flex-1">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}

            <div className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              <span className="font-medium truncate max-w-[200px] md:max-w-[300px]">
                {courseState.currentCourse?.title || "Course"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center text-sm">
              <BookOpen className="mr-2 h-4 w-4" />
              <span>
                {completedChapters} of {totalChapters} lessons
              </span>
              <span className="mx-2 text-muted-foreground">•</span>
              <span className="text-primary font-medium">{progressPercentage}% complete</span>
            </div>

            <FloatingCourseActions slug={slug} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          id="course-sidebar"
          className={cn(
            "w-80 border-r bg-background z-20",
            "transition-all duration-300 ease-in-out",
            isMobile ? "fixed inset-y-14 left-0 bottom-0 shadow-xl" : "relative",
            isMobile && !sidebarOpen ? "-translate-x-full" : "translate-x-0",
          )}
        >
          <VideoNavigationSidebar
            course={courseState.currentCourse}
            currentChapter={currentChapter}
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
        </aside>

        {/* Main Content */}
        <main className={cn("flex-1 overflow-y-auto", "px-4 py-6 md:px-6 lg:px-8")}>{children}</main>
      </div>
    </div>
  )
}
