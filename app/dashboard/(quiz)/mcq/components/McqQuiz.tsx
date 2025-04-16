"use client"

import { useCallback, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { HelpCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { SignInPrompt } from "@/app/auth/signin/components/SignInPrompt"


import { useAnimation } from "@/providers/animation-provider"
import { MotionWrapper, MotionTransition } from "@/components/ui/animations/motion-wrapper"
import { QuizBase } from "../../components/QuizBase"
import { QuizResultDisplay } from "../../components/QuizResultDisplay"
import { useQuizState, formatQuizTime } from "@/hooks/use-quiz-state"
import { QuizFeedback } from "../../components/QuizFeedback"
import { QuizProgress } from "../../components/QuizProgress"
import { AuthModal } from "@/components/ui/auth-modal"

type Question = {
  id: number
  question: string
  answer: string
  option1: string
  option2: string
  option3: string
}

interface McqQuizProps {
  questions: Question[]
  quizId: number | string
  slug: string
  title: string
  onComplete?: () => void
  onSubmitAnswer?: (questionId: number, answer: string, isCorrect: boolean) => void
}

export default function McqQuiz({ questions, quizId, slug, title, onComplete }: McqQuizProps) {
  const [showAuthModal, setShowAuthModal] = useState(false)

  const calculateScore = useCallback((selectedOptions: (string | null)[], questions: Question[]) => {
    return selectedOptions.reduce((score, selected, index) => {
      const correctAnswer = questions[index]?.answer
      return score + (selected === correctAnswer ? 1 : 0)
    }, 0)
  }, [])

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
    handleSelectOption,
    handleNextQuestion: originalHandleNextQuestion,
    handleFeedbackContinue,
  } = useQuizState({
    quizId,
    slug,
    questions,
    quizType: "mcq",
    calculateScore,
    onComplete,
  })

  // Wrap the original handler to add authentication check
  const handleNextQuestion = useCallback(() => {
    // If this is the last question and user is not authenticated, show auth modal
    if (currentQuestionIndex === questions.length - 1 && !isAuthenticated && !session) {
      setShowAuthModal(true)
      return
    }

    // Otherwise, proceed with original handler
    originalHandleNextQuestion()
  }, [currentQuestionIndex, questions.length, isAuthenticated, session, originalHandleNextQuestion])

  const handleAuthModalClose = useCallback(() => {
    setShowAuthModal(false)
    // Continue with quiz completion after modal is closed
    originalHandleNextQuestion()
  }, [originalHandleNextQuestion])

  const [uniqueOptions, hasError] = useMemo(() => {
    if (!currentQuestion) {
      return [[], true]
    }

    const allOptions = [
      currentQuestion.answer,
      currentQuestion.option1,
      currentQuestion.option2,
      currentQuestion.option3,
    ].filter(Boolean)

    const uniqueOptionsSet = new Set(allOptions)

    if (uniqueOptionsSet.size < 2) {
      return [[], true]
    }

    if (uniqueOptionsSet.size < 4) {
      const fallbackOptions = [
        "None of the above",
        "All of the above",
        "Not enough information",
        "Cannot be determined",
      ]

      let i = 0
      while (uniqueOptionsSet.size < 4 && i < fallbackOptions.length) {
        uniqueOptionsSet.add(fallbackOptions[i])
        i++
      }
    }

    const shuffledOptions = [...uniqueOptionsSet].sort(() => Math.random() - 0.5)
    return [shuffledOptions, false]
  }, [currentQuestion])

  const { animationsEnabled } = useAnimation()

  const renderQuizContent = () => {
    if (hasError) {
      return (
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">This question needs review due to insufficient options.</p>
            <Button onClick={() => handleNextQuestion()}>Skip to Next Question</Button>
          </CardContent>
        </Card>
      )
    }

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
              type="mcq"
              slug={slug}
              preventAutoSave={true} // Prevent duplicate saving
            />
          </MotionWrapper>
        )
      }
      return (
        <MotionWrapper animate={true} variant="fade" duration={0.6}>
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center space-y-6">
              {!session ? <SignInPrompt callbackUrl={`/dashboard/mcq/${slug}`} /> : null}
            </CardContent>
          </Card>
        </MotionWrapper>
      )
    }

    return (
      <Card className="w-full">
        <CardHeader className="space-y-4">
          <QuizProgress
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={questions.length}
            timeSpent={timeSpent}
            title={title}
            quizType="Multiple Choice"
            animate={animationsEnabled}
          />
        </CardHeader>
        <CardContent>
          <MotionTransition key={currentQuestionIndex}>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <h2 className="text-lg sm:text-xl font-semibold">{currentQuestion?.question}</h2>
                </div>
                <RadioGroup
                  value={selectedOptions[currentQuestionIndex] || ""}
                  onValueChange={handleSelectOption}
                  className="space-y-3 w-full mt-4"
                >
                  {uniqueOptions.map((option, index) => (
                    <motion.div
                      key={`${index}-${option}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                      <div
                        className={cn(
                          "flex items-center space-x-2 p-4 rounded-lg transition-all w-full",
                          "border-2",
                          selectedOptions[currentQuestionIndex] === option
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:bg-muted",
                        )}
                      >
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label
                          htmlFor={`option-${index}`}
                          className="flex-grow cursor-pointer font-medium text-sm sm:text-base"
                        >
                          {option}
                        </Label>
                      </div>
                    </motion.div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </MotionTransition>
        </CardContent>
        <CardFooter className="flex justify-between items-center gap-4 border-t pt-6 md:flex-row flex-col-reverse">
          <p className="text-sm text-muted-foreground">
            Question time: {formatQuizTime(timeSpent[currentQuestionIndex] || 0)}
          </p>
          <Button
            onClick={() => handleNextQuestion()}
            disabled={selectedOptions[currentQuestionIndex] === null || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              "Submitting..."
            ) : currentQuestionIndex === questions.length - 1 ? (
              "Finish Quiz"
            ) : (
              <>
                Next Question
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <>
      <QuizBase quizId={quizId.toString()} slug={slug} title={title} type="mcq" totalQuestions={questions.length}>
        {renderQuizContent()}

        {showFeedbackModal && (
          <QuizFeedback
            isSubmitting={isSubmitting}
            isSuccess={isSuccess}
            isError={isError}
            score={calculateScore(selectedOptions, questions)}
            totalQuestions={questions.length}
            onContinue={handleFeedbackContinue}
            errorMessage={errorMessage ?? undefined}
            quizType="mcq"
          />
        )}
      </QuizBase>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        title="Sign in to save your results"
        description="Please sign in to save your quiz results and track your progress."
        callbackUrl={`/dashboard/mcq/${slug}`}
      />
    </>
  )
}
