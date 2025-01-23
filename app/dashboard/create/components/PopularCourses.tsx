"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Book, Clock, Users, ChevronRight, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Link from "next/link"
import type { CourseDetails } from "@/app/types"

interface PopularCoursesProps {
  courseDetails: CourseDetails[]
}

const PopularCourses: React.FC<PopularCoursesProps> = ({ courseDetails }) => {
  return (
    <div className="h-full p-6 space-y-6 bg-background">
      <div className="sticky top-0 z-10 pb-4 bg-background border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Popular Courses</h2>
          </div>
          <Button variant="ghost" size="icon">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {courseDetails.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <Card className="group hover:bg-muted transition-colors">
              <CardHeader className="space-y-1">
                <CardTitle className="flex justify-between items-center text-2xl">
                  <span>{course.courseName}</span>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
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
                  <Button className="w-full" size="sm">
                    View Course
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default PopularCourses

