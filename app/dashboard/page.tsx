"use client"

import { useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { debounce } from "lodash"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Book, Clock, BarChart, Star, Search, Loader2 } from "lucide-react"
import { Course, QuizListItem } from "../types/types"
import { QuizCard } from "../components/shared/QuizCard"
import { CourseCard } from "./courses/components/CourseCard"



const fetchCourses = async ({ queryKey }: { queryKey: [string, string, string, string] }) => {
  const [_, searchTerm, sortBy, filterDifficulty] = queryKey
  const { data } = await axios.get<Course[]>("/api/public/course", {
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
    queryKey: ["courses", searchTerm, sortBy],
    queryFn: fetchCourses,
    enabled: activeTab === "courses",
  })

  const {
    data: quizzes,
    isLoading: isLoadingQuizzes,
    isError: isErrorQuizzes,
  } = useQuery({
    queryKey: ["quizzes", searchTerm, sortBy],
    queryFn: fetchQuizzes,
    enabled: activeTab === "quizzes",
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Explore Courses and Quizzes</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative w-full">
            <Input
              placeholder="Search courses and quizzes..."
              onChange={handleSearchChange}
              className="w-full pl-10"
            />
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
        </TabsList>
        <TabsContent value="courses">
          <ScrollArea className="h-[600px]">
            {isLoadingCourses ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : isErrorCourses ? (
              <div className="text-center text-red-500">Error loading courses. Please try again later.</div>
            ) : courses && courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                {courses.map((course) => (
                  <CourseCard name={course.name} key={course.id}
                   description={course.description}
                    image={course.image} 
                    rating={course.rating} 
                    slug={course.slug} 
                    unitCount={course.unitCount} 
                    lessonCount={course.lessonCount} 
                    quizCount={course.quizCount} userId={""} />

                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">No courses found.</div>
            )}
          </ScrollArea>
        </TabsContent>
        <TabsContent value="quizzes">
          <ScrollArea className="h-[600px]">
            {isLoadingQuizzes ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : isErrorQuizzes ? (
              <div className="text-center text-red-500">Error loading quizzes. Please try again later.</div>
            ) : quizzes && quizzes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                {quizzes.map((quiz) => (
                  <QuizCard key={quiz.id} title={quiz.topic}

                  questionCount={quiz.questionCount}
                  quizType={quiz.quizType as "code" | "mcq" | "openended" | "fill-blanks"}
                  slug={quiz.slug} description={""}
                  />
                
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">No quizzes found.</div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

