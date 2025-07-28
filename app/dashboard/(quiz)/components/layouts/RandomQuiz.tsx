"use client"

import { useState, useCallback, useMemo } from "react"
import {
  Clock,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Star,
  Users,
  Target,
  Brain,
  Code2,
  BookOpen,
  PenTool,
  Shuffle,
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRandomQuizzes } from "@/hooks/useRandomQuizzes"
import type React from "react"

interface RandomQuizProps {
  stats?: {
    totalQuizzes?: number
    averageRating?: number
    totalAttempts?: number
  }
  isVisible?: boolean
  className?: string
  showHeader?: boolean
  showStats?: boolean
  showShuffle?: boolean
}

interface QuizData {
  id: string
  slug: string
  title: string
  description?: string
  quizType: string
  difficulty?: string
  duration?: number
  rating?: number
  completionRate?: number
  attempts?: number
}

const quizTypeConfig = {
  blanks: { icon: PenTool, label: "Fill Blanks", color: "bg-blue-500" },
  flashcard: { icon: BookOpen, label: "Flashcards", color: "bg-orange-500" },
  openended: { icon: BookOpen, label: "Open Ended", color: "bg-purple-500" },
  code: { icon: Code2, label: "Code Quiz", color: "bg-green-500" },
  mcq: { icon: Brain, label: "Multiple Choice", color: "bg-indigo-500" },
}

const difficultyColors = {
  Easy: "bg-green-100 text-green-800 border-green-200",
  Medium: "bg-amber-100 text-amber-800 border-amber-200",
  Hard: "bg-red-100 text-red-800 border-red-200",
}

const quizTypeRoutes = {
  blanks: "dashboard/blanks",
  mcq: "dashboard/mcq",
  flashcard: "dashboard/flashcard",
  openended: "dashboard/openended",
  code: "dashboard/code",
}

const QuizCard: React.FC<{
  quiz: QuizData
  isActive: boolean
}> = ({ quiz, isActive }) => {
  const config = quizTypeConfig[quiz.quizType as keyof typeof quizTypeConfig] || quizTypeConfig.mcq
  const Icon = config.icon
  const difficultyColor = quiz.difficulty
    ? difficultyColors[quiz.difficulty as keyof typeof difficultyColors]
    : difficultyColors.Medium

  if (!isActive) return null

  return (
    <Card className="h-full border-0 shadow-sm bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={cn("p-2 rounded-lg text-white", config.color)}>
            <Icon className="h-5 w-5" />
          </div>
          {quiz.rating && (
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-full">
              <Star className="h-3 w-3 text-amber-500 fill-current" />
              <span className="text-xs font-medium text-amber-700">{quiz.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <CardTitle className="text-lg font-bold leading-tight line-clamp-2">{quiz.title}</CardTitle>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            {config.label}
          </Badge>
          {quiz.difficulty && (
            <Badge variant="outline" className={cn("text-xs border", difficultyColor)}>
              {quiz.difficulty}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {quiz.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{quiz.description}</p>}

        <div className="grid grid-cols-2 gap-3 text-sm">
          {quiz.duration && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{quiz.duration} min</span>
            </div>
          )}
          {quiz.attempts && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{quiz.attempts}</span>
            </div>
          )}
          {quiz.completionRate && (
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span>{quiz.completionRate}%</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Link href={`/${quizTypeRoutes[quiz.quizType as keyof typeof quizTypeRoutes]}/${quiz.slug}`} className="w-full">
          <Button className="w-full">
            Start Quiz
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

export const RandomQuiz: React.FC<RandomQuizProps> = ({
  stats = {},
  isVisible = true,
  className,
  showHeader = true,
  showShuffle = true,
}) => {
  const { quizzes, isLoading, error, refresh } = useRandomQuizzes(6)
  const [activeIndex, setActiveIndex] = useState(0)

  const processedQuizzes = useMemo(() => {
    if (!quizzes?.length) return []
    return quizzes.map(
      (quiz: any, index: number): QuizData => ({
        id: quiz.id || `quiz-${index}`,
        slug: quiz.slug || quiz.id || `quiz-${index}`,
        title: quiz.title || "Untitled Quiz",
        description: quiz.description,
        quizType: quiz.quizType || "mcq",
        difficulty: quiz.difficulty,
        duration: quiz.duration,
        rating: quiz.rating,
        completionRate: quiz.completionRate,
        attempts: quiz.attempts,
      }),
    )
  }, [quizzes])

  const nextQuiz = useCallback(() => {
    if (processedQuizzes.length <= 1) return
    setActiveIndex((prev) => (prev + 1) % processedQuizzes.length)
  }, [processedQuizzes.length])

  const prevQuiz = useCallback(() => {
    if (processedQuizzes.length <= 1) return
    setActiveIndex((prev) => (prev === 0 ? processedQuizzes.length - 1 : prev - 1))
  }, [processedQuizzes.length])

  const handleShuffle = useCallback(() => {
    refresh()
    setActiveIndex(0)
  }, [refresh])

  if (!isVisible) return null

  return (
    <Card className={cn("w-full", className)}>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Discover Quizzes</h3>
            </div>
            {showShuffle && (
              <Button variant="ghost" size="sm" onClick={handleShuffle} disabled={isLoading} className="h-8 w-8 p-0">
                <Shuffle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent className="p-4">
        {isLoading && !processedQuizzes.length ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading quizzes...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <p className="text-sm text-muted-foreground">Failed to load quizzes</p>
            <Button variant="outline" size="sm" onClick={handleShuffle}>
              Try Again
            </Button>
          </div>
        ) : processedQuizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">No quizzes available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quiz Card */}
            <div className="relative min-h-[300px]">
              {processedQuizzes.map((quiz, index) => (
                <div
                  key={quiz.id}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-200",
                    index === activeIndex ? "opacity-100" : "opacity-0 pointer-events-none",
                  )}
                >
                  <QuizCard quiz={quiz} isActive={index === activeIndex} />
                </div>
              ))}
            </div>

            {/* Navigation */}
            {processedQuizzes.length > 1 && (
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" size="sm" onClick={prevQuiz} className="h-8 w-8 p-0 bg-transparent">
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {processedQuizzes.map((_, index) => (
                    <button
                      key={index}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        index === activeIndex ? "bg-primary" : "bg-muted-foreground/30",
                      )}
                      onClick={() => setActiveIndex(index)}
                    />
                  ))}
                </div>

                <Button variant="outline" size="sm" onClick={nextQuiz} className="h-8 w-8 p-0 bg-transparent">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
