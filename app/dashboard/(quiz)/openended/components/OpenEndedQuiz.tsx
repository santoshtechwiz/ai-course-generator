"use client"

import { useState, useEffect, useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import {
  selectQuestions,
  selectCurrentQuestionIndex,
  selectAnswers,
  selectCurrentQuestion,
  setCurrentQuestionIndex,
  submitQuiz,
} from "@/store/slices/quizSlice"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Lightbulb, PenTool, CheckCircle2, Clock, BookOpen } from "lucide-react"

interface OpenEndedQuizProps {
  onAnswer?: (answer: string, elapsedTime: number, hintsUsed: boolean) => void
}

interface OpenEndedQuizQuestion {
  id: string
  question: string
  hints?: string[]
}

export function OpenEndedQuiz({ onAnswer }: OpenEndedQuizProps) {
  const dispatch = useDispatch()

  const questions = useSelector(selectQuestions)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const answers = useSelector(selectAnswers)
  const currentQuestion = useSelector(selectCurrentQuestion) as OpenEndedQuizQuestion

  const [answer, setAnswer] = useState("")
  const [startTime, setStartTime] = useState(Date.now())
  const [hintsUsed, setHintsUsed] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (currentQuestion?.id && answers[currentQuestion.id]?.text) {
      const existingAnswer = answers[currentQuestion.id].text || ""
      setAnswer(existingAnswer)
      setHasAnswered(true)
      setWordCount(
        existingAnswer
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length,
      )
    } else {
      setAnswer("")
      setHasAnswered(false)
      setWordCount(0)
    }
    setShowHints(false)
    setHintsUsed(false)
    setStartTime(Date.now())
  }, [currentQuestion, answers])

  const handleAnswerChange = useCallback((value: string) => {
    setAnswer(value)
    const words = value
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0)
    setWordCount(words.length)
  }, [])

  const handleShowHints = useCallback(() => {
    setShowHints(true)
    setHintsUsed(true)
  }, [])

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex - 1))
    }
  }, [currentQuestionIndex, dispatch])

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
    }
  }, [currentQuestionIndex, questions.length, dispatch])

  const handleSubmit = useCallback(() => {
    if (!currentQuestion || !answer.trim() || isSubmitting) return

    setIsSubmitting(true)

    const elapsedTime = Math.floor((Date.now() - startTime) / 1000)

    if (onAnswer) {
      onAnswer(answer, elapsedTime, hintsUsed)
    }

    setHasAnswered(true)
    setIsSubmitting(false)
  }, [currentQuestion, answer, startTime, hintsUsed, onAnswer, isSubmitting])

  const handleFinishQuiz = useCallback(() => {
    if (isSubmitting) return

    setIsSubmitting(true)

    if (currentQuestion && answer.trim()) {
      const elapsedTime = Math.floor((Date.now() - startTime) / 1000)
      if (onAnswer) {
        onAnswer(answer, elapsedTime, hintsUsed)
      }
    }

    dispatch(submitQuiz())
    setIsSubmitting(false)
  }, [answer, currentQuestion, dispatch, hintsUsed, isSubmitting, onAnswer, startTime])

  const progressPercentage = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

  if (!currentQuestion || questions.length === 0) {
    return (
      <Card className="max-w-4xl mx-auto shadow-xl border-0 bg-gradient-to-br from-background to-muted/20">
        <CardContent className="p-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-foreground">No Questions Available</h2>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              This quiz doesn't have any questions yet, or we couldn't load them. Please try refreshing the page.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentQuestionIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="max-w-5xl mx-auto"
      >
        <Card className="shadow-xl border-0 bg-gradient-to-br from-background via-background to-muted/10 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-border/50 p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <PenTool className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Question {currentQuestionIndex + 1}</h2>
                    <p className="text-sm text-muted-foreground">of {questions.length} questions</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{Math.round(progressPercentage)}%</div>
                  <p className="text-xs text-muted-foreground">Complete</p>
                </div>
              </div>
              <div className="space-y-2">
                <Progress value={progressPercentage} className="h-3 bg-muted/50" />
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Progress through quiz</span>
                  <div className="flex gap-1">
                    {Array.from({ length: questions.length }).map((_, i) => (
                      <motion.div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i === currentQuestionIndex
                            ? "bg-primary scale-125"
                            : i < currentQuestionIndex
                              ? "bg-green-500"
                              : "bg-muted"
                        }`}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: i === currentQuestionIndex ? 1.25 : 1 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/20"
              >
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Write your detailed answer</span>
              </motion.div>
            </div>

            <motion.div
              className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 shadow-inner"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <h3 className="text-xl font-semibold leading-relaxed text-foreground text-center max-w-3xl mx-auto">
                {currentQuestion.question}
              </h3>
            </motion.div>

            {currentQuestion.hints?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                {!showHints ? (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShowHints}
                      className="flex items-center gap-2 hover:bg-yellow-50 hover:border-yellow-300 dark:hover:bg-yellow-900/20"
                    >
                      <Lightbulb className="w-4 h-4" />
                      Show Hints ({currentQuestion.hints.length})
                    </Button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                    className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="space-y-3 flex-1">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">Helpful hints:</p>
                        <ul className="space-y-2">
                          {currentQuestion.hints.map((hint, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-300"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                              {hint}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            <div className="relative">
              <Textarea
                value={answer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Start typing your answer here... Be as detailed as possible."
                className={`min-h-[200px] resize-y text-base leading-relaxed transition-all duration-300 ease-in-out ${
                  isFocused
                    ? "border-primary shadow-lg shadow-primary/10 bg-primary/5"
                    : hasAnswered
                      ? "border-green-500 bg-green-50 dark:bg-green-900/10"
                      : "border-border hover:border-primary/50"
                } focus:ring-2 focus:ring-primary/20`}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
                <PenTool className="w-3 h-3" />
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{answer.length} characters</span>
              </div>
              {hasAnswered && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </motion.div>
              )}
            </div>

            {/* Footer Actions */}
          </CardContent>
          {/* Uniform Footer Navigation */}
          <div className="border-t border-border/50 bg-muted/20 p-6 mt-8">
            <div className="flex justify-between items-center">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                size="lg"
                className="flex items-center gap-2 px-6"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>

              <Button
                onClick={() => {
                  if (answer.trim()) {
                    const elapsedTime = Math.floor((Date.now() - startTime) / 1000)
                    if (onAnswer) {
                      onAnswer(answer, elapsedTime, hintsUsed)
                    }
                  }

                  if (currentQuestionIndex === questions.length - 1) {
                    handleFinishQuiz()
                  } else {
                    handleNext()
                  }
                }}
                disabled={!answer.trim() || isSubmitting}
                size="lg"
                className="flex items-center gap-2 px-6"
              >
                {currentQuestionIndex === questions.length - 1 ? "Finish Quiz" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
