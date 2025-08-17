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
      {/* Header */}
      <AnimatePresence>
        {!isFullscreen && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="sticky top-0 z-40 px-4 py-3 border-b bg-gradient-to-b from-background/95 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm ai-glass dark:ai-glass-dark"
          >
            <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
              <div className="flex items-center gap-3">

                {/* Course Info */}
                <div className="hidden md:flex items-center gap-2 ml-4">
                  <Badge variant="secondary" className="text-xs">
                    {course.category?.name || 'Course'}
                  </Badge>
                  {course.level || course.difficulty ? (
                    <Badge variant="outline" className="text-xs">
                      {course.level || course.difficulty}
                    </Badge>
                  ) : null}
                  <span className="text-sm font-medium text-muted-foreground">
                    {course.title}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Keyboard shortcuts hint */}
                <Badge variant="outline" className="text-xs text-muted-foreground hidden lg:inline-flex">
                  Press T for Theater • F for Fullscreen • H to hide controls
                </Badge>
              </div>
            </div>
            {/* Breadcrumbs */}
            <div className="max-w-screen-2xl mx-auto mt-2 hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <a href="/dashboard" className="hover:text-foreground">Dashboard</a>
              <span>/</span>
              <a href="/dashboard/course" className="hover:text-foreground">Courses</a>
              <span>/</span>
              <span className="text-foreground/80 line-clamp-1">{course.title}</span>
            </div>
          </motion.header>
        )}
      </AnimatePresence>



      {/* Main Content Area */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        theatreMode && "bg-black",
        isFullscreen && "bg-black"
      )}>
        <div className={cn(
          "w-full mx-auto flex flex-col transition-all duration-300",
          isFullscreen 
            ? "px-0 py-0 max-w-none" 
            : "max-w-screen-2xl px-4 md:px-6 py-6 gap-6"
        )}>
          <MainContent 
            course={course} 
            initialChapterId={initialChapterId}
            isFullscreen={isFullscreen}
            onFullscreenToggle={toggleFullscreen}
          />
        </div>
      </div>
    </div>
  )
}

export default EnhancedCourseLayout
