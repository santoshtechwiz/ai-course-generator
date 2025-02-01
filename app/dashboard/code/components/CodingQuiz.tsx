"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import QuizResult from "./QuizResult"
import { useRouter } from "next/navigation"
import QuizOptions from "./QuizOptions"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { submitQuizData } from "@/app/actions/actions"
import { QuizActions } from "../../mcq/components/QuizActions"

interface QuizQuestion {
  question: string
  options: string[]
  codeSnippet: string | null
  language?: string
}

interface CodingQuizProps {
  quizId: number
  slug: string
  isFavorite: boolean
  isPublic: boolean
  userId: string
  ownerId: string
  quizData: {
    title: string
    questions: QuizQuestion[]
  }
}

const CodingQuiz: React.FC<CodingQuizProps> = ({ quizId, slug, isFavorite, isPublic, userId, ownerId, quizData }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<(string | null)[]>(
    new Array(quizData.questions.length).fill(null),
  )
  const [startTimes, setStartTimes] = useState<number[]>(new Array(quizData.questions.length).fill(Date.now()))
  const [timeSpent, setTimeSpent] = useState<number[]>(new Array(quizData.questions.length).fill(0))
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quizResults, setQuizResults] = useState<any>(null)
  const router = useRouter()

  const currentQuestion: QuizQuestion = quizData.questions[currentQuestionIndex] ?? {
    question: "",
    options: [],
    codeSnippet: null,
    language: "javascript",
  }
  const options = Array.isArray(currentQuestion.options) ? currentQuestion.options : []

  useEffect(() => {
    // Start timing for the first question
    setStartTimes((prev) => {
      const newStartTimes = [...prev]
      newStartTimes[0] = Date.now()
      return newStartTimes
    })
  }, [])

  const handleSelectOption = (option: string) => {
    setSelectedOptions((prev) => {
      const newSelectedOptions = [...prev]
      newSelectedOptions[currentQuestionIndex] = option
      return newSelectedOptions
    })
  }

  const calculateScore = useCallback(() => {
    return selectedOptions.reduce((score, selected, index) => {
      return score + (selected === quizData.questions[index].options[0] ? 1 : 0)
    }, 0)
  }, [selectedOptions, quizData.questions])

  const handleNextQuestion = useCallback(async () => {
    // Calculate time spent on current question
    const currentTime = Date.now()
    const timeSpentOnQuestion = Math.round((currentTime - startTimes[currentQuestionIndex]) / 1000)

    setTimeSpent((prev) => {
      const newTimeSpent = [...prev]
      newTimeSpent[currentQuestionIndex] = timeSpentOnQuestion
      return newTimeSpent
    })

    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1)
      // Start timing for the next question
      setStartTimes((prev) => {
        const newStartTimes = [...prev]
        newStartTimes[currentQuestionIndex + 1] = Date.now()
        return newStartTimes
      })
    } else {
      setIsSubmitting(true)
      try {
        const correctCount = calculateScore()
        const score = (correctCount / quizData.questions.length) * 100
        const answers = selectedOptions.map((answer, index) => ({
          answer: answer || "",
          timeSpent: timeSpent[index],
          hintsUsed: false,
        }))

        const totalTimeSpent = timeSpent.reduce((sum, time) => sum + time, 0)

        const results = await submitQuizData(
          {
            slug,
            quizId: quizId,
            answers,
            elapsedTime: totalTimeSpent,
            score,
            type: "code",
          },
          setIsSubmitting,
        )
        setQuizResults(results)
        setQuizCompleted(true)
      } catch (error) {
        console.error("Error submitting quiz data:", error)
        setIsSubmitting(false)
      }
    }
  }, [
    currentQuestionIndex,
    quizData.questions.length,
    quizId,
    selectedOptions,
    calculateScore,
    startTimes,
    timeSpent,
    slug,
  ])

  const restartQuiz = () => {
    router.push("/dashboard/code")
  }

  const renderCode = (code: string, language = "javascript") => {
    const cleanCode = code.replace(/^```[\w]*\n?|\n?```$/g, "")

    return (
      <div className="rounded-md overflow-hidden">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "1rem",
            fontSize: "0.9rem",
            backgroundColor: "#1E1E1E",
          }}
          showLineNumbers={true}
        >
          {cleanCode}
        </SyntaxHighlighter>
      </div>
    )
  }

  const renderOptionContent = (option: string) => {
    const codeRegex = /```[\s\S]*?```/g
    const parts = option.split(codeRegex)
    const codes = option.match(codeRegex) || []

    return (
      <div className="w-full">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part && <span className="block mb-2">{part.trim()}</span>}
            {codes[index] && <div className="my-2">{renderCode(codes[index], currentQuestion.language)}</div>}
          </React.Fragment>
        ))}
      </div>
    )
  }

  if (quizCompleted) {
    const correctCount = calculateScore()
    const score = (correctCount / quizData.questions.length) * 100

    return (
      <QuizResult
        correctCount={correctCount}
        totalQuestions={quizData.questions.length}
        onRestartQuiz={restartQuiz}
        isSubmitting={isSubmitting}
        savedResults={quizResults}
      />
    )
  }

  return (
    <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 w-full">
      {/* Quiz Actions (Aligned) */}
      <div className="w-full max-w-2xl mb-4">
        <QuizActions quizId={quizId.toString()} quizSlug={slug} initialIsFavorite={isFavorite} initialIsPublic={isPublic} userId={userId} ownerId={ownerId} />
      </div>

      {/* Quiz Card */}




      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">{currentQuestion.question}</h3>
          </div>
          {currentQuestion.codeSnippet && (
            <div className="my-4">{renderCode(currentQuestion.codeSnippet, currentQuestion.language)}</div>
          )}
          <div className="my-4">
            <QuizOptions
              options={options}
              selectedOption={selectedOptions[currentQuestionIndex]}
              onSelect={handleSelectOption}
              disabled={false}
              renderOptionContent={renderOptionContent} />
          </div>
          <Button
            className="w-full"
            onClick={handleNextQuestion}
            disabled={selectedOptions[currentQuestionIndex] === null || isSubmitting}
          >
            {currentQuestionIndex < quizData.questions.length - 1 ? "Next Question" : "Finish Quiz"}
          </Button>
          <div className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {quizData.questions.length}
          </div>
        </CardContent>
      </Card>





    </div>
  )


}

export default CodingQuiz

