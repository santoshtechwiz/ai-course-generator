"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Brain, ArrowRight, Target, RotateCcw, BookOpen, RefreshCw } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Course, CourseProgress, QuizAttempt } from "@/app/types"

interface AIRecommendationsProps {
  courses: Course[]
  courseProgress: CourseProgress[]
  quizAttempts: QuizAttempt[]
}

interface Recommendation {
  type: "next" | "review" | "practice"
  message: string
  courseId: number
  chapterId: number
  slug: string
}

export default function AIRecommendations({ courses, courseProgress, quizAttempts }: AIRecommendationsProps) {
  const router = useRouter()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const generateRecommendations = useCallback(() => {
    setIsLoading(true)
    setError(null)

    try {
      const newRecommendations: Recommendation[] = []

      // Find courses with low progress
      const lowProgressCourses = courseProgress.filter((c) => c.progress < 30 && !c.isCompleted)
      if (lowProgressCourses.length > 0) {
        const course = courses.find((c) => c.id === lowProgressCourses[0].courseId)
        if (
          course &&
          course.courseUnits &&
          course.courseUnits.length > 0 &&
          course.courseUnits[0].chapters.length > 0
        ) {
          newRecommendations.push({
            type: "next",
            message: `Continue ${course.name} to maintain your learning momentum`,
            courseId: +course.id,
            chapterId: +course.courseUnits[0].chapters[0].id,
            slug: course.slug || "",
          })
        }
      }

      // Find quizzes with low scores
      const lowScoreQuizzes = quizAttempts.filter((q) => q?.score < 70)
      if (lowScoreQuizzes.length > 0) {
        const latestLowScoreQuiz = lowScoreQuizzes.reduce((latest, current) =>
          new Date(latest.createdAt) > new Date(current.createdAt) ? latest : current,
        )
        const relevantCourse = courses.find((c) =>
          c.courseUnits?.some((unit) =>
            unit.chapters.some((chapter) =>
              chapter.questions?.some((question) => question.id === latestLowScoreQuiz.quizId),
            ),
          ),
        )
        if (relevantCourse) {
          const relevantChapter = relevantCourse.courseUnits
            ?.flatMap((unit) => unit.chapters)
            .find((chapter) => chapter.questions?.some((question) => question.id === latestLowScoreQuiz.quizId))
          if (relevantChapter) {
            newRecommendations.push({
              type: "review",
              message: "Review previous chapters to improve your quiz scores",
              courseId: relevantCourse.id,
              chapterId: relevantChapter.id,
              slug: relevantCourse.slug || "",
            })
          }
        }
      }

      // Recommend practice if no recent activity
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const inactiveCourses = courseProgress.filter((c) => new Date(c.lastAccessedAt) < oneWeekAgo && !c.isCompleted)
      if (inactiveCourses.length > 0) {
        const course = courses.find((c) => c.id === inactiveCourses[0].courseId)
        if (
          course &&
          course.courseUnits &&
          course.courseUnits.length > 0 &&
          course.courseUnits[0].chapters.length > 0
        ) {
          newRecommendations.push({
            type: "practice",
            message: "Practice makes perfect! Take a quick quiz to stay sharp",
            courseId: course.id,
            chapterId: course.courseUnits[0].chapters[0].id,
            slug: course.slug || "",
          })
        }
      }

      setRecommendations(newRecommendations)
    } catch (err) {
      setError("Failed to generate recommendations. Please try again.")
      toast({
        title: "Error",
        description: "Failed to generate recommendations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [courses, courseProgress, quizAttempts])

  useEffect(() => {
    generateRecommendations()
  }, [generateRecommendations])

  const handleRecommendationClick = (recommendation: Recommendation) => {
    router.push(`/dashboard/course/${recommendation.slug}?chapter=${recommendation.chapterId}`)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="flex items-start gap-4">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={generateRecommendations} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No recommendations at the moment</p>
          <p className="text-xs text-muted-foreground">Keep learning and check back later!</p>
          <Button onClick={generateRecommendations} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Recommendations
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Recommendations
        </CardTitle>
        <Button onClick={generateRecommendations} variant="ghost" size="icon">
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">Refresh Recommendations</span>
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <AnimatePresence>
            {recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div
                  className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted mb-4 cursor-pointer"
                  onClick={() => handleRecommendationClick(rec)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleRecommendationClick(rec)}
                >
                  {rec.type === "review" && <RotateCcw className="h-5 w-5 text-yellow-500 shrink-0" />}
                  {rec.type === "practice" && <Target className="h-5 w-5 text-blue-500 shrink-0" />}
                  {rec.type === "next" && <ArrowRight className="h-5 w-5 text-green-500 shrink-0" />}
                  <div className="flex-1 space-y-2">
                    <p className="text-sm">{rec.message}</p>
                    <p className="text-xs text-muted-foreground">Click to get started</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

