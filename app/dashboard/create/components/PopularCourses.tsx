"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Book, Clock, Users, ChevronRight, Sparkles, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { CourseDetails } from "@/app/types"

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
              className={`cursor-pointer hover:bg-primary/20 ${filter === category ? "bg-primary/20" : ""}`}
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
          >
            <Card className="group hover:bg-accent transition-colors">
              <CardHeader className="space-y-1">
                <CardTitle className="flex justify-between items-center text-2xl">
                  <span>{course.courseName}</span>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"
                  >
                    <Book className="h-4 w-4 text-primary" />
                  </motion.div>
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {`Learn about ${course.category || "various topics"}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    {course.totalChapters} chapters
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    {`${course.totalUnits} units`}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/dashboard/course/${course.slug}`} className="w-full">
                  <Button className="w-full group" size="sm">
                    View Course
                    <motion.div className="ml-2" initial={{ x: 0 }} whileHover={{ x: 5 }}>
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

