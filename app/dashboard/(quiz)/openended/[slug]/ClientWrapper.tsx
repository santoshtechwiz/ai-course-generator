'use client'

import { useAppDispatch } from "@/store"
import { resetQuiz } from "@/store/slices/textQuizSlice"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import OpenEndedQuizWrapper from "../components/OpenEndedQuizWrapper"
import { LoadingDisplay } from "../../components/QuizStateDisplay"
import type { OpenEndedQuizData } from "@/types/quiz"

export function ClientWrapper({ slug, quizData }: { slug: string, quizData: OpenEndedQuizData }) {
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const reset = searchParams.get('reset')
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (reset === 'true') {
      dispatch(resetQuiz())
    }
    
    // Set a small delay to ensure the component is fully mounted
    // and the Redux store is accessible
    const timer = setTimeout(() => setIsReady(true), 100)
    return () => clearTimeout(timer)
  }, [reset, dispatch])

  if (!isReady) {
    return <LoadingDisplay message="Preparing your quiz..." />
  }
  
  return <OpenEndedQuizWrapper slug={slug} quizData={quizData} />
}
