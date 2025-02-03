"use client"

import { useState, useCallback, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { debounce } from "lodash"
import axios from "axios"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import type { PublicCourse, QuizListItem } from "../types/types"
import { QuizCard } from "../components/shared/QuizCard"
import { CourseCard } from "./courses/components/CourseCard"

const fetchCourses = async ({ queryKey }: { queryKey: [string, string, string, string] }) => {
  const [_, searchTerm, sortBy, filterDifficulty] = queryKey
  const { data } = await axios.get<PublicCourse[]>("/api/public/course", {
    params: { search: searchTerm, sort: sortBy, difficulty: filterDifficulty },
  })
  return data
}

const fetchQuizzes = async ({ queryKey }: { queryKey: [string, string, string, string] }) => {
  const [_, searchTerm, sortBy, filterDifficulty] = queryKey
  const { data } = await axios.get<QuizListItem[]>("/api/public/quiz", {
    params: { search: searchTerm, sort: sortBy, difficulty: filterDifficulty },
  })
  return data
}

export default function PublicCoursesAndQuizzes() {
  const [activeTab, setActiveTab] = useState("courses")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("name")

  const debouncedSearch = useCallback(
    debounce((value: string) => setSearchTerm(value), 300),
    [],
  )

  const {
    data: courses,
    isLoading: isLoadingCourses,
    isError: isErrorCourses,
  } = useQuery({
    queryKey: ["courses", searchTerm, sortBy, ""],
    queryFn: fetchCourses,
    staleTime: 60000, // 1 minute
  })

  const {
    data: quizzes,
    isLoading: isLoadingQuizzes,
    isError: isErrorQuizzes,
  } = useQuery({
    queryKey: ["quizzes", searchTerm, sortBy, ""],
    queryFn: fetchQuizzes,
    staleTime: 60000, // 1 minute
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value)
  }

  useEffect(() => {
    if (searchTerm) {
      const courseResults = courses?.filter(
        (course) =>
          course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      const quizResults = quizzes?.filter((quiz) => quiz.topic.toLowerCase().includes(searchTerm.toLowerCase()))

      if (courseResults?.length && !quizResults?.length) {
        setActiveTab("courses")
      } else if (!courseResults?.length && quizResults?.length) {
        setActiveTab("quizzes")
      }
    }
  }, [searchTerm, courses, quizzes])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Explore Courses and Quizzes</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative w-full">
            <Input placeholder="Search courses and quizzes..." onChange={handleSearchChange} className="w-full pl-10" />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          </div>
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value={activeTab === "courses" ? "rating" : "score"}>
              {activeTab === "courses" ? "Rating" : "Best Score"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
        </TabsList>
        <TabsContent value="courses">
          {isLoadingCourses ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : isErrorCourses ? (
            <div className="text-center text-red-500">Error loading courses. Please try again later.</div>
          ) : courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  name={course.name}
                  description={course.description ?? ""}
                  image={course.image}
                  rating={course.rating || 0}
                  slug={course.slug ?? ""}
                  unitCount={course.unitCount || 0}
                  lessonCount={course.lessonCount || 0}
                  quizCount={course.quizCount || 0}
                  userId={""} id={""}                />
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">No courses found.</div>
          )}
        </TabsContent>
        <TabsContent value="quizzes">
          {isLoadingQuizzes ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : isErrorQuizzes ? (
            <div className="text-center text-red-500">Error loading quizzes. Please try again later.</div>
          ) : quizzes && quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  title={quiz.topic}
                  questionCount={quiz.questionCount}
                  quizType={quiz.quizType as "code" | "mcq" | "openended" | "fill-blanks"}
                  slug={quiz.slug}
                  description={""}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">No quizzes found.</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

