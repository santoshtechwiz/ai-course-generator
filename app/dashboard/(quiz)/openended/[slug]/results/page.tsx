"use client"

import { Suspense, use, useCallback, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { signIn, useSession } from "next-auth/react"
import type { AppDispatch } from "@/store"
import { Button } from "@/components/ui/button"
import { selectIsAuthenticated } from "@/store/slices/authSlice"
import { Spinner } from "@/hooks/spinner"
import { Card, CardContent } from "@/components/ui/card"
import {
  selectQuizResults,
  selectQuizStatus,
  selectQuizError,
  selectQuestions,
  selectAnswers,
  selectQuizTitle,
  selectOrGenerateQuizResults,
  resetQuiz
} from "@/store/slices/quizSlice"
import { QuizLoadingSteps } from "../../../components/QuizLoadingSteps"
import { NonAuthenticatedUserSignInPrompt } from "../../../components/NonAuthenticatedUserSignInPrompt"
import QuizResult from "../../../components/QuizResult"
import { useSessionService } from "@/hooks/useSessionService"
import { RefreshCw, Check } from "lucide-react"


interface ResultsPageProps {
  params: Promise<{ slug: string }> | { slug: string }
}

export default function OpenEndedResultsPage({ params }: ResultsPageProps) {
  const slug = params instanceof Promise ? use(params).slug : params.slug
  const searchParams = useSearchParams()
  const fromAuth = searchParams.get("fromAuth") === 'true'

  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { saveAuthRedirectState, restoreAuthRedirectState, clearQuizResults } = useSessionService()
  const { status: authStatus, data: sessionData } = useSession()

  // Redux state
  const quizResults = useSelector(selectQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const title = useSelector(selectQuizTitle)
  const generatedResults = useSelector(selectOrGenerateQuizResults)

  // Debug logging
  useEffect(() => {
    console.log("OpenEnded Results page mount - Auth status:", authStatus);
    console.log("OpenEnded Results data check:", { 
      hasQuizResults: !!quizResults, 
      hasGeneratedResults: !!generatedResults,
      answersCount: Object.keys(answers).length,
      questionsCount: questions.length,
      fromAuth
    });
  }, [authStatus, quizResults, generatedResults, answers, questions, fromAuth]);

  // Validate slug and redirect if invalid
  useEffect(() => {
    if (!slug || typeof slug !== "string") {
      console.error("Invalid slug provided to results page")
      router.push("/dashboard/quizzes")
      return
    }
  }, [slug, router])

  // Check for auth return after sign-in
  useEffect(() => {
    if (authStatus === "authenticated" && (fromAuth || sessionStorage.getItem(`${slug}_auth_for_results`) === 'true')) {
      console.log("Authentication detected, restoring openended quiz state");
      // Restore any saved quiz state from auth redirect
      const restored = restoreAuthRedirectState()
      
      // Set a flag to avoid immediate redirect to quiz
      if (restored) {
        sessionStorage.setItem(`${slug}_auth_restored`, 'true');
      }

      // Clean up the fromAuth flag
      if (fromAuth) {
        sessionStorage.removeItem(`${slug}_auth_for_results`);
      }
    }
  }, [authStatus, sessionData, restoreAuthRedirectState, slug, fromAuth]);

  // Clean up function to reset quiz state when navigating away
  useEffect(() => {
    return () => {
      // Only clear quiz results if we're not redirecting for authentication
      if (typeof window !== "undefined" && 
          !sessionStorage.getItem(`${slug}_auth_for_results`) && 
          !sessionStorage.getItem("pendingQuiz")) {
        clearQuizResults();
        console.log("Cleaning up openended quiz results on unmount");
      }
    };
  }, [slug, clearQuizResults]);

  // Redirect to quiz if no results available - with debounce
  useEffect(() => {
    // Skip redirect if we've just restored after auth
    if (typeof window !== "undefined" && sessionStorage.getItem(`${slug}_auth_restored`) === 'true') {
      console.log("Skipping redirect check because auth was just restored");
      sessionStorage.removeItem(`${slug}_auth_restored`);
      return;
    }
    
    const redirectTimeout = setTimeout(() => {
      const hasResults = quizResults || generatedResults;
      const hasAnswers = answers && Object.keys(answers).length > 0;
      
      console.log("Checking if redirect needed:", { hasResults, hasAnswers });
      
      if (!hasResults && !hasAnswers) {
        console.log("No results or answers found, redirecting to openended quiz");
        router.push(`/dashboard/openended/${slug}`);
      }
    }, 1000); // Give time for state to be restored
    
    return () => clearTimeout(redirectTimeout);
  }, [generatedResults, quizResults, answers, router, slug]);

  const handleRetake = useCallback(() => {
    // Clear results state before redirecting
    clearQuizResults();
    router.push(`/dashboard/openended/${slug}?reset=true`);
  }, [router, slug, clearQuizResults]);

  const handleSignIn = useCallback(async () => {
    try {
      // Store both generated and actual results for safety
      const resultsToSave = quizResults || generatedResults || {
        slug,
        title: title || `Open-Ended Quiz - ${slug}`,
        questions: questions,
        // Generate question results from answers - open-ended questions are treated as "correct" if answered
        questionResults: Object.entries(answers).map(([questionId, answerData]) => {
          const question = questions.find(q => q.id === questionId);
          const userAnswer = answerData.text || 'No answer';
          
          // For open-ended quizzes, we simply check if an answer was provided
          const isCorrect = !!answerData.text && answerData.text.trim().length > 0;
          
          return {
            questionId,
            userAnswer,
            correctAnswer: question?.modelAnswer || 'Open-ended question',
            isCorrect
          };
        })
      };
      
      // Calculate total score (for open-ended, a non-empty answer is considered correct)
      if (resultsToSave.questionResults && !resultsToSave.score) {
        const score = resultsToSave.questionResults.filter(q => q.isCorrect).length;
        resultsToSave.score = score;
        resultsToSave.maxScore = questions.length;
        resultsToSave.percentage = Math.round((score / questions.length) * 100);
      }
      
      console.log("Saving openended results before authentication:", resultsToSave);
      
      // Store comprehensive quiz state for when user returns after authentication
      saveAuthRedirectState({
        returnPath: `/dashboard/openended/${slug}/results?fromAuth=true`,
        quizState: {
          slug,
          quizData: {
            title: title,
            questions: questions,
            type: "openended"
          },
          currentState: {
            answers,
            showResults: true,
            results: resultsToSave,
          },
        },
      });
      
      await signIn(undefined, { callbackUrl: `/dashboard/openended/${slug}/results?fromAuth=true` });
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  }, [saveAuthRedirectState, slug, title, questions, answers, generatedResults, quizResults]);

  // Loading states
  if (authStatus === "loading" || quizStatus === "loading") {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Checking authentication", status: authStatus === "loading" ? "loading" : "completed" },
          { label: "Loading quiz data", status: quizStatus === "loading" ? "loading" : "completed" },
        ]}
      />
    );
  }

  // Show results from Redux state
  const resultData = useMemo(() => {
    // Start with existing quiz results or generated results
    const baseData = quizResults || generatedResults;
    
    // If we have no base data but have answers, create a minimal result object
    if (!baseData && Object.keys(answers).length > 0) {
      console.log("Creating minimal result object from openended answers");
      
      // Calculate score - for open-ended questions, having a non-empty answer counts as correct
      let score = 0;
      const questionResults = Object.entries(answers).map(([questionId, answerData]) => {
        const question = questions.find(q => q.id === questionId);
        const userAnswer = answerData.text || 'No answer';
        
        // For open-ended quizzes, we simply check if an answer was provided
        const isCorrect = !!answerData.text && answerData.text.trim().length > 0;
        if (isCorrect) score++;
        
        return {
          questionId,
          userAnswer,
          correctAnswer: question?.modelAnswer || 'Open-ended question',
          isCorrect,
          feedback: question?.feedback || 'Thank you for your thoughtful answer.'
        };
      });
      
      return {
        slug,
        title: title || `Open-Ended Quiz - ${slug}`,
        questions,
        questionResults,
        score,
        maxScore: questions.length,
        percentage: Math.round((score / questions.length) * 100)
      };
    }
    
    return baseData;
  }, [quizResults, generatedResults, answers, slug, title, questions]);

  // No results case - redirect to quiz
  if (!resultData && Object.keys(answers).length === 0) {
    console.log("No openended result data available, showing loading...");
    return (
      <div className="container max-w-4xl py-10 text-center">
        <Card>
          <CardContent className="p-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">No Results Available</h2>
            <p className="text-muted-foreground">Taking you to the quiz page so you can take the quiz...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For unauthenticated users, show the sign-in prompt with limited results
  if (!isAuthenticated) {
    // If we have results, show a teaser of results with limited information
    if (resultData && Object.keys(resultData).length > 0) {
      console.log("Showing limited openended results for unauthenticated user");
      
      // Create a limited version of results that hides specific answers and feedback
      const limitedResultData = {
        ...resultData,
        // Remove detailed question data
        questions: undefined,
        // Only show overall stats and limited question info - hide detailed feedback
        questionResults: resultData.questionResults?.map(q => ({
          ...q,
          correctAnswer: undefined, // Hide model answers
          isCorrect: undefined,     // Hide which ones were correct/incorrect
          feedback: undefined,      // Hide feedback
        })),
        // Keep core stats
        score: resultData.score,
        maxScore: resultData.maxScore,
        percentage: resultData.percentage
      };

      return (
        <div className="container max-w-4xl py-6">
          <Card className="mb-6 bg-gradient-to-b from-background to-primary/10 border-primary/20">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold mb-3">Your Completion Rate: {resultData.percentage}%</h2>
              <p className="text-muted-foreground mb-6">
                Sign in to see your detailed responses, model answers, and personalized feedback.
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={handleSignIn} size="lg">
                  Sign In to See Full Results
                </Button>
                <Button variant="outline" onClick={handleRetake} size="lg">
                  Retake Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="bg-muted/30 p-6 rounded-lg border border-muted mb-6">
                <h3 className="text-lg font-medium mb-2 text-center">Why Sign In?</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>View expert model answers to compare with your responses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Get personalized feedback on your answers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Track your progress over time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Access more learning resources</span>
                  </li>
                </ul>
              </div>
              
              {/* Show only limited result summary, not detailed responses */}
              <div className="opacity-50 pointer-events-none select-none filter blur-sm">
                <QuizResult result={limitedResultData} onRetake={handleRetake} quizType="openended" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-primary/90 text-white px-6 py-3 rounded-lg shadow-lg">
                    Sign in to view detailed results
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // If we don't have proper results, show sign-in prompt
    console.log("Showing sign-in prompt for unauthenticated user (no openended results available)");
    return (
      <div className="container max-w-md py-10">
        <NonAuthenticatedUserSignInPrompt
          onSignIn={handleSignIn}
          title="Sign In to View Results"
          message="Please sign in to view your detailed quiz results and track your progress over time."
          fallbackAction={{
            label: "Take Quiz Instead",
            onClick: () => router.push(`/dashboard/openended/${slug}`),
            variant: "outline",
          }}
        />
      </div>
    );
  }
  
  // For authenticated users, show full results
  console.log("Showing full openended results for authenticated user");
  return (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <QuizResult result={resultData} onRetake={handleRetake} quizType="openended" />
        </CardContent>
      </Card>
    </div>
  );
}

