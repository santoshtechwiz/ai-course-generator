"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { FullCourseType } from "@/app/types/types"
import MainContent from "./MainContent"
import { cn } from "@/lib/utils"
import { ModuleLayout } from "@/components/layout/ModuleLayout"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { JsonLD } from "@/lib/seo"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { ChevronLeft } from "lucide-react"

interface EnhancedCourseLayoutProps {
  course: FullCourseType
  initialChapterId?: string
  breadcrumbs?: {
    label: string
    href: string
  }[]
}

const EnhancedCourseLayout: React.FC<EnhancedCourseLayoutProps> = ({
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
      <AnimatePresence>
        {!isFullscreen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {/* Back to courses navigation */}
            <div className="bg-background border-b">
              <div className="max-w-screen-2xl mx-auto px-4 py-2">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                        Dashboard
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/dashboard/course" className="text-sm text-muted-foreground hover:text-foreground">
                        Courses
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <span className="text-sm text-foreground line-clamp-1">
                        {course.title}
                      </span>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        isFullscreen && "bg-black"
      )}>
        <div className={cn(
          "w-full mx-auto flex flex-col transition-all duration-300",
          isFullscreen 
            ? "px-0 py-0 max-w-none" 
            : "max-w-screen-2xl px-4 md:px-6 py-4 gap-4"
        )}>
          <MainContent 
            course={course} 
            initialChapterId={initialChapterId}
            isFullscreen={isFullscreen}
          />
        </div>
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

export default EnhancedCourseLayout
