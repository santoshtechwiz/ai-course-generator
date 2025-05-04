"use client"

import { createContext, useContext, useRef, useEffect, type ReactNode, useCallback, useState } from "react"
import { Provider as ReduxProvider, useDispatch, useSelector } from "react-redux"
import { store, persistor } from "@/store"
import { useSession } from "next-auth/react"
import { useQuizState } from "@/hooks/useQuizState"
import { PersistGate } from "redux-persist/integration/react"
import {
  setIsAuthenticated,
  setIsProcessingAuth,
  setAuthCheckComplete,
  setForceShowResults,
  setPendingAuthRedirect,
} from "@/store/slices/quizSlice"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"

interface QuizProviderProps {
  children: ReactNode
  quizId?: string
  slug?: string
  quizType?: string
  quizData?: any
  onAuthRequired?: (redirectUrl: string) => void
}

type QuizContextValue = ReturnType<typeof useQuizState> & {
  quizData?: any
  quizId?: string
  slug?: string
  quizType?: string
  setAuthCheckComplete?: (complete: boolean) => void
  handleFromAuthRedirect: () => void
  isAuthRedirectProcessed: boolean
}

// Export the context so it can be imported if needed
export const QuizContext = createContext<QuizContextValue | null>(null)

export const QuizProvider = ({ children, quizId, slug, quizType, quizData, onAuthRequired }: QuizProviderProps) => {
  const initializedQuizId = useRef<string | undefined>(undefined)
  const quizState = useQuizState()
  const reduxState = useSelector((s: any) => s.quiz)
  const dispatch = useDispatch()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const hasCheckedAuth = useRef(false)
  const searchParams = useSearchParams()
  const [isAuthRedirectProcessed, setIsAuthRedirectProcessed] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>({})

  // Update debug info
  useEffect(() => {
    setDebugInfo({
      sessionStatus: status,
      isAuthenticated: status === "authenticated",
      hasUser: !!session?.user,
      userId: session?.user?.id || null,
      email: session?.user?.email || null,
      slug,
      quizId,
      quizType,
      reduxState: {
        isCompleted: reduxState.isCompleted,
        forceShowResults: reduxState.forceShowResults,
        isAuthenticated: reduxState.isAuthenticated,
        requiresAuth: reduxState.requiresAuth,
        isProcessingAuth: reduxState.isProcessingAuth,
        authCheckComplete: reduxState.authCheckComplete,
        pendingAuthRedirect: reduxState.pendingAuthRedirect,
      },
      isAuthRedirectProcessed,
      hasCheckedAuth: hasCheckedAuth.current,
      searchParams: searchParams ? Object.fromEntries(searchParams.entries()) : {},
    })
  }, [status, session, slug, quizId, quizType, reduxState, isAuthRedirectProcessed, searchParams])

  // Initialize quiz data once per quiz
  useEffect(() => {
    if (quizData && quizState.initializeQuiz && initializedQuizId.current !== quizId) {
      console.log("Initializing quiz in QuizProvider:", { quizId, slug, quizType })
      quizState.initializeQuiz({
        id: quizId,
        slug,
        questions: quizData?.questions || [],
        quizType: quizType || "mcq",
        requiresAuth: true,
        isAuthenticated: status === "authenticated" && !!session?.user,
      })
      initializedQuizId.current = quizId
    }
  }, [quizData, quizId, quizState, slug, quizType, status, session])

  // Keep Redux slice in sync with NextAuth
  useEffect(() => {
    const isAuthenticated = status === "authenticated" && !!session?.user
    dispatch(setIsAuthenticated(isAuthenticated))

    // Mark auth check as complete when session status is determined
    if (status !== "loading") {
      dispatch(setAuthCheckComplete(true))
    }
  }, [status, dispatch, session])

  // Handle return from authentication - check for fromAuth parameter
  useEffect(() => {
    if (typeof window !== "undefined" && !isAuthRedirectProcessed) {
      try {
        const fromAuth = searchParams?.get("fromAuth") === "true"

        if (fromAuth && status === "authenticated") {
          console.log("Detected return from authentication, processing...")

          // Process the authentication redirect immediately
          handleFromAuthRedirect()
        }
      } catch (error) {
        console.error("Error checking auth redirect:", error)
      }
    }
  }, [status, searchParams, isAuthRedirectProcessed])

  // Trigger onAuthRequired callback immediately when needed
  useEffect(() => {
    if (
      onAuthRequired &&
      reduxState.requiresAuth &&
      !reduxState.isAuthenticated &&
      !reduxState.isProcessingAuth &&
      status !== "loading" &&
      status !== "authenticated"
    ) {
      const currentUrl = typeof window !== "undefined" ? window.location.href : ""
      console.log("Authentication required, redirecting to sign-in")

      // Set processing auth immediately to prevent multiple redirects
      dispatch(setIsProcessingAuth(true))

      // Set pending auth redirect flag in Redux
      dispatch(
        setPendingAuthRedirect({
          pending: true,
          redirectUrl: currentUrl,
        }),
      )

      // Trigger the redirect immediately
      onAuthRequired(currentUrl)
    }
  }, [
    reduxState.requiresAuth,
    reduxState.isAuthenticated,
    reduxState.isProcessingAuth,
    onAuthRequired,
    dispatch,
    status,
  ])

  // Handle redirect from authentication
  const handleFromAuthRedirect = useCallback(() => {
    if (isAuthRedirectProcessed) {
      return
    }

    console.log("Processing authentication redirect")

    // Clear the URL parameter
    if (typeof window !== "undefined") {
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
    }

    // Mark auth check as complete and reset processing state
    dispatch(setAuthCheckComplete(true))
    dispatch(setIsProcessingAuth(false))

    // Force show results - this is critical to ensure results are displayed
    dispatch(setForceShowResults(true))

    // Show toast notification
    toast({
      title: "Authentication successful",
      description: "Your quiz results have been saved.",
    })

    // Mark as processed to prevent multiple processing
    setIsAuthRedirectProcessed(true)
  }, [dispatch, toast, isAuthRedirectProcessed])

  const contextValue: QuizContextValue = {
    ...quizState,
    quizData,
    quizId,
    slug,
    quizType,
    setAuthCheckComplete: (complete: boolean) => {
      dispatch(setAuthCheckComplete(complete))
    },
    handleFromAuthRedirect,
    isAuthRedirectProcessed,
  }

  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QuizContext.Provider value={contextValue}>
          {children}

          <div className="fixed bottom-4 right-4 z-50 max-w-md">
            <details className="bg-slate-800 text-white p-2 rounded-md text-xs">
              <summary className="cursor-pointer font-bold">Quiz Context Debug</summary>
              <pre className="mt-2 overflow-auto max-h-96 p-2 bg-slate-900 rounded">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </div>
        </QuizContext.Provider>
      </PersistGate>
    </ReduxProvider>
  )
}

export const useQuiz = () => {
  const ctx = useContext(QuizContext)
  if (!ctx) {
    throw new Error("useQuiz must be used within a QuizProvider")
  }
  return ctx
}
