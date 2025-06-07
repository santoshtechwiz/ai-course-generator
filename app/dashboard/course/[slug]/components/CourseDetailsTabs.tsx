"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import {
  BookOpen,
  Brain,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle,
  Star,
  Download,
  Users,
  TrendingUp,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import CourseAISummary from "./CourseAISummary"
import type { FullChapterType, FullCourseType } from "@/app/types/types"
import CourseDetailsQuiz from "./CourseDetailsQuiz"

interface CoursePageTabsProps {
  course: FullCourseType
  currentChapter?: FullChapterType
  isAuthenticated: boolean
  isPremium: boolean
  isAdmin: boolean
}

export const CoursePageTabs: React.FC<CoursePageTabsProps> = ({
  course,
  currentChapter,
  isAuthenticated,
  isPremium,
  isAdmin,
}) => {
  const [activeTab, setActiveTab] = useState("overview")

  // Memoized course stats
  const courseStats = useMemo(() => {
    const totalChapters = course.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0) || 0
    const totalDuration =
      course.courseUnits?.reduce(
        (acc, unit) => acc + unit.chapters.reduce((chapterAcc, chapter) => chapterAcc + (chapter.duration || 0), 0),
        0,
      ) || 0

    return {
      totalChapters,
      totalDuration,
      difficulty: course.difficulty || "Beginner",
      rating: 4.8, // This would come from your API
      students: 12543, // This would come from your API
    }
  }, [course])

  // Format duration
  const formatDuration = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }, [])

  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)
  }, [])

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="ai-summary" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">AI Summary</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Notes</span>
          </TabsTrigger>
         
          {/* <TabsTrigger value="resources" className="flex items-center gap-2 hidden lg:flex">
            <Download className="h-4 w-4" />
            <span>Resources</span>
          </TabsTrigger> */}
          <TabsTrigger value="progress" className="flex items-center gap-2 hidden lg:flex">
            <TrendingUp className="h-4 w-4" />
            <span>Progress</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Course Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Course Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Chapters</span>
                        <Badge variant="secondary">{courseStats.totalChapters}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Duration</span>
                        <Badge variant="secondary">{formatDuration(courseStats.totalDuration)}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Difficulty</span>
                        <Badge variant="outline">{courseStats.difficulty}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Rating</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{courseStats.rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Students</span>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span className="text-sm font-medium">{courseStats.students.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Current Chapter */}
                  {currentChapter && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Current Chapter
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <h3 className="font-medium mb-2">{currentChapter.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {currentChapter.description || "Continue learning with this chapter."}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {currentChapter.duration || "5 min"}
                          </Badge>
                          {currentChapter.isFree && <Badge variant="secondary">Free</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Course Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>About This Course</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {course.description ||
                        "This comprehensive course will take you through all the essential concepts and practical applications. You'll learn through hands-on examples and real-world projects."}
                    </p>
                  </CardContent>
                </Card>

             
              </TabsContent>

              {/* AI Summary Tab */}
              <TabsContent value="ai-summary">
                {currentChapter ? (
                  <CourseAISummary
                    chapterId={currentChapter.id}
                    name={currentChapter.title || "Current Chapter"}
                    existingSummary={null}
                    isPremium={isPremium}
                    isAdmin={isAdmin}
                  />
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Chapter Selected</h3>
                        <p className="text-muted-foreground">Select a chapter to view its AI-generated summary.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Your Notes
                    </CardTitle>
                    <CardDescription>Take notes while watching to enhance your learning experience.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Notes Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start taking notes to keep track of important concepts and ideas.
                      </p>
                      <Button>
                        <FileText className="h-4 w-4 mr-2" />
                        Add Your First Note
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Discussion Tab */}
              <TabsContent value="discussion">
              <CourseDetailsQuiz isPremium={false} isPublicCourse={false} chapter={undefined} course={undefined}></CourseDetailsQuiz>
              </TabsContent>

              {/* Resources Tab */}
              <TabsContent value="resources">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Course Resources
                    </CardTitle>
                    <CardDescription>Download additional materials and resources for this course.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <div>
                            <h4 className="font-medium">Course Slides</h4>
                            <p className="text-sm text-muted-foreground">PDF • 2.4 MB</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-green-500" />
                          <div>
                            <h4 className="font-medium">Exercise Files</h4>
                            <p className="text-sm text-muted-foreground">ZIP • 5.1 MB</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Progress Tab */}
              <TabsContent value="progress">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Your Progress
                    </CardTitle>
                    <CardDescription>Track your learning progress and achievements.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Progress Tracking</h3>
                      <p className="text-muted-foreground mb-4">
                        Your learning progress will be displayed here as you complete chapters.
                      </p>
                      <Button variant="outline">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        View Detailed Progress
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  )
}

export default CoursePageTabs
