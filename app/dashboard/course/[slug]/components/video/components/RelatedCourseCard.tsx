"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, Play } from "lucide-react"

interface RelatedCourseCardProps {
  course: {
    id?: string | number
    slug?: string
    title?: string
    description?: string
    image?: string
  }
  index: number
  onClick?: () => void
}

const RelatedCourseCard: React.FC<RelatedCourseCardProps> = ({ course, index, onClick }) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onClick?.()
    // Navigate to course
    if (course.slug) {
      window.location.href = `/dashboard/course/${course.slug}`
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  return (
    <motion.div
      className="min-w-[160px] sm:min-w-[180px] max-w-[200px] sm:max-w-[220px] bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 cursor-pointer touch-manipulation border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl"
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.3, ease: "easeOut" }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick(e as any)
        }
      }}
      aria-label={`View course: ${course.title || 'Course'}`}
    >
      {/* Enhanced image container with loading states */}
      <div className="w-full h-20 sm:h-24 bg-gradient-to-br from-white/20 to-white/10 rounded-lg mb-3 overflow-hidden flex items-center justify-center relative group">
        {/* Loading skeleton */}
        {!imageLoaded && !imageError && course.image && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 animate-pulse" />
        )}
        
        {/* Course image */}
        {course.image && !imageError ? (
          <img 
            src={course.image} 
            alt={course.title || 'Course'} 
            className="w-full h-full object-cover transition-opacity duration-300"
            style={{ opacity: imageLoaded ? 1 : 0 }}
            loading="lazy"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center">
            <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-white/70" />
          </div>
        )}
        
        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
            <Play className="h-4 w-4 text-black ml-0.5" />
          </div>
        </div>
      </div>
      
      {/* Course title with enhanced typography */}
      <div className="text-sm sm:text-base font-semibold line-clamp-2 mb-2 text-white leading-tight">
        {course.title || 'Course Title'}
      </div>
      
      {/* Course description with better contrast */}
      <div className="text-xs sm:text-sm text-white/80 line-clamp-2 leading-relaxed">
        {course.description || 'Course description will appear here'}
      </div>
      
      {/* Subtle indicator for clickable state */}
      <div className="mt-2 flex items-center justify-between">
        <div className="w-2 h-2 bg-white/30 rounded-full" />
        <div className="text-xs text-white/60 font-medium">Click to view</div>
      </div>
    </motion.div>
  )
}

export default React.memo(RelatedCourseCard)