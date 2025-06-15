"use client"

import { useEffect, useMemo, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { 
  selectFlashcardQuestions,
  selectFlashcardAnswers, 
  selectFlashcardResults,
  selectFlashcardStatus,
  selectFlashcardIsComplete,
  selectQuizTitle,
  fetchFlashCardQuiz,
  clearQuizState,
  completeFlashCardQuiz
} from "@/store/slices/flashcard-slice"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { NoResults } from "@/components/ui/no-results"
import { RefreshCw, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { signIn } from "next-auth/react"
import FlashCardResults from "./FlashCardQuizResults"
import { motion } from "framer-motion"

export interface FlashcardResultHandlerProps {
  slug: string
  children: React.ReactNode | ((props: { result: any; state: any }) => React.ReactNode)
}

export default function FlashcardResultHandler({ slug, children }: FlashcardResultHandlerProps) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { data: session, status: authStatus } = useSession()
  const isAuthenticated = authStatus === "authenticated"
  
  // Track if we've initiated fetching to prevent loops
  const [hasFetched, setHasFetched] = useState(false)
  const [hasRestoredState, setHasRestoredState] = useState(false)
  
  // Get data from flashcard-slice
  const questions = useSelector(selectFlashcardQuestions)
  const answers = useSelector(selectFlashcardAnswers)
  const storedResults = useSelector(selectFlashcardResults)
  const quizStatus = useSelector(selectFlashcardStatus)
  const isCompleted = useSelector(selectFlashcardIsComplete)
  const title = useSelector(selectQuizTitle)
  
  // Restore state after authentication
  useEffect(() => {
    // Only run when user is authenticated and we haven't already restored state
    if (isAuthenticated && !hasRestoredState) {
      // Try to get pending results from localStorage
      try {
        const storedStateJson = localStorage.getItem('flashcard_pending_results')
        if (storedStateJson) {
          const storedState = JSON.parse(storedStateJson)
          
          // Make sure the stored state is for the current slug
          if (storedState && storedState.slug === slug) {
            // Create and dispatch the results
            const correctAnswers = storedState.answers?.filter(a => a.isCorrect).length || 0
            const totalQuestions = storedState.questions?.length || 0
            const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
            
            const result = {
              slug,
              title: storedState.title || "Flashcard Quiz",
              questions: storedState.questions || [],
              answers: storedState.answers || [],
              completedAt: new Date().toISOString(),
              userScore: correctAnswers,
              maxScore: totalQuestions,
              percentage,
              correctAnswers,
              totalQuestions,
              isCompleted: true,
            }
            
            // Complete the quiz with restored results
            dispatch(completeFlashCardQuiz(result))
            
            // Clear the stored state
            localStorage.removeItem('flashcard_pending_results')
          }
        }
      } catch (e) {
        console.error("Error restoring flashcard state after auth:", e)
      }
      
      setHasRestoredState(true)
    }
  }, [isAuthenticated, hasRestoredState, slug, dispatch])
  
  // Fetch flashcard data if not already loaded - fix infinite update loop
  useEffect(() => {
    if (!hasFetched && quizStatus !== "loading" && questions.length === 0) {
      setHasFetched(true)
      dispatch(fetchFlashCardQuiz(slug))
    }
  }, [slug, dispatch, hasFetched, quizStatus, questions.length])
  
  // Handle retaking the quiz
  const handleRetake = () => {
    dispatch(clearQuizState())
    router.push(`/dashboard/flashcard/${slug}?reset=true&t=${Date.now()}`)
  }
  
  // Handle sign in
  const handleSignIn = () => {
    // Store current state in localStorage so we can restore it after auth
    if (answers && answers.length > 0) {
      try {
        localStorage.setItem('flashcard_pending_results', JSON.stringify({
          slug,
          title,
          questions,
          answers,
        }))
      } catch (err) {
        console.error('Error saving pending results to localStorage', err)
      }
    }
    
    signIn(undefined, { callbackUrl: `/dashboard/flashcard/${slug}/results` })
  }
  
  // Process results from the flashcard state
  const result = useMemo(() => {
    if (storedResults) {
      return storedResults
    }
    
    if (answers?.length > 0 && questions?.length > 0) {
      const correctAnswers = answers.filter(answer => answer.isCorrect).length
      const totalQuestions = questions.length
      const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
      const totalTime = answers.reduce((total, answer) => total + (answer.timeSpent || 0), 0)
      
      return {
        slug,
        title: title || "Flashcard Quiz",
        score,
        percentage: score,
        correctAnswers,
        totalQuestions,
        totalTime,
        completedAt: new Date().toISOString(),
        answers,
        questions
      }
    }
    
    return null
  }, [storedResults, answers, questions, slug, title])
  
  // Loading state
  if (quizStatus === "loading") {
    return <QuizLoader message="Loading flashcard results..." />
  }
  
  // Authentication check - if not signed in and we have results to show
  if (!isAuthenticated) {
    // Store current state in localStorage before showing auth UI
    if (answers && answers.length > 0) {
      try {
        localStorage.setItem('flashcard_pending_results', JSON.stringify({
          slug,
          title,
          questions,
          answers,
        }))
      } catch (err) {
        console.error('Error saving pending results to localStorage', err)
      }
    }
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md mx-auto shadow-lg border-primary/20">
          <CardHeader className="text-center bg-primary/5 border-b">
            <CardTitle className="text-xl font-semibold">Sign in to View Results</CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            <p className="text-center mb-6">
              Please sign in to view and save your flashcard results.
            </p>
            <div className="flex justify-center">
              <Button 
                onClick={handleSignIn} 
                className="gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In to Continue
              </Button>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/20 text-center text-sm text-muted-foreground">
            Create a free account to track your progress across sessions
          </CardFooter>
        </Card>
      </motion.div>
    )
  }
  
  // No results case
  if (!result && quizStatus !== "loading") {
    return (
      <NoResults
        variant="quiz"
        title="No Results Found"
        description="Try taking the quiz first to see results."
        action={{
          label: "Take Quiz",
          onClick: () => router.push(`/dashboard/flashcard/${slug}`),
          icon: <RefreshCw className="w-4 h-4" />,
        }}
      />
    )
  }
  
  // Render children with result data
  if (typeof children === "function") {
    return children({ 
      result, 
      state: { 
        questions, 
        answers, 
        isCompleted, 
        title,
        quizStatus
      } 
    })
  }
  
  return children
}
