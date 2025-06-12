"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ChevronRight, TrendingUp, Eye, Clock, Users, Star, BarChart2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

interface PopularCoursesProps {
  courseDetails: any[]
}

export default function PopularCourses({ courseDetails = [] }: PopularCoursesProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null)

  // Memoize sortedCourses to prevent unnecessary re-computation on re-renders
  const sortedCourses = useMemo(() => {
    if (!courseDetails || courseDetails.length === 0) return []
    return [...courseDetails]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 5)
  }, [courseDetails])

  // If no courses, show a message
  if (!courseDetails || courseDetails.length === 0) {
    return (
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-xl font-semibold flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-primary" />
          Popular Courses
        </h2>
        <Card className="border-dashed border-muted hover:border-primary/20 transition-colors">
          <CardContent className="p-6 text-center">
            <motion.div
              animate={{
                rotate: [0, 5, -5, 0],
                transition: { repeat: Number.POSITIVE_INFINITY, duration: 2 },
              }}
            >
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            </motion.div>
            <p className="text-muted-foreground">No popular courses yet</p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      <motion.h2
        className="text-xl font-semibold flex items-center"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <TrendingUp className="mr-2 h-5 w-5 text-primary" />
        Popular Courses
      </motion.h2>

      <div className="space-y-3">
        {sortedCourses.map((course, index) => (
          <motion.div
            key={course.id || index}
            className="relative"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onHoverStart={() => setHoveredIndex(index)}
            onHoverEnd={() => setHoveredIndex(null)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link href={`/dashboard/course/${course.slug}`} className="block">
              <Card className="overflow-hidden border-border/50 hover:border-primary/20 transition-colors group">
                <div className="flex items-center p-3">
                  <motion.div
                    className="relative h-14 w-14 rounded-lg overflow-hidden flex-shrink-0 mr-3 bg-muted"
                    whileHover={{ scale: 1.05 }}
                  >
                    {course.image ? (
                      <Image
                        src={course.image || "/placeholder.svg"}
                        alt={course.title}
                        fill
                        className="object-cover"
                        sizes="56px"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-primary/10 to-secondary/10">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <AnimatePresence>
                      {hoveredIndex === index && (
                        <motion.div
                          className="absolute inset-0 bg-black/20"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {course.instructor || "Unknown Instructor"}
                        </p>
                      </div>
                      {course.rating && (
                        <Badge variant="secondary" className="text-xs h-5 px-1.5 flex items-center">
                          <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                          {course.rating.toFixed(1)}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Eye className="h-3 w-3 mr-1" />
                        <span>{course.viewCount?.toLocaleString() || 0}</span>
                      </div>

                      {course.duration && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{course.duration}</span>
                        </div>
                      )}

                      {course.students && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Users className="h-3 w-3 mr-1" />
                          <span>{course.students.toLocaleString()}+</span>
                        </div>
                      )}

                      {course.level && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                          {course.level}
                        </Badge>
                      )}

                      {course.category && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                          {course.category}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <motion.div
                    animate={{
                      x: hoveredIndex === index ? 5 : 0,
                      color: hoveredIndex === index ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                    }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </motion.div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <Link
          href="/dashboard/explore"
          className="flex items-center justify-center text-sm text-primary hover:text-primary/80 transition-colors mt-4"
        >
          <span>View all courses</span>
          <BarChart2 className="h-4 w-4 ml-2" />
        </Link>
      </motion.div>
    </div>
  )
}
