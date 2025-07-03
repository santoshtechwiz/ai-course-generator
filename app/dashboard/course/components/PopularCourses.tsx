"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ChevronRight, TrendingUp, Eye, Clock, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { GlobalLoader } from "@/components/ui/loader"
import { cn } from "@/lib/utils"

// Define proper types for course data
interface Course {
  id: string
  slug: string
  title: string
  image?: string
  instructor?: string
  viewCount?: number
  duration?: string
  category?: string
}

interface PopularCoursesProps {
  courseDetails: Course[]
  isLoading?: boolean
}

export default function PopularCourses({ courseDetails = [], isLoading = false }: PopularCoursesProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Memoize sortedCourses to prevent unnecessary re-computation on re-renders
  const sortedCourses = useMemo(() => {
    if (!courseDetails || courseDetails.length === 0) return []
    return [...courseDetails]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 4) // Reduced to 4 for better grid layout
  }, [courseDetails])
  
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center">
          <div className="h-5 w-5 rounded bg-muted/60 mr-2"></div>
          <div className="h-7 w-40 rounded bg-muted/60"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden border-muted/30">
              <div className="p-4">
                <div className="flex space-x-3">
                  <div className="w-12 h-12 rounded-md bg-muted/60"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-3/4 rounded bg-muted/60"></div>
                    <div className="h-4 w-1/2 rounded bg-muted/60"></div>
                  </div>
                </div>
                <div className="mt-3 flex space-x-2">
                  <div className="h-4 w-16 rounded bg-muted/60"></div>
                  <div className="h-4 w-16 rounded bg-muted/60"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // If no courses, show an enhanced empty state
  if (!courseDetails || courseDetails.length === 0) {
    return (
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h2 className="text-xl font-semibold flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-primary" />
          Popular Courses
        </h2>
        <Card className="border-dashed border-muted hover:border-primary/20 transition-colors overflow-hidden">
          <CardContent className="p-8 text-center">
            <motion.div
              animate={{
                rotate: [0, 5, -5, 0],
                y: [0, -2, 2, 0],
                transition: { repeat: Number.POSITIVE_INFINITY, duration: 3, ease: "easeInOut" },
              }}
              className="relative"
            >
              <div className="absolute -inset-4 rounded-full bg-primary/5 blur-xl"></div>
              <BookOpen className="h-16 w-16 mx-auto text-primary/50 relative" />
            </motion.div>
            <h3 className="mt-4 text-lg font-medium">No popular courses yet</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Courses will appear here once they gain traction from learners like you.
            </p>
          </CardContent>
          <CardFooter className="bg-muted/5 p-4 flex justify-center">
            <Link 
              href="/dashboard/explore" 
              className="text-primary hover:text-primary/80 text-sm font-medium flex items-center"
            >
              <span>Discover courses</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    )
  }
  return (
    <div className="space-y-6">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-xl font-semibold flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-primary" />
          Popular Courses
        </h2>
        <Link
          href="/dashboard/explore"
          className="text-sm text-primary/80 hover:text-primary transition-colors flex items-center group"
        >
          <span>View all</span>
          <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sortedCourses.map((course, index) => (
          <motion.div
            key={course.id || index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.4, 
              delay: index * 0.1,
              ease: [0.25, 0.1, 0.25, 1.0] // Custom easing
            }}
          >
            <Link 
              href={`/dashboard/course/${course.slug}`} 
              className="block h-full"
              aria-label={`View course: ${course.title}`}
            >
              <Card 
                className={cn(
                  "overflow-hidden h-full bg-gradient-to-b from-card to-card/95",
                  "border border-border/60 hover:border-primary/30",
                  "transition-all duration-300 group"
                )}
              >
                <div className="p-4 h-full flex flex-col">
                  <div className="flex gap-3">
                    {/* Course image or placeholder */}
                    <div 
                      className="relative rounded-md overflow-hidden w-16 h-16 flex-shrink-0 bg-muted/30"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      {course.image ? (
                        <Image
                          src={course.image}
                          alt=""
                          fill
                          className="object-cover transition-transform group-hover:scale-110"
                          sizes="(max-width: 768px) 64px, 96px"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/20">
                          <BookOpen className="h-7 w-7 text-primary/70" />
                        </div>
                      )}
                      <AnimatePresence>
                        {hoveredIndex === index && (
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Sparkles className="h-5 w-5 text-primary" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Course info */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      
                      {course.instructor && (
                        <p className="text-xs text-muted-foreground mt-1">
                          by {course.instructor}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 mt-auto pt-2">
                        {course.viewCount !== undefined && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Eye className="h-3 w-3 mr-1" />
                            <span>{course.viewCount.toLocaleString()}</span>
                          </div>
                        )}

                        {course.duration && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{course.duration}</span>
                          </div>
                        )}

                        {course.category && (
                          <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
                            {course.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
      
      {sortedCourses.length > 0 && (
        <div className="flex justify-center">
          <motion.div
            className="inline-block"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              href="/dashboard/explore"
              className="inline-flex items-center justify-center px-4 py-2 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/15 transition-colors"
            >
              <span>Explore more courses</span>
              <ChevronRight className="h-4 w-4 ml-2" />
            </Link>
          </motion.div>
        </div>
      )}
    </div>
  )
}
