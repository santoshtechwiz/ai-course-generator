"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ChevronRight, TrendingUp, Eye } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"

interface PopularCoursesProps {
  courseDetails: any[]
}

export default function PopularCourses({ courseDetails = [] }: PopularCoursesProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // If no courses, show a message
  if (!courseDetails || courseDetails.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-primary" />
          Popular Courses
        </h2>
        <Card className="border-dashed border-muted">
          <CardContent className="p-6 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No popular courses yet</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Sort courses by viewCount (descending)
  const sortedCourses = [...courseDetails].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center">
        <TrendingUp className="mr-2 h-5 w-5 text-primary" />
        Popular Courses
      </h2>

      <div className="space-y-3">
        {sortedCourses.map((course, index) => (
          <motion.div
            key={course.id || index}
            className="relative"
            onHoverStart={() => setHoveredIndex(index)}
            onHoverEnd={() => setHoveredIndex(null)}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Link href={`/dashboard/course/${course.slug}`} className="block">
              <Card className="overflow-hidden border-border/50 hover:border-primary/20 transition-colors">
                <div className="flex items-center p-3">
                  <div className="relative h-12 w-12 rounded-md overflow-hidden flex-shrink-0 mr-3 bg-muted">
                    {course.image ? (
                      <Image
                        src={course.image || "/placeholder.svg"}
                        alt={course.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full bg-primary/10">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-1">{course.title}</h3>

                    <div className="flex items-center mt-1 text-xs text-muted-foreground">
                      <div className="flex items-center mr-3">
                        <Eye className="h-3 w-3 mr-1" />
                        <span>{course.viewCount || 0}</span>
                      </div>

                      {course.category && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                          {course.category}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <ChevronRight
                    className={`h-4 w-4 transition-transform duration-300 ${
                      hoveredIndex === index ? "translate-x-1 text-primary" : "text-muted-foreground"
                    }`}
                  />
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <Link
        href="/dashboard/explore"
        className="block text-center text-sm text-primary hover:text-primary/80 transition-colors mt-4"
      >
        View all courses
      </Link>
    </div>
  )
}
