"use client"

import { ReactNode } from "react"
import { BookOpen, CheckCircle, Settings } from "lucide-react"
import FloatingCourseActions from "./components/FloatingCourseActions"
import VideoNavigationSidebar from "./components/VideoNavigationSidebar"
import { useAppSelector } from "@/store/hooks"

interface CoursePageLayoutProps {
  children: ReactNode
  slug: string
}

export default function CoursePageLayout({ children, slug }: CoursePageLayoutProps) {
  const courseState = useAppSelector((state) => state.course)
  const currentChapter = courseState.currentCourse?.courseUnits
    ?.flatMap((unit) => unit.chapters)
    ?.find((chapter) => chapter.id === courseState.currentChapterId)

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      {/* Sticky Sidebar */}
      <aside className="lg:w-1/4 lg:sticky lg:top-0 lg:h-screen bg-background border-r border-border p-4">
        <FloatingCourseActions slug={slug} />
        <div className="mt-6">
          <h2 className="text-lg font-bold mb-4">Chapters</h2>
          <VideoNavigationSidebar
            course={courseState.currentCourse}
            currentChapter={currentChapter}
            onVideoSelect={() => {} /* Pass appropriate handler */}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {/* Header */}
        <header className="bg-background border-b border-border p-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{courseState.currentCourse?.title}</h1>
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <BookOpen className="mr-2 h-4 w-4" />
              <span>
                Chapter {courseState.courseProgress?.completedChapters.length || 0} of{" "}
                {courseState.currentCourse?.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0) || 0}
              </span>
              {courseState.courseProgress?.completedChapters.includes(currentChapter?.id || "") && (
                <span className="ml-4 flex items-center text-green-600 dark:text-green-400">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Completed
                </span>
              )}
            </div>
          </div>
          <Settings className="h-6 w-6 text-muted-foreground cursor-pointer" />
        </header>

        {/* Main Content Area */}
        <div className="p-4">{children}</div>
      </main>
    </div>
  )
}
