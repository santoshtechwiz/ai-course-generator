import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/store'
import { fetchQuizResults } from '@/app/store/slices/textQuizSlice'
import { useAuth } from './useAuth'

export function useQuizResults(slug: string, quizType: string) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { isAuthenticated } = useAuth()
  const quizState = useAppSelector((state) => state.textQuiz)
  const [localResult, setLocalResult] = useState<any>(null)

  useEffect(() => {
    const loadResults = async () => {
      if (isAuthenticated) {
        // For authenticated users, fetch from API
        dispatch(fetchQuizResults({ slug, type: quizType }))
      } else {
        // For non-authenticated users, load from local storage
        const savedResult = getLocalQuizResult(slug)
        setLocalResult(savedResult)
      }
    }

    loadResults()
  }, [dispatch, slug, quizType, isAuthenticated])

  const saveResults = (results: any) => {
    if (!isAuthenticated) {
      saveLocalQuizResult(slug, results)
      setLocalResult(results)
    }
  }

  return {
    isLoading: quizState.status === 'loading',
    error: quizState.error,
    results: isAuthenticated ? quizState : localResult,
    saveResults,
    isAuthenticated
  }
}
