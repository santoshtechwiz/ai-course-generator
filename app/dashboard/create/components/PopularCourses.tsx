"use client"

import React from "react"
import { motion } from "framer-motion"
import { Book, Clock, Users, ChevronRight, Sparkles, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Link from "next/link"
import { CourseDetails } from "@/app/types"

interface PopularCoursesProps {
  courseDetails: CourseDetails[]
}

const PopularCourses: React.FC<PopularCoursesProps> = ({ courseDetails }) => {
  return (
    <div className="h-full p-4 space-y-4">
      <div className="sticky top-0 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">Popular Courses</h2>
          </div>
          <Button variant="ghost" size="icon">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {courseDetails.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group bg-card hover:bg-accent transition-colors">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{course.courseName}</span>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center"
                    >
                      <Book className="h-4 w-4 text-yellow-500" />
                    </motion.div>
                  </CardTitle>
                  <CardDescription>
                    {`Learn about ${course.category || "various topics"}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {course.totalChapters} chapters
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {`${course.totalUnits} units`}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/dashboard/course/${course.slug}`} className="w-full">
                    <Button 
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                      size="lg"
                    >
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
    </div>
  )
}

export default PopularCourses

