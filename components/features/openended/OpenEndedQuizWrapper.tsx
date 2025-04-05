"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { toast } from "@/hooks/use-toast"
import { SignInPrompt } from "@/components/SignInPrompt"
import { QuizActions } from "@/components/QuizActions"
import OpenEndedQuizQuestion from "./OpenEndedQuizQuestion"
import QuizResultsOpenEnded from "./QuizResultsOpenEnded"
import type { QuestionOpenEnded } from "@/app/types/types"
import { useQuizResult } from "@/hooks/use-quiz-result"

interface QuizData {
  id: number
  questions: QuestionOpenEnded[]
  title: string
  userId: string
}

interface OpenEndedQuizWrapperProps {
  slug: string
  quizData: QuizData
}

interface Answer {
  answer: string
  timeSpent: number
  hintsUsed: boolean

}

const OpenEndedQuizWrapper: React.FC<OpenEndedQuizWrapperProps> = ({ slug, quizData }) => {
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [quizStartTime, setQuizStartTime] = useState<number>(Date.now())
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [score, setScore] = useState<number | null>(null)

  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"

  const { submitQuizResult, isSuccess, isError, errorMessage, resetSubmissionState, result } = useQuizResult({
    onSuccess: (result) => {
      console.log("Quiz submission successful:", result)
    },
  })

  useEffect(() => {
    if (quizData?.questions && quizData.questions.length > 0) {
      const initialAnswers = Array(quizData.questions.length)
        .fill(null)
        .map(() => ({
          answer: "",
          timeSpent: 0,
          hintsUsed: false,
          isCorrect: false,
        }))
      setAnswers(initialAnswers)
      setQuizStartTime(Date.now())
      setQuestionStartTime(Date.now())
      console.log(`Quiz initialized with ${quizData.questions.length} questions`)
    }
  }, [quizData])

  const handleAnswerSubmit = useCallback(
    (answer: string) => {
      if (!quizData || !quizData.questions || activeQuestion >= quizData.questions.length) return;

      const currentIndex = activeQuestion;
      const timeSpent = (Date.now() - questionStartTime) / 1000;

      const newAnswer: Answer = {
        answer,
        timeSpent,
        hintsUsed: false,
      };

      setAnswers((prevAnswers) => {
        const updatedAnswers = [...prevAnswers];
        updatedAnswers[currentIndex] = newAnswer;

        return updatedAnswers;
      });

      const isLast = currentIndex === quizData.questions.length - 1;

      if (isLast) {
        setQuizCompleted(true);
      } else {
        setActiveQuestion((prev) => prev + 1);
        setQuestionStartTime(Date.now());
      }

      console.log(`Answered Q${currentIndex + 1}:`, {
        answer,
        timeSpent: Math.round(timeSpent),
      });
    },
    [activeQuestion, quizData, questionStartTime]
  );

  const handleRestart = useCallback(() => {
    if (!window.confirm("Are you sure you want to restart the quiz?")) return

    setActiveQuestion(0)
    setAnswers(
      Array(quizData.questions.length)
        .fill(null)
        .map(() => ({
          answer: "",
          timeSpent: 0,
          hintsUsed: false,
          isCorrect: false,
        }))
    )
    setQuizCompleted(false)
    setScore(null)
    setQuizStartTime(Date.now())
    setQuestionStartTime(Date.now())
    console.log("Quiz restarted")
  }, [quizData.questions.length])

  const handleComplete = useCallback(
    async (finalScore: number) => {
      setScore(finalScore)

      if (isAuthenticated) {
        setIsSubmitting(true)

        try {
          const formattedAnswers = answers.map((answer, index) => ({
            userAnswer: answer.answer,
          
            timeSpent: answer.timeSpent,
            hintsUsed: answer.hintsUsed,
          }))

          const elapsedTime = (Date.now() - quizStartTime) / 1000

          await submitQuizResult(
            quizData.id.toString(),
            formattedAnswers,
            elapsedTime,
            finalScore,
            "openended"
          )
        } catch (error) {
          console.error("Error saving quiz results:", error)
          toast({
            title: "Error",
            description: "Failed to save quiz results. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsSubmitting(false)
        }
      }
    },
    [answers, isAuthenticated, quizData, quizStartTime]
  )

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return <p className="text-center text-gray-500 my-8">No questions available for this quiz.</p>
  }

  return (
    <div className="flex flex-col gap-8">
      <QuizActions
        quizId={quizData.id.toString()}
        quizSlug={slug}
        userId={quizData.userId}
        ownerId={quizData.userId}
        initialIsPublic={false}
        initialIsFavorite={false}
        quizType="openended"
        position="left-center"
      />

      {isSubmitting && (
        <div className="bg-secondary/20 p-4 rounded-md text-center">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-primary rounded-full mb-2"></div>
          <p>Saving your quiz results...</p>
        </div>
      )}

      {quizCompleted ? (
        isAuthenticated ? (
          <QuizResultsOpenEnded
            answers={answers}
            questions={quizData.questions}
            onRestart={handleRestart}
            onComplete={handleComplete}
          />
        ) : (
          <div className="max-w-4xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Quiz Completed</h2>
            <p className="mb-4">Sign in to view your results and save your progress.</p>
            <SignInPrompt callbackUrl={`/dashboard/openended/${slug}`} />
          </div>
        )
      ) : (
        <OpenEndedQuizQuestion
          question={quizData.questions[activeQuestion]}
          onAnswer={handleAnswerSubmit}
          questionNumber={activeQuestion + 1}
          totalQuestions={quizData.questions.length}
        />
      )}
    </div>
  )
}

export default OpenEndedQuizWrapper
