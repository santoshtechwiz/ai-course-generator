"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import CodeEditor from "./CodeEditor"
import QuizOptions from "./QuizOptions"
import QuizResult from "./QuizResult"
import { useRouter } from "next/navigation"

interface QuizQuestion {
  question: string
  options: string []
  codeSnippet: string | null
}

interface CodingQuizProps {
  quizData: {
    title: string
    questions: QuizQuestion[]
  }
}

const CodingQuiz: React.FC<CodingQuizProps> = ({ quizData }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [progress, setProgress] = useState(100)
  const [score, setScore] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const router = useRouter()

  const currentQuestion = (quizData && quizData.questions && quizData.questions[currentQuestionIndex] !== undefined) 
  ? quizData.questions[currentQuestionIndex] : { question: "", options: "[]", codeSnippet: null }
  let options: string[] = []

  try {
    if (typeof currentQuestion.options === 'string') {
    
    } else {
      options = currentQuestion.options
    }
  } catch (error) {
    console.error("Failed to parse options:", error)
    options = [] 
  }

  useEffect(() => {
   
    setSelectedOption(null)
    setIsSubmitted(false)
    setTimeLeft(60)
    setProgress(100)
  }, [currentQuestionIndex])

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isSubmitted && timeLeft > 0) {
        setTimeLeft((prev) => {
          const newTime = prev - 1
          setProgress((newTime / 60) * 100)
          return newTime
        })
      } else if (timeLeft === 0 && !isSubmitted) {
        handleSubmit()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [isSubmitted, timeLeft])

  const handleSubmit = () => {
    setIsSubmitted(true)
    if (selectedOption === options[0]) {
      setScore((prevScore) => prevScore + 1)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1)
    } else {
      setQuizCompleted(true)
    }
  }

  const restartQuiz = () => {
    router.push("/dashboard/code")
  }

  if (quizCompleted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 space-y-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Quiz Completed!</h2>
          <p className="text-lg mb-4">
            Your score: {score} out of {quizData.questions.length}
          </p>
          <Button onClick={restartQuiz}>Start New Quiz</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">{currentQuestion.question}</h3>
          <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">{timeLeft}s</span>
        </div>
        <Progress value={progress} className="h-2" />
        {currentQuestion.codeSnippet && (
          <CodeEditor value={currentQuestion.codeSnippet} language="javascript" readOnly />
        )}
        <QuizOptions
          options={options}
          selectedOption={selectedOption}
          onSelect={setSelectedOption}
          disabled={isSubmitted}
          correctAnswer={isSubmitted ? options[0] : undefined}
        />
        {!isSubmitted ? (
          <Button className="w-full" onClick={handleSubmit} disabled={!selectedOption}>
            Submit Answer
          </Button>
        ) : (
          <>
            <QuizResult isCorrect={selectedOption === options[0]} correctAnswer={options[0]} />
            <Button className="w-full" onClick={handleNextQuestion}>
              {currentQuestionIndex < quizData.questions.length - 1 ? "Next Question" : "Finish Quiz"}
            </Button>
          </>
        )}
        <div className="text-sm text-gray-500">
          Question {currentQuestionIndex + 1} of {quizData.questions.length}
        </div>
      </CardContent>
    </Card>
  )
}

export default CodingQuiz