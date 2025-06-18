"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Home, RotateCcw } from "lucide-react"

import { quizStore } from "@/lib/quiz-store"
import type { Quiz } from "@/lib/quiz-store"

interface QuizPlayerProps {
  quizId: string
}

export function QuizPlayer({ quizId }: QuizPlayerProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Load quiz data
    const quizData = quizStore.getQuiz(quizId)
    if (quizData) {
      setQuiz(quizData)

      // Start a new attempt
      const newAttemptId = quizStore.startQuizAttempt(quizId)
      setAttemptId(newAttemptId)

      // Initialize selected answers array
      setSelectedAnswers(new Array(quizData.questions.length).fill(-1))
    }
    setLoading(false)
  }, [quizId])

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestionIndex] = answerIndex
    setSelectedAnswers(newAnswers)

    // Save answer to the attempt
    if (attemptId) {
      quizStore.saveQuizAnswer(attemptId, currentQuestionIndex, answerIndex)
    }
  }

  const goToNextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      completeQuiz()
    }
  }

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const completeQuiz = () => {
    if (!quiz || !attemptId) return

    // Complete the attempt and get the score
    const completedAttempt = quizStore.completeQuizAttempt(attemptId)
    if (completedAttempt) {
      setScore(completedAttempt.score)
      setQuizCompleted(true)
    }
  }

  const restartQuiz = () => {
    if (!quiz) return

    // Start a new attempt
    const newAttemptId = quizStore.startQuizAttempt(quiz.id)
    setAttemptId(newAttemptId)

    // Reset state
    setSelectedAnswers(new Array(quiz.questions.length).fill(-1))
    setCurrentQuestionIndex(0)
    setQuizCompleted(false)
  }

  const goToHome = () => {
    router.push("/")
  }

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="animate-pulse bg-muted h-8 w-3/4 rounded"></CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="animate-pulse bg-muted h-6 w-full rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse bg-muted h-12 w-full rounded"></div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="animate-pulse bg-muted h-10 w-24 rounded"></div>
          <div className="animate-pulse bg-muted h-10 w-24 rounded"></div>
        </CardFooter>
      </Card>
    )
  }

  if (!quiz) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Quiz Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Sorry, the quiz you're looking for doesn't exist or has been removed.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={goToHome}>
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (quizCompleted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Quiz Completed!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-2xl font-bold">
              Your Score: {score} / {quiz.questions.length}
            </p>
            <p className="text-muted-foreground">({Math.round((score / quiz.questions.length) * 100)}%)</p>
          </div>

          <Progress value={(score / quiz.questions.length) * 100} className="h-2" />

          <div className="pt-4">
            <h3 className="font-medium mb-2">Summary:</h3>
            {quiz.questions.map((question, index) => (
              <div key={question.id} className="mb-2">
                <p className="text-sm">
                  <span
                    className={selectedAnswers[index] === question.correctAnswer ? "text-green-600" : "text-red-600"}
                  >
                    {index + 1}. {question.question.substring(0, 50)}
                    {question.question.length > 50 ? "..." : ""}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={goToHome}>
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
          <Button onClick={restartQuiz}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Restart Quiz
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{quiz.title}</CardTitle>
          <span className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </span>
        </div>
        <Progress value={((currentQuestionIndex + 1) / quiz.questions.length) * 100} className="h-2 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <h3 className="text-lg font-medium">{currentQuestion.question}</h3>

          <RadioGroup
            value={selectedAnswers[currentQuestionIndex]?.toString() || ""}
            onValueChange={(value) => handleAnswerSelect(Number.parseInt(value))}
          >
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted/50 transition-colors"
              >
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={goToPreviousQuestion} disabled={currentQuestionIndex === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={goToNextQuestion} disabled={selectedAnswers[currentQuestionIndex] === -1}>
          {currentQuestionIndex === quiz.questions.length - 1 ? "Finish" : "Next"}
          {currentQuestionIndex < quiz.questions.length - 1 && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  )
}
