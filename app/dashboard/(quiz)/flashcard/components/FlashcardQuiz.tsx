"use client";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useAnimation,
  type PanInfo,
} from "framer-motion";
import { useAnimation as useAnimationContext } from "@/providers/animation-provider";
import { useSession } from "next-auth/react";
import { QuizContainer } from "@/components/quiz/QuizContainer";
import { toast } from "sonner";
import { Confetti } from "@/components/ui/confetti";
import { useGlobalLoader } from "@/store/global-loader";
import { cn } from "@/lib/utils";
import {
  initFlashCardQuiz,
  submitFlashCardAnswer,
  resetFlashCards,
  nextFlashCard,
  type AnswerEntry,
  type RatingAnswer,
  ANSWER_TYPES,
} from "@/store/slices/flashcard-slice";
import { useAppDispatch, useAppSelector } from "@/store";

// Import modular components
import { FlashcardFront } from "./FlashcardFront";
import { FlashcardBack } from "./FlashcardBack";
import { FlashcardController } from "./FlashcardController";
import { Button } from "@/components/ui/button";
import { CheckCircle, RefreshCw } from "lucide-react";

interface FlashCard {
  id: string;
  question: string;
  answer: string;
  options?: string[];
  keywords?: string[];
  imageUrl?: string;
  audioUrl?: string;
  codeSnippet?: string;
  language?: string;
  type?: "mcq" | "code" | "text";
}

interface FlashCardComponentProps {
  cards: FlashCard[];
  quizId: string | number;
  slug: string;
  title: string;
  onSaveCard?: (card: FlashCard) => void;
  isReviewMode?: boolean;
  onComplete?: (results: any) => void;
}

const ratingFeedbackVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 },
};

export default function FlashCardQuiz({
  cards,
  quizId,
  slug,
  title,
  onSaveCard,
  isReviewMode = false,
  onComplete,
}: FlashCardComponentProps) {
  const dispatch = useAppDispatch();
  const {
    currentQuestion: currentQuestionIndex,
    isCompleted,
    answers,
    quizId: storeQuizId,
  } = useAppSelector((state) => state.flashcard);

  const { data: session } = useSession();

  // State management
  const [flipped, setFlipped] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [ratingAnimation, setRatingAnimation] = useState<
    "correct" | "incorrect" | "still_learning" | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const { startQuizLoading, stopLoading } = useGlobalLoader();
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [swipeDisabled, setSwipeDisabled] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [cardTimes, setCardTimes] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("flashcard_best_streak") || 0);
    }
    return 0;
  });
  const [showHint, setShowHint] = useState(false);
  const [savedCardIds, setSavedCardIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(
          localStorage.getItem("flashcard_saved_cards") || "[]"
        );
      } catch {
        return [];
      }
    }
    return [];
  });
  const [showCompletionFeedback, setShowCompletionFeedback] = useState(false);
  const [completionFeedbackType, setCompletionFeedbackType] = useState<
    "success" | "info"
  >("success");

  // Animation controls
  const cardControls = useAnimation();
  const cardRef = useRef<HTMLDivElement>(null);
  const { animationsEnabled } = useAnimationContext();

  // Mount tracking
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize quiz
  useEffect(() => {
    if (
      cards &&
      cards.length > 0 &&
      (!storeQuizId || storeQuizId !== quizId.toString())
    ) {
      dispatch(
        initFlashCardQuiz({
          id: quizId.toString(),
          slug,
          title,
          questions: cards,
          userId: "",
        })
      );
    }
  }, [cards, quizId, slug, title, dispatch, storeQuizId]);

  // Loading state
  useEffect(() => {
    startQuizLoading("Flashcards");
    
    const timer = setTimeout(() => {
      setIsLoading(false);
      stopLoading();
    }, 500);
    return () => clearTimeout(timer);
  }, [startQuizLoading, stopLoading]);

  // Process results
  const processedResults = useMemo(() => {
    if (!answers || !Array.isArray(answers) || !cards || !cards.length) {
      return {
        correctCount: 0,
        stillLearningCount: 0,
        incorrectCount: 0,
        totalCount: 0,
      };
    }

    let correctCount = 0;
    let stillLearningCount = 0;
    let incorrectCount = 0;
    answers.forEach((answer: AnswerEntry) => {
      if (answer && "answer" in answer && typeof answer.answer === "string") {
        switch (answer.answer) {
          case "correct":
            correctCount++;
            break;
          case "still_learning":
            stillLearningCount++;
            break;
          case "incorrect":
            incorrectCount++;
            break;
        }
      }
    });

    return {
      correctCount,
      stillLearningCount,
      incorrectCount,
      totalCount: correctCount + stillLearningCount + incorrectCount,
    };
  }, [answers, cards]);

  // Current card
  const currentCard = useMemo(() => {
    if (!cards || !cards.length) return null;
    return cards[Math.min(currentQuestionIndex, cards.length - 1)];
  }, [currentQuestionIndex, cards]);

  // Card saved status
  const isSaved = useMemo(
    () =>
      currentCard?.id
        ? savedCardIds.includes(currentCard.id.toString())
        : false,
    [currentCard?.id, savedCardIds]
  );

  // Update best streak in localStorage
  useEffect(() => {
    if (streak > bestStreak) {
      setBestStreak(streak);
      localStorage.setItem("flashcard_best_streak", String(streak));
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  }, [streak, bestStreak]);

  // Persist saved cards to localStorage
  useEffect(() => {
    localStorage.setItem("flashcard_saved_cards", JSON.stringify(savedCardIds));
  }, [savedCardIds]);

  // Toggle card flip
  const toggleFlip = useCallback(() => {
    if (swipeDisabled) return;
    if (!flipped) {
      setStartTime(Date.now());
    }
    setFlipped((prev) => !prev);
    setShowHint(false);
  }, [flipped, swipeDisabled]);

  // Save card
  const handleSaveCard = useCallback(() => {
    if (!currentCard) return;
    setSavedCardIds((prev) => {
      const id = currentCard.id.toString();
      if (prev.includes(id)) {
        toast.success("Removed from saved cards");
        return prev.filter((cid) => cid !== id);
      } else {
        toast.success("Added to saved cards");
        return [...prev, id];
      }
    });
  }, [currentCard]);

  // Move to next card
  const moveToNextCard = useCallback(() => {
    if (!cards?.length || swipeDisabled) return;
    const maxIndex = cards.length - 1;
    if (currentQuestionIndex < maxIndex) {
      setFlipped(false);
      setSwipeDisabled(true);
      if (animationsEnabled) {
        cardControls
          .start({
            x: -300,
            opacity: 0,
            transition: { duration: 0.3 },
          })
          .then(() => {
            if (isMountedRef.current) {
              dispatch(nextFlashCard());
              cardControls.set({ x: 0, opacity: 1 });
              setStartTime(Date.now());
              setSwipeDisabled(false);
            }
          });
      } else {
        dispatch(nextFlashCard());
        setStartTime(Date.now());
        setSwipeDisabled(false);
      }
    } else if (onComplete) {
      onComplete(processedResults);
    }
  }, [
    currentQuestionIndex,
    cards,
    dispatch,
    cardControls,
    onComplete,
    processedResults,
    animationsEnabled,
    swipeDisabled,
  ]); // Handle self rating
  const handleSelfRating = useCallback(
    (cardId: string, rating: "correct" | "incorrect" | "still_learning") => {
      if (!cardId || swipeDisabled) return;
      setSwipeDisabled(true);
      const endTime = Date.now();
      const timeSpent = Math.floor((endTime - startTime) / 1000);

      // Check if this is a change from previous rating
      const previousAnswer = answers.find(
        (a): a is RatingAnswer => "answer" in a && a.questionId === cardId
      );

      const isStatusChange = previousAnswer && previousAnswer.answer !== rating;

      // Update streak
      let newStreak = streak;
      if (rating === "correct") {
        newStreak = streak + 1;
        setStreak(newStreak);
      } else {
        newStreak = 0;
        setStreak(0);
      }
      setRatingAnimation(rating);
      setCardTimes((prev) => ({
        ...prev,
        [cardId]: (prev[cardId] || 0) + timeSpent,
      }));

      // Submit answer with adaptive learning priority
      // Cards that are "still_learning" or "incorrect" get higher priority for future review
      const priority =
        rating === "correct" ? 1 : rating === "still_learning" ? 2 : 3;
      const answerData = {
        answer: rating,
        userAnswer: rating,
        timeSpent: timeSpent,
        isCorrect: rating === "correct",
        questionId: cardId,
        streak: rating === "correct" ? newStreak : 0,
        priority: priority, // Add adaptive learning priority
      };
      dispatch(submitFlashCardAnswer(answerData));

      // Show appropriate toast for status changes in review mode
      if (isReviewMode && isStatusChange) {
        if (previousAnswer?.answer === "incorrect" && rating === "correct") {
          toast.success("Great job! You've learned this card!", {
            duration: 2000,
            icon: "🎉",
          });
        } else if (
          previousAnswer?.answer === "still_learning" &&
          rating === "correct"
        ) {
          toast.success("You've mastered this card!", {
            duration: 2000,
            icon: "⭐",
          });
        } else if (
          previousAnswer?.answer === "correct" &&
          rating !== "correct"
        ) {
          toast.info("We'll help you review this card more.", {
            duration: 2000,
          });
        }
      }
      // Haptic feedback
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(
          rating === "correct"
            ? [50, 30, 50]
            : rating === "still_learning"
              ? [30, 20, 30]
              : [100]
        );
      } // Confetti for milestones
      if (rating === "correct" && newStreak % 5 === 0 && newStreak > 0) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2500);
      }

      // Check if this was the last card in review mode
      const isLastCard = currentQuestionIndex === cards.length - 1;

      // Show completion feedback for review mode
      if (isReviewMode && isLastCard) {
        // Calculate how many cards were marked as known
        const correctAnswersCount = answers.filter(
          (a): a is RatingAnswer =>
            "answer" in a && a.answer === ANSWER_TYPES.CORRECT
        ).length;

        // If all or most cards were marked as known, show success feedback
        const successThreshold = Math.floor(cards.length * 0.7); // 70% of cards
        const feedbackType =
          correctAnswersCount >= successThreshold ? "success" : "info";

        // Show completion feedback after a slight delay
        setTimeout(() => {
          if (isMountedRef.current) {
            setCompletionFeedbackType(feedbackType);
            setShowCompletionFeedback(true);
          }
        }, 1200);
      }

      // Auto-advance or reset animation
      setTimeout(() => {
        if (isMountedRef.current) {
          setRatingAnimation(null);
          if (autoAdvance && !isLastCard) {
            moveToNextCard();
          }
          setSwipeDisabled(false);
        }
      }, 1000);
    },
    [dispatch, autoAdvance, moveToNextCard, startTime, streak, swipeDisabled]
  );
  // Restart quiz
  const handleRestartQuiz = useCallback(() => {
    dispatch(resetFlashCards());
    setFlipped(false);
    setShowConfetti(false);
    setStreak(0);
    toast("Quiz has been reset");
  }, [dispatch]);

  // Finish quiz early
  const handleFinishQuiz = useCallback(() => {
    // Check if user has gone through enough cards to finish
    const completedCardCount = Object.keys(cardTimes).length;
    const progressPercent = (completedCardCount / cards.length) * 100;

    if (completedCardCount === 0) {
      toast.warning("Please rate at least one card before finishing");
      return;
    }

    if (progressPercent < 50 && !isReviewMode) {
      const confirmFinish = window.confirm(
        `You've only completed ${Math.round(progressPercent)}% of the cards. Are you sure you want to finish?`
      );
      if (!confirmFinish) return;
    }

    if (onComplete) {
      toast.success("Quiz completed!");
      onComplete(processedResults);
    }
  }, [cardTimes, cards.length, isReviewMode, onComplete, processedResults]);

  // Handle swipe gestures
  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (swipeDisabled) return;
      const swipeThreshold = 100;
      const swipeDirection = info.offset.x > 0 ? "right" : "left";
      const isEffectiveSwipe =
        Math.abs(info.offset.x) > swipeThreshold ||
        Math.abs(info.velocity.x) > 500;
      if (isEffectiveSwipe) {
        if (window.navigator?.vibrate) window.navigator.vibrate(50);
        if (swipeDirection === "left") {
          moveToNextCard();
        } else {
          toggleFlip();
        }
      } else {
        cardControls.start({
          x: 0,
          opacity: 1,
          transition: { type: "spring", stiffness: 500, damping: 30 },
        });
      }
    },
    [swipeDisabled, moveToNextCard, toggleFlip, cardControls]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading || isCompleted || swipeDisabled) return;
      if (e.repeat) return;
      switch (e.key) {
        case "ArrowRight":
          moveToNextCard();
          break;
        case "ArrowLeft":
        case " ":
          toggleFlip();
          break;
        case "1":
        case "y":
          if (currentCard?.id && flipped && !ratingAnimation) {
            handleSelfRating(currentCard.id.toString(), "correct");
          }
          break;
        case "2":
        case "s":
          if (currentCard?.id && flipped && !ratingAnimation) {
            handleSelfRating(currentCard.id.toString(), "still_learning");
          }
          break;
        case "3":
        case "n":
          if (currentCard?.id && flipped && !ratingAnimation) {
            handleSelfRating(currentCard.id.toString(), "incorrect");
          }
          break;
        case "h":
          setShowHint((v) => !v);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isLoading,
    isCompleted,
    moveToNextCard,
    toggleFlip,
    currentCard,
    flipped,
    handleSelfRating,
    showHint,
    ratingAnimation,
    swipeDisabled,
  ]);
  if (isLoading) {
    return null; // Loading handled by global state
  }
  if (!cards || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="text-xl font-medium">No flashcards available</div>
          <p className="text-muted-foreground">
            Please check back later or create your own flashcards
          </p>
        </div>
      </div>
    );
  }
  return (
    <>
      <QuizContainer
        quizTitle="Flashcard Quiz"
        quizSubtitle="Test your knowledge with interactive flashcards"
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={cards?.length || 0}
        quizType="flashcard"
        animationKey={`card-${currentQuestionIndex}`}
      >
        <div className="space-y-4 sm:space-y-6">
          {/* Controller */}{" "}
          <FlashcardController
            title={title}
            currentIndex={currentQuestionIndex}
            totalCards={cards?.length || 0}
            streak={streak}
            isReviewMode={isReviewMode}
            flipped={flipped}
            autoAdvance={autoAdvance}
            showSettings={showSettings}
            onToggleFlip={toggleFlip}
            onNextCard={moveToNextCard}
            onSetAutoAdvance={setAutoAdvance}
            onSetShowSettings={setShowSettings}
            onRestartQuiz={handleRestartQuiz}
            onFinishQuiz={handleFinishQuiz}
          />
          {/* Flashcard Content */}
          <div className="relative min-h-[300px] sm:min-h-[350px] w-full perspective-1000">
            <motion.div
              key={`card-${currentQuestionIndex}`}
              drag={!swipeDisabled && !isCompleted ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragEnd={handleDragEnd}
              animate={cardControls}
              layoutId={`card-${currentQuestionIndex}`}
              className="absolute inset-0 w-full h-full touch-manipulation"
              ref={cardRef}
              tabIndex={0}
              aria-label="Flashcard"
            >
              <AnimatePresence mode="wait">
                {!flipped ? (
                  <FlashcardFront
                    key="front"
                    question={currentCard?.question || ""}
                    keywords={currentCard?.keywords}
                    showHint={showHint}
                    onToggleHint={() => setShowHint((v) => !v)}
                    onFlip={toggleFlip}
                    animationsEnabled={animationsEnabled}
                    codeSnippet={currentCard?.codeSnippet}
                    language={currentCard?.language}
                    type={currentCard?.type}
                  />
                ) : (
                  <FlashcardBack
                    key="back"
                    answer={currentCard?.answer || ""}
                    onFlip={toggleFlip}
                    onSelfRating={(rating) => {
                      if (
                        currentCard?.id &&
                        !ratingAnimation &&
                        !swipeDisabled
                      ) {
                        handleSelfRating(currentCard.id.toString(), rating);
                      }
                    }}
                    onSaveCard={handleSaveCard}
                    isSaved={isSaved}
                    animationsEnabled={animationsEnabled}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </QuizContainer>
      {/* Rating feedback overlay */}
      <AnimatePresence>
        {ratingAnimation && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            variants={ratingFeedbackVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div
              className={cn(
                "px-6 sm:px-8 py-4 sm:py-6 rounded-2xl sm:rounded-3xl text-white font-bold text-xl sm:text-2xl shadow-2xl border-4",
                ratingAnimation === "correct" &&
                  "bg-green-500 border-green-400",
                ratingAnimation === "still_learning" &&
                  "bg-amber-500 border-amber-400",
                ratingAnimation === "incorrect" && "bg-red-500 border-red-400"
              )}
            >
              {ratingAnimation === "correct" && "✅ I knew it!"}
              {ratingAnimation === "still_learning" && "📚 Still learning"}
              {ratingAnimation === "incorrect" && "❌ Need to study"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>{" "}
      {showConfetti && <Confetti isActive={showConfetti} />}
      {/* Completion feedback modal */}
      {showCompletionFeedback && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8 max-w-md text-center"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 15 }}
          >
            {completionFeedbackType === "success" ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 10 }}
                >
                  <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Great progress!</h2>
                <p className="text-muted-foreground mb-6">
                  You've improved your knowledge of these cards. Keep up the
                  good work!
                </p>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 10 }}
                >
                  <RefreshCw className="h-16 w-16 mx-auto text-blue-500 mb-4" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Review Complete</h2>
                <p className="text-muted-foreground mb-6">
                  You've gone through all the review cards. Want to see your
                  progress?
                </p>
              </>
            )}
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => {
                  setShowCompletionFeedback(false);
                  handleFinishQuiz();
                }}
              >
                See Results
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
