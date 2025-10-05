"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { FullCourseType } from "@/app/types/types"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { JsonLD } from "@/lib/seo"
import { ErrorBoundary } from "react-error-boundary"
import { ModuleLoadingSkeleton } from "@/components/shared/ModuleLoadingSkeleton"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { ChevronLeft } from "lucide-react"

// Dynamically import MainContent with suspense
const MainContent = dynamic(() => import("./MainContent"), {
  loading: () => <ModuleLoadingSkeleton variant="detailed" itemCount={1} />,
  ssr: false
})

interface CourseLayoutProps {
  course: FullCourseType
  initialChapterId?: string
  breadcrumbs?: {
    label: string
    href: string
  }[]
}

const CourseLayout: React.FC<CourseLayoutProps> = ({
  course,
  initialChapterId,
  breadcrumbs = []
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.warn('Fullscreen not supported or failed:', error)
    }
  }, [])

  return (
    <div className={cn(
      "min-h-screen flex flex-col transition-all duration-300",
      isFullscreen && "bg-black"
    )}>
      {/* Header - only show when not in fullscreen */}
        {!isFullscreen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="bg-background/95 backdrop-blur-sm border-b border-border/40 shadow-sm"
          >
            <div className="max-w-screen-2xl mx-auto px-1 sm:px-2 py-0.5">
              <Breadcrumb>
                <BreadcrumbList className="gap-1">
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href="/dashboard"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-0.5"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="text-muted-foreground/60" />
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href="/dashboard"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      Courses
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="text-muted-foreground/60" />
                  <BreadcrumbItem>
                    <span className="text-sm font-medium text-foreground line-clamp-1 max-w-xs">
                      {course.title}
                    </span>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </motion.div>
        )}

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        isFullscreen && "bg-black"
      )}>
        <ErrorBoundary
          fallback={
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center min-h-[60vh] p-4"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-2">Error Loading Course Content</h2>
                  <p className="text-muted-foreground max-w-md mx-auto text-sm">
                    There was a problem loading the course content. Please try refreshing the page or contact support if the issue persists.
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => window.location.reload()} size="sm">
                    Reload Page
                  </Button>
                  <Button variant="outline" onClick={() => window.history.back()} size="sm">
                    Go Back
                  </Button>
                </div>
              </div>
            </motion.div>
          }
        >
          <Suspense
            fallback={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <ModuleLoadingSkeleton variant="detailed" itemCount={1} />
              </motion.div>
            }
          >
            <MainContent
              course={course}
              initialChapterId={initialChapterId}
              isFullscreen={isFullscreen}
            />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Structured data for SEO */}
      <JsonLD
        type="Course"
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          "name": course.title,
          "description": course.description || `${course.title} - AI Learning Platform course`,
          "provider": {
            "@type": "Organization",
            "name": "AI Learning Platform",
            "sameAs": "https://ailearningplatform.com"
          },
          ...(course.level && { "audience": {
            "@type": "Audience",
            "audienceType": course.level
          }}),
          ...(course.category?.name && { "about": {
            "@type": "Thing",
            "name": course.category.name
          }})
        }}
      />
    </div>
  )
}

export default CourseLayout
