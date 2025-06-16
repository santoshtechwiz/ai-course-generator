"use client"
import { motion } from "framer-motion"
import { CheckCircle, XCircle, HelpCircle, Target, RotateCcw, Home } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface McqQuizResultProps {
  result: {
    title: string
    score: number
    maxScore: number
    percentage: number
    completedAt: string
    questionResults: Array<{
      questionId: string
      question: string
      userAnswer: string
      correctAnswer: string
      isCorrect: boolean
      type: string
      options?: Array<{ id: string; text: string }>
    }>
  }
  onRetake?: () => void
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

export function McqQuizResult({ result, onRetake }: McqQuizResultProps) {
  const { title, score, maxScore, percentage, questionResults } = result

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-500"
    if (percentage >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-50 dark:bg-green-950/20"
    if (percentage >= 60) return "bg-yellow-50 dark:bg-yellow-950/20"
    return "bg-red-50 dark:bg-red-950/20"
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto p-4 space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">Multiple Choice Quiz Results</p>
      </motion.div>

      {/* Score Card */}
      <motion.div variants={itemVariants}>
        <Card className={cn("border-2", getScoreBgColor(percentage))}>
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2">
              <Target className="h-6 w-6" />
              Your Score
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-2">
              <div className={cn("text-6xl font-bold", getScoreColor(percentage))}>{percentage}%</div>
              <p className="text-lg text-muted-foreground">
                {score} out of {maxScore} correct
              </p>
            </div>

            <Progress value={percentage} className="h-3" />

            <div className="flex justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{score} Correct</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>{maxScore - score} Incorrect</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Question Results */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Question Review</h2>

        <div className="space-y-4">
          {questionResults.map((questionResult, index) => (
            <motion.div key={questionResult.questionId} variants={itemVariants} transition={{ delay: index * 0.05 }}>
              <Card
                className={cn(
                  "border-l-4 transition-all duration-200 hover:shadow-md",
                  questionResult.isCorrect
                    ? "border-l-green-500 bg-green-50/50 dark:bg-green-950/10"
                    : "border-l-red-500 bg-red-50/50 dark:bg-red-950/10",
                )}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            Question {index + 1}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <HelpCircle className="h-3 w-3 mr-1" />
                            MCQ
                          </Badge>
                          {questionResult.isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <p className="text-base font-medium text-foreground leading-relaxed">
                          {questionResult.question}
                        </p>
                      </div>
                    </div>

                    {/* Options (if available) */}
                    {questionResult.options && questionResult.options.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-muted-foreground">Answer Options</span>
                        <div className="grid gap-2">
                          {questionResult.options.map((option) => {
                            const isUserAnswer =
                              option.text === questionResult.userAnswer || option.id === questionResult.userAnswer
                            const isCorrectAnswer =
                              option.text === questionResult.correctAnswer || option.id === questionResult.correctAnswer

                            return (
                              <div
                                key={option.id}
                                className={cn(
                                  "p-3 rounded-lg border-2 text-sm transition-all",
                                  isCorrectAnswer && "border-green-500 bg-green-50 dark:bg-green-950/20",
                                  isUserAnswer && !isCorrectAnswer && "border-red-500 bg-red-50 dark:bg-red-950/20",
                                  !isUserAnswer && !isCorrectAnswer && "border-muted bg-muted/30",
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  {isCorrectAnswer && <CheckCircle className="h-4 w-4 text-green-500" />}
                                  {isUserAnswer && !isCorrectAnswer && <XCircle className="h-4 w-4 text-red-500" />}
                                  <span
                                    className={cn(
                                      isCorrectAnswer && "font-medium text-green-700 dark:text-green-300",
                                      isUserAnswer && !isCorrectAnswer && "font-medium text-red-700 dark:text-red-300",
                                    )}
                                  >
                                    {option.text}
                                  </span>
                                  {isUserAnswer && (
                                    <Badge variant="outline" className="ml-auto text-xs">
                                      Your Choice
                                    </Badge>
                                  )}
                                  {isCorrectAnswer && (
                                    <Badge variant="outline" className="ml-auto text-xs bg-green-100 text-green-700">
                                      Correct
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Fallback Answer Display */}
                    {(!questionResult.options || questionResult.options.length === 0) && (
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* User Answer */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-3 h-3 rounded-full",
                                questionResult.isCorrect ? "bg-green-500" : "bg-red-500",
                              )}
                            />
                            <span className="text-sm font-medium text-muted-foreground">Your Answer</span>
                          </div>
                          <div
                            className={cn(
                              "p-3 rounded-lg border-2",
                              questionResult.isCorrect
                                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
                                : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20",
                            )}
                          >
                            {questionResult.userAnswer || (
                              <span className="text-muted-foreground italic">No answer selected</span>
                            )}
                          </div>
                        </div>

                        {/* Correct Answer */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-sm font-medium text-muted-foreground">Correct Answer</span>
                          </div>
                          <div className="p-3 rounded-lg border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
                            {questionResult.correctAnswer}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
        {onRetake && (
          <Button onClick={onRetake} size="lg" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Retake Quiz
          </Button>
        )}
        <Button variant="outline" size="lg" asChild>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </motion.div>
    </motion.div>
  )
}
