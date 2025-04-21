"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, BookOpen, BarChart } from "lucide-react"
import type { QuizType } from "@/app/types/types"
import { motion } from "framer-motion"
import { buildQuizUrl } from "@/lib/utils"
import { getSimilarQuiz } from "@/app/actions/getSimilarQuiz"

const QUIZ_DIFFICULTY_COLORS = {
  beginner: "bg-green-100 text-green-800",
  easy: "bg-green-100 text-green-800",
  intermediate: "bg-blue-100 text-blue-800",
  medium: "bg-blue-100 text-blue-800",
  advanced: "bg-purple-100 text-purple-800",
  hard: "bg-purple-100 text-purple-800",
  expert: "bg-red-100 text-red-800",
} as const

interface SimilarQuiz {
  id: string
  title: string
  type: QuizType
  difficulty: string
  slug: string
}

export function SimilarQuizzes() {
  const [quizzes, setQuizzes] = useState<SimilarQuiz[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Use a ref to prevent duplicate API calls
  const fetchedRef = useRef(false)

  useEffect(() => {
    // Only fetch if we haven't already
    if (fetchedRef.current) return

    async function fetchSimilarQuizzes() {
      try {
        console.log("Fetching similar quizzes")
        const result = await getSimilarQuiz()
        if (result && result.similarQuizzes) {
          setQuizzes(
            result.similarQuizzes.map((q) => ({
              id: q.id,
              title: q.title,
              type: q.quizType,
              difficulty: q.difficulty,
              slug: q.slug,
            })),
          )
          console.log(`Found ${result.similarQuizzes.length} similar quizzes`)
        }
      } catch (err) {
        console.error("Error fetching similar quizzes:", err)
        setError(err instanceof Error ? err.message : "Unknown error occurred")
      } finally {
        setLoading(false)
        fetchedRef.current = true
      }
    }

    fetchSimilarQuizzes()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <BarChart className="h-5 w-5 mr-2 text-purple-500" />
          Recommended Next Quizzes
        </h3>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <BarChart className="h-5 w-5 mr-2 text-purple-500" />
          Recommended Next Quizzes
        </h3>
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    )
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <BarChart className="h-5 w-5 mr-2 text-purple-500" />
          Recommended Next Quizzes
        </h3>
        <div className="text-sm text-gray-500">No quizzes found.</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center">
        <BarChart className="h-5 w-5 mr-2 text-purple-500" />
        Recommended Next Quizzes
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {quizzes.map((quiz, index) => (
          <QuizCard key={quiz.id} quiz={quiz} index={index} />
        ))}
      </div>
    </div>
  )
}

function QuizCard({ quiz, index }: { quiz: SimilarQuiz; index: number }) {
  const difficultyColor =
    QUIZ_DIFFICULTY_COLORS[quiz.difficulty?.toLowerCase() as keyof typeof QUIZ_DIFFICULTY_COLORS] ||
    "bg-gray-100 text-gray-800"

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }}>
      <Link href={buildQuizUrl(quiz.slug, quiz.type)}>
        <Card className="hover:shadow-md transition-all duration-200 hover:bg-slate-50 group">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">
                <BookOpen className="h-5 w-5 text-slate-500 group-hover:text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-base group-hover:text-primary">{quiz.title}</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {formatQuizType(quiz.type)}
                  </Badge>
                  <Badge variant="secondary" className={`text-xs ${difficultyColor}`}>
                    {quiz.difficulty}
                  </Badge>
                </div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

function formatQuizType(quizType: QuizType): string {
  return quizType
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
