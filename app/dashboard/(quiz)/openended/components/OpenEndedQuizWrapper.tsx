"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store"
import OpenEndedQuizQuestion from "./OpenEndedQuizQuestion"
import type { OpenEndedQuizData } from "../types"
import { initializeQuiz, completeQuiz, setCurrentQuestion } from "@/app/store/slices/textQuizSlice"

interface OpenEndedQuizWrapperProps {
  quizData: OpenEndedQuizData;
  slug: string;
}

export default function OpenEndedQuizWrapper({ quizData, slug }: OpenEndedQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const quizState = useAppSelector((state) => state.textQuiz)
  
  // Initialize quiz with safety check
  useEffect(() => {
    if (quizData?.id && quizData?.questions?.length > 0 && slug) {
      dispatch(initializeQuiz({
        ...quizData,
        type: 'openended',
        slug,
      }))
    }
  }, [dispatch, quizData, slug])

  // Show loading state if data is not ready
  if (!quizData?.id || !quizData?.questions?.length) {
    return <div className="text-center p-4">Loading quiz...</div>
  }

  // Handle question completion
  const handleQuestionComplete = useCallback(() => {
    if ((quizState?.currentQuestionIndex || 0) === quizData.questions.length - 1) {
      // Complete quiz before navigation
      dispatch(completeQuiz({ 
        answers: quizState.answers,
        completedAt: new Date().toISOString()
      }))
      router.push(`/dashboard/openended/${slug}/results`)
    } else {
      // Move to next question
      dispatch(setCurrentQuestion((quizState?.currentQuestionIndex || 0) + 1))
    }
  }, [quizState?.currentQuestionIndex, quizState.answers, quizData.questions.length, router, slug, dispatch])

  return (
    <OpenEndedQuizQuestion
      question={quizData.questions[quizState?.currentQuestionIndex || 0]}
      questionNumber={(quizState?.currentQuestionIndex || 0) + 1}
      totalQuestions={quizData.questions.length}
      isLastQuestion={(quizState?.currentQuestionIndex || 0) === quizData.questions.length - 1}
      onQuestionComplete={handleQuestionComplete}
    />
  )
}
