'use client'

import { useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/store"
import {
  fetchFlashCardQuiz,
  clearQuizState,
  completeFlashCardQuiz,
  saveFlashCardResults,
  selectQuizQuestions,
  selectQuizAnswers,
  selectCurrentQuestionIndex,
  selectQuizStatus,
  selectQuizTitle,
  selectIsQuizComplete,
  selectShouldRedirectToResults,
  selectQuizError,
  selectRequiresAuth,
  setPendingFlashCardAuth,
} from "@/store/slices/flashcard-slice"

import {
  ANSWER_TYPES,
  type RatingAnswer,
  type QuizResultsState,
} from "@/store/slices/flashcard-slice"

import FlashcardQuiz from "./FlashcardQuiz"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { NoResults } from "@/components/ui/no-results"
import { useAuth } from "@/hooks/use-auth"
import SignInPrompt from "@/app/auth/signin/components/SignInPrompt"
import { GlobalLoader } from "@/components/ui/loader"
import { QuizSchema } from "@/lib/seo-manager-new"

interface FlashcardQuizWrapperProps {
  slug: string
  title?: string
}



export default function FlashcardQuizWrapper({ slug, title }: FlashcardQuizWrapperProps) {
  const initRef = useRef(false)
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isInitialized, login } = useAuth()

  const isReviewMode = searchParams?.get("review") === "true"
  const isResetMode = searchParams?.get("reset") === "true"

  const questions = useSelector(selectQuizQuestions)
  const answers = useSelector(selectQuizAnswers)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const quizStatus = useSelector(selectQuizStatus)
  const quizTitle = useSelector(selectQuizTitle)
  const isCompleted = useSelector(selectIsQuizComplete)
  const shouldRedirectToResults = useSelector(selectShouldRedirectToResults)
  const error = useSelector(selectQuizError)
  const requiresAuth = useSelector(selectRequiresAuth)
  // Initial load: clear state if needed and fetch quiz
  useEffect(() => {
    if (!slug || !isInitialized) return

    // In review mode, only clear state if we don't have questions yet
    if (isResetMode || (isReviewMode && questions.length === 0)) {
      dispatch(clearQuizState())
    }

    if (!questions.length) {
      dispatch(fetchFlashCardQuiz(slug))
        .unwrap()
        .then(() => {
          // After successfully loading questions, log for debugging
          console.log(`Loaded ${questions.length} questions for ${slug}, review mode: ${isReviewMode}`)
          
          // If in review mode with cards parameter, log the filtered questions
          if (isReviewMode && searchParams?.get("cards")) {
            const cardsParam = searchParams.get("cards")
            console.log(`Review mode with cards: ${cardsParam}`)
          }
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : "Failed to load flashcards"
          toast.error(message)
        })
    }
  }, [dispatch, isResetMode, isReviewMode, questions.length, slug, isInitialized, searchParams])

  // Redirect if auth required
  useEffect(() => {
    if (requiresAuth && !isAuthenticated && isInitialized) {
      dispatch(setPendingFlashCardAuth(true))
      router.push(`/auth/signin?callbackUrl=/dashboard/flashcard/${slug}`)
    }
  }, [requiresAuth, isAuthenticated, isInitialized, dispatch, router, slug])  // Redirect to results
  useEffect(() => {
    // Only redirect to results if we're not in review mode
    if (!isReviewMode && (shouldRedirectToResults || (isCompleted && !shouldRedirectToResults))) {
      router.replace(`/dashboard/flashcard/${slug}/results`)
    }
  }, [shouldRedirectToResults, isCompleted, router, slug, isReviewMode]);
  
  const reviewQuestions = useMemo(() => {
    if (!isReviewMode || !questions.length) return questions

    // Check if specific card IDs are provided in the URL
    const specificCardsParam = searchParams?.get("cards");
    
    if (specificCardsParam) {      // Use specific card IDs from the URL
      const specificCardIds = specificCardsParam.split(",").map(id => id.trim());
      
      // Log for debugging
      console.log(`Filtering for cards: ${specificCardIds.join(", ")}`);
      console.log(`Available question IDs: ${questions.map(q => q.id).join(", ")}`);
      
      const filteredQuestions = questions.filter(q => {
        if (!q.id) return false;
        
        // Try matching by both string and number
        const questionIdStr = q.id.toString();
        const questionIdNum = parseInt(questionIdStr);
        
        // Check if either the string ID or numeric ID is in the specific card IDs
        const isIncludedStr = specificCardIds.includes(questionIdStr);
        const isIncludedNum = !isNaN(questionIdNum) && specificCardIds.includes(questionIdNum.toString());
        
        console.log(`Question ${questionIdStr}: ${isIncludedStr || isIncludedNum ? "included" : "excluded"}`);
        return isIncludedStr || isIncludedNum;
      });
      
      console.log(`Found ${filteredQuestions.length} matching questions`);
      return filteredQuestions;
    } else if (answers.length) {
      // Fall back to filtering by answer status
      const reviewType = searchParams?.get("type");
      const reviewIds = answers
        .filter((a): a is RatingAnswer => {
          if (!('answer' in a)) return false;
          
          if (reviewType === "stillLearning") {
            return a.answer === ANSWER_TYPES.STILL_LEARNING;
          } else {
            return (
              a.answer === ANSWER_TYPES.INCORRECT ||
              a.answer === ANSWER_TYPES.STILL_LEARNING ||
              a.isCorrect === false
            );
          }
        })
        .map((a) => a.questionId);

      return questions.filter((q) => reviewIds.includes(q.id?.toString() || ""));
    }
    
    return questions;
  }, [answers, questions, isReviewMode, searchParams])

  const currentQuestions = isReviewMode ? reviewQuestions : questions
  const onComplete = () => {
    const ratingAnswers = answers.filter((a): a is RatingAnswer => 'answer' in a)

    const correctCount = ratingAnswers.filter((a) => a.answer === ANSWER_TYPES.CORRECT).length
    const stillLearningCount = ratingAnswers.filter((a) => a.answer === ANSWER_TYPES.STILL_LEARNING).length
    const incorrectCount = ratingAnswers.filter((a) => a.answer === ANSWER_TYPES.INCORRECT).length
    const totalTime = ratingAnswers.reduce((acc, a) => acc + (a.timeSpent || 0), 0)    // If we're in review mode, just navigate to results instead of completing quiz
    if (isReviewMode) {
      // Save the review results to state for better UX
      const timestamp = new Date().toISOString();
      const reviewResults = {
        correctCount,
        incorrectCount,
        stillLearningCount,
        totalTime,
        reviewCompleted: true,
        timestamp
      };
      
      // Store review session analytics in localStorage for persistence
      try {
        const reviewKey = `flashcard_review_${slug}_${timestamp}`;
        localStorage.setItem(reviewKey, JSON.stringify(reviewResults));
      } catch (e) {
        console.error("Failed to save review analytics:", e);
      }
      
      // Navigate back to results
      router.push(`/dashboard/flashcard/${slug}/results`)
      return
    }

    const totalQuestions = questions.length
    const percentage = totalQuestions ? (correctCount / totalQuestions) * 100 : 0
    const timestamp = new Date().toISOString()

    const results: QuizResultsState = {
      score: correctCount,
      percentage,
      correctCount,
      incorrectCount,
      stillLearningCount,
      correctAnswers: correctCount,
      stillLearningAnswers: stillLearningCount,
      incorrectAnswers: incorrectCount,
      totalQuestions,
      totalTime,
      completedAt: timestamp,
      submittedAt: timestamp,      reviewCards: ratingAnswers
        .filter((a) => a.answer === ANSWER_TYPES.INCORRECT)
        .map((a) => {
          const id = parseInt(a.questionId);
          return isNaN(id) ? 0 : id; // Ensure we always return a number
        }),
      stillLearningCards: ratingAnswers
        .filter((a) => a.answer === ANSWER_TYPES.STILL_LEARNING)
        .map((a) => {
          const id = parseInt(a.questionId);
          return isNaN(id) ? 0 : id; // Ensure we always return a number
        }),
      questions,
      answers,
      slug,
      title: quizTitle || title || "Flashcard Quiz",
      quizId: slug,
      maxScore: totalQuestions,
    }

    dispatch(completeFlashCardQuiz(results))
  }
  // Loading Skeletons
  if (quizStatus === "loading" || !isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <GlobalLoader size="sm" />
        <p className="mt-4 text-muted-foreground">
          {isReviewMode 
            ? "Loading your review cards..." 
            : "Loading flashcards..."}
        </p>
      </div>
    )
  }

  // Error State with Retry
  if (quizStatus === "failed" || error) {
    return (
      <NoResults
        variant="error"
        title="Oops! Something went wrong."
        description={error || "Unable to load flashcards at this moment."}
        action={{
          label: "Retry",
          onClick: () => {
            dispatch(clearQuizState())
            dispatch(fetchFlashCardQuiz(slug))
          },
        }}
        secondaryAction={{
          label: "Browse Topics",
          onClick: () => router.push("/dashboard/quizzes"),
        }}
      />
    )
  }

  // Sign-in prompt for auth-required quizzes
  if (requiresAuth && !isAuthenticated && isInitialized) {
    return (
      <SignInPrompt
        onSignIn={() => login("credentials", { callbackUrl: `/dashboard/flashcard/${slug}` })}
        onRetake={() => {
          dispatch(clearQuizState())
          router.push(`/dashboard/flashcard/${slug}?reset=true`)
        }}
        quizType="flashcard"
      />
    )
  }
  // Empty Review State
  if (isReviewMode && questions.length > 0 && reviewQuestions.length === 0) {
    // Get cards parameter for debugging
    const cardsParam = searchParams?.get("cards");
    
    return (
      <NoResults
        variant="empty"
        title={cardsParam ? "Cards Not Found" : "All Clear!"}
        description={cardsParam 
          ? `We couldn't find the specific cards you requested (IDs: ${cardsParam}). They may have been removed or updated.` 
          : "You've reviewed all cards. Great job!"}
        action={{
          label: "Take Full Quiz",
          onClick: () => {
            dispatch(clearQuizState());            router.push(`/dashboard/flashcard/${slug}?reset=true`);
          },
        }}
        secondaryAction={{
          label: "Back to Results",
          onClick: () => router.push(`/dashboard/flashcard/${slug}/results`),
        }}
      />
    )
  }

  // No questions found
  if (!currentQuestions || currentQuestions.length === 0) {
    return (
      <NoResults
        variant="error"
        title="No Flashcards Available"
        description="We couldn't find any flashcards for this topic."
        action={{
          label: "Try Again",
          onClick: () => {
            dispatch(clearQuizState())
            router.push(`/dashboard/flashcard/${slug}?reset=true`)
          },
        }}
        secondaryAction={{
          label: "Browse Topics",
          onClick: () => router.push("/dashboard/quizzes"),
        }}
      />
    )
  }
  // Main Quiz Component
  return (
    <motion.div
      className="space-y-6 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <QuizSchema 
        quizName={quizTitle || title || "Flashcard Quiz"}
        quizUrl={`https://courseai.io/dashboard/flashcard/${slug}`}
        description={`Interactive flashcards for ${quizTitle || title || "learning"} on CourseAI.`}
        numberOfQuestions={currentQuestions?.length}
        timeRequired="PT15M"
      />
      <FlashcardQuiz
        key={`${slug}-${isReviewMode ? "review" : "full"}`}
        cards={currentQuestions}
        quizId={slug}
        slug={slug}
        onComplete={onComplete}
        onSaveCard={(saveData) => {
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