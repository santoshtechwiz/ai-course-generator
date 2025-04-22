"use client"

import React, { useCallback, useMemo, useState, useEffect } from "react"
import { ArrowRight, ArrowLeft, Code, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import QuizOptions from "./CodeQuizOptions"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"
import type { CodeChallenge } from "@/app/types/types"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { useAnimation } from "@/providers/animation-provider"
import { MotionWrapper, MotionTransition } from "@/components/ui/animations/motion-wrapper"
import { QuizResultDisplay } from "../../components/QuizResultDisplay"
import { formatQuizTime } from "@/lib/utils"

interface CodeQuizProps {
  quizId: string
  slug: string
  isFavorite: boolean
  isPublic: boolean
  userId: string
  ownerId: string
  quizData: {
    title: string
    questions: CodeChallenge[]
  }
  onComplete?: (answers: any[]) => void
  isCompleted?: boolean
  savedAnswers?: any[]
}

export default function CodingQuiz({
  quizId,
  slug,
  quizData,
  userId,
  onComplete,
  isCompleted = false,
  savedAnswers = [],
}: CodeQuizProps) {
  const { animationsEnabled } = useAnimation()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<(string | null)[]>(Array(quizData.questions.length).fill(null))
  const [elapsedTime, setElapsedTime] = useState(0)
  const [timeSpent, setTimeSpent] = useState<number[]>(Array(quizData.questions.length).fill(0))
  const [startTime] = useState(Date.now())
  const [quizCompleted, setQuizCompleted] = useState(isCompleted)

  // Initialize with saved answers if available
  useEffect(() => {
    if (savedAnswers && savedAnswers.length > 0) {
      setSelectedOptions(savedAnswers.map((a) => a.answer || null))
      setQuizCompleted(isCompleted)
    }
  }, [savedAnswers, isCompleted])

  // Update elapsed time
  useEffect(() => {
    if (quizCompleted) return

    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))

      // Update time spent for current question
      setTimeSpent((prev) => {
        const updated = [...prev]
        updated[currentQuestionIndex] = Math.floor((Date.now() - startTime) / 1000)
        return updated
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [startTime, currentQuestionIndex, quizCompleted])

  const currentQuestion = useMemo(() => {
    return quizData.questions[currentQuestionIndex]
  }, [quizData.questions, currentQuestionIndex])

  const options = useMemo(() => {
    return Array.isArray(currentQuestion?.options) ? currentQuestion.options : []
  }, [currentQuestion?.options])

  // Calculate score function
  const calculateScore = useCallback((selectedOpts: (string | null)[], questions: CodeChallenge[]) => {
    return selectedOpts.reduce((score, selected, index) => {
      const correctAnswer = questions[index]?.correctAnswer
      return score + (selected === correctAnswer ? 1 : 0)
    }, 0)
  }, [])

  const handleSelectOption = useCallback(
    (option: string) => {
      setSelectedOptions((prev) => {
        const updated = [...prev]
        updated[currentQuestionIndex] = option
        return updated
      })
    },
    [currentQuestionIndex],
  )

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex === quizData.questions.length - 1) {
      // This is the last question, complete the quiz
      const formattedAnswers = selectedOptions.map((answer, index) => ({
        answer,
        timeSpent: timeSpent[index] || 0,
        isCorrect: answer === quizData.questions[index]?.correctAnswer,
      }))

      setQuizCompleted(true)
      if (onComplete) onComplete(formattedAnswers)
    } else {
      // Move to next question
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }, [currentQuestionIndex, quizData.questions.length, selectedOptions, timeSpent, onComplete])

  const handleRestart = useCallback(() => {
    setCurrentQuestionIndex(0)
    setSelectedOptions(Array(quizData.questions.length).fill(null))
    setTimeSpent(Array(quizData.questions.length).fill(0))
    setQuizCompleted(false)
  }, [quizData.questions.length])

  const renderCode = useCallback((code: string, language = "javascript") => {
    if (!code) return null

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
  }, [])

  const renderQuestionText = useCallback((text: string) => {
    if (!text) return null

    const [questionText, ...codeBlocks] = text.split("```")

    return (
      <div className="space-y-4">
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
        {codeBlocks.map((code, index) => (
          <pre key={index} className="bg-muted/50 p-4 rounded-lg overflow-x-auto">
            <code className="text-primary font-mono whitespace-pre">{code.trim()}</code>
          </pre>
        ))}
      </div>
    )
  }, [])

  const renderOptionContent = useCallback(
    (option: string) => {
      if (!option) return null

      const codeRegex = /```[\s\S]*?```/g
      const parts = option.split(codeRegex)
      const codes = option.match(codeRegex) || []

      return (
        <div className="w-full">
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              {part && <span className="block mb-2">{part.trim()}</span>}
              {codes[index] && <div className="my-2">{renderCode(codes[index], currentQuestion?.language)}</div>}
            </React.Fragment>
          ))}
        </div>
      )
    },
    [currentQuestion?.language, renderCode],
  )

  if (quizCompleted) {
    const correctCount = calculateScore(selectedOptions, quizData.questions)
    const totalQuestions = quizData.questions.length
    const percentage = (correctCount / totalQuestions) * 100
    const totalTime = timeSpent.reduce((sum, time) => sum + time, 0)

    // Create formatted answers for the QuizResultDisplay
    const formattedAnswers = quizData.questions.map((question, index) => {
      const userAnswer = selectedOptions[index] || ""
      return {
        isCorrect: userAnswer === question.correctAnswer,
        timeSpent: timeSpent[index] || 0,
        answer: question.correctAnswer,
        userAnswer: userAnswer,
      }
    })

    return (
      <MotionWrapper animate={animationsEnabled} variant="fade" duration={0.6}>
        <QuizResultDisplay
          quizId={quizId}
          title={quizData.title}
          score={percentage}
          totalQuestions={totalQuestions}
          totalTime={totalTime}
          correctAnswers={correctCount}
          type="code"
          slug={slug}
          answers={formattedAnswers}
          onRestart={handleRestart}
          preventAutoSave={true}
        />
      </MotionWrapper>
    )
  }

  if (!quizData.questions || quizData.questions.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-4">No questions available for this quiz.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex flex-col space-y-1.5">
          <h2 className="text-xl font-semibold">{quizData.title}</h2>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {quizData.questions.length}
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatQuizTime(elapsedTime)}</span>
            </div>
          </div>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <MotionTransition key={currentQuestionIndex}>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary font-medium px-3 py-1 flex items-center gap-1.5 mt-1"
                >
                  <Code className="h-3.5 w-3.5" />
                  Code Challenge
                </Badge>
                <h2 className="text-lg sm:text-xl font-semibold">
                  {renderQuestionText(currentQuestion?.question || "")}
                </h2>
              </div>

              {currentQuestion?.codeSnippet && (
                <MotionWrapper animate={animationsEnabled} variant="fade" duration={0.5} delay={0.2}>
                  <div className="my-4 overflow-x-auto">
                    {renderCode(currentQuestion.codeSnippet, currentQuestion.language)}
                  </div>
                </MotionWrapper>
              )}

              <QuizOptions
                options={options}
                selectedOption={selectedOptions[currentQuestionIndex]}
                onSelect={handleSelectOption}
                disabled={false}
                renderOptionContent={renderOptionContent}
              />
            </div>
          </div>
        </MotionTransition>
      </CardContent>
      <CardFooter className="flex justify-between items-center gap-4 border-t pt-6 md:flex-row flex-col-reverse">
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-mono">{formatQuizTime(timeSpent[currentQuestionIndex] || 0)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Time spent on this question</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {currentQuestionIndex > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
              className="gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
          )}
        </div>

        <Button
          onClick={handleNextQuestion}
          disabled={selectedOptions[currentQuestionIndex] === null}
          className="w-full sm:w-auto"
        >
          {currentQuestionIndex === quizData.questions.length - 1 ? (
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
