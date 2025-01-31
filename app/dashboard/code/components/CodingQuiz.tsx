"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import QuizResult from "./QuizResult"
import { useRouter } from "next/navigation"
import QuizOptions from "./QuizOptions"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { QuizActions } from "../../mcq/components/QuizActions"
import type { CodingQuizProps, QuizQuestion } from "@/app/types"

const CodingQuiz: React.FC<CodingQuizProps> = ({
  quizId,
  slug,
  isFavorite,
  isPublic,
  userId,
  ownerId,
  quizData,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<(string | null)[]>(
    new Array(quizData.questions.length).fill(null),
  )
  const [timeLeft, setTimeLeft] = useState(60)
  const [progress, setProgress] = useState(100)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const router = useRouter()

  const currentQuestion: QuizQuestion = quizData.questions[currentQuestionIndex] ?? {
    question: "",
    options: [],
    codeSnippet: null,
    language: "javascript",
  }
  const options = Array.isArray(currentQuestion.options) ? currentQuestion.options : []

  useEffect(() => {
    setTimeLeft(60)
    setProgress(100)
  }, [currentQuestionIndex])

  useEffect(() => {
    const timer = setInterval(() => {
      if (timeLeft > 0) {
        setTimeLeft((prev) => {
          const newTime = prev - 1
          setProgress((newTime / 60) * 100)
          return newTime
        })
      } else {
        handleNextQuestion()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const handleSelectOption = (option: string) => {
    setSelectedOptions((prev) => {
      const newSelectedOptions = [...prev]
      newSelectedOptions[currentQuestionIndex] = option
      return newSelectedOptions
    })
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1)
    } else {
      setQuizCompleted(true)
    }
  }

  const calculateScore = () => {
    return selectedOptions.reduce((score, selected, index) => {
      return score + (selected === quizData.questions[index].options[0] ? 1 : 0)
    }, 0)
  }

  const restartQuiz = () => {
    router.push("/dashboard/code")
  }

  const renderCode = (code: string, language = "javascript") => {
    const cleanCode = code.replace(/^```[\w]*\n?|\n?```$/g, "").trim()
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
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 space-y-6">
          <h2 className="text-2xl font-bold mb-4 text-center">Quiz Completed!</h2>
          <QuizResult
            correctCount={correctCount}
            totalQuestions={quizData.questions.length}
            onRestartQuiz={restartQuiz}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <QuizActions
        quizId={quizId}
        quizSlug={slug}
        initialIsPublic={isPublic}
        initialIsFavorite={isFavorite}
        userId={userId || ""}
        ownerId={ownerId || ""}
      />
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">{currentQuestion.question}</h3>
            <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
              {timeLeft}s
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          {currentQuestion.codeSnippet && (
            <div className="my-4">{renderCode(currentQuestion.codeSnippet, currentQuestion.language)}</div>
          )}
          <div className="my-4">
            <QuizOptions
              options={options}
              selectedOption={selectedOptions[currentQuestionIndex]}
              onSelect={handleSelectOption}
              disabled={false}
              renderOptionContent={renderOptionContent}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleNextQuestion}
            disabled={selectedOptions[currentQuestionIndex] === null}
          >
            {currentQuestionIndex < quizData.questions.length - 1 ? "Next Question" : "Finish Quiz"}
          </Button>
          <div className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {quizData.questions.length}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default CodingQuiz