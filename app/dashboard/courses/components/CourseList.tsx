"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

import CourseCard from "./CourseCard"
import NoCoursesIllustration from "./NoCoursesIllustration"

interface Course {
  id: string
  name: string
  image: string
  lessonCount: number
  quizCount: number
  rating: number
  slug: string
}

interface CoursesListProps {
  initialCourses: Course[]
}

export default function CoursesList({ initialCourses }: CoursesListProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulating a delay in loading courses
    const timer = setTimeout(() => {
      setCourses(initialCourses)
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [initialCourses])

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex justify-center items-center py-20"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-muted-foreground"></div>
        </motion.div>
      ) : courses.length === 0 ? (
        <motion.div
          key="no-courses"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="text-center py-20"
        >
          <NoCoursesIllustration />
          <p className="text-xl text-muted-foreground">No courses found. Try a different search term.</p>
        </motion.div>
      ) : (
        <motion.div
          key="courses-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, staggerChildren: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {courses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CourseCard 
                id={course.id}
                name={course.name}
                image={course.image}
                lessonCount={course.lessonCount}
                quizCount={course.quizCount}
                rating={course.rating}
                slug={course.slug}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

