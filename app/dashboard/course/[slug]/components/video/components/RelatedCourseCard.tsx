"use client"

import React from "react"
import { motion } from "framer-motion"
import { BookOpen } from "lucide-react"

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
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onClick?.()
    // Navigate to course
    if (course.slug) {
      window.location.href = `/dashboard/course/${course.slug}`
    }
  }

  return (
    <motion.div
      className="min-w-[160px] sm:min-w-[180px] max-w-[200px] sm:max-w-[220px] bg-white/10 rounded-lg p-2 hover:bg-white/15 transition-all duration-200 transform hover:scale-105 cursor-pointer touch-manipulation"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
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
      <div className="w-full h-16 sm:h-20 bg-white/10 rounded mb-2 overflow-hidden flex items-center justify-center">
        {course.image ? (
          <img 
            src={course.image} 
            alt={course.title || 'Course'} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-white/60" />
        )}
      </div>
      <div className="text-xs sm:text-xs font-semibold line-clamp-2 mb-1">
        {course.title || 'Course'}
      </div>
      <div className="text-[10px] sm:text-[11px] text-white/70 line-clamp-2">
        {course.description || ''}
      </div>
    </motion.div>
  )
}

export default React.memo(RelatedCourseCard)