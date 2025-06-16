"use client"

import type React from "react"
import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "@/store"
import {
  setQuizResults,
  selectQuizResults,
  selectQuizStatus,
  selectOrGenerateQuizResults,
  selectQuizId,
  hydrateStateFromStorage,
  selectQuestions,
  selectIsQuizComplete,
  saveQuizResultsToDatabase,
  selectIsProcessingResults,
  selectAnswers,
  selectQuizTitle,
  clearQuizState,
} from "@/store/slices/quiz-slice"
import { Skeleton } from "@/components/ui/skeleton"
import { useSessionService } from "@/hooks/useSessionService"
import type { QuizType } from "@/types/quiz"
import { AnimatePresence, motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { NoResults } from "@/components/ui/no-results"
import { RefreshCw } from "lucide-react"
import SignInPrompt from "@/app/auth/signin/components/SignInPrompt"
import { useAuth } from "@/hooks/use-auth"

interface Props {
  slug: string
  quizType: QuizType
  children: (props: { result: any }) => React.ReactNode
}

type ViewState = "loading" | "show_results" | "show_signin" | "no_results" | "error"

export default function GenericQuizResultHandler({ slug, quizType, children }: Props) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()

  // Use pure useAuth hook for more reliable authentication state
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const { isLoading: isSessionLoading, signIn, restoreQuizResults } = useSessionService()
  const isLoadingAuth = isAuthLoading || isSessionLoading

  // Redux selectors
  const quizResults = useSelector(selectQuizResults)
  const generatedResults = useSelector(selectOrGenerateQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const currentSlug = useSelector(selectQuizId)
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const quizTitle = useSelector(selectQuizTitle)
  const isCompleted = useSelector(selectIsQuizComplete)
  const isProcessingResults = useSelector(selectIsProcessingResults)

  // Normalize the slug value once
  const normalizedSlug = useMemo(() => slug, [slug, currentSlug])
  
  // Single view state to prevent flickering with better transitions
  const [viewState, setViewState] = useState<ViewState>("loading")
  const [isInitialized, setIsInitialized] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [hasPendingResults, setHasPendingResults] = useState(false)

  // Enhanced result memoization with better validation and normalization
  const currentResult = useMemo(() => {
    // Track result source for debugging
    let resultSource = '';
    
    // Try from Redux first (most reliable source)
    if (quizResults) {
      resultSource = 'redux';
      // Validate result structure before returning
      if (!quizResults.questionResults && quizResults.questions && Array.isArray(quizResults.questions)) {
        // Try to repair missing questionResults from questions array
        return {
          ...quizResults,
          questionResults: quizResults.questions.map((q: any) => {
            const qid = String(q.id || q.questionId || "");
            // Find matching answer if available
            const answer = quizResults.answers?.find((a: any) => 
              String(a.questionId || a.id || "") === qid
            );
            
            return {
              questionId: qid,
              question: q.question || q.text || "",
              correctAnswer: q.answer || q.correctAnswer || q.correctOptionId || "",
              userAnswer: answer?.userAnswer || answer?.answer || "",
              isCorrect: answer?.isCorrect || false,
              type: q.type || quizType
            };
          })
        };
      }
      return quizResults;
    }
    
    // Then try generated results from current state
    if (generatedResults) {
      resultSource = 'generated';
      return generatedResults;
    }
    
    // Finally check storage with enhanced validation and repair capabilities
    if (typeof window !== 'undefined') {
      try {
        // Check both storage types with proper error handling
        let storedResult = null;
        let storageType = '';
        
        // Try sessionStorage first (safer for guest users)
        try {
          const sessionData = sessionStorage.getItem("pendingQuizResults");
          if (sessionData) {
            const parsed = JSON.parse(sessionData);
            if (parsed.results && parsed.slug === normalizedSlug) {
              storedResult = parsed.results;
              storageType = 'sessionStorage';
              setHasPendingResults(true);
            }
          }
        } catch (e) {
          console.warn("Error checking sessionStorage:", e);
        }
        
        // Fallback to localStorage if needed
        if (!storedResult) {
          try {
            const localData = localStorage.getItem("pendingQuizResults");
            if (localData) {
              const parsed = JSON.parse(localData);
              if (parsed.results && parsed.slug === normalizedSlug) {
                storedResult = parsed.results;
                storageType = 'localStorage';
                setHasPendingResults(true);
              }
            }
          } catch (e) {
            console.warn("Error checking localStorage:", e);
          }
        }

        // If we found a result, validate and repair it if necessary
        if (storedResult) {
          resultSource = storageType;
          
          // Check for missing questionResults and repair if possible
          if (!storedResult.questionResults && storedResult.questions && Array.isArray(storedResult.questions)) {
            console.log('Repairing missing questionResults from storage data');
            
            // Extract relevant data from stored result
            const questions = storedResult.questions;
            const answers = storedResult.answers || [];
            
            // Create questionResults from questions and answers
            storedResult.questionResults = questions.map((question: any) => {
              const qid = String(question.id || question.questionId || "");
              const answer = answers.find((a: any) => 
                String(a.questionId || a.id || "") === qid
              );
              
              return {
                questionId: qid,
                question: question.question || question.text || "",
                correctAnswer: question.answer || question.correctAnswer || question.correctOptionId || "",
                userAnswer: answer?.userAnswer || answer?.answer || answer?.text || "",
                isCorrect: typeof answer?.isCorrect === 'boolean' ? answer.isCorrect : false,
                type: question.type || storedResult.quizType || quizType
              };
            });
          }
          
          // Console debugging
          console.log(`Using quiz result from ${resultSource}`, {
            questionCount: storedResult.questions?.length || 0,
            resultCount: storedResult.questionResults?.length || 0,
            quizType: storedResult.quizType || quizType
          });
          
          return storedResult;
        }
      } catch (e) {
        console.warn("Error retrieving or processing stored results:", e);
      }
    }
    
    // Last resort: try to generate basic results from current state
    if (questions.length > 0 && Object.keys(answers).length > 0) {
      resultSource = 'dynamically_generated';
      
      // Generate simple results inline (without calling generateResultsFromState to avoid dependency cycle)
      let score = 0;
      const questionResults = questions.map((question: any) => {
        const qid = String(question.id || question.questionId || "");
        const answer = answers[qid];
        const isCorrect = answer?.isCorrect === true;
        if (isCorrect) score++;
        
        return {
          questionId: qid,
          question: question.question || question.text || "",
          correctAnswer: question.answer || question.correctAnswer || "",
          userAnswer: answer?.userAnswer || answer?.text || answer?.answer || "",
          isCorrect: isCorrect,
          type: question.type || quizType
        };
      });
      
      return {
        quizId: normalizedSlug,
        slug: normalizedSlug,
        title: quizTitle || `${quizType.toUpperCase()} Quiz`,
        quizType,
        score,
        maxScore: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        completedAt: new Date().toISOString(),
        questionResults,
        questions,
        answers: Object.values(answers)
      };
    }
    
    // Nothing found
    return null;
  }, [quizResults, generatedResults, normalizedSlug, questions, answers, quizType, quizTitle]);

  // Handle retake action - improved with better state cleanup
  const handleRetake = useCallback(() => {
    // First save state to avoid flashing no-results screen
    setViewState("loading");
    
    // Then clear state and redirect
    dispatch(clearQuizState());
    
    // Small delay to ensure UI updates before navigation
    setTimeout(() => {
      router.push(`/dashboard/${quizType}/${normalizedSlug}`);
    }, 50);
  }, [dispatch, router, quizType, normalizedSlug]);

  // Enhanced sign in action with robust state preservation
  const handleSignIn = useCallback(async () => {
    if (currentResult) {
      try {
        // Store comprehensive data in both storage types for redundancy
        const storeData = {
          slug: normalizedSlug,
          quizType,
          results: currentResult,
          timestamp: Date.now(),
          questions: questions,
          answers: answers,
          isCompleted: true,
          title: currentResult.title || quizTitle || `${quizType.toUpperCase()} Quiz`,
        }

        // First set a timestamp to mark auth flow start and prevent result clearing
        try {
          localStorage.setItem("quizAuthTimestamp", Date.now().toString());
        } catch (e) {
          console.warn("Failed to store auth timestamp:", e);
        }

        // Use try/catch for each storage to handle quota issues
        try {
          localStorage.setItem("pendingQuizResults", JSON.stringify(storeData));
        } catch (e) {
          console.warn("Failed to store in localStorage:", e);
        }
        
        try {
          sessionStorage.setItem("pendingQuizResults", JSON.stringify(storeData));
        } catch (e) {
          console.warn("Failed to store in sessionStorage:", e);
        }

        // Also back up answers separately for reliability
        try {
          localStorage.setItem("quiz_answers_backup", JSON.stringify(answers));
        } catch (e) {
          console.warn("Failed to back up answers:", e);
        }
      } catch (error) {
        console.error("Failed to store quiz results before auth:", error);
      }
    }

    // Setup return path to ensure we come back to results
    await signIn({
      returnPath: `/dashboard/${quizType}/${normalizedSlug}/results`,
      quizState: { slug: normalizedSlug, results: currentResult },
    });
  }, [currentResult, normalizedSlug, quizType, questions, answers, quizTitle, signIn]);

  // Generate results from state if needed - with improved property mapping
  const generateResultsFromState = useCallback(() => {
    if (!questions.length || !Object.keys(answers).length) {
      return null;
    }

    let score = 0;
    // Enhanced normalization with thorough property extraction
    const normalizedQuestions = questions.map((question: any) => {
      // Normalize question ID to string for reliable matching
      const qid = String(question.id);
      
      // Robust text extraction for each question
      const questionText = question.question || question.text || 
                          (typeof question.prompt === 'string' ? question.prompt : "") || "";
      
      // Enhanced correct answer extraction with better fallbacks
      const correctOptionId = question.correctOptionId || question.correctAnswerId || "";
      const correctAnswer = question.answer || question.correctAnswer || correctOptionId || "";
      
      // Ensure we have all needed metadata
      return {
        id: qid,
        questionId: qid, // Add questionId as well for easier matching
        text: questionText,
        question: questionText, // Keep both for compatibility
        correctAnswer: correctAnswer,
        correctOptionId: correctOptionId, // Store separately for MCQ matching
        type: question.type || quizType,
        options: question.options || [] // Store options for MCQ display
      };
    });
    
    // Map answers to questions with improved extraction logic
    const questionResults = normalizedQuestions.map((question: any) => {
      const qid = question.id;
      const answer = answers[qid];

      // Default structure for unanswered questions
      if (!answer) {
        return {
          questionId: qid,
          question: question.question, // Use the normalized question text
          correctAnswer: question.correctAnswer,
          userAnswer: "",
          isCorrect: false,
          type: question.type
        };
      }
      
      // Extract answer data with enhanced fallback paths
      let isCorrect = answer.isCorrect === true; // Default to provided value
      let userAnswer = "";
      
      // Handle each quiz type with improved extraction logic
      switch (question.type) {
        case "mcq": {
          // Get the selected option ID with enhanced fallbacks
          const rawAnswer = answer.selectedOptionId || answer.selectedOption || answer.userAnswer || answer.answer || "";
          const selectedOptionId = String(rawAnswer);

          // Try to extract full option text for better display
          if (question.options && Array.isArray(question.options)) {
            // Support both object options and string options
            const selectedOption = question.options.find((opt: any) => {
              const optId = typeof opt === 'object' ? String(opt.id) : String(opt);
              return optId === selectedOptionId || String(opt) === selectedOptionId;
            });
            
            if (selectedOption) {
              userAnswer = typeof selectedOption === 'object' ? 
                (selectedOption.text || selectedOption.label || String(selectedOption.id)) : 
                String(selectedOption);
            } else {
              // If we can't find the option, use the raw answer
              userAnswer = rawAnswer;
            }
          } else {
            userAnswer = rawAnswer;
          }
          
          // Calculate correctness if not explicitly provided
          if (typeof answer.isCorrect !== 'boolean') {
            const correct = question.correctOptionId || question.correctAnswer || question.answer;
            isCorrect = selectedOptionId === String(correct);
          }
          break;
        }
        
        case "code": {
          userAnswer = answer.selectedOptionId || answer.userAnswer || answer.answer || answer.code || "";
          break;
        }
        
        case "blanks": {
          // For fill-in-the-blanks quizzes
          userAnswer = answer.userAnswer || answer.text || answer.value || "";
          
          // Also check filledBlanks object which is common in this quiz type
          if (!userAnswer && answer.filledBlanks) {
            userAnswer = answer.filledBlanks[qid] || answer.filledBlanks[question.id] || "";
          }
          
          // If correctness isn't explicit, compare with correct answer
          if (typeof answer.isCorrect !== 'boolean') {
            isCorrect = userAnswer.trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
          }
          break;
        }
        
        case "openended": {
          userAnswer = answer.text || answer.userAnswer || answer.answer || "";
          break;
        }
        
        case "flashcard": {
          userAnswer = answer.userAnswer || answer.text || answer.response || answer.answer || "";
          
          // Flashcards often store the answer type directly
          if (answer.answer === "correct") {
            isCorrect = true;
          } else if (answer.answer === "incorrect") {
            isCorrect = false;
          }
          break;
        }
        
        default: {
          // Generic fallback
          userAnswer = answer.userAnswer || answer.text || answer.answer || answer.value || "";
        }
      }

      // Increment score if answer is correct
      if (isCorrect) score++;

      // Return a comprehensive result object
      return {
        questionId: qid,
        question: question.question, // Use normalized question text
        correctAnswer: question.correctAnswer,
        userAnswer: userAnswer,
        isCorrect: isCorrect,
        type: question.type,
        similarity: answer.similarity,
        timeSpent: answer.timeSpent || answer.time || 0
      };
    });

    const percentage = Math.round((score / questions.length) * 100);

    // Create results object
    const results = {
      quizId: normalizedSlug,
      slug: normalizedSlug,
      title: quizTitle || `${quizType.toUpperCase()} Quiz`,
      quizType,
      score,
      maxScore: questions.length,
      percentage,
      completedAt: new Date().toISOString(),
      questionResults,
      answers: Object.values(answers),
      questions: normalizedQuestions
    };

    // Store the generated results
    dispatch(setQuizResults(results));
    return results;
  }, [questions, answers, quizType, normalizedSlug, quizTitle, dispatch]);
  
  // Initialize and restore state - improved to check storage first
  useEffect(() => {
    if (isInitialized) return;
    
    // First try to restore results from storage directly for faster startup
    if (!isLoadingAuth && !isHydrated) {
      // Try hydrating from storage using the existing action
      dispatch(hydrateStateFromStorage());
      setIsHydrated(true);
      
      // Then try restoring specific quiz results if available
      if (!quizResults && !generatedResults) {
        restoreQuizResults();
      }
    }
    
    setIsInitialized(true);
  }, [isLoadingAuth, dispatch, isInitialized, isHydrated, quizResults, generatedResults, restoreQuizResults]);
  
  // Determine view state based on current conditions - enhanced with storage checks and prioritization
  useEffect(() => {
    // First priority: During active auth/loading and we have results - keep showing results
    if (isLoadingAuth && currentResult) {
      setViewState(isAuthenticated ? "show_results" : "show_signin");
      return;
    }

    // Second priority: During loading with no ready results, show loading state
    if (isLoadingAuth && !currentResult) {
      setViewState("loading");
      return;
    }

    // Third priority: If we have results ready to show
    if (currentResult) {
      // Always show results if authenticated, otherwise prompt for sign in
      if (isAuthenticated) {
        setViewState("show_results");
      } else {
        setViewState("show_signin");
      }
      return;
    }

    // Fourth priority: If results are being processed, show loading
    if (isProcessingResults) {
      setViewState("loading");
      return;
    }

    // Fifth priority: Try to generate results from state if possible
    if (questions.length > 0 && Object.keys(answers).length > 0) {
      // First try to generate results from available state
      const generated = generateResultsFromState();
      if (generated) {
        setViewState(isAuthenticated ? "show_results" : "show_signin");
        return;
      }
    }
    
    // Check if we just reloaded but have pending results in storage
    if ((isCompleted || hasPendingResults) && !isProcessingResults) {
      if (isAuthenticated) {
        // If authenticated but no results in state, try restoring once more
        restoreQuizResults();
        // Show loading while we restore
        setViewState("loading");
        return;
      } else {
        // If not authenticated but we have pending results, show sign in
        setViewState("show_signin");
        return;
      }
    }

    // Last resort: When all else fails, show no results
    setViewState("no_results");
  }, [
    isInitialized, 
    isLoadingAuth, 
    currentResult, 
    isAuthenticated, 
    isProcessingResults, 
    isCompleted,
    hasPendingResults,
    questions.length, 
    answers, 
    generateResultsFromState,
    restoreQuizResults
  ]);

  // Improved loading state with better layout preserving skeleton
  if (viewState === "loading") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6 max-w-lg mx-auto mt-6 px-4"
      >
        <div className="flex flex-col items-center justify-center mb-4">
          <div className="p-3 bg-muted/30 rounded-full mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <Skeleton className="h-7 w-48 mx-auto mb-2" />
          <Skeleton className="h-5 w-36 mx-auto" />
        </div>
        
        {/* Score indicators */}
        <div className="bg-muted/20 p-6 rounded-lg mt-4 mb-4">
          <div className="flex justify-center mb-4">
            <Skeleton className="h-10 w-20 rounded-md" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </div>
        
        {/* Question previews */}
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <div className="flex justify-center mt-4">
            <Skeleton className="h-10 w-40 rounded-md" />
          </div>
        </div>
      </motion.div>
    );
  }

  // Render based on view state - improved transitions
  return (
    <AnimatePresence mode="wait">
      {viewState === "show_signin" && !isLoadingAuth && !isAuthenticated && (
        <motion.div
          key="signin"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SignInPrompt
            onSignIn={handleSignIn}
            onRetake={handleRetake}
            quizType={quizType}
            previewData={
              currentResult
                ? {
                    percentage: currentResult.percentage || 0,
                    score: currentResult.score || currentResult.userScore || 0,
                    maxScore: currentResult.maxScore || 0,
                  }
                : undefined
            }
          />
        </motion.div>
      )}

      {viewState === "show_results" && currentResult && (
        <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          {children({ result: currentResult })}
        </motion.div>
      )}

      {viewState === "no_results" && (
        <motion.div
          key="no-results"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <NoResults
            variant="quiz"            title="Quiz Results Not Found" 
            description="We couldn't find your quiz results. This usually happens when you haven't completed this quiz yet or your session data was cleared."
            action={{
              label: "Take Quiz Again",
              onClick: handleRetake,
              icon: <RefreshCw className="h-4 w-4" />,
              variant: "default"
            }}
            secondaryAction={{
              label: "Go to Dashboard",
              onClick: () => router.push("/dashboard"),
              icon: null,
              variant: "outline"
            }}
            minimal={false}
            className="max-w-lg mx-auto"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Simplified QuizResultHandler for handling quiz completion and saving
export function QuizResultHandler({
  slug,
  quizType,
  onComplete,
}: {
  slug: string
  quizType: string
  onComplete?: (results: any) => void
}) {
  // Use both hooks for more complete state management
  const { data: session, status: authStatus } = useSession()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const dispatch = useDispatch()
  const results = useSelector(selectQuizResults)
  const isCompleted = useSelector(selectIsQuizComplete)
  const isProcessing = useSelector(selectIsProcessingResults)

  // Track state to prevent loops and improve performance
  const [hasRedirected, setHasRedirected] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)
  const [saveAttempted, setSaveAttempted] = useState(false)
  
  // Before redirecting, store results in storage for unauthenticated users
  useEffect(() => {
    if (isCompleted && results && !isAuthenticated && !hasRedirected) {
      try {
        // Store for access after authentication
        const storeData = {
          slug,
          quizType,
          results,
          timestamp: Date.now(),
          isCompleted: true,
        };
        
        // Try to store in both storage mechanisms for redundancy
        try {
          sessionStorage.setItem("pendingQuizResults", JSON.stringify(storeData));
        } catch (e) {
          console.warn("Failed to store in sessionStorage:", e);
        }
        
        try {
          localStorage.setItem("pendingQuizResults", JSON.stringify(storeData));
        } catch (e) {
          console.warn("Failed to store in localStorage:", e);
        }
      } catch (error) {
        console.error("Error storing results for unauthenticated user:", error);
      }
    }
  }, [isCompleted, results, isAuthenticated, slug, quizType, hasRedirected]);

  // Handle quiz completion and result saving - with improved error handling
  useEffect(() => {
    // Only proceed if we have results, we're authenticated, and haven't saved yet
    if (isCompleted && results && isAuthenticated && !hasSaved && !saveAttempted) {
      setHasSaved(false);
      setSaveAttempted(true);

      dispatch(saveQuizResultsToDatabase({ slug, quizType }) as any)
        .unwrap()
        .then(() => {
          setHasSaved(true);
          
          if (onComplete) {
            onComplete(results);
          }
        })
        .catch((error: any) => {
          console.error("Failed to save quiz results:", error);
          // Still mark as saved to prevent infinite retries
          setHasSaved(true);
          
          // Still call onComplete despite error - user should see results
          if (onComplete) {
            onComplete(results);
          }
        });
    }
  }, [isCompleted, results, isAuthenticated, slug, quizType, dispatch, onComplete, hasSaved, saveAttempted]);

  // Redirect to results page if quiz is completed - with improved handling and loading state
  useEffect(() => {
    if (isCompleted && results && !hasRedirected && !isProcessing) {
      const pathname = window.location.pathname;
      if (!pathname.includes("/results")) {
        setHasRedirected(true);
        router.push(`/dashboard/${quizType}/${slug}/results`);
      }
    }
  }, [isCompleted, results, router, quizType, slug, hasRedirected, isProcessing]);

  return null;
}
