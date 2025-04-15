"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LightbulbIcon, SendIcon, CheckCircleIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useQuizState, formatQuizTime } from "@/hooks/use-quiz-state"

import { QuizResultDisplay } from "../../components/QuizResultDisplay"
import { MotionWrapper } from "@/components/ui/animations/motion-wrapper"
import { useAnimation } from "@/providers/animation-provider"
import { SignInPrompt } from "@/app/auth/signin/components/SignInPrompt"
import { QuizFeedback } from "../../components/QuizFeedback"
import { QuizProgress } from "../../components/QuizProgress"

interface Question {
  id: number
  question: string
  answer: string
  openEndedQuestion: {
    hints: string | string[]
    difficulty: string
    tags: string | string[]
    inputType: string
  }
}

interface OpenEndedQuizQuestionProps {
  questions: Question[]
  quizId: string | number
  slug: string
  title: string
  onComplete?: () => void
  onSubmitAnswer?: (answer: string) => void
}

export default function OpenEndedQuizQuestion({
  questions,
  quizId,
  slug,
  title,
  onComplete,
  onSubmitAnswer,
}: OpenEndedQuizQuestionProps) {
  const [answer, setAnswer] = useState("")
  const [showHints, setShowHints] = useState<boolean[]>([])
  const { animationsEnabled } = useAnimation()

  const calculateScore = (selectedOptions: (string | null)[], questions: Question[]) => {
    return selectedOptions.reduce((score, selected, index) => {
      if (!selected) return score

      // For open-ended questions, we'll consider any non-empty answer as valid
      // The actual scoring would typically be done by an instructor or AI
      return score + (selected.trim().length > 0 ? 1 : 0)
    }, 0)
  }

  const {
    currentQuestionIndex,
    currentQuestion,
    selectedOptions,
    timeSpent,
    quizCompleted,
    quizResults,
    showFeedbackModal,
    isSubmitting,
    isSuccess,
    isError,
    errorMessage,
    isAuthenticated,
    session,
    hintsUsed,
    handleSelectOption,
    handleNextQuestion,
    handleFeedbackContinue,
    handleUseHint,
  } = useQuizState({
    quizId,
    slug,
    questions,
    quizType: "openended",
    calculateScore,
    onComplete,
  })

  const hints = useMemo(() => {
    if (!currentQuestion) return []

    return Array.isArray(currentQuestion.openEndedQuestion.hints)
      ? currentQuestion.openEndedQuestion.hints
      : currentQuestion.openEndedQuestion.hints.split("|")
  }, [currentQuestion])

  useEffect(() => {
    setAnswer("")
    setShowHints(Array(hints.length).fill(false))
  }, [currentQuestion?.id, hints.length])

  const handleInputChange = (value: string) => {
    setAnswer(value)
    handleSelectOption(value)
  }

  const handleSubmit = () => {
    if (!currentQuestion) return

    if (onSubmitAnswer) {
      onSubmitAnswer(answer)
    }

    const answerData = {
      answer: answer,
      isCorrect: true, // Open-ended questions don't have right/wrong answers in this context
      timeSpent: timeSpent[currentQuestionIndex] || 0,
      hintsUsed: hintsUsed[currentQuestionIndex] || 0,
    }

    handleNextQuestion(answerData)
    setAnswer("")
  }

  const handleProgressiveHint = () => {
    if (!hints.length) return

    const currentHintLevel = hintsUsed[currentQuestionIndex] || 0

    if (currentHintLevel < hints.length) {
      handleUseHint()
      setShowHints((prev) => {
        const newHints = [...prev]
        newHints[currentHintLevel] = true
        return newHints
      })
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-500"
      case "medium":
        return "bg-yellow-500"
      case "hard":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  const renderQuizContent = () => {
    if (quizCompleted) {
      const correctCount = calculateScore(selectedOptions, questions)
      const totalQuestions = questions.length
      const percentage = (correctCount / totalQuestions) * 100
      const totalTime = quizResults?.elapsedTime ?? timeSpent.reduce((sum, time) => sum + time, 0)

      if (isAuthenticated) {
        return (
          <MotionWrapper animate={animationsEnabled} variant="fade" duration={0.6}>
            <QuizResultDisplay
              quizId={quizId.toString()}
              title={title}
              score={percentage}
              totalQuestions={totalQuestions}
              totalTime={totalTime}
              correctAnswers={correctCount}
              type="openended"
              slug={slug}
            />
          </MotionWrapper>
        )
      }

      return (
        <MotionWrapper animate={true} variant="fade" duration={0.6}>
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center space-y-6">
              {!session ? <SignInPrompt callbackUrl={`/dashboard/openended/${slug}`} /> : null}
            </CardContent>
          </Card>
        </MotionWrapper>
      )
    }

    return (
      <motion.div
        key={currentQuestion?.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-4xl mx-auto shadow-lg border-t-4 border-primary">
          <CardHeader className="space-y-4">
            <QuizProgress
              currentQuestionIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              timeSpent={timeSpent}
              title={title}
              quizType="Open Ended"
              animate={animationsEnabled}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  className="flex items-center gap-1 text-sm text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="font-medium text-foreground">Question {currentQuestionIndex + 1}</span>
                  <ChevronRightIcon className="h-4 w-4" />
                  <span>{questions.length}</span>
                </motion.div>
              </div>
              {currentQuestion && (
                <Badge
                  variant="secondary"
                  className={cn("text-white", getDifficultyColor(currentQuestion.openEndedQuestion.difficulty))}
                >
                  {currentQuestion.openEndedQuestion.difficulty}
                </Badge>
              )}
            </div>

            {currentQuestion && (
              <motion.h2
                className="text-2xl font-bold leading-tight text-primary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {currentQuestion.question}
              </motion.h2>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <Textarea
              value={answer}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Type your answer here..."
              className="min-h-[150px] resize-none transition-all duration-200 focus:min-h-[200px] focus:ring-2 focus:ring-primary"
            />
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleProgressiveHint}
                disabled={(hintsUsed[currentQuestionIndex] || 0) >= hints.length}
                className="w-full sm:w-auto hover:bg-primary hover:text-primary-foreground"
              >
                <LightbulbIcon className="w-4 h-4 mr-2" />
                {(hintsUsed[currentQuestionIndex] || 0) === 0
                  ? "Get Hint"
                  : `Next Hint (${hintsUsed[currentQuestionIndex]}/${hints.length})`}
              </Button>
              <AnimatePresence>
                {showHints.map(
                  (show, index) =>
                    show && (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-secondary/10 p-2 rounded mt-2">
                          <CheckCircleIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span>{hints[index]}</span>
                        </div>
                      </motion.div>
                    ),
                )}
              </AnimatePresence>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between items-center gap-4 border-t pt-6 md:flex-row flex-col-reverse">
            <p className="text-sm text-muted-foreground">
              Question time: {formatQuizTime(timeSpent[currentQuestionIndex] || 0)}
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!answer.trim() || isSubmitting}
              className="w-full sm:w-auto ml-auto bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Submitting...
                </>
              ) : currentQuestionIndex === questions.length - 1 ? (
                "Finish Quiz"
              ) : (
                <>
                  <SendIcon className="w-4 h-4 mr-2" />
                  Submit Answer
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    )
  }

  return (
    <>
      {renderQuizContent()}

      {showFeedbackModal && (
        <QuizFeedback
          isSubmitting={isSubmitting}
          isSuccess={isSuccess}
          isError={isError}
          score={calculateScore(selectedOptions, questions)}
          totalQuestions={questions.length}
          onContinue={handleFeedbackContinue}
          errorMessage={errorMessage}
          quizType="openended"
        />
      )}
    </>
  )
}
