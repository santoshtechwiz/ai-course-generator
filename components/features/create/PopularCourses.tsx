"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Book, Clock, Users, ChevronRight, Sparkles, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { CourseDetails } from "@/app/types/types"

interface PopularCoursesProps {
  courseDetails: CourseDetails[]
}

const PopularCourses: React.FC<PopularCoursesProps> = ({ courseDetails }) => {
  const [filter, setFilter] = useState<string | null>(null)

  const filteredCourses = filter ? courseDetails.filter((course) => course.category === filter) : courseDetails

  const categories = Array.from(new Set(courseDetails.map((course) => course.category)))

  return (
    <div className="h-full space-y-6 bg-background">
      <div className="sticky top-0 z-10 pb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Popular Courses</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => setFilter(null)}>
            <Filter className="h-4 w-4 mr-2" />
            {filter || "All"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category}
              variant="outline"
              className={`cursor-pointer hover:bg-primary/10 transition-colors ${filter === category ? "bg-primary/20 border-primary/50" : ""}`}
              onClick={() => setFilter(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {filteredCourses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="relative group"
          >
            {/* Hover glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-primary/10 rounded-lg opacity-0 group-hover:opacity-100 blur transition-all duration-300 group-hover:duration-200 animate-tilt"></div>

            <Card className="relative bg-card border border-border group-hover:border-primary/20 transition-all duration-300 overflow-hidden">
              {/* Subtle gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <CardHeader className="space-y-1 relative z-10">
                <CardTitle className="flex justify-between items-center text-2xl">
                  <span className="group-hover:text-primary/90 transition-colors duration-300">
                    {course.courseName}
                  </span>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    className="h-8 w-8 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors duration-300"
                  >
                    <Book className="h-4 w-4 text-primary" />
                  </motion.div>
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {`Learn about ${course.category || "various topics"}`}
                </CardDescription>
              </CardHeader>

              <CardContent className="relative z-10">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                    <Users className="h-4 w-4 mr-2 group-hover:text-primary/70 transition-colors duration-300" />
                    {course.totalChapters} chapters
                  </div>
                  <div className="flex items-center text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                    <Clock className="h-4 w-4 mr-2 group-hover:text-primary/70 transition-colors duration-300" />
                    {`${course.totalUnits} units`}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="relative z-10">
                <Link href={`/dashboard/course/${course.slug}`} className="w-full">
                  <Button
                    className={cn(
                      "w-full group relative overflow-hidden transition-all duration-300",
                      "bg-primary hover:bg-primary/90",
                      "after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent",
                      "after:translate-x-[-100%] after:group-hover:translate-x-[100%] after:transition-transform after:duration-500",
                    )}
                    size="sm"
                  >
                    View Course
                    <motion.div
                      className="ml-2"
                      initial={{ x: 0 }}
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </motion.div>
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default PopularCourses

