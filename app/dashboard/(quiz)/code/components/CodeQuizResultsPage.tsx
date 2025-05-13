"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Share2, RotateCcw, Award, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QuizResultsSummary } from "@/components/ui/quiz-results-summary"
import { AnswerReviewItem } from "@/components/ui/answer-review-item"
import { QuizConfetti } from "@/components/ui/quiz-confetti"
import { formatQuizTime } from "@/lib/utils/quiz-performance"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CodeQuizResultData } from "@/app/types/code-quiz-types"

interface CodeQuizResultsPageProps {
  result: CodeQuizResultData
  onRestart?: () => void
  onShare?: () => void
  onReturn?: () => void
}

export default function CodeQuizResultsPage({ result, onRestart, onShare, onReturn }: CodeQuizResultsPageProps) {
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(false)

  // Calculate metrics
  const totalQuestions = result.totalQuestions
  const correctAnswers = result.correctAnswers
  const incorrectAnswers = totalQuestions - correctAnswers
  const score = result.score
  const totalTimeSpent = result.totalTimeSpent
  const formattedTimeSpent = result.formattedTimeSpent || formatQuizTime(totalTimeSpent)
  const averageTimePerQuestion = Math.round(totalTimeSpent / totalQuestions)

  // Determine performance level
  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return "Excellent"
    if (score >= 75) return "Good"
    if (score >= 60) return "Satisfactory"
    return "Needs Improvement"
  }

  const performanceLevel = getPerformanceLevel(score)

  // Show confetti for high scores
  useEffect(() => {
    if (score >= 80) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [score])

  // Handle navigation
  const handleReturn = () => {
    if (onReturn) {
      onReturn()
    } else {
      router.push("/dashboard/quizzes")
    }
  }

  // Handle restart
  const handleRestart = () => {
    if (onRestart) {
      onRestart()
    } else {
      router.push(`/dashboard/code/${result.slug}?reset=true`)
    }
  }

  // Handle share
  const handleShare = () => {
    if (onShare) {
      onShare()
    } else {
      // Default share implementation
      if (navigator.share) {
        navigator
          .share({
            title: `My Code Quiz Result: ${score}%`,
            text: `I scored ${score}% on the coding quiz!`,
            url: window.location.href,
          })
          .catch((err) => console.error("Error sharing:", err))
      } else {
        // Fallback - copy to clipboard
        navigator.clipboard
          .writeText(`I scored ${score}% on the coding quiz! Check it out: ${window.location.href}`)
          .then(() => {
            alert("Result link copied to clipboard!")
          })
          .catch((err) => console.error("Error copying to clipboard:", err))
      }
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {showConfetti && <QuizConfetti score={score} />}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Button variant="ghost" size="sm" onClick={handleReturn} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quizzes
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Quiz Results</h1>
            <p className="text-muted-foreground">
              Completed on {new Date(result.completedAt).toLocaleDateString()} at{" "}
              {new Date(result.completedAt).toLocaleTimeString()}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRestart}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry Quiz
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Result
            </Button>
          </div>
        </div>
      </motion.div>

      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center">
            <Award className="h-5 w-5 mr-2 text-primary" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QuizResultsSummary
            score={score}
            correctAnswers={correctAnswers}
            totalQuestions={totalQuestions}
            totalTimeSpent={totalTimeSpent}
            formattedTimeSpent={formattedTimeSpent}
            quizType="code"
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Questions ({totalQuestions})</TabsTrigger>
          <TabsTrigger value="correct">Correct ({correctAnswers})</TabsTrigger>
          <TabsTrigger value="incorrect">Incorrect ({incorrectAnswers})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {result.answers.map((answer, index) => (
            <AnswerReviewItem
              key={`answer-${index}`}
              index={index}
              question={answer.question}
              userAnswer={answer.codeSnippet || answer.answer}
              correctAnswer={answer.correctAnswer || ""}
              isCorrect={answer.isCorrect}
              timeSpent={answer.timeSpent}
              language={answer.language}
              delay={index * 0.1}
            />
          ))}
        </TabsContent>

        <TabsContent value="correct" className="space-y-4">
          {result.answers
            .filter((answer) => answer.isCorrect)
            .map((answer, index) => (
              <AnswerReviewItem
                key={`correct-${index}`}
                index={result.answers.findIndex((a) => a.questionId === answer.questionId)}
                question={answer.question}
                userAnswer={answer.codeSnippet || answer.answer}
                correctAnswer={answer.correctAnswer || ""}
                isCorrect={true}
                timeSpent={answer.timeSpent}
                language={answer.language}
                delay={index * 0.1}
              />
            ))}
        </TabsContent>

        <TabsContent value="incorrect" className="space-y-4">
          {result.answers
            .filter((answer) => !answer.isCorrect)
            .map((answer, index) => (
              <AnswerReviewItem
                key={`incorrect-${index}`}
                index={result.answers.findIndex((a) => a.questionId === answer.questionId)}
                question={answer.question}
                userAnswer={answer.codeSnippet || answer.answer}
                correctAnswer={answer.correctAnswer || ""}
                isCorrect={false}
                timeSpent={answer.timeSpent}
                language={answer.language}
                delay={index * 0.1}
              />
            ))}
        </TabsContent>
      </Tabs>

      <Card className="bg-muted/40">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-lg font-medium">Performance Level: {performanceLevel}</h3>
              <p className="text-muted-foreground">
                {score >= 80
                  ? "Great job! You've mastered this quiz."
                  : score >= 60
                    ? "Good effort! Keep practicing to improve."
                    : "Keep practicing! You'll get better with time."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRestart}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" onClick={handleReturn}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Quizzes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
