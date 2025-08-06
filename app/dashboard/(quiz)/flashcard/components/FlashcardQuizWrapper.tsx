"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  fetchFlashCardQuiz,
  clearQuizState,
  completeFlashCardQuiz,
  saveFlashCardResults,
  saveFlashCard,
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
} from "@/store/slices/flashcard-slice";

import {
  ANSWER_TYPES,
  type RatingAnswer,
  type QuizResultsState,
} from "@/store/slices/flashcard-slice";

import FlashcardQuiz from "./FlashcardQuiz";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { NoResults } from "@/components/ui/no-results";
import { useAuth } from "@/modules/auth";
import SignInPrompt from "@/app/auth/signin/components/SignInPrompt";

import { QuizActions } from "../../components/QuizActions";
import { LoadingSpinner } from "@/components/loaders/GlobalLoader";
import { QuizSchema } from "@/lib/seo/components";


interface FlashcardQuizWrapperProps {
  slug: string;
  title?: string;
}

export default function FlashcardQuizWrapper({
  slug,
  title,
}: FlashcardQuizWrapperProps) {
  const hasInitialized = useRef(false);
  const lastSlug = useRef<string>("");
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, isLoading } = useAuth();

  const isReviewMode = searchParams?.get("review") === "true";
  const isResetMode = searchParams?.get("reset") === "true";

  const questions = useSelector(selectQuizQuestions);
  const answers = useSelector(selectQuizAnswers);
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex);
  const quizStatus = useSelector(selectQuizStatus);
  const quizTitle = useSelector(selectQuizTitle);
  const isCompleted = useSelector(selectIsQuizComplete);
  const shouldRedirectToResults = useSelector(selectShouldRedirectToResults);
  const error = useSelector(selectQuizError);
  const requiresAuth = useSelector(selectRequiresAuth);
  const userId = user?.id;
  const quizId = useSelector((state: RootState) => state.flashcard.quizId);
  const quizData = useSelector((state: RootState) => state.flashcard.results);
  const quizOwnerId = useSelector((state: RootState) => state.flashcard.userId);
  // Initial load: clear state if needed and fetch quiz
  useEffect(() => {
    if (!slug || isLoading) return;

    // Reset initialization when slug changes
    if (lastSlug.current !== slug) {
      hasInitialized.current = false;
      lastSlug.current = slug;
    }

    // Prevent multiple initializations
    if (hasInitialized.current) return;

    // Handle reset mode - clear state and mark as initialized
    if (isResetMode) {
      dispatch(clearQuizState());
      hasInitialized.current = true;
      return;
    }

    // Handle review mode - clear only if needed
    if (isReviewMode && questions.length === 0 && quizStatus !== "idle" && quizStatus !== "loading") {
      dispatch(clearQuizState());
      hasInitialized.current = true;
      return;
    }

    // Only fetch if we're in idle state, have no questions, and haven't initialized yet
    if (quizStatus === "idle" && questions.length === 0) {
      hasInitialized.current = true;
      dispatch(fetchFlashCardQuiz(slug))
        .unwrap()
        .catch((err) => {
          console.error(`Error loading flashcards for ${slug}:`, err);
          const message =
            err instanceof Error ? err.message : "Failed to load flashcards";
          toast.error(message);
          hasInitialized.current = false; // Allow retry on error
        });
    }
  }, [dispatch, slug, isResetMode, isReviewMode]); // Removed quizStatus, questions.length, isLoading

  // Reset initialization flag when component unmounts or slug changes
  useEffect(() => {
    return () => {
      hasInitialized.current = false;
    };
  }, [slug]);

  // Redirect if auth required
  useEffect(() => {
    if (requiresAuth && !isAuthenticated && !isLoading) {
      dispatch(setPendingFlashCardAuth(true));
      router.push(`/auth/signin?callbackUrl=/dashboard/flashcard/${slug}`);
    }
  }, [requiresAuth, isAuthenticated, isLoading, dispatch, router, slug]); // Redirect to results
  useEffect(() => {
    // Only redirect to results if we're not in review mode
    if (
      !isReviewMode &&
      (shouldRedirectToResults || (isCompleted && !shouldRedirectToResults))
    ) {
      router.replace(`/dashboard/flashcard/${slug}/results`);
    }
  }, [shouldRedirectToResults, isCompleted, router, slug, isReviewMode]);

  const reviewQuestions = useMemo(() => {
    if (!isReviewMode || !questions.length) return questions;

    // Check if specific card IDs are provided in the URL
    const specificCardsParam = searchParams?.get("cards");

    if (specificCardsParam) {
      // Use specific card IDs from the URL
      const specificCardIds = specificCardsParam
        .split(",")
        .map((id) => id.trim());

      const filteredQuestions = questions.filter((q) => {
        if (!q.id) return false;

        // Try matching by both string and number
        const questionIdStr = q.id.toString();
        const questionIdNum = parseInt(questionIdStr);

        // Check if either the string ID or numeric ID is in the specific card IDs
        const isIncludedStr = specificCardIds.includes(questionIdStr);
        const isIncludedNum =
          !isNaN(questionIdNum) &&
          specificCardIds.includes(questionIdNum.toString());

        return isIncludedStr || isIncludedNum;
      });

      return filteredQuestions;
    } else if (answers.length) {
      // Fall back to filtering by answer status
      const reviewType = searchParams?.get("type");
      const reviewIds = answers
        .filter((a): a is RatingAnswer => {
          if (!("answer" in a)) return false;

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

      return questions.filter((q) =>
        reviewIds.includes(q.id?.toString() || "")
      );
    }

    return questions;
  }, [answers, questions, isReviewMode, searchParams?.get("cards"), searchParams?.get("type")]);

  const currentQuestions = isReviewMode ? reviewQuestions : questions;
  const onComplete = () => {
    const ratingAnswers = answers.filter(
      (a): a is RatingAnswer => "answer" in a
    );

    const correctCount = ratingAnswers.filter(
      (a) => a.answer === ANSWER_TYPES.CORRECT
    ).length;
    const stillLearningCount = ratingAnswers.filter(
      (a) => a.answer === ANSWER_TYPES.STILL_LEARNING
    ).length;
    const incorrectCount = ratingAnswers.filter(
      (a) => a.answer === ANSWER_TYPES.INCORRECT
    ).length;
    const totalTime = ratingAnswers.reduce(
      (acc, a) => acc + (a.timeSpent || 0),
      0
    ); // If we're in review mode, just navigate to results instead of completing quiz
    if (isReviewMode) {
      // Save the review results to state for better UX
      const timestamp = new Date().toISOString();
      const reviewResults = {
        correctCount,
        incorrectCount,
        stillLearningCount,
        totalTime,
        reviewCompleted: true,
        timestamp,
      };

      // Store review session analytics in localStorage for persistence
      try {
        const reviewKey = `flashcard_review_${slug}_${timestamp}`;
        localStorage.setItem(reviewKey, JSON.stringify(reviewResults));
      } catch (e) {
        console.error("Failed to save review analytics:", e);
      }

      // Navigate back to results
      router.push(`/dashboard/flashcard/${slug}/results`);
      return;
    }

    const totalQuestions = questions.length;
    const percentage = totalQuestions
      ? (correctCount / totalQuestions) * 100
      : 0;
    const timestamp = new Date().toISOString();

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
      submittedAt: timestamp,
      reviewCards: ratingAnswers
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
    };

    dispatch(completeFlashCardQuiz(results));
  };

  // Loading Skeletons
  if (quizStatus === "loading" || isLoading) {
    return <LoadingSpinner size={48} />;
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
            dispatch(clearQuizState());
            dispatch(fetchFlashCardQuiz(slug));
          },
        }}
        secondaryAction={{
          label: "Browse Topics",
          onClick: () => router.push("/dashboard/quizzes"),
        }}
      />
    );
  }

  // Sign-in prompt for auth-required quizzes
  if (requiresAuth && !isAuthenticated && !isLoading) {
    return (
      <SignInPrompt
        onSignIn={() =>
          router.push(
            `/auth/signin?callbackUrl=${encodeURIComponent(`/dashboard/flashcard/${slug}`)}`
          )
        }
        onRetake={() => {
          dispatch(clearQuizState());
          router.push(`/dashboard/flashcard/${slug}?reset=true`);
        }}
        quizType="flashcard"
      />
    );
  }
  // Empty Review State
  if (isReviewMode && questions.length > 0 && reviewQuestions.length === 0) {
    // Get cards parameter for debugging
    const cardsParam = searchParams?.get("cards");
    return (
      <NoResults
        variant="empty"
        title={cardsParam ? "Cards Not Found" : "All Clear!"}
        description={
          cardsParam
            ? `We couldn't find the specific cards you requested (IDs: ${cardsParam}). They may have been removed or updated.`
            : "You've reviewed all cards. Great job!"
        }
        action={{
          label: "Take Full Quiz",
          onClick: () => {
            dispatch(clearQuizState());
            router.push(`/dashboard/flashcard/${slug}?reset=true`);
          },
        }}
        secondaryAction={{
          label: "Back to Results",
          onClick: () => router.push(`/dashboard/flashcard/${slug}/results`),
        }}
      />
    );
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
            dispatch(clearQuizState());
            router.push(`/dashboard/flashcard/${slug}?reset=true`);
          },
        }}
        secondaryAction={{
          label: "Browse Topics",
          onClick: () => router.push("/dashboard/quizzes"),
        }}
      />
    );
  }
  // Main Quiz Component
  // Only render one progress bar and one main action button (handled inside FlashcardQuiz)
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <QuizSchema
        name={quizTitle || title || "Flashcard Quiz"}
        url={`https://courseai.io/dashboard/flashcard/${slug}`}
        questions={currentQuestions}
        description={`Interactive flashcards for ${quizTitle || title || "learning"} on CourseAI.`}
        numberOfQuestions={currentQuestions?.length}
      />
      <div className="space-y-6">
        <FlashcardQuiz
          key={`${slug}-${isReviewMode ? "review" : "full"}`}
          cards={currentQuestions}
          quizId={slug}
          slug={slug}
          onComplete={onComplete}
          onSaveCard={(card) => {
            dispatch(saveFlashCard({ 
              cardId: parseInt(card.id), 
              saved: !card.saved 
            }));
          }}
          title={
            isReviewMode
              ? `Review: ${quizTitle || title || "Flashcard Quiz"}`
              : quizTitle || title || "Flashcard Quiz"
          }
          isReviewMode={isReviewMode}
        />
      </div>
    </div>
  );
}
