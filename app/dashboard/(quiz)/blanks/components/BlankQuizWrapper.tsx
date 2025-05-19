"use client"

import { useEffect, useCallback } from "react"
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
      dispatch(initializeQuiz({
        ...quizData,
        type: 'blanks',
        slug,
      }))
    }
  }, [dispatch, quizData, slug])

  // Show loading state if data is not ready
  if (!quizData?.id || !quizData?.questions?.length) {
    return <div className="text-center p-4">Loading quiz...</div>
  }

  // Handle quiz completion
  const handleQuestionComplete = () => {
    if ((quizState?.currentQuestionIndex || 0) === quizData.questions.length - 1) {
      // Complete quiz before navigation
      dispatch(completeQuiz({ 
        answers: quizState.answers,
        completedAt: new Date().toISOString()
      }))
      router.push(`/dashboard/blanks/${slug}/results`)
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
