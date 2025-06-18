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

  // Enhanced score validation with proper fallbacks
  const validatedScore = typeof score === "number" && score >= 0 ? score : 0
  const validatedMaxScore = typeof maxScore === "number" && maxScore > 0 ? maxScore : questionResults?.length || 1

  // Count correct answers from questionResults as backup
  const correctFromResults = questionResults?.filter((q) => q.isCorrect === true).length || 0
  const totalFromResults = questionResults?.length || 0

  // Use the most reliable source for final calculations
  const finalScore = validatedScore > 0 ? validatedScore : correctFromResults
  const finalMaxScore = validatedMaxScore > 1 ? validatedMaxScore : Math.max(totalFromResults, 1)

  // Calculate percentage with proper bounds checking
  const calculatedPercentage = finalMaxScore > 0 ? Math.round((finalScore / finalMaxScore) * 100) : 0
  const validatedPercentage =
    typeof percentage === "number" && percentage >= 0 ? Math.min(percentage, 100) : calculatedPercentage
  const finalPercentage = Math.max(0, Math.min(validatedPercentage, 100))

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
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight break-words">{title}</h1>
          <p className="text-lg text-muted-foreground">Multiple Choice Quiz Results</p>
          <motion.div
            className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full max-w-xs mx-auto"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      {/* Score Card */}
      <motion.div
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Card className={cn("border-2 shadow-xl", getScoreBgColor(finalPercentage))}>
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-3 text-2xl">
              <motion.div whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.6, ease: "easeInOut" }}>
                <Target className="h-8 w-8 text-primary" />
              </motion.div>
              Your Score
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-3">
              <motion.div
                className={cn("text-5xl md:text-6xl font-black", getScoreColor(finalPercentage))}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.3,
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                }}
              >
                {finalPercentage}%
              </motion.div>
              <p className="text-lg text-muted-foreground font-medium">
                {finalScore} out of {finalMaxScore} questions correct
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Progress value={finalPercentage} className="h-4 rounded-full bg-muted/50" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                    repeatDelay: 1,
                  }}
                  style={{ opacity: finalPercentage > 0 ? 1 : 0 }}
                />
              </div>
            </div>

            <div className="flex justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-semibold text-green-700 dark:text-green-300">{finalScore} Correct</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="font-semibold text-red-700 dark:text-red-300">
                  {finalMaxScore - finalScore} Incorrect
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Question Results */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Question Review</h2>

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
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
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
                        <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed break-words">
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
                                  "p-3 rounded-lg border-2 text-sm transition-all break-words",
                                  isCorrectAnswer && "border-green-500 bg-green-50 dark:bg-green-950/20",
                                  isUserAnswer && !isCorrectAnswer && "border-red-500 bg-red-50 dark:bg-red-950/20",
                                  !isUserAnswer && !isCorrectAnswer && "border-muted bg-muted/30",
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  {isCorrectAnswer && <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />}
                                  {isUserAnswer && !isCorrectAnswer && (
                                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                  )}
                                  <span
                                    className={cn(
                                      "flex-1 min-w-0",
                                      isCorrectAnswer && "font-medium text-green-700 dark:text-green-300",
                                      isUserAnswer && !isCorrectAnswer && "font-medium text-red-700 dark:text-red-300",
                                    )}
                                  >
                                    {option.text}
                                  </span>
                                  {isUserAnswer && (
                                    <Badge variant="outline" className="text-xs flex-shrink-0">
                                      Your Choice
                                    </Badge>
                                  )}
                                  {isCorrectAnswer && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-green-100 text-green-700 flex-shrink-0"
                                    >
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
                                "w-3 h-3 rounded-full flex-shrink-0",
                                questionResult.isCorrect ? "bg-green-500" : "bg-red-500",
                              )}
                            />
                            <span className="text-sm font-medium text-muted-foreground">Your Answer</span>
                          </div>
                          <div
                            className={cn(
                              "p-3 rounded-lg border-2 break-words",
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
                            <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-muted-foreground">Correct Answer</span>
                          </div>
                          <div className="p-3 rounded-lg border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20 break-words">
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
