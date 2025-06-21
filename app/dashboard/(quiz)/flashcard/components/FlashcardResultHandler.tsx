"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import { useAppSelector, useAppDispatch } from "@/store"
import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import FlashCardResults from "./FlashCardQuizResults"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { 
  setQuizResults, 
  resetRedirectFlag, 
  resetFlashCards,
  clearQuizState 
} from "@/store/slices/flashcard-slice"
import SignInPrompt from "@/app/auth/signin/components/SignInPrompt"
import { Button } from "@/components/ui/button"

interface FlashcardResultHandlerProps {
  slug: string
  title?: string
  onRestart?: () => void
  onReview?: (cards: number[]) => void
  onReviewStillLearning?: (cards: number[]) => void
  questions?: Array<{
    id: string | number
    question: string
    answer: string
  }>
}

export default function FlashcardResultHandler({
  slug,
  title,
  onRestart,
  onReview,
  onReviewStillLearning,
  questions = [],
}: FlashcardResultHandlerProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const dispatch = useAppDispatch()

  // State management
  const [isLoading, setIsLoading] = useState(true)
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)
  const [restoredResults, setRestoredResults] = useState<any>(null)
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const hasRestoredRef = useRef(false)
  const hasSavedPendingRef = useRef(false)
  const hasInitializedRef = useRef(false)

  // Get flashcard state from Redux
  const {
    isCompleted,
    answers,
    score,
    totalQuestions,
    correctAnswers,
    totalTime,
    quizId,
    results: storedResults,
    questions: storeQuestions,
    shouldRedirectToResults,
  } = useAppSelector((state) => state.flashcard)

  // Process answers to get detailed counts including still_learning
  const processedResults = useMemo(() => {
    if (!answers || !Array.isArray(answers)) {
      return {
        correctCount: 0,
        stillLearningCount: 0,
        incorrectCount: 0,
        totalCount: 0,
        reviewCards: [],
        stillLearningCards: [],
      }
    }

    let correctCount = 0
    let stillLearningCount = 0
    let incorrectCount = 0
    const reviewCards: number[] = []
    const stillLearningCards: number[] = []

    answers.forEach((answer, index) => {
      if (answer && typeof answer.answer === "string") {
        switch (answer.answer) {
          case "correct":
            correctCount++
            break
          case "still_learning":
            stillLearningCount++
            stillLearningCards.push(index)
            break
          case "incorrect":
            incorrectCount++
            reviewCards.push(index)
            break
        }
      }
    })

    return {
      correctCount,
      stillLearningCount,
      incorrectCount,
      totalCount: correctCount + stillLearningCount + incorrectCount,
      reviewCards,
      stillLearningCards,
    }
  }, [answers])

  // Generate complete results object
  const completeResults = useMemo(() => {
    if (restoredResults) {
      return restoredResults
    }

    // Check if we have valid quiz completion data
    if (isCompleted && answers?.length > 0) {
      return {
        quizId,
        slug,
        title: title || "Flashcard Quiz",
        quizType: "flashcard",
        score: processedResults.correctCount,
        maxScore: processedResults.totalCount,
        percentage:
          processedResults.totalCount > 0
            ? Math.round((processedResults.correctCount / processedResults.totalCount) * 100)
            : 0,
        correctAnswers: processedResults.correctCount,
        stillLearningAnswers: processedResults.stillLearningCount,
        incorrectAnswers: processedResults.incorrectCount,
        totalQuestions: processedResults.totalCount || questions.length || 5,
        totalTime: totalTime || 0,
        completedAt: new Date().toISOString(),
        answers,
        questions: questions.length > 0 ? questions : storeQuestions,
        reviewCards: processedResults.reviewCards || [],
        stillLearningCards: processedResults.stillLearningCards || [],
      }
    }

    // Check if we have stored results
    if (storedResults) {
      return storedResults
    }

    // If we have any results data but not a formal complete result, create a minimal one
    if ((quizId || slug) && Array.isArray(answers) && answers.length > 0) {
      return {
        quizId: quizId || slug,
        slug,
        title: title || "Flashcard Quiz",
        quizType: "flashcard",
        score: processedResults.correctCount,
        maxScore: processedResults.totalCount,
        percentage: 
          processedResults.totalCount > 0
            ? Math.round((processedResults.correctCount / processedResults.totalCount) * 100)
            : 0,
        correctAnswers: processedResults.correctCount,
        stillLearningAnswers: processedResults.stillLearningCount,
        incorrectAnswers: processedResults.incorrectCount,
        totalQuestions: questions.length || answers.length,
        totalTime: 0,
        completedAt: new Date().toISOString(),
        answers,
        questions: questions.length > 0 ? questions : storeQuestions,
        reviewCards: processedResults.reviewCards,
        stillLearningCards: processedResults.stillLearningCards,
      }
    }

    return null
  }, [
    restoredResults,
    isCompleted,
    answers,
    quizId,
    slug,
    title,
    processedResults,
    totalTime,
    questions,
    storeQuestions,
    storedResults,
  ])

  // Handle sign-in process
  const handleSignIn = useCallback(async () => {
    if (completeResults && !hasSavedPendingRef.current) {
      try {
        // Save current results to both storages for reliability
        const pendingData = {
          slug,
          quizType: "flashcard",
          results: completeResults,
          timestamp: Date.now(),
          questions: questions.length > 0 ? questions : storeQuestions,
          title: completeResults.title,
        }

        localStorage.setItem("pendingQuizResults", JSON.stringify(pendingData))
        sessionStorage.setItem("pendingQuizResults", JSON.stringify(pendingData))
        hasSavedPendingRef.current = true
      } catch (error) {
        console.error("Failed to store pending results:", error)
      }
    }

    // Trigger sign-in with callback to current page
    await signIn(undefined, {
      callbackUrl: `/dashboard/flashcard/${slug}/results`,
    })
  }, [completeResults, slug, questions, storeQuestions])  // Handle retake process - ULTRA AGGRESSIVE RESET
  const handleRetake = useCallback(() => {
    // Reset the flashcard state completely using both available methods
    dispatch(resetFlashCards())
    dispatch(clearQuizState())
    
    // ENHANCED: Ultra aggressive storage clearing - clear absolutely everything
    try {
      // Clear all known flashcard storage keys
      const keysToRemove = [
        // Main storage keys
        'flashcard_complete_state',
        'flashcard_results',
        
        // Emergency backup keys
        'flashcard_emergency_backup',
        
        // Generic quiz keys that might have flashcard data
        'pendingQuizResults',
        
        // Any other keys that might contain flashcard data
        'flashcard_state',
        'redux_state_flashcard'
      ];
      
      // Try to remove from both localStorage and sessionStorage
      keysToRemove.forEach(key => {
        try { localStorage.removeItem(key) } catch (e) {}
        try { sessionStorage.removeItem(key) } catch (e) {}
      });
      
      // Also try to find and remove any keys containing the slug
      if (slug) {
        try {
          // Look for any keys containing the slug in localStorage
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.includes(slug)) {
              localStorage.removeItem(key)
            }
          }
          
          // Do the same for sessionStorage
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i)
            if (key && key.includes(slug)) {
              sessionStorage.removeItem(key)
            }
          }
        } catch (e) {
          console.warn("Error clearing storage by slug", e)
        }
      }
      
      console.log("Successfully cleared ALL flashcard state from storage");
    } catch (e) {
      console.warn("Failed to clear some stored results", e);
    }

    if (onRestart) {
      // Use the provided restart handler if available
      onRestart();
    } else {
      console.log("Using default restart behavior with full reset");
      
      // AGGRESSIVE APPROACH:
      // 1. Reset all state via dispatch
      // 2. Use timeout to ensure state update happens
      // 3. Force full page reload with cache-busting parameter
      
      // For maximum reliability, we do a full state reset, then reload
      setTimeout(() => {
        // Set URL parameters to ensure it's a fresh start with cache busting
        const resetUrl = `/dashboard/flashcard/${slug}?reset=true&t=${Date.now()}`;
        
        // Use window.location for a full page refresh
        // This ensures all state is completely cleared including Redux
        window.location.href = resetUrl;
      }, 100);
    }
  }, [onRestart, dispatch, slug])  // Check for results but NEVER redirect back to quiz from results page
  useEffect(() => {
    if (hasInitializedRef.current) return

    hasInitializedRef.current = true
    
    // FIRST PRIORITY: Check if we're on the results page - NEVER redirect away from results
    const isOnResultsPage = typeof window !== 'undefined' && 
      (window.location.pathname.includes(`/flashcard/${slug}/results`) || 
       window.location.href.includes(`/flashcard/${slug}/results`));

    // If we're on results page, we must stay here no matter what
    if (isOnResultsPage) {
      console.log("On results page, will NOT redirect back to quiz");
      
      // Load results from any available source in order of preference:
      // 1. Complete state from localStorage (new approach)
      // 2. Redux state
      // 3. Flashcard results from localStorage (old approach)
      
      // First try to restore complete state (newly added approach)
      try {
        const completeStateData = localStorage.getItem('flashcard_complete_state');
        if (completeStateData) {
          const parsedState = JSON.parse(completeStateData);
          console.log("Found complete state in localStorage", parsedState);
          
          // Ensure the state is for this quiz
          if (parsedState.slug === slug || !slug) {
            // Restore the complete state including questions, answers, etc.
            console.log("Restoring complete quiz state from localStorage");
            
            // Set individual pieces of state
            if (parsedState.quizResults) {
              dispatch(setQuizResults(parsedState.quizResults));
              setRestoredResults(parsedState.quizResults);
            }
            
            setIsLoading(false);
            return; // Exit early since we found and restored complete state
          }
        }
      } catch (e) {
        console.warn("Error parsing complete state from localStorage", e);
      }
      
      // Then try Redux state
      if (storedResults || (isCompleted && answers?.length > 0)) {
        console.log("Using results from Redux state");
        setIsLoading(false);
        return;
      }
      
      // Then try old localStorage approach as backup
      try {
        const localData = localStorage.getItem('flashcard_results');
        if (localData) {
          const parsedData = JSON.parse(localData);
          console.log("Using locally stored results from localStorage (old format)");
          setRestoredResults(parsedData.quizResults);
          dispatch(setQuizResults(parsedData.quizResults));
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.warn("Error parsing localStorage results", e);
      }
        // ENHANCED: Emergency fallback - generate minimal results if nothing else is available
      const emergencyResults = {
        score: 0,
        percentage: 0,
        correctAnswers: 0,
        totalQuestions: questions.length || 1,
        completedAt: new Date().toISOString(),
        answers: [],
        reviewCards: [],
        stillLearningCards: [],
        slug: slug,
      };
      
      console.log("Using emergency fallback results on results page");
      setRestoredResults(emergencyResults);
      dispatch(setQuizResults(emergencyResults));
      
      // Even with emergency results, still stay on results page
      setIsLoading(false);
      return;
    }

    // NOT on results page - normal flow for quiz page
    
    // Try to use localStorage results if available - check both formats
    if (!storedResults && !restoredResults && !isCompleted) {
      // First try complete state format
      try {
        const completeStateData = localStorage.getItem('flashcard_complete_state');
        if (completeStateData) {
          const parsedState = JSON.parse(completeStateData);
          if (parsedState.slug === slug) {
            console.log("Using complete state from localStorage");
            if (parsedState.quizResults) {
              dispatch(setQuizResults(parsedState.quizResults));
              setRestoredResults(parsedState.quizResults);
            }
            setIsLoading(false);
            return; // Exit early since we found results
          }
        }
      } catch (e) {
        console.warn("Error parsing complete state from localStorage", e);
      }
      
      // Then try old format
      try {
        const localData = localStorage.getItem('flashcard_results');
        if (localData) {
          const parsedData = JSON.parse(localData);
          if (parsedData.slug === slug) {
            console.log("Using locally stored results from localStorage (old format)");
            setRestoredResults(parsedData.quizResults);
            dispatch(setQuizResults(parsedData.quizResults));
            setIsLoading(false);
            return; // Exit early since we found results
          }
        }
      } catch (e) {
        console.warn("Error parsing localStorage results", e);
      }
    }    // CRITICAL FIX: Consider isCompleted even with empty answers as valid results!
    const hasValidResults =
      isCompleted || // Just being completed is enough!
      storedResults || // Stored results in Redux
      restoredResults || // Restored from storage
      (answers && answers.length > 0); // Any answers available
      
    console.log("Results check:", {
      isCompleted,
      hasStoredResults: !!storedResults,
      hasRestoredResults: !!restoredResults,
      answersLength: answers?.length,
      hasValidResults
    });
      
    // ENHANCED VERSION: Never redirect from results page even if state is empty    
    if (isOnResultsPage) {
      // We're on results page - NEVER redirect back to quiz
      console.log("On results page - staying here even with no results");
      setIsLoading(false);
    } else if (!hasValidResults && !shouldRedirect) {
      // Only redirect if not on results page and no valid results
      console.log("Not on results page and no valid results found, redirecting to quiz");
      setShouldRedirect(true);
      router.replace(`/dashboard/flashcard/${slug}`);
    } else {
      setIsLoading(false);
    }
  }, [status, isCompleted, answers, storedResults, restoredResults, slug, router, shouldRedirect, dispatch])

  // Restore results after authentication
  useEffect(() => {
    if (status === "authenticated" && !hasRestoredRef.current) {
      try {
        // Try to restore from sessionStorage first, then localStorage
        let storedData = null

        try {
          const sessionData = sessionStorage.getItem("pendingQuizResults")
          if (sessionData) {
            storedData = JSON.parse(sessionData)
          }
        } catch (e) {
          console.warn("Failed to parse sessionStorage data:", e)
        }

        if (!storedData) {
          try {
            const localData = localStorage.getItem("pendingQuizResults")
            if (localData) {
              storedData = JSON.parse(localData)
            }
          } catch (e) {
            console.warn("Failed to parse localStorage data:", e)
          }
        }

        if (storedData && storedData.slug === slug && storedData.quizType === "flashcard") {
          // Restore the results
          setRestoredResults(storedData.results)

          // Store back into Redux for consistency
          dispatch(setQuizResults(storedData.results))

          // Clean up stored data
          try {
            localStorage.removeItem("pendingQuizResults")
            sessionStorage.removeItem("pendingQuizResults")
          } catch (error) {
            console.warn("Failed to clear stored data:", error)
          }

          hasRestoredRef.current = true
          setShowSignInPrompt(false)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error restoring results after auth:", error)
      }
    }
  }, [status, slug, dispatch])

  // Handle loading and authentication flow - STRICT AUTHENTICATION REQUIRED
  useEffect(() => {
    if (shouldRedirect) return

    if (status === "loading") {
      setIsLoading(true)
      return
    }

    // ONLY show results to authenticated users
    if (completeResults) {
      if (status === "unauthenticated") {
        // Always show sign-in prompt for unauthenticated users
        setIsLoading(false)
        setShowSignInPrompt(true)
      } else if (status === "authenticated") {
        // Only authenticated users see full results
        setIsLoading(false)
        setShowSignInPrompt(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [status, completeResults, shouldRedirect])

  // Enhanced review mode handlers with proper card mapping
  const handleReviewIncorrect = useCallback(() => {
    console.log("Review incorrect called", {
      reviewCards: processedResults.reviewCards,
      questions: questions.length > 0 ? questions : storeQuestions,
    })

    if (onReview && processedResults.reviewCards.length > 0) {
      // Pass the actual card indices that were marked as incorrect
      onReview(processedResults.reviewCards)
    } else {
      console.warn("No review handler or no incorrect cards to review")
    }
  }, [onReview, processedResults.reviewCards, questions, storeQuestions])

  const handleReviewStillLearningCards = useCallback(() => {
    console.log("Review still learning called", {
      stillLearningCards: processedResults.stillLearningCards,
      questions: questions.length > 0 ? questions : storeQuestions,
    })

    if (onReviewStillLearning && processedResults.stillLearningCards.length > 0) {
      // Pass the actual card indices that were marked as still learning
      onReviewStillLearning(processedResults.stillLearningCards)
    } else {
      console.warn("No review handler or no still learning cards to review")
    }
  }, [onReviewStillLearning, processedResults.stillLearningCards, questions, storeQuestions])
  // --- EARLY RETURN: Show loader during any loading, redirect, or result submission state ---
  const isNoAnswersCompleted = isCompleted && (!answers || answers.length === 0)
  
  // Check if we're on the results page through URL check
  const isOnResultsPage = typeof window !== 'undefined' && 
    (window.location.pathname.includes(`/flashcard/${slug}/results`) || 
     window.location.href.includes(`/flashcard/${slug}/results`));
     
  // Only show loading UI if we're not on results page
  if (
    !isOnResultsPage && 
    (isLoading || status === "loading" || shouldRedirect || shouldRedirectToResults || 
    (!completeResults && (status === "authenticated" || status === "unauthenticated"))) 
  ) {
    if (typeof window !== 'undefined') document.body.classList.add('quiz-loading')
    return <QuizLoader message="Loading results..." subMessage="Please wait while we process your session" />
  }
  if (typeof window !== 'undefined') document.body.classList.remove('quiz-loading')

  // --- HANDLE REDIRECT FLAG RESET WHEN REACHING RESULTS PAGE ---
  useEffect(() => {
    // Reset the redirect flag when the results component mounts
    // This prevents redirect loops and cleans up the state
    if (shouldRedirectToResults) {
      // Always reset the flag to prevent infinite loops
      dispatch(resetRedirectFlag())
      console.log("Reset redirect flag on results page")
    }
    
    // We're on the results page - make sure we have the latest results from localStorage if needed
    if (!completeResults && !restoredResults) {
      try {
        const localData = localStorage.getItem('flashcard_results');
        if (localData) {
          const parsedData = JSON.parse(localData);
          console.log("Found backup results in localStorage");
          setRestoredResults(parsedData.quizResults);
          dispatch(setQuizResults(parsedData.quizResults));
        }
      } catch (e) {
        console.warn("Error parsing localStorage backup results", e);
      }
    }
    
    // Remove any redirect/loading classes when component mounts
    if (typeof window !== 'undefined') {
      document.body.classList.remove('quiz-redirect')
      document.body.classList.remove('quiz-loading')
    }
    
    return () => { 
      if (typeof window !== 'undefined') {
        document.body.classList.remove('quiz-redirect')
        document.body.classList.remove('quiz-loading')
      }
    }
  }, [shouldRedirectToResults, dispatch])  
  // Check for locally stored results first (from our localStorage backup)
  useEffect(() => {
    if (!completeResults && !isLoading) {
      try {
        const localResults = localStorage.getItem('flashcard_results');
        if (localResults) {
          const parsed = JSON.parse(localResults);
          if (parsed.slug === slug && parsed.timestamp && Date.now() - parsed.timestamp < 86400000) { // 24h validity
            console.log("Using locally stored results", parsed);
            dispatch(setQuizResults(parsed.quizResults));
            setIsLoading(false);
          }
        }
      } catch (e) {
        console.warn("Could not load from localStorage", e);
      }
    }
  }, [completeResults, isLoading, slug, dispatch]);
  // BYPASS LOADER: Always try to show results if we have answers data
  const hasAnswerData = isCompleted && (answers?.length > 0 || completeResults);
  
  // Only show loader briefly if we absolutely have no data to show
  if (
    !hasAnswerData && 
    !isOnResultsPage && 
    isLoading && 
    status === "loading" && 
    !completeResults
  ) {
    return <QuizLoader message="Almost done..." subMessage="Preparing your results" displayProgress={99} />
  }  // Generate emergency fallback results - ALWAYS CREATE THEM FOR RELIABILITY
  const emergencyFallbackResults = useMemo(() => {
    // Always return a valid results object, we'll only use it as fallback
    console.log("Creating emergency fallback results - always available");
    
    // Take any available data from state to create the most complete fallback possible
    return {
      quizId: slug,
      slug,
      title: title || "Flashcard Quiz",
      quizType: "flashcard",
      score: 0,
      maxScore: 100,
      percentage: 0,
      correctAnswers: 0,
      stillLearningAnswers: 0,
      incorrectAnswers: 0,
      totalQuestions: questions?.length || storeQuestions?.length || 5,
      totalTime: 0,
      completedAt: new Date().toISOString(),
      answers: [],
      questions: questions?.length > 0 ? questions : storeQuestions || [],
      reviewCards: [],
      stillLearningCards: [],
    };
  }, [slug, title, questions, storeQuestions]);

  // Use the fallback if we have no other results
  const finalResults = completeResults || restoredResults || emergencyFallbackResults;
  
  // ALWAYS show sign-in prompt for unauthenticated users with results
  if (status === "unauthenticated" && finalResults) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="sign-in-prompt"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <SignInPrompt
            onSignIn={handleSignIn}
            onRetake={handleRetake}
            previewData={{
              correctAnswers: processedResults.correctCount,
              totalQuestions: processedResults.totalCount,
              stillLearningAnswers: processedResults.stillLearningCount,
              incorrectAnswers: processedResults.incorrectCount,
            }}
          />
        </motion.div>
      </AnimatePresence>
    )
  }  // ALWAYS show results for authenticated users if we have any source of results
  if (status === "authenticated" && finalResults) {
    console.log("Rendering results for authenticated user", finalResults);
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="results"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <FlashCardResults
            quizId={finalResults.quizId || slug}
            slug={slug}
            title={finalResults.title || title || "Flashcard Quiz"}
            score={finalResults.score || 0}
            totalQuestions={finalResults.totalQuestions || questions?.length || 0}
            correctAnswers={finalResults.correctAnswers || 0}
            stillLearningAnswers={finalResults.stillLearningAnswers || 0}
            incorrectAnswers={finalResults.incorrectAnswers || 0}
            totalTime={finalResults.totalTime || 0}
            onRestart={handleRetake}
            onReview={handleReviewIncorrect}
            onReviewStillLearning={handleReviewStillLearningCards}
            reviewCards={finalResults.reviewCards || []}
            stillLearningCards={finalResults.stillLearningCards || []}
            answers={finalResults.answers || []}
            questions={finalResults.questions || questions || []}
          />
        </motion.div>
      </AnimatePresence>
    )
  }
  // For unauthenticated users without results, redirect to quiz
  if (status === "unauthenticated" && !completeResults && !isLoading) {
    router.replace(`/dashboard/flashcard/${slug}`)
    return <QuizLoader message="Redirecting to quiz..." subMessage="Authentication required" />
  }  // ALWAYS TRY TO SHOW RESULTS: Even with minimal data, try to show something
  // This is our most aggressive fallback to ensure users always see results
  if (isCompleted || answers?.length > 0 || completeResults || finalResults || storedResults || true) {
    console.log("Using ultimate fallback to show results", { storedResults, finalResults });
    
    // Create combined results using all available data sources in order of reliability
    const bestPossibleResults = {
      quizId: completeResults?.quizId || finalResults?.quizId || storedResults?.quizId || quizId || slug,
      slug: slug,
      title: completeResults?.title || finalResults?.title || storedResults?.title || title || "Flashcard Quiz",
      score: completeResults?.score || finalResults?.score || storedResults?.score || 0,
      totalQuestions: completeResults?.totalQuestions || finalResults?.totalQuestions || storedResults?.totalQuestions || questions?.length || 5,
      correctAnswers: completeResults?.correctAnswers || finalResults?.correctAnswers || storedResults?.correctAnswers || 0,
      stillLearningAnswers: completeResults?.stillLearningAnswers || finalResults?.stillLearningAnswers || storedResults?.stillLearningAnswers || 0,
      incorrectAnswers: completeResults?.incorrectAnswers || finalResults?.incorrectAnswers || storedResults?.incorrectAnswers || 0,
      totalTime: completeResults?.totalTime || finalResults?.totalTime || storedResults?.totalTime || 0,
      answers: completeResults?.answers || finalResults?.answers || storedResults?.answers || answers || [],
      questions: completeResults?.questions || finalResults?.questions || storedResults?.questions || questions || storeQuestions || [],
      reviewCards: completeResults?.reviewCards || finalResults?.reviewCards || storedResults?.reviewCards || [],
      stillLearningCards: completeResults?.stillLearningCards || finalResults?.stillLearningCards || storedResults?.stillLearningCards || [],
    };
    
    console.log("Rendering with best possible results:", bestPossibleResults);
    
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="results"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <FlashCardResults
            quizId={bestPossibleResults.quizId}
            slug={slug}
            title={bestPossibleResults.title}
            score={bestPossibleResults.score}
            totalQuestions={bestPossibleResults.totalQuestions}
            correctAnswers={bestPossibleResults.correctAnswers}
            stillLearningAnswers={bestPossibleResults.stillLearningAnswers}
            incorrectAnswers={bestPossibleResults.incorrectAnswers}
            totalTime={bestPossibleResults.totalTime || 0}
            onRestart={() => {
              // First, immediately reset all quiz state in Redux
              dispatch(resetFlashCards())
              
              // Force the reset to take effect before navigation
              setTimeout(() => {
                // Create a new URL with a timestamp to prevent caching
                const resetUrl = `/dashboard/flashcard/${slug}?reset=true&t=${Date.now()}`
                
                // Hard refresh approach for more reliable reset
                window.location.href = resetUrl
              }, 50)
            }}
            onReview={handleReviewIncorrect}
            onReviewStillLearning={handleReviewStillLearningCards}
            reviewCards={bestPossibleResults.reviewCards || []}
            stillLearningCards={bestPossibleResults.stillLearningCards || []}
            answers={bestPossibleResults.answers || []}
            questions={bestPossibleResults.questions || []}
          />
        </motion.div>
      </AnimatePresence>
    )
  }
  // EMERGENCY FALLBACK: If we've reached here, create a simple results screen with retry option
  // This ensures we never get stuck in an endless loading state
  return (
    <div className="container max-w-2xl py-10 text-center">
      <h2 className="text-2xl font-bold mb-4">Quiz Completed</h2>
      <p className="text-muted-foreground mb-6">
        Your quiz has been completed but we couldn't load detailed results. You can try again or start a fresh quiz.
      </p>
      <div className="space-y-4">
        <Button 
          onClick={() => {
            dispatch(resetFlashCards());
            window.location.href = `/dashboard/flashcard/${slug}?reset=true&t=${Date.now()}`;
          }} 
          className="w-full"
        >
          Try Again
        </Button>
        <Button 
          variant="outline"
          onClick={() => {
            window.location.href = "/dashboard/flashcard";
          }}
          className="w-full"
        >
          Browse Topics
        </Button>
      </div>
    </div>
  )
}