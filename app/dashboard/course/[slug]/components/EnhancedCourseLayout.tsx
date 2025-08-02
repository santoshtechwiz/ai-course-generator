"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { FullCourseType } from "@/app/types/types"
import MainContent from "./MainContent"
import { cn } from "@/lib/utils"
import CourseActions from "./CourseActions"
import { motion, AnimatePresence } from "framer-motion"
import { Monitor, MonitorX, Maximize2, Minimize2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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
  const [theatreMode, setTheatreMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)

  // Handle keyboard shortcuts for theater mode
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 't' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setTheatreMode(prev => !prev)
      }
      if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        toggleFullscreen()
      }
      if (e.key === 'h' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setShowControls(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [])

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

  const toggleTheaterMode = useCallback(() => {
    setTheatreMode(prev => !prev)
  }, [])

  return (
    <div className={cn(
      "min-h-screen flex flex-col transition-all duration-300",
      theatreMode && "bg-black",
      isFullscreen && "bg-black"
    )}>
      {/* Enhanced Theater Mode Controls */}
      <AnimatePresence>
        {!theatreMode && !isFullscreen && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-background/95 backdrop-blur-sm border-b px-4 py-3 sticky top-0 z-40"
          >
            <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
              <div className="flex items-center gap-3">
                <motion.div
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleTheaterMode}
                    className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                  >
                    <Monitor className="h-4 w-4" />
                    <span className="hidden sm:inline">Theater Mode</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                  >
                    <Maximize2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Fullscreen</span>
                  </Button>
                </motion.div>

                {/* Course Info */}
                <div className="hidden md:flex items-center gap-2 ml-4">
                  <Badge variant="secondary" className="text-xs">
                    {course.category?.name || 'Course'}
                  </Badge>
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
          </motion.header>
        )}
      </AnimatePresence>

      {/* Floating Controls for Theater/Fullscreen Mode */}
      <AnimatePresence>
        {(theatreMode || isFullscreen) && showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between"
            onMouseEnter={() => setShowControls(true)}
          >
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={toggleTheaterMode}
                className="bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white border-white/20"
              >
                <MonitorX className="h-4 w-4 mr-2" />
                Exit Theater
              </Button>
              
              {isFullscreen && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white border-white/20"
                >
                  <Minimize2 className="h-4 w-4 mr-2" />
                  Exit Fullscreen
                </Button>
              )}
            </div>

            <Badge 
              variant="secondary" 
              className="bg-black/50 backdrop-blur-sm text-white border-white/20"
            >
              {course.title}
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-hide controls in theater mode */}
      {(theatreMode || isFullscreen) && (
        <div
          className="fixed inset-0 z-40"
          onMouseMove={() => {
            setShowControls(true)
            setTimeout(() => setShowControls(false), 3000)
          }}
        />
      )}

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        theatreMode && "bg-black",
        isFullscreen && "bg-black"
      )}>
        <div className={cn(
          "w-full mx-auto flex flex-col transition-all duration-300",
          theatreMode || isFullscreen 
            ? "px-0 py-0 max-w-none" 
            : "max-w-screen-2xl px-4 md:px-6 py-6 gap-6"
        )}>
          <MainContent 
            course={course} 
            initialChapterId={initialChapterId}
            theatreMode={theatreMode}
            isFullscreen={isFullscreen}
            onTheaterModeToggle={toggleTheaterMode}
          />
        </div>
      </div>
    </div>
  )
}

export default EnhancedCourseLayout
