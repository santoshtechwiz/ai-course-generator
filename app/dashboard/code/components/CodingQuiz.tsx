"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { RefreshCcw, Trophy } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import QuizOptions from "./QuizOptions"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { submitQuizData } from "@/app/actions/actions"
import { QuizActions } from "../../mcq/components/QuizActions"
import { useSession } from "next-auth/react"
import { SignInPrompt } from "@/app/components/SignInPrompt"
import { useRouter } from "next/navigation"
import { CodeChallenge } from "@/app/types"

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: string // Add correctAnswer to the question interface
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
    questions: CodeChallenge[]
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
  const { data: session, status } = useSession()

  const currentQuestion: CodeChallenge = quizData.questions[currentQuestionIndex] ?? {
    question: "",
    options: [],
    correctAnswer: "",
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

    // Check for saved results in localStorage
    const savedResults = localStorage.getItem("quizResults")
    if (savedResults) {
      setQuizResults(JSON.parse(savedResults))
      setQuizCompleted(true)
    }
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
      const correctAnswer = quizData.questions[index].correctAnswer
      return score + (selected === correctAnswer ? 1 : 0)
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

        // Calculate the total time spent on all questions
        const totalTimeSpent =
          timeSpent.reduce((sum, time) => sum + time, 0) + (Date.now() - startTimes[currentQuestionIndex]) / 1000

        const answers = selectedOptions.map((answer, index) => ({
          answer: answer || "",
          timeSpent: index === currentQuestionIndex ? (Date.now() - startTimes[index]) / 1000 : timeSpent[index],
          hintsUsed: false,
        }))

        const results = {
          slug,
          quizId: quizId,
          answers,
          elapsedTime: Math.round(totalTimeSpent),
          score,
          type: "code",
        }

        if (status === "authenticated") {
          const submittedResults = await submitQuizData(results, setIsSubmitting)
          setQuizResults(submittedResults)
        } else {
          // Save results to localStorage if user is not signed in
          localStorage.setItem("quizResults", JSON.stringify(results))
          setQuizResults(results)
        }
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
    status,
  ])

  const restartQuiz = () => {
    localStorage.removeItem("quizResults")
    setCurrentQuestionIndex(0)
    setSelectedOptions(new Array(quizData.questions.length).fill(null))
    setStartTimes(new Array(quizData.questions.length).fill(Date.now()))
    setTimeSpent(new Array(quizData.questions.length).fill(0))
    setQuizCompleted(false)
    setIsSubmitting(false)
    setQuizResults(null)
  }

  const renderQuestionText = (text: string) => {
    // First, split the text to separate the question from the code block
    const [questionText, ...codeBlocks] = text.split("```")
  
    return (
      <div className="space-y-4">
        {/* Render the question text with inline code highlighting */}
        <div>
          {questionText.split(/`([^`]+)`/).map((part, index) =>
            index % 2 === 0 ? (
              <span key={index}>{part}</span>
            ) : (
              <code key={index} className="bg-muted/50 text-primary font-mono px-1.5 py-0.5 rounded-md">
                {part}
              </code>
            ),
          )}
        </div>
  
        {/* Render code blocks */}
        {codeBlocks.map((code, index) => (
          <pre key={index} className="bg-muted/50 p-4 rounded-lg overflow-x-auto">
            <code className="text-primary font-mono whitespace-pre">{code.trim()}</code>
          </pre>
        ))}
      </div>
    )
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

  useEffect(() => {
    const submitSavedResults = async () => {
      if (status === "authenticated" && quizResults && !quizResults.submitted) {
        try {
          const submittedResults = await submitQuizData(quizResults, setIsSubmitting)
          setQuizResults(submittedResults)
          localStorage.removeItem("quizResults")
        } catch (error) {
          console.error("Failed to submit saved quiz results:", error)
        }
      }
    }

    submitSavedResults()
  }, [status, quizResults])

  if (quizCompleted) {
    const correctCount = calculateScore()
    const totalQuestions = quizData.questions.length
    const percentage = (correctCount / totalQuestions) * 100
    const totalTime = quizResults?.elapsedTime ?? timeSpent.reduce((sum, time) => sum + time, 0)

    console.log("Quiz Results:", {
      selectedOptions,
      correctAnswers: quizData.questions.map((q) => q.correctAnswer),
      correctCount,
      totalQuestions,
      percentage,
    })

    const formatTime = (seconds: number): string => {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = Math.floor(seconds % 60)
      return `${minutes}m ${remainingSeconds}s`
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-screen p-4 bg-background"
      >
        <div className="max-w-2xl w-full text-center space-y-6">
          <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
          <h2 className="text-2xl font-bold">Quiz Completed!</h2>
          <p className="text-muted-foreground">Time taken: {formatTime(totalTime)}</p>
          {status === "authenticated" ? (
            <>
              <div className="bg-muted rounded-lg p-6 space-y-4">
                <div className="text-4xl font-bold">{Math.round(percentage).toFixed(2)}%</div>
                <p className="text-muted-foreground">
                  You got {correctCount} out of {totalQuestions} questions correct
                </p>
              </div>
              <Button onClick={restartQuiz} className="w-full sm:w-auto">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retake Quiz
              </Button>
            </>
          ) : (
            <SignInPrompt callbackUrl={`/dashboard/code/${slug}`} />
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 w-full">
      <div className="w-full max-w-2xl mb-4">
        <QuizActions
          quizId={quizId.toString()}
          quizSlug={slug}
          initialIsFavorite={isFavorite}
          initialIsPublic={isPublic}
          userId={userId}
          ownerId={ownerId}
        />
      </div>

      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">{renderQuestionText(currentQuestion.question)}</h3>
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
              renderOptionContent={renderOptionContent}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleNextQuestion}
            disabled={selectedOptions[currentQuestionIndex] === null || isSubmitting}
          >
            {currentQuestionIndex < quizData.questions.length - 1 ? "Next Question" : "Finish Quiz"}
          </Button>
          <div className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {quizData.questions.length}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CodingQuiz

