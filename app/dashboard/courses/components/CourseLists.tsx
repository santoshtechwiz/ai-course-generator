"use client"

import { useState } from "react"
import { CourseCard } from "./CourseCard"
import SearchBar from "./SearchBar"

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

  const handleSearch = (query: string) => {
    const lowercaseQuery = query.toLowerCase()
    const filtered = initialCourses.filter(
      (course) =>
        course.name.toLowerCase().includes(lowercaseQuery) ||
        (course.description?.toLowerCase() || "").includes(lowercaseQuery),
    )
    setFilteredCourses(filtered)
  }

  if (!initialCourses || initialCourses.length === 0) {
    return <div className="text-center text-gray-500">No courses available.</div>
  }

  return (
    <div>
      <SearchBar onSearch={handleSearch} />
      {filteredCourses.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">No courses found matching your search.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} {...course} />
          ))}
        </div>
      )}
    </div>
  )
}

export default CourseList

