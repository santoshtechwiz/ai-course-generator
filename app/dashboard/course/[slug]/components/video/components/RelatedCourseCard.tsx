"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, Play, Star, Users, Clock, Heart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CategoryIcon } from "@/app/category-icon"

interface RelatedCourseCardProps {
  course: {
    id?: string | number
    slug?: string
    title?: string
    description?: string
    image?: string
    category?: string | { name: string }
    rating?: number
    students?: number
    duration?: string
    level?: string
  }
  index: number
  onClick?: () => void
}

const RelatedCourseCard: React.FC<RelatedCourseCardProps> = ({ course, index, onClick }) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onClick?.()
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

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsFavorited(!isFavorited)
  }

  const rating = course.rating || 4.2 + Math.random() * 0.6
  const studentCount = course.students || Math.floor(Math.random() * 2000) + 500

  return (
    <motion.div
      className="group relative min-w-[200px] max-w-[240px]"
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -6 }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleClick(e as any)
        }
      }}
      aria-label={`View course: ${course.title || "Course"}`}
    >
      {/* Premium glow effect */}
      <motion.div
        className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))",
          filter: "blur(6px)",
        }}
      />

      <div className="relative bg-card/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-border/20 hover:border-primary/30 cursor-pointer">
        {/* Enhanced image container */}
        <div className="relative w-full h-28 overflow-hidden">
          {/* Loading skeleton */}
          {!imageLoaded && !imageError && course.image && (
            <div className="absolute inset-0 bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 animate-pulse" />
          )}

          {/* Course image */}
          {course.image && !imageError ? (
            <img
              src={course.image || "/placeholder.svg"}
              alt={course.title || "Course"}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              style={{ opacity: imageLoaded ? 1 : 0 }}
              loading="lazy"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-primary/70" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Category badge */}
          {course.category && (
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-white/95 backdrop-blur-sm shadow-sm">
                <CategoryIcon
                  categoryId={
                    typeof course.category === "object"
                      ? course.category.name.toLowerCase()
                      : course.category.toLowerCase()
                  }
                 
                  variant="gradient"
                  animated
                />
              </div>
            </div>
          )}

          {/* Favorite button */}
          <motion.button
            className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-sm shadow-sm transition-all duration-300 ${
              isFavorited ? "bg-red-500/95 text-white" : "bg-white/95 text-gray-700 hover:bg-red-50 hover:text-red-500"
            }`}
            onClick={handleFavoriteClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart className={`h-3 w-3 ${isFavorited ? "fill-current" : ""}`} />
          </motion.button>

          {/* Play overlay */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: isHovered ? 1 : 0,
              scale: isHovered ? 1 : 0.8,
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
              <Play className="h-4 w-4 text-primary ml-0.5" />
            </div>
          </motion.div>
        </div>

        {/* Content section */}
        <div className="p-4 space-y-3">
          {/* Course title */}
          <h3 className="text-sm font-bold line-clamp-2 text-foreground leading-tight group-hover:text-primary transition-colors duration-300">
            {course.title || "Course Title"}
          </h3>

          {/* Course description */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {course.description ||
              "Discover amazing content in this comprehensive course designed for learners of all levels."}
          </p>

          {/* Stats row */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="h-3 w-3 fill-current" />
                <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3" />
                <span className="font-medium">{studentCount.toLocaleString()}</span>
              </div>
            </div>

            {course.level && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium border-primary/30 text-primary">
                {course.level}
              </Badge>
            )}
          </div>

          {/* Duration */}
          {course.duration && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="font-medium">{course.duration}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default React.memo(RelatedCourseCard)
