"use client"

import React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/tailwindUtils"

interface CourseModuleLayoutProps {
  children: React.ReactNode
  className?: string
  videoArea?: React.ReactNode
  headerArea?: React.ReactNode
  footerArea?: React.ReactNode
  sidebarOpen?: boolean
}

/**
 * CourseModuleLayout - A reusable layout component for course modules
 * 
 * This component provides the structure for course content, with areas for:
 * - Video/media content
 * - Header information
 * - Main content area (passed as children)
 * - Optional footer
 */
const CourseModuleLayout: React.FC<CourseModuleLayoutProps> = ({
  children,
  className,
  videoArea,
  headerArea,
  footerArea,
  sidebarOpen,
}) => {
  return (
    <div className={cn("flex flex-col w-full min-h-screen bg-background", className)}>
      {/* Video player area - takes full width within container */}
      {videoArea && (
        <div className="w-full">
          {videoArea}
        </div>
      )}
      
      {/* Header area for title, metadata, etc. */}
      {headerArea && (
        <div className="mb-6">
          {headerArea}
        </div>
      )}
      
      {/* Main content area - where tabs, content etc. will be rendered */}
      <div className="flex-1">
        {children}
      </div>
      
      {/* Optional footer area */}
      {footerArea && (
        <div className="mt-6">
          {footerArea}
        </div>
      )}
    </div>
  )
}

export default CourseModuleLayout
