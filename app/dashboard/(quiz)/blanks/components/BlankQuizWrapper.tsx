"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store"
import BlanksQuiz from "./BlanksQuiz"
import type { BlanksQuizWrapperProps } from "../blanks-quiz-types"
import { initializeQuiz, setCurrentQuestion, completeQuiz } from "@/app/store/slices/textQuizSlice"

export default function BlankQuizWrapper({ quizData, slug }: BlanksQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const quizState = useAppSelector((state) => state.textQuiz)

  // Initialize quiz with safety check
  useEffect(() => {
    if (quizData?.id && quizData?.questions?.length > 0 && slug) {
      dispatch(
        initializeQuiz({
          ...quizData,
          type: "blanks",
          slug,
        }),
      )
    }
  }, [dispatch, quizData, slug])

  // Show loading state if data is not ready
  if (!quizData?.id || !quizData?.questions?.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="text-muted-foreground">Loading your fill-in-the-blank quiz...</p>
        </div>
      </div>
    )
  }

  // Handle quiz completion
  const handleQuestionComplete = () => {
    if ((quizState?.currentQuestionIndex || 0) === quizData.questions.length - 1) {
      // Complete quiz before navigation
      dispatch(
        completeQuiz({
          answers: quizState.answers,
          completedAt: new Date().toISOString(),
        }),
      )

      // Add a small delay before navigation for better UX
      setTimeout(() => {
        router.push(`/dashboard/blanks/${slug}/results`)
      }, 300)
    } else {
      dispatch(setCurrentQuestion((quizState?.currentQuestionIndex || 0) + 1))
    }
  }

  return (
    <BlanksQuiz
      question={quizData.questions[quizState?.currentQuestionIndex || 0]}
      questionNumber={(quizState?.currentQuestionIndex || 0) + 1}
      totalQuestions={quizData.questions.length}
      isLastQuestion={(quizState?.currentQuestionIndex || 0) === quizData.questions.length - 1}
      onQuestionComplete={handleQuestionComplete}
    />
  )
}
