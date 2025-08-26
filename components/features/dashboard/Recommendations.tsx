"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Brain, ArrowRight, Target, RotateCcw, BookOpen, RefreshCw, Sparkles, BookMarked } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { CourseUnit, Chapter, CourseProgress as AppCourseProgress } from "@/app/types/course-types"
import type { UserQuizAttempt as AppUserQuizAttempt } from "@/app/types/quiz-types"
import { useLocalStorage } from "@/lib/storage"

interface AIRecommendationsProps {
  courses: any[] // fallback to any for now due to type mismatch
  courseProgress: AppCourseProgress[]
  quizAttempts: AppUserQuizAttempt[]
}

interface Recommendation {
  type: "next" | "review" | "practice" | "quiz"
  message: string
  courseId: number
  chapterId: number
  slug: string
  generatedAt?: Date
}

interface GeneratedQuiz {
  id: string
  title: string
  courseId: number
  chapterId: number
  questions: {
    question: string
    options: string[]
    correctAnswer: number
  }[]
}

// Cache TTL in milliseconds (24 hours)
const CACHE_TTL = 24 * 60 * 60 * 1000

export default function AIRecommendations({ courses, courseProgress, quizAttempts }: AIRecommendationsProps) {
  const router = useRouter()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null)
  const hasInitialized = useRef(false)

  // Cache recommendations in localStorage to reduce API calls
  const [cachedRecommendations, setCachedRecommendations] = useLocalStorage<{
    data: Recommendation[]
    timestamp: number
  }>("ai-recommendations-cache", { data: [], timestamp: 0 })

  // Analyze user data to identify knowledge gaps and interests
  const userAnalysis = useMemo(() => {
    // Track topics the user has engaged with
    const topicEngagement = new Map<string, number>()

    // Track knowledge gaps based on quiz performance
    const knowledgeGaps = new Map<string, number>()

    // Analyze quiz attempts to find knowledge gaps
    quizAttempts.forEach((attempt) => {
      const relevantCourse = courses.find((c) =>
        c.courseUnits && Array.isArray(c.courseUnits) && c.courseUnits.some((unit: CourseUnit) =>
          unit.chapters && Array.isArray(unit.chapters) && unit.chapters.some((chapter: Chapter) =>
            chapter.questions && Array.isArray(chapter.questions) && chapter.questions.some((question) => question.id === attempt.userQuizId)
          )
        )
      )

      if (relevantCourse) {
        // Increase topic engagement
        topicEngagement.set(relevantCourse.title, (topicEngagement.get(relevantCourse.title) || 0) + 1)

        // If score is low, mark as knowledge gap
        if (attempt.score !== null && attempt.score !== undefined && attempt.score < 70) {
          knowledgeGaps.set(relevantCourse.title, (knowledgeGaps.get(relevantCourse.title) || 0) + 1)
        }
      }
    })

    // Analyze course progress to find interests
    courseProgress.forEach((progress) => {
      const course = courses.find((c) => c.id == progress.courseId)
      if (course) {
        // Increase topic engagement based on progress
        topicEngagement.set(course.title, (topicEngagement.get(course.title) || 0) + Math.floor(progress.progress / 10))
      }
    })

    return {
      topicEngagement: Array.from(topicEngagement.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([topic]) => topic),
      knowledgeGaps: Array.from(knowledgeGaps.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([topic]) => topic),
    }
  }, [courses, courseProgress, quizAttempts])

  const generateRecommendations = useCallback(() => {
    setIsLoading(true)
    setError(null)

    try {
      // Check if we have valid cached recommendations
      const now = Date.now()
      if (cachedRecommendations.data.length > 0 && now - cachedRecommendations.timestamp < CACHE_TTL) {
        setRecommendations(cachedRecommendations.data)
        setIsLoading(false)
        return
      }

      const newRecommendations: Recommendation[] = []

      // Find courses with low progress
      const lowProgressCourses = courseProgress
        .filter((c) => c.progress < 30 && !c.isCompleted)
        .sort((a, b) => a.progress - b.progress)

      if (lowProgressCourses.length > 0) {
        const course = courses.find((c) => c.id == lowProgressCourses[0].courseId)
        if (
          course &&
          course.courseUnits && Array.isArray(course.courseUnits) &&
          course.courseUnits.length > 0 &&
          course.courseUnits[0].chapters && Array.isArray(course.courseUnits[0].chapters) &&
          course.courseUnits[0].chapters.length > 0
        ) {
          // Find the next incomplete chapter
          const completedChaptersArray = Array.isArray(lowProgressCourses[0].completedChapters)
            ? lowProgressCourses[0].completedChapters
            : []

          const nextChapter =
            course.courseUnits
              .flatMap((unit: CourseUnit) => unit.chapters || [])
              .find((chapter: Chapter) => !completedChaptersArray.includes(chapter.id)) || (course.courseUnits[0].chapters && course.courseUnits[0].chapters[0])

          if (nextChapter) {
            newRecommendations.push({
              type: "next",
              message: `Continue ${course.title} to maintain your learning momentum`,
              courseId: typeof course.id === "string" ? parseInt(course.id) : course.id,
              chapterId: typeof nextChapter.id === "string" ? parseInt(nextChapter.id) : nextChapter.id,
              slug: course.slug || "",
              generatedAt: new Date(),
            })
          }
        }
      }

      // Find quizzes with low scores
      const lowScoreQuizzes = quizAttempts
        .filter((q) => q.score !== null && q.score !== undefined && q.score < 70)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      if (lowScoreQuizzes.length > 0) {
        const latestLowScoreQuiz = lowScoreQuizzes[0]
        const relevantCourse = courses.find((c) =>
          c.courseUnits && Array.isArray(c.courseUnits) && c.courseUnits.some((unit: CourseUnit) =>
            unit.chapters && Array.isArray(unit.chapters) && unit.chapters.some((chapter: Chapter) =>
              chapter.questions && Array.isArray(chapter.questions) && chapter.questions.some((question) => question.id === latestLowScoreQuiz.userQuizId)
            )
          )
        )

        if (relevantCourse) {
          const relevantChapter = relevantCourse.courseUnits
            .flatMap((unit: CourseUnit) => unit.chapters || [])
            .find((chapter: Chapter) => chapter.questions && Array.isArray(chapter.questions) && chapter.questions.some((question) => question.id === latestLowScoreQuiz.userQuizId))

          if (relevantChapter) {
            newRecommendations.push({
              type: "review",
              message: `Review ${relevantChapter.title} to improve your quiz score of ${latestLowScoreQuiz.score}%`,
              courseId: typeof relevantCourse.id === "string" ? parseInt(relevantCourse.id) : relevantCourse.id,
              chapterId: typeof relevantChapter.id === "string" ? parseInt(relevantChapter.id) : relevantChapter.id,
              slug: relevantCourse.slug || "",
              generatedAt: new Date(),
            })
          }
        }
      }

      // Recommend practice if no recent activity
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      const inactiveCourses = courseProgress
        .filter((c) => c.lastAccessedAt && new Date(c.lastAccessedAt as string) < twoWeeksAgo && !c.isCompleted)
        .sort((a, b) => new Date(a.lastAccessedAt as string).getTime() - new Date(b.lastAccessedAt as string).getTime())

      if (inactiveCourses.length > 0) {
        const course = courses.find((c) => c.id == inactiveCourses[0].courseId)
        if (course && course.courseUnits && Array.isArray(course.courseUnits) && course.courseUnits.length > 0) {
          const chapterWithQuestions = course.courseUnits
            .flatMap((unit: CourseUnit) => unit.chapters || [])
            .find((chapter: Chapter) => chapter.questions && Array.isArray(chapter.questions) && chapter.questions.length > 0)

          if (chapterWithQuestions) {
            newRecommendations.push({
              type: "practice",
              message: `Practice ${course.title} to refresh your knowledge after ${getTimeSinceLastAccess(inactiveCourses[0].lastAccessedAt as string)}`,
              courseId: typeof course.id === "string" ? parseInt(course.id) : course.id,
              chapterId: typeof chapterWithQuestions.id === "string" ? parseInt(chapterWithQuestions.id) : chapterWithQuestions.id,
              slug: course.slug || "",
              generatedAt: new Date(),
            })
          }
        }
      }

      // Add personalized quiz recommendation based on user interests
      if (userAnalysis.topicEngagement.length > 0) {
        const topInterest = userAnalysis.topicEngagement[0]
        const relevantCourse = courses.find((c) => c.title === topInterest)

        if (relevantCourse && relevantCourse.courseUnits && Array.isArray(relevantCourse.courseUnits) && relevantCourse.courseUnits.length > 0 && relevantCourse.courseUnits[0].chapters && Array.isArray(relevantCourse.courseUnits[0].chapters) && relevantCourse.courseUnits[0].chapters.length > 0) {
          const firstChapter = relevantCourse.courseUnits[0].chapters[0]

          newRecommendations.push({
            type: "quiz",
            message: `Take a personalized quiz on ${topInterest} to test your knowledge`,
            courseId: typeof relevantCourse.id === "string" ? parseInt(relevantCourse.id) : relevantCourse.id,
            chapterId: typeof firstChapter.id === "string" ? parseInt(firstChapter.id) : firstChapter.id,
            slug: relevantCourse.slug || "",
            generatedAt: new Date(),
          })
        }
      }

      // Update state and cache
      setRecommendations(newRecommendations)
      setCachedRecommendations({
        data: newRecommendations,
        timestamp: now,
      })
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
  }, [courses, courseProgress, quizAttempts, userAnalysis, setCachedRecommendations])

  useEffect(() => {
    if (hasInitialized.current) return

    hasInitialized.current = true
    generateRecommendations()

    return () => {
      // Cleanup
    }
  }, []) // Empty dependency array to run only once

  const handleRecommendationClick = (recommendation: Recommendation) => {
    if (recommendation.type === "quiz") {
      generatePersonalizedQuiz(recommendation)
    } else {
  
      router.push(`/dashboard/course/${recommendation.slug}?chapter=${recommendation.chapterId}`)
    }
  }

  const generatePersonalizedQuiz = async (recommendation: Recommendation) => {
    setIsGeneratingQuiz(true)

    try {
      const course = courses.find((c) => c.id == recommendation.courseId)
      const chapter = course?.courseUnits
        ?.flatMap((unit: CourseUnit) => unit.chapters || [])
        .find((ch: Chapter) => ch.id == recommendation.chapterId)

      if (!course || !chapter) {
        throw new Error("Course or chapter not found")
      }

      // In a real implementation, this would call an API endpoint
      // Here we're simulating the generation to avoid API calls
      const quiz: GeneratedQuiz = {
        id: `generated-${Date.now()}`,
        title: `Personalized Quiz: ${course.title}`,
        courseId: course.id,
        chapterId: chapter.id,
        questions: [
          {
            question: `What is the main focus of ${course.title}?`,
            options: [
              `Understanding core concepts of ${course.title}`,
              `Advanced techniques in ${course.title}`,
              `History of ${course.title}`,
              `Practical applications of ${course.title}`,
            ],
            correctAnswer: 0,
          },
          {
            question: `Which of these is most relevant to ${chapter.title}?`,
            options: ["Theoretical foundations", "Practical implementation", "Case studies", "Future developments"],
            correctAnswer: 1,
          },
          {
            question: "Based on your previous quiz performance, which area needs improvement?",
            options: [
              userAnalysis.knowledgeGaps[0] || "Fundamental concepts",
              userAnalysis.knowledgeGaps[1] || "Advanced applications",
              "Problem-solving techniques",
              "Analytical thinking",
            ],
            correctAnswer: 0,
          },
        ],
      }

      // In a real implementation, this quiz would be saved to the database
      setGeneratedQuiz(quiz)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to generate personalized quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingQuiz(false)
    }
  }

  const handleStartQuiz = () => {
    if (generatedQuiz) {
      // In a real implementation, this would navigate to the quiz page
      // with the generated quiz ID
      toast({
        title: "Quiz Ready",
        description: "Your personalized quiz has been created and is ready to take!",
      })

      // Reset the generated quiz state
      setGeneratedQuiz(null)

      // Navigate to the course page
      const recommendation = recommendations.find((r) => r.type === "quiz")
      if (recommendation) {
  
        router.push(`/dashboard/course/${recommendation.slug}?chapter=${recommendation.chapterId}`)
      }
    }
  }

  // Helper function to format time since last access
  const getTimeSinceLastAccess = (lastAccessedAt: string) => {
    const lastAccess = new Date(lastAccessedAt)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - lastAccess.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 7) {
      return `${diffDays} days`
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks`
    } else {
      return `${Math.floor(diffDays / 30)} months`
    }
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

  if (isGeneratingQuiz) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Generating Personalized Quiz
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          <div className="flex items-center justify-center h-24 w-24 rounded-full bg-primary/10">
            <Sparkles className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <p className="text-sm text-center">Creating a personalized quiz based on your learning history...</p>
          <div className="w-full max-w-xs bg-muted rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full animate-[progress_2s_ease-in-out_infinite]"
              style={{ width: "70%" }}
            ></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (generatedQuiz) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {generatedQuiz.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This quiz has been personalized based on your learning history and areas that need improvement.
          </p>
          <div className="space-y-3">
            {generatedQuiz.questions.map((q, i) => (
              <div key={i} className="border rounded-lg p-3">
                <p className="font-medium text-sm mb-2">
                  Question {i + 1}: {q.question}
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {q.options.map((option, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-muted text-xs">
                        {String.fromCharCode(65 + j)}
                      </span>
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setGeneratedQuiz(null)}>
            Cancel
          </Button>
          <Button onClick={handleStartQuiz} className="flex items-center gap-2">
            <BookMarked className="h-4 w-4" />
            Start Quiz
          </Button>
        </CardFooter>
      </Card>
    )
  }
  console.log(recommendations)
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
                  {rec.type === "quiz" && <Sparkles className="h-5 w-5 text-purple-500 shrink-0" />}
                  <div className="flex-1 space-y-2">
                    <p className="text-sm">{rec.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {rec.type === "quiz" ? "Click to generate a personalized quiz" : "Click to get started"}
                    </p>
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
