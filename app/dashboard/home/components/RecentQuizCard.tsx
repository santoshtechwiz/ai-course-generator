"use client"

import { memo } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Clock } from "lucide-react"
import type { UserQuiz, QuizType } from "@/app/types/types"

interface RecentQuizCardProps {
  quiz: UserQuiz
}

// Memoize the component to prevent unnecessary re-renders
const RecentQuizCard = memo(function RecentQuizCard({ quiz }: RecentQuizCardProps) {
  const getQuizTypeLabel = (quizType: QuizType) => {
    switch (quizType) {
      case "mcq":
        return "Multiple Choice"
      case "openended":
        return "Open Ended"
      case "fill-blanks":
        return "Fill in the Blanks"
      case "code":
        return "Code"
      default:
        return "Quiz"
    }
  }

  const getQuizTypeColor = (quizType: QuizType) => {
    switch (quizType) {
      case "mcq":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "openended":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      case "fill-blanks":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
      case "code":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const buildQuizSlug = (quizType: QuizType) => {
    switch (quizType) {
      case "mcq":
        return "mcq"
      case "openended":
        return "openended"
      case "fill-blanks":
        return "blanks"
      case "code":
        return "code"
      default:
        return "quiz"
    }
  }

  return (
    <Link href={`/dashboard/${buildQuizSlug(quiz.quizType as QuizType)}/${quiz.slug}`}>
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <Badge className={getQuizTypeColor(quiz.quizType as QuizType)}>
            {getQuizTypeLabel(quiz.quizType as QuizType)}
          </Badge>
          {quiz.timeEnded ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Completed
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <Clock className="mr-1 h-3 w-3" />
              In Progress
            </Badge>
          )}
        </div>

        <h3 className="font-semibold text-lg line-clamp-1">{quiz.title}</h3>

        {!quiz.timeEnded && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span>{quiz.progress || 0}%</span>
            </div>
            <Progress value={quiz.progress || 0} className="h-2" />
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">{quiz.questions?.length || 0} questions</div>

          {quiz.timeEnded && (
            <div className="text-lg font-bold text-green-600 dark:text-green-400">{quiz.bestScore || 0}%</div>
          )}
        </div>
      </Card>
    </Link>
  )
})

export default RecentQuizCard
