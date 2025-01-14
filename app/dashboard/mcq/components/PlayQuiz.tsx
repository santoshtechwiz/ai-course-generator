"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, ArrowRight, RefreshCcw, AlertTriangle, Trophy, Timer, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'
import { toast } from '@/hooks/use-toast'
import { useGlobalActivity } from '@/lib/useGlobalActivity'

type Question = {
  question: string
  answer: string
  option1: string
  option2: string
  option3: string
}

interface PlayQuizProps {
  questions: Question[]
  quizId: number
}

export default function PlayQuiz({ questions, quizId }: PlayQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [uniqueOptions, setUniqueOptions] = useState<string[]>([])
  const [hasError, setHasError] = useState(false)
  const [timeSpent, setTimeSpent] = useState(0)

  const currentQuestion = questions[currentQuestionIndex]
  const [startTime] = useState<number>(Date.now());
  const { logActivity } = useGlobalActivity();
  const handleQuizCompletion = async () => {
    const duration = Math.floor((Date.now() - startTime) / 1000); // duration in seconds

    await logActivity({
      action: 'COMPLETE_QUIZ',
      entityType: 'quiz',
      entityId: quizId.toString(),
      metadata: JSON.stringify({ score, duration }),
    });
    setQuizCompleted(true)
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })

    try {
      const response = await fetch('/api/quiz/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quizId, score, duration: timeSpent }),
      });
      const result = await response.json()
      if (result.success) {
        toast({
          title: "Quiz score updated",
          description: "Your quiz score has been successfully recorded.",
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Failed to update quiz score:', error)
      toast({
        title: "Error",
        description: "Failed to update quiz score. Please try again.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      if (!quizCompleted) {
        setTimeSpent(prev => prev + 1)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [quizCompleted])

  useEffect(() => {
    if (currentQuestion) {
      const allOptions = [
        currentQuestion.answer,
        currentQuestion.option1,
        currentQuestion.option2,
        currentQuestion.option3
      ]
      
      const uniqueOptionsSet = new Set(allOptions)
      
      if (uniqueOptionsSet.size < 2) {
        setHasError(true)
        return
      }
      
      if (uniqueOptionsSet.size < 4) {
        const fallbackOptions = [
          "None of the above",
          "All of the above",
        ]
        
        let i = 0
        while (uniqueOptionsSet.size < 4 && i < fallbackOptions.length) {
          uniqueOptionsSet.add(fallbackOptions[i])
          i++
        }
      }
      
      const shuffledOptions = [...uniqueOptionsSet].sort(() => Math.random() - 0.5)
      setUniqueOptions(shuffledOptions)
      setHasError(false)
    }
    
    setSelectedAnswer(null)
    setIsCorrect(null)
  }, [currentQuestionIndex, currentQuestion])

  const checkAnswer = () => {
    if (selectedAnswer === currentQuestion.answer) {
      setIsCorrect(true)
      setScore(prevScore => prevScore + 1)
    } else {
      setIsCorrect(false)
    }
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1)
    } else {
      handleQuizCompletion()
    }
  }

  const resetQuiz = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setScore(0)
    setQuizCompleted(false)
    setHasError(false)
    setTimeSpent(0)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-xl border-0">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Question Error</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This question needs review due to duplicate options.
            </p>
            <Button onClick={nextQuestion}>Skip to Next Question</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-[95%] md:max-w-3xl shadow-xl border-0">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-xl sm:text-2xl font-bold">
              Interactive Quiz Challenge
            </CardTitle>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Timer className="w-4 h-4" />
              {formatTime(timeSpent)}
            </div>
          </div>
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Progress: {Math.round(progress)}%</span>
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <AnimatePresence mode="wait" initial={false}>
            {!quizCompleted ? (
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                    <h2 className="text-lg sm:text-xl font-semibold">
                      {currentQuestion?.question}
                    </h2>
                  </div>
                  <RadioGroup
                    onValueChange={(value) => setSelectedAnswer(value)}
                    value={selectedAnswer || ""}
                    className="space-y-3"
                  >
                    {uniqueOptions.map((option, index) => (
                      <motion.div
                        key={`${index}-${option}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div
                          className={cn(
                            "flex items-center space-x-2 p-3 sm:p-4 rounded-lg transition-all",
                            "hover:bg-muted",
                            "border-2 border-transparent",
                            selectedAnswer === option && "border-primary",
                            isCorrect !== null && option === currentQuestion.answer && "bg-green-100 dark:bg-green-900/20 border-green-500",
                            isCorrect === false && option === selectedAnswer && "bg-red-100 dark:bg-red-900/20 border-red-500"
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
                <AnimatePresence>
                  {isCorrect !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={cn(
                        "p-4 rounded-lg",
                        isCorrect ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"
                      )}
                    >
                      {isCorrect ? (
                        <p className="text-green-600 dark:text-green-400 flex items-center font-medium">
                          <CheckCircle2 className="mr-2" /> 
                          Excellent! That's the correct answer.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-red-600 dark:text-red-400 flex items-center font-medium">
                            <XCircle className="mr-2" /> 
                            Not quite right.
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            The correct answer is: {currentQuestion.answer}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 sm:py-8 space-y-4 sm:space-y-6"
              >
                <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-yellow-500" />
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold">
                    Quiz Completed!
                  </h2>
                  <p className="text-muted-foreground">
                    Time taken: {formatTime(timeSpent)}
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-4 sm:p-6 space-y-4">
                  <div className="text-3xl sm:text-4xl font-bold">
                    {Math.round((score / questions.length) * 100)}%
                  </div>
                  <p className="text-muted-foreground">
                    You got {score} out of {questions.length} questions correct
                  </p>
                </div>
                <Button 
                  onClick={resetQuiz} 
                  className="w-full sm:w-auto"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" /> 
                  Retake Quiz
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        {!quizCompleted && (
          <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 border-t pt-6">
            <Button
              onClick={checkAnswer}
              disabled={!selectedAnswer || isCorrect !== null}
              className="w-full sm:w-auto"
            >
              Check Answer
            </Button>
            <Button
              onClick={nextQuestion}
              disabled={isCorrect === null}
              className="w-full sm:w-auto"
            >
              {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

