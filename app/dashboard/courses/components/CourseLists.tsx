"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { CourseCard } from "./CourseCard"
import { CreateQuizCard } from "@/app/components/CreateQuizCard"
import { useInView } from "react-intersection-observer"

interface Course {
  id: string
  name: string
  description: string
  image: string
  rating: number
  slug: string
  unitCount: number
  lessonCount: number
  quizCount: number
  userId: string
}

interface CourseListProps {
  initialCourses: Course[]
}

const CourseList = ({ initialCourses }: CourseListProps) => {
  const [filteredCourses, setFilteredCourses] = useState(initialCourses)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [showCreatePrompt, setShowCreatePrompt] = useState(false)

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })

  useEffect(() => {
    const lowercaseQuery = searchQuery.toLowerCase()
    const filtered = initialCourses.filter(
      (course) =>
        course.name.toLowerCase().includes(lowercaseQuery) ||
        (course.description?.toLowerCase() || "").includes(lowercaseQuery),
    )
    setFilteredCourses(filtered)
    setIsSearching(lowercaseQuery.length > 0)
  }, [searchQuery, initialCourses])

  useEffect(() => {
    if (inView) {
      setShowCreatePrompt(true)
    }
  }, [inView])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  if (!initialCourses || initialCourses.length === 0) {
    return (
      <div className="text-center">
        <p className="text-gray-500 mb-4">No courses available.</p>
        <CreateQuizCard
          title="Create Your First Course"
          description="Start your teaching journey by creating your first course!"
          createUrl="http://localhost:3000/dashboard/create"
          animationDuration={2.0}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 relative min-h-screen">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-4 pb-2 border-b">
        <div className="flex items-center max-w-7xl mx-auto px-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search courses..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>
      </div>
      <AnimatePresence mode="wait">
        {filteredCourses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-8 px-4"
          >
            <p className="text-xl text-muted-foreground mb-4">
              {isSearching ? "No courses found matching your search." : "No courses available."}
            </p>
            <CreateQuizCard
              title={isSearching ? "Create New Course" : "Add Your First Course"}
              description={
                isSearching
                  ? "Can't find what you're looking for? Create a new course!"
                  : "Start your teaching journey by creating your first course!"
              }
              createUrl="http://localhost:3000/dashboard/create"
              animationDuration={2.0}
            />
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
              {filteredCourses.map((course) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CourseCard {...course} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={ref} className="h-20" /> {/* Intersection observer target */}
      <AnimatePresence>
        {showCreatePrompt && filteredCourses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-20"
          >
            <CreateQuizCard
              floating
              title="Create Course"
              createUrl="http://localhost:3000/dashboard/create"
              animationDuration={2.0}
              className="w-auto"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CourseList

