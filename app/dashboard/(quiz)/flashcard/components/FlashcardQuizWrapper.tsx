"use client"

import { useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState, RootState } from "@/store"
import {

  selectQuizTitle,
  selectIsQuizComplete,
  selectShouldRedirectToResults,
  clearQuizState,
  fetchFlashCardQuiz,
  saveFlashCardResults,
  completeFlashCardQuiz,
  selectQuizQuestions,
  selectAnswers,
  selectCurrentQuestionIndex,
  selectQuizStatus,
} from "@/store/slices/flashcard-slice"
import FlashcardQuiz from "./FlashcardQuiz"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { NoResults } from "@/components/ui/no-results"

interface FlashcardQuizWrapperProps {
  slug: string
  title?: string
}

export default function FlashcardQuizWrapper({ slug, title }: FlashcardQuizWrapperProps) {
  // References to prevent re-fetching
  const initRef = useRef(false)
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasFetchedRef = useRef(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch<AppDispatch>()

  // Get UI state from URL
  const isReviewMode = searchParams?.get("review") === "true"
  const isResetMode = searchParams?.get("reset") === "true"

  // Get data from Redux (memoized selectors already)
  const questions = useSelector((state: RootState) => selectQuizQuestions(state))
  const answers = useSelector((state: RootState) => selectAnswers(state))
  const currentQuestionIndex = useSelector((state: RootState) => selectCurrentQuestionIndex(state))
  const quizStatus = useSelector((state: RootState) => selectQuizStatus(state))
  const quizTitle = useSelector((state: RootState) => selectQuizTitle(state))
  const isCompleted = useSelector((state: RootState) => selectIsQuizComplete(state))
  const shouldRedirectToResults = useSelector((state: RootState) => state.flashcard.shouldRedirectToResults)
  // Initialize the quiz - only run once
  useEffect(() => {
    if (initRef.current) return

    const init = async () => {
      // Reset if requested or for review mode
      if (isResetMode || isReviewMode) {
        dispatch(clearQuizState())
        
        // Also clear any stored state when explicitly resetting
        try {
          localStorage.removeItem('flashcard_complete_state');
          localStorage.removeItem('flashcard_results');
          sessionStorage.removeItem('flashcard_results');
          sessionStorage.removeItem('flashcard_complete_state');
        } catch (e) {
          console.warn("Failed to clear stored quiz state during reset", e);
        }
      }      // Enhanced check for completed quiz state - check ALL possible storage locations
      if (!isResetMode && !hasFetchedRef.current && questions.length === 0) {
        // Track if we find a completed state
        let foundCompleted = false;
        
        // Check multiple storage locations for completed state
        const checkStorageForCompletedState = () => {
          // 1. Check primary storage (localStorage complete state)
          try {
            const completeStateData = localStorage.getItem('flashcard_complete_state');
            if (completeStateData) {
              const parsedState = JSON.parse(completeStateData);
              if (parsedState.slug === slug && parsedState.isCompleted && parsedState.quizResults) {
                console.log("Found completed state in localStorage, redirecting", parsedState);
                foundCompleted = true;
                return true;
              }
            }
          } catch (e) {
            console.warn("Error checking localStorage complete state", e);
          }
          
          // 2. Check session storage backup
          try {
            const sessionStateData = sessionStorage.getItem('flashcard_complete_state');
            if (sessionStateData) {
              const parsedState = JSON.parse(sessionStateData);
              if (parsedState.slug === slug && parsedState.isCompleted && parsedState.quizResults) {
                console.log("Found completed state in sessionStorage, redirecting", parsedState);
                foundCompleted = true;
                return true;
              }
            }
          } catch (e) {
            console.warn("Error checking sessionStorage complete state", e);
          }
          
          // 3. Check legacy flashcard_results format
          try {
            const resultsData = localStorage.getItem('flashcard_results') || 
                                sessionStorage.getItem('flashcard_results');
            if (resultsData) {
              const parsedData = JSON.parse(resultsData);
              if (parsedData.slug === slug && parsedData.quizResults) {
                console.log("Found completed state in legacy format, redirecting", parsedData);
                foundCompleted = true;
                return true;
              }
            }
          } catch (e) {
            console.warn("Error checking legacy results format", e);
          }
          
          // 4. Check generic pendingQuizResults
          try {
            const pendingData = localStorage.getItem('pendingQuizResults') || 
                               sessionStorage.getItem('pendingQuizResults');
            if (pendingData) {
              const parsedData = JSON.parse(pendingData);
              if (parsedData.slug === slug && parsedData.quizType === "flashcard" && parsedData.results) {
                console.log("Found completed state in pendingQuizResults, redirecting", parsedData);
                foundCompleted = true;
                return true;
              }
            }
          } catch (e) {
            console.warn("Error checking pendingQuizResults", e);
          }
          
          return false;
        };
        
        // Check all storage locations and redirect if found
        if (checkStorageForCompletedState() && typeof window !== 'undefined') {
          hasFetchedRef.current = true;
          
          // If we're on the quiz page but have completed results, redirect to results
          if (!window.location.pathname.includes('/results')) {
            console.log("Found completed quiz state, redirecting to results");
            
            // Add a small delay to ensure any state is properly set
            setTimeout(() => {
              window.location.href = `/dashboard/flashcard/${slug}/results`;
            }, 10);
            return;
          }
        }
      }

      // Only fetch if we don't have questions yet and haven't found stored state
      if (!hasFetchedRef.current && questions.length === 0) {
        try {
          hasFetchedRef.current = true
          await dispatch(fetchFlashCardQuiz(slug)).unwrap()
        } catch (err) {
          console.error("Failed to load flashcards:", err)
          toast.error("Failed to load flashcards. Please try again.")
        }
      }
    }

    init()
    initRef.current = true

    // Clean up any timeouts on unmount
    return () => {
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current)
      }
    }
  }, [slug, dispatch, isResetMode, isReviewMode, questions.length])// Handle quiz completion and navigation - AGGRESSIVE APPROACH
  useEffect(() => {
    if (shouldRedirectToResults) {
      // Add a class to body to indicate redirect is happening
      if (typeof window !== 'undefined') document.body.classList.add('quiz-redirect')
      
      // Show toast only if there was an error saving - but don't block the flow
      if (quizStatus === "failed" || quizStatus === "completed_with_errors") {
        toast.error(
          "Couldn't save to database, but results are available", 
          { duration: 5000 }
        )
      }
      
      // MOST AGGRESSIVE APPROACH: Use window.location.href for immediate navigation
      // This is more reliable than router.replace as it forces a complete navigation
      // that breaks out of any potential React rendering loops
      window.location.href = `/dashboard/flashcard/${slug}/results`;
    }
    
    return () => {
      // Clean up class when component unmounts
      if (typeof window !== 'undefined') document.body.classList.remove('quiz-redirect')
    }
  }, [shouldRedirectToResults, slug, quizStatus])

  // Reset flag and force redirect to results if we're completed but flag is not set
  useEffect(() => {
    // If we have completed quiz but redirect flag is not set, force redirect
    if (isCompleted && !shouldRedirectToResults) {
      console.log("Found completed quiz but redirect flag not set, redirecting to results");
      
      // Try direct navigation first since Redux state might be lost
      if (typeof window !== 'undefined') {
        // Check if we're not already on results page
        if (!window.location.pathname.includes('/results')) {
          window.location.href = `/dashboard/flashcard/${slug}/results`;
        }
      }
    }
  }, [isCompleted, shouldRedirectToResults, slug]);

  // Get cards to review (based on incorrect and still_learning answers)
  const reviewQuestions = useMemo(() => {
    if (!isReviewMode || !questions.length || !answers.length) return questions

    // Find questions that were answered incorrectly or marked as still learning
    const reviewIds = answers
      .filter(
        (answer) => answer.answer === "incorrect" || answer.answer === "still_learning" || answer.isCorrect === false,
      )
      .map((answer) => answer.questionId)

    // Filter the questions to only include those with incorrect/still learning answers
    return questions.filter((question) => reviewIds.includes(question.id?.toString() || ""))
  }, [isReviewMode, questions, answers])

  // Use the correct set of questions based on mode
  const currentQuestions = isReviewMode ? reviewQuestions : questions
  // Loading state
  if (quizStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-pulse text-xl font-medium">Loading flashcards...</div>
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Please wait while we prepare your quiz</p>
        </div>
      </div>
    )
  }  // Handle quiz completion - completely bypass saving and focus on showing results
  const onComplete = () => {
    // Calculate total time from answers
    const totalTime = Array.isArray(answers) ? answers.reduce((acc, answer) => acc + (answer?.timeSpent || 0), 0) : 0

    // Calculate score based on "correct" self-ratings
    const correctCount = answers.filter((answer) => answer.answer === "correct").length
    const stillLearningCount = answers.filter((answer) => answer.answer === "still_learning").length
    const incorrectCount = answers.filter((answer) => answer.answer === "incorrect").length

    const totalQuestions = questions.length
    const score = totalQuestions ? (correctCount / totalQuestions) * 100 : 0

    // Complete the quiz with proper result data
    const quizResults = {
      score,
      answers: answers || [],
      completedAt: new Date().toISOString(),
      percentage: score,
      correctAnswers: correctCount,
      stillLearningAnswers: stillLearningCount,
      incorrectAnswers: incorrectCount,
      totalQuestions: totalQuestions,
      totalTime: totalTime,
      reviewCards: answers
        .filter((a) => a.answer === "incorrect")
        .map((a) => parseInt(a.questionId) || a.questionId),
      stillLearningCards: answers
        .filter((a) => a.answer === "still_learning")
        .map((a) => parseInt(a.questionId) || a.questionId),
    }
    
    // Create a complete state object that includes all necessary data
    const completeState = {
      quizResults,
      slug,
      title: quizTitle || title || "Flashcard Quiz",
      questions: questions,
      currentQuestion: currentQuestionIndex,
      answers: answers,
      isCompleted: true,
      quizId: slug,
      timestamp: Date.now(),
      status: "succeeded"
    };
    
    console.log("Saving complete quiz state to localStorage:", completeState);

    // Store COMPLETE state in local storage - not just results
    try {
      // Save the complete state as JSON
      localStorage.setItem('flashcard_complete_state', JSON.stringify(completeState));
      
      // Also save in the original format for backward compatibility
      localStorage.setItem('flashcard_results', JSON.stringify({
        quizResults,
        slug,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }
    
    // Update Redux state
    dispatch(completeFlashCardQuiz(quizResults))
      // Wait a more significant amount of time to ensure storage operations complete
    // Check that storage worked before redirecting
    const verifyStorageAndRedirect = () => {
      try {
        // Verify localStorage storage worked by reading it back
        const storedState = localStorage.getItem('flashcard_complete_state');
        const storedResults = localStorage.getItem('flashcard_results');
        const pendingResults = localStorage.getItem('pendingQuizResults');
        
        if (!storedState && !storedResults && !pendingResults) {
          // No storage found, try emergency save to session storage
          console.warn("Storage verification failed, attempting emergency backup");
          try {
            sessionStorage.setItem('flashcard_emergency_backup', JSON.stringify({
              quizResults,
              slug,
              timestamp: Date.now()
            }));
          } catch (e) {
            console.error("Emergency backup failed", e);
          }
        } else {
          console.log("Storage verified before redirect");
        }
        
        // DIRECT NAVIGATION: Force immediate redirect using window.location 
        // This is more aggressive than router.replace and will break any loading cycles
        window.location.href = `/dashboard/flashcard/${slug}/results`;
      } catch (e) {
        console.error("Error during storage verification:", e);
        // Still redirect even if verification fails
        window.location.href = `/dashboard/flashcard/${slug}/results`;
      }
    };
    
    // Increased delay to ensure storage operations complete (100ms instead of 50ms)
    setTimeout(verifyStorageAndRedirect, 100);
  }
  // Error state - AGGRESSIVE RESET
  if (quizStatus === "failed" && !isCompleted) {
    return (
      <NoResults
        variant="error"
        title="No Flashcards Found"
        description="We couldn't find any flashcards for this topic."
        action={{ 
          label: "Try Again", 
          onClick: () => {
            // First reset state completely
            dispatch(clearQuizState());
            // Then force a complete page reload with cache busting
            window.location.href = `${window.location.pathname}?reset=true&t=${Date.now()}`;
          } 
        }}
        secondaryAction={{
          label: "Browse Topics",
          onClick: () => window.location.href = "/dashboard/quizzes",
          variant: "outline",
        }}
      />
    )
  }
  // If quiz is completed but save failed, still allow showing results
  if ((quizStatus === "failed" || quizStatus === "completed_with_errors") && isCompleted && shouldRedirectToResults) {
    // Immediately redirect without trying to save again
    router.replace(`/dashboard/flashcard/${slug}/results`)
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-pulse text-xl font-medium">Results ready!</div>
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Redirecting to results page...</p>
          <p className="text-xs text-muted-foreground/70">97% complete (skipping database save)</p>
        </div>
      </div>
    )
  }

  // No questions to review
  if (isReviewMode && reviewQuestions.length === 0) {
    return (
      <NoResults
        variant="empty"
        title="No Cards to Review"
        description="You marked all cards as known. Great job!"
        action={{ label: "Retake Quiz", onClick: () => router.push(`/dashboard/flashcard/${slug}?reset=true`) }}
        secondaryAction={{
          label: "Back to Results",
          onClick: () => router.push(`/dashboard/flashcard/${slug}/results`),
        }}
      />
    )
  }
  // No questions state
  if (!currentQuestions || currentQuestions.length === 0) {
    return (
      <NoResults
        variant="error"
        title="No Flashcards Found"
        description="We couldn't find any flashcards for this topic."
        action={{ 
          label: "Try Again", 
          onClick: () => {
            // Clear quiz state first
            dispatch(clearQuizState());
            // Then force reload with cache busting
            window.location.href = `${window.location.pathname}?reset=true&t=${Date.now()}`; 
          } 
        }}
        secondaryAction={{ label: "Browse Topics", onClick: () => router.push("/dashboard/quizzes") }}
      />
    )
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <FlashcardQuiz
        key={`${slug}-${isReviewMode ? "review" : "full"}`}
        cards={currentQuestions}
        quizId={slug}
        slug={slug}
        onComplete={onComplete}
        onSaveCard={(saveData) => {
          // Save the card answer immediately
          dispatch(saveFlashCardResults({ slug, data: [saveData] }))
        }}
        title={
          isReviewMode ? `Review: ${quizTitle || title || "Flashcard Quiz"}` : quizTitle || title || "Flashcard Quiz"
        }
        isReviewMode={isReviewMode}
      />
    </motion.div>
  )
}
