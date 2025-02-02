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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Book, Clock, BarChart, Star, Search, Loader2 } from "lucide-react"

interface Course {
  id: number
  name: string
  description: string
  image: string
  difficulty: string
  estimatedHours: number
  averageRating: number
  category: string
}

interface Quiz {
  id: number
  topic: string
  difficulty: string
  bestScore: number
  lastAttempted: string
}

const fetchCourses = async ({ queryKey }: { queryKey: [string, string, string, string] }) => {
  const [_, searchTerm, sortBy, filterDifficulty] = queryKey
  const { data } = await axios.get<Course[]>("/api/public/course", {
    params: { search: searchTerm, sort: sortBy, difficulty: filterDifficulty },
  })
  return data
}

const fetchQuizzes = async ({ queryKey }: { queryKey: [string, string, string, string] }) => {
  const [_, searchTerm, sortBy, filterDifficulty] = queryKey
  const { data } = await axios.get<Quiz[]>("/api/public/quiz", {
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
          <Input
            placeholder="Search courses and quizzes..."
            onChange={handleSearchChange}
            className="w-full"
            icon={<Search className="w-4 h-4 text-gray-500" />}
          />
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
                  <motion.div key={course.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Card className="h-full flex flex-col">
                      <img
                        src={course.image || "/placeholder.svg"}
                        alt={course.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <CardHeader>
                        <CardTitle>{course.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
                        <div className="flex justify-between items-center mb-2">
                          <Badge variant="secondary">{course.category}</Badge>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 mr-1" />
                            <span className="text-sm">{course.averageRating.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Book className="w-4 h-4 mr-1 text-blue-500" />
                            <span className="text-sm">{course.difficulty}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1 text-green-500" />
                            <span className="text-sm">{course.estimatedHours} hours</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
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
                  <motion.div key={quiz.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Card className="h-full flex flex-col">
                      <CardHeader>
                        <CardTitle>{quiz.topic}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="flex justify-between items-center mb-4">
                          <Badge variant="secondary">{quiz.difficulty}</Badge>
                          <div className="flex items-center">
                            <BarChart className="w-4 h-4 text-blue-500 mr-1" />
                            <span className="text-sm">Best Score: {quiz.bestScore}%</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1 text-green-500" />
                            <span className="text-sm">
                              Last Attempted: {new Date(quiz.lastAttempted).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <div className="p-4 mt-auto">
                        <Button className="w-full">Take Quiz</Button>
                      </div>
                    </Card>
                  </motion.div>
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

