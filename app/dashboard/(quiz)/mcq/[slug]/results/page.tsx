'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { signIn, useSession } from 'next-auth/react'
import type { AppDispatch, RootState } from '@/store'
import {
  selectQuizResults,
  selectQuizStatus,
  selectQuizError,
  checkAuthAndLoadResults,
  rehydrateQuiz,
  resetPendingQuiz,
  selectQuestions,
  selectAnswers,
  setQuizResults,
} from '@/store/slices/quizSlice'
import { selectIsAuthenticated } from '@/store/slices/authSlice'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { NonAuthenticatedUserSignInPrompt } from '../../../components/NonAuthenticatedUserSignInPrompt'
import { QuizLoadingSteps } from '../../../components/QuizLoadingSteps'
import McqQuizResult from '../../components/McqQuizResult'
import { useSessionService } from '@/hooks/useSessionService'
import { getQuizResults, saveQuizResults } from '@/store/utils/session'

interface ResultsPageProps {
  params: Promise<{ slug: string }>
}

export default function McqResultsPage({ params }: ResultsPageProps) {
  const { slug } = use(params)
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const sessionService = useSessionService()
  const { status: authStatus } = useSession()
  
  // Always select all necessary state at the top level
  const quizResults = useSelector(selectQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const pendingQuiz = useSelector((state: RootState) => state.quiz.pendingQuiz)
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const quizId = useSelector((state: RootState) => state.quiz.quizId) // Add this selector

  const [rehydrated, setRehydrated] = useState(false)
  const [restoredOnce, setRestoredOnce] = useState(false)

  // Extract the rehydration logic to a memoized callback to maintain dependency stability
  const rehydrateFromPendingQuiz = useCallback(() => {
    if (!isAuthenticated || restoredOnce) return;

    let restored = pendingQuiz;
    if (!restored && typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('pendingQuiz');
        if (stored) {
          restored = JSON.parse(stored);
        }
      } catch (e) {
        // ignore
      }
    }

    if (restored?.currentState?.showResults) {
      dispatch(rehydrateQuiz(restored));
      dispatch(resetPendingQuiz());
      setRehydrated(true);
      setRestoredOnce(true);
    } else {
      setRestoredOnce(true);
    }
  }, [dispatch, isAuthenticated, pendingQuiz, restoredOnce]);

  // Use the callback in the effect with stable dependencies
  useEffect(() => {
    rehydrateFromPendingQuiz();
  }, [rehydrateFromPendingQuiz]);

  // Extract compute results logic to useCallback - don't use hooks inside
  const computeResultsFromAnswers = useCallback(() => {
    if (!questions.length || !Object.keys(answers).length) {
      // Check if we have results in session storage first
      if (typeof window !== 'undefined') {
        try {
          const storedResults = sessionStorage.getItem(`quiz_results_${slug}`);
          if (storedResults) {
            return JSON.parse(storedResults);
          }
          
          // Also try with quizId if different from slug
          if (quizId && quizId !== slug) {
            const alternateResults = sessionStorage.getItem(`quiz_results_${quizId}`);
            if (alternateResults) {
              return JSON.parse(alternateResults);
            }
          }
        } catch (e) {
          console.error("Failed to retrieve stored results:", e);
        }
      }
      return null;
    }
    
    let score = 0;
    const questionResults = questions.map((question) => {
      const answer = answers[String(question.id)];
      const isCorrect = answer?.isCorrect === true;
      if (isCorrect) score++;
      return {
        questionId: question.id,
        isCorrect,
        userAnswer: answer?.selectedOptionId || null,
        correctAnswer: question.correctOptionId || question.answer,
        question: question.question || question.text
      };
    });

    const results = {
      quizId: slug,
      slug,
      title: questions[0]?.title || "Quiz Results",
      score,
      maxScore: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      completedAt: new Date().toISOString(),
      questions,
      answers: Object.values(answers),
      questionResults,
    };
    
    return results;
  }, [questions, answers, slug, quizId]); // Include quizId in dependencies

  // If there's a pendingQuiz with showResults, try to get results from storage
  useEffect(() => {
    if (
      pendingQuiz?.currentState?.showResults &&
      !quizResults &&
      (!questions.length || !Object.keys(answers).length)
    ) {
      // Try to find results in storage
      if (typeof window !== 'undefined') {
        try {
          // Try with slug
          const storedResults = sessionStorage.getItem(`quiz_results_${slug}`);
          if (storedResults) {
            const parsedResults = JSON.parse(storedResults);
            dispatch(setQuizResults(parsedResults));
            return;
          }
          
          // Also try with pendingQuiz slug
          const pendingSlug = pendingQuiz.slug;
          if (pendingSlug && pendingSlug !== slug) {
            const alternateResults = sessionStorage.getItem(`quiz_results_${pendingSlug}`);
            if (alternateResults) {
              const parsedResults = JSON.parse(alternateResults);
              dispatch(setQuizResults(parsedResults));
            }
          }
        } catch (e) {
          console.error("Failed to retrieve stored results:", e);
        }
      }
    }
  }, [pendingQuiz, quizResults, questions, answers, slug, dispatch]);

  // If there's a pendingQuiz with showResults but no results or answers, try harder to recover or generate them
  useEffect(() => {
    if (
      pendingQuiz?.currentState?.showResults &&
      !quizResults &&
      ((!questions.length || !Object.keys(answers).length) && pendingQuiz?.quizData?.questions?.length)
    ) {
      console.log("Attempting to recover quiz results from pendingQuiz data");
      
      try {
        // Try to generate results from the pending quiz data
        const pendingQuestions = pendingQuiz.quizData.questions || [];
        
        if (pendingQuestions.length > 0) {
          // Generate default answers for questions
          const generatedAnswers = {};
          const questionResults = pendingQuestions.map((question, index) => {
            return {
              questionId: question.id,
              isCorrect: false,
              userAnswer: null,
              correctAnswer: question.correctOptionId || question.answer,
              skipped: true
            };
          });
          
          const generatedResults = {
            quizId: slug,
            slug,
            title: pendingQuiz.quizData.title || "Quiz Results",
            score: 0,
            maxScore: pendingQuestions.length,
            percentage: 0,
            completedAt: new Date().toISOString(),
            questions: pendingQuestions,
            answers: [],
            questionResults,
          };
          
          // Save the generated results
          saveQuizResults(slug, generatedResults);
          dispatch(setQuizResults(generatedResults));
        }
      } catch (e) {
        console.error("Failed to generate results from pending quiz:", e);
      }
    }
  }, [pendingQuiz, quizResults, questions, answers, slug, dispatch]);
  
  // Add special handling for the "Results not found" error with available quiz data
  useEffect(() => {
    if (
      quizStatus === 'failed' && 
      error === "Results not found. Please take the quiz again." &&
      pendingQuiz?.quizData?.questions?.length
    ) {
      // Instead of showing error, rehydrate quiz with the pending data
      dispatch(rehydrateQuiz({
        slug,
        quizData: pendingQuiz.quizData,
        currentState: {
          ...pendingQuiz.currentState,
          showResults: true
        }
      }));
    }
  }, [quizStatus, error, pendingQuiz, slug, dispatch]);

  // Always recompute results after rehydration if authenticated
  useEffect(() => {
    // Skip if loading, already have results, or not authenticated
    if (
      authStatus === 'loading' || 
      quizResults !== null || 
      !isAuthenticated || 
      !questions.length || 
      !Object.keys(answers).length
    ) {
      return;
    }
    
    const results = computeResultsFromAnswers();
    if (results) {
      // Save results - ensure slug is used, not numeric ID
      saveQuizResults(slug, results);
      dispatch(setQuizResults(results));
    } else {
      // No results could be computed, try API
      dispatch(checkAuthAndLoadResults({ slug, authStatus }))
        .unwrap()
        .catch(() => {
          const fallbackResults = computeResultsFromAnswers();
          if (fallbackResults) {
            saveQuizResults(slug, fallbackResults);
            dispatch(setQuizResults(fallbackResults));
          }
        });
    }
  }, [
    authStatus,
    isAuthenticated,
    quizResults,
    questions,
    answers,
    slug,
    dispatch,
    computeResultsFromAnswers
  ]);

  // If we have no results and no answers and we're authenticated, redirect to the correct slug URL
  useEffect(() => {
    if (
      isAuthenticated && 
      !quizResults && 
      questions.length === 0 && 
      Object.keys(answers).length === 0 && 
      quizStatus !== 'loading' && 
      authStatus !== 'loading'
    ) {
      // Use slug in the URL, not numeric ID
      const redirectTimer = setTimeout(() => {
        // Check if slug is numeric and there's a stored quiz with a proper slug
        if (/^\d+$/.test(slug) && typeof window !== 'undefined') {
          try {
            // Check if we have a pending quiz with a different slug
            const pendingQuizStr = sessionStorage.getItem('pendingQuiz');
            if (pendingQuizStr) {
              const parsedQuiz = JSON.parse(pendingQuizStr);
              if (parsedQuiz.slug && parsedQuiz.slug !== slug) {
                console.log(`Redirecting from numeric ID ${slug} to proper slug ${parsedQuiz.slug}`);
                router.push(`/dashboard/mcq/${parsedQuiz.slug}`);
                return;
              }
            }
          } catch (e) {
            // Ignore errors and continue with default redirect
          }
        }
        
        router.push(`/dashboard/mcq/${slug}`);
      }, 500);
      
      // Cleanup
      return () => clearTimeout(redirectTimer);
    }
  }, [isAuthenticated, quizResults, questions.length, answers, quizStatus, authStatus, router, slug]);
  
  // If we have results, show them immediately
  if (quizResults) {
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
    // Try to get any existing quiz data and results from storage
    let existingQuizData = null;
    let existingResults = null;
    
    if (typeof window !== 'undefined') {
      try {
        // Get quiz data
        const storedQuiz = sessionStorage.getItem('pendingQuiz');
        if (storedQuiz) {
          const parsed = JSON.parse(storedQuiz);
          existingQuizData = parsed.quizData;
          
          // Also check for results in the stored quiz
          if (parsed.currentState?.results) {
            existingResults = parsed.currentState.results;
          }
        }
        
        // If no results in pending quiz, try to get from session storage directly
        if (!existingResults) {
          const storedResults = sessionStorage.getItem(`quiz_results_${slug}`);
          if (storedResults) {
            existingResults = JSON.parse(storedResults);
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }
    
    return (
      <div className="container max-w-md py-10">
        <NonAuthenticatedUserSignInPrompt
          onSignIn={async () => {
            sessionService.saveAuthRedirectState({
              returnPath: `/dashboard/mcq/${slug}/results`,
              quizState: {
                slug,
                quizData: existingQuizData, // Preserve existing quiz data
                showResults: true,
                // Include additional state with results if available
                currentState: {
                  results: existingResults, // Include results when redirecting
                }
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

  // Modify the error state handler to handle the specific error
  if (quizStatus === 'failed') {
    // Special case: if we have pendingQuiz with quiz data but error says "Results not found"
    if (error === "Results not found. Please take the quiz again." && 
        pendingQuiz?.quizData?.questions?.length) {
      return (
        <QuizLoadingSteps
          steps={[
            { label: 'Generating quiz results', status: 'loading' },
            { label: 'Please wait...', status: 'pending' },
          ]}
        />
      );
    }
    
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

  // If we have questions but no answers/results, show "No Results Found"
  if (questions.length > 0 && Object.keys(answers).length === 0) {
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

  // If we have questions and answers but no results, compute them on the spot
  if (!quizResults && questions.length > 0 && Object.keys(answers).length > 0) {
    // Instantly compute results without waiting for useEffect
    let score = 0;
    const questionResults = questions.map((question) => {
      const answer = answers[String(question.id)];
      const isCorrect = answer?.isCorrect === true;
      if (isCorrect) score++;
      return {
        questionId: question.id,
        isCorrect,
        userAnswer: answer?.selectedOptionId || null,
        correctAnswer: question.correctOptionId || question.answer,
      };
    });
    
    const results = {
      quizId: slug,
      slug,
      title: "Quiz Results",
      score,
      maxScore: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      completedAt: new Date().toISOString(),
      questions,
      answers: Object.values(answers),
      questionResults,
    };
    
    // Immediate render with computed results
    return (
      <div className="container max-w-4xl py-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <McqQuizResult result={results} />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Add a check specifically for showResults=true but no results or answers
  if (
    pendingQuiz?.currentState?.showResults && 
    !quizResults && 
    Object.keys(answers).length === 0
  ) {
    return (
      <div className="container max-w-4xl py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Incomplete Quiz Results</h1>
        <p className="mb-6">
          This quiz was marked for results display, but no answers were found.
          You may need to complete the quiz first.
        </p>
        <div className="mt-6 flex flex-col gap-2 items-center">
          <Button onClick={() => router.push(`/dashboard/mcq/${slug}`)}>Take the Quiz</Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/quizzes')}>
            Back to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <QuizLoadingSteps
      steps={[
        { label: 'Restoring quiz state', status: 'loading' },
        { label: 'Loading results', status: 'pending' },
      ]}
    />
  )
}
