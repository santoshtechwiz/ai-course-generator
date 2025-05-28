'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { signIn, useSession } from 'next-auth/react'
import type { AppDispatch } from '@/store'
import {
  selectQuizResults,
  selectQuizStatus,
  selectQuizError,
  checkAuthAndLoadResults,
  rehydrateQuiz,
  resetPendingQuiz,
} from '@/store/slices/quizSlice'
import { selectIsAuthenticated } from '@/store/slices/authSlice'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { NonAuthenticatedUserSignInPrompt } from '../../../components/NonAuthenticatedUserSignInPrompt'
import { QuizLoadingSteps } from '../../../components/QuizLoadingSteps'
import McqQuizResult from '../../components/McqQuizResult'
import { useSessionService } from '@/hooks/useSessionService'

interface ResultsPageProps {
  params: Promise<{ slug: string }>
}

export default function McqResultsPage({ params }: ResultsPageProps) {
  const { slug } = use(params);
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const sessionService = useSessionService()
  const { status: authStatus } = useSession()

  const quizResults = useSelector(selectQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const pendingQuiz = useSelector((state: any) => state.quiz.pendingQuiz)

  const [rehydrated, setRehydrated] = useState(false)

  // Rehydrate if authenticated and no results
  useEffect(() => {
    if (!isAuthenticated || quizResults || rehydrated) return

    let restored = pendingQuiz

    if (!restored && typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('pendingQuiz')
        if (stored) {
          restored = JSON.parse(stored)
        }
      } catch (e) {
        console.warn('Failed to parse pendingQuiz:', e)
      }
    }

    if (restored?.currentState?.showResults) {
      dispatch(rehydrateQuiz(restored))
      dispatch(resetPendingQuiz())
      setRehydrated(true)
    }
  }, [isAuthenticated, pendingQuiz, quizResults, dispatch, rehydrated])

  // Load results after auth and rehydration
  useEffect(() => {
    if (
      authStatus !== 'loading' &&
      quizStatus === 'idle' &&
      isAuthenticated &&
      !quizResults &&
      rehydrated
    ) {
      dispatch(checkAuthAndLoadResults({ slug, authStatus }))
    }
  }, [authStatus, quizStatus, quizResults, slug, dispatch, isAuthenticated, rehydrated])

  if (authStatus === 'loading' || quizStatus === 'loading') {
    return (
      <QuizLoadingSteps
        steps={[
          { label: 'Checking authentication', status: authStatus === 'loading' ? 'loading' : 'done' },
          { label: 'Loading results', status: quizStatus === 'loading' ? 'loading' : 'pending' },
        ]}
      />
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-md py-10">
        <NonAuthenticatedUserSignInPrompt
          onSignIn={async () => {
            sessionService.saveAuthRedirectState({
              returnPath: `/dashboard/mcq/${slug}/results`,
              quizState: {
                slug,
                showResults: true,
              },
            })
            await signIn(undefined, { callbackUrl: `/dashboard/mcq/${slug}/results` })
          }}
          title="Sign In to View Results"
          message="Please sign in to view your quiz results and track your progress."
        />
      </div>
    )
  }

  if (quizStatus === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Results</h2>
        <p className="text-muted-foreground mb-6">
          {error || "We couldn't load your quiz results."}
        </p>
        <div className="space-x-4">
          <Button variant="outline" onClick={() => router.push(`/dashboard/mcq/${slug}`)}>
            Take the Quiz
          </Button>
          <Button onClick={() => router.push('/dashboard/quizzes')}>
            Back to Quizzes
          </Button>
        </div>
      </div>
    )
  }

  if (!quizResults) {
    return (
      <div className="container max-w-4xl py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">No Results Found</h1>
        <p className="mb-6">We couldn't find your results for this quiz.</p>
        <div className="mt-6 flex flex-col gap-2 items-center">
          <Button onClick={() => router.push(`/dashboard/mcq/${slug}`)}>Take the Quiz</Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/quizzes')}>
            Back to Quizzes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <McqQuizResult result={quizResults} />
        </CardContent>
      </Card>
    </div>
  )
}
