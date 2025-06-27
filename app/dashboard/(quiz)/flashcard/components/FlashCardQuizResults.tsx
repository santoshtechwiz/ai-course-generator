"use client"

import { useMemo, useCallback, useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { 
  RefreshCw,
  RotateCcw,
  Eye,
  Share2,
  CheckCircle,
  Activity,
  AlertCircle,
  ThumbsUp,
  ThumbsDown
} from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { NoResults } from "@/components/ui/no-results"
import { Confetti } from "@/components/ui/confetti"
import { getPerformanceLevel } from "@/lib/utils/text-similarity"
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Answer {
  questionId: string | number
  answer: "correct" | "incorrect" | "still_learning"
  isCorrect?: boolean
  timeSpent?: number
}

interface Question {
  id: string | number
  question: string
  answer: string
  difficulty?: string
  saved?: boolean
}

interface FlashCardResultsProps {
  quizId?: string
  slug: string
  title?: string
  score?: number
  totalQuestions?: number
  correctAnswers?: number
  stillLearningAnswers?: number
  incorrectAnswers?: number
  totalTime?: number
  onRestart?: () => void
  onReview?: (cards: number[]) => void
  onReviewStillLearning?: (cards: number[]) => void
  reviewCards?: number[]
  stillLearningCards?: number[]
  answers?: Answer[]
  questions?: Question[]
  result?: any // Add the result prop
}

interface ReviewableCard {
  questionId: string | number;
  answer: string;
  question?: string;
  correctAnswer?: string;
  [key: string]: any;
}

export default function FlashCardResults({
  slug,
  title = "Flashcard Quiz",
  score = 0,
  totalQuestions: propTotalQuestions = 0,
  correctAnswers: propCorrectAnswers = 0,
  stillLearningAnswers: propStillLearningAnswers = 0,
  incorrectAnswers: propIncorrectAnswers = 0,
  totalTime = 0,
  onRestart,
  onReview,
  onReviewStillLearning,
  reviewCards = [],
  stillLearningCards = [],
  answers = [],
  questions = [],
  result
}: FlashCardResultsProps) {
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(false)
  const [showDetailedResults, setShowDetailedResults] = useState(false)
  const hasShownConfettiRef = useRef(false)
  // Title handling with useState to allow for dynamic updates
  const [internalTitle, setInternalTitle] = useState(result?.title || title);
  const titleRef = useRef(result?.title || title);
  
  // Process result prop if available
  useEffect(() => {
    if (result) {
      // Map result data to component state
      if (result.title) {
        setInternalTitle(result.title);
        titleRef.current = result.title;
      }
    }
  }, [result]);
  // Calculate actual results from answers array to ensure consistency
  const calculatedResults = useMemo(() => {
    // If we have result object with quiz data, prioritize it
    if (result) {
      if (result.totalQuestions && result.correctAnswers !== undefined) {
        return {
          totalQuestions: result.totalQuestions,
          correctAnswers: result.correctAnswers,
          stillLearningAnswers: result.stillLearningAnswers || 0,
          incorrectAnswers: result.incorrectAnswers || 0,
        };
      }
        // If result contains answers, calculate from those
      if (result.answers && result.answers.length > 0) {
        const resultAnswers = result.answers as Answer[];
        const correct = resultAnswers.filter((a: Answer) => a.answer === "correct" || a.isCorrect === true).length;
        const stillLearning = resultAnswers.filter((a: Answer) => a.answer === "still_learning").length;
        const incorrect = resultAnswers.filter((a: Answer) => a.answer === "incorrect" || a.isCorrect === false).length;
        const total = result.totalQuestions || resultAnswers.length;
        
        return {
          totalQuestions: total,
          correctAnswers: correct,
          stillLearningAnswers: stillLearning,
          incorrectAnswers: incorrect,
        };
      }
    }
    
    // Use provided answers if available
    if (answers && answers.length > 0) {
      const correct = answers.filter(a => a.answer === "correct" || a.isCorrect === true).length;
      const stillLearning = answers.filter(a => a.answer === "still_learning").length;
      const incorrect = answers.filter(a => a.answer === "incorrect" || a.isCorrect === false).length;
      const total = propTotalQuestions || answers.length;
      
      return {
        totalQuestions: total,
        correctAnswers: correct,
        stillLearningAnswers: stillLearning,
        incorrectAnswers: incorrect,
      };
    }
    
    // Fall back to props
    return {
      totalQuestions: propTotalQuestions,
      correctAnswers: propCorrectAnswers,
      stillLearningAnswers: propStillLearningAnswers,
      incorrectAnswers: propIncorrectAnswers,
    }
  }, [result, answers, propTotalQuestions, propCorrectAnswers, propStillLearningAnswers, propIncorrectAnswers])

  const { totalQuestions, correctAnswers, stillLearningAnswers, incorrectAnswers } = calculatedResults

  // Format the total time
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(totalTime / 60)
    const seconds = totalTime % 60
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }, [totalTime])

  // Calculate average time per card
  const avgTimePerCard = useMemo(() => {
    if (totalQuestions === 0) return 0
    return Math.round(totalTime / totalQuestions)
  }, [totalTime, totalQuestions])

  // Calculate percentage for each category
  const percentCorrect = useMemo(() => {
    return totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
  }, [correctAnswers, totalQuestions])

  const percentStillLearning = useMemo(() => {
    return totalQuestions > 0 ? Math.round((stillLearningAnswers / totalQuestions) * 100) : 0
  }, [stillLearningAnswers, totalQuestions])

  const percentIncorrect = useMemo(() => {
    return totalQuestions > 0 ? Math.round((incorrectAnswers / totalQuestions) * 100) : 0
  }, [incorrectAnswers, totalQuestions])

  useEffect(() => {
    // Show confetti if score is good
    if (!hasShownConfettiRef.current && percentCorrect >= 70) {
      hasShownConfettiRef.current = true;
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [percentCorrect]);



  const performance = getPerformanceLevel(percentCorrect)

  // Handle go back to flashcards page
  const handleGoToFlashcards = useCallback(() => {
    router.push("/dashboard/flashcard")
  }, [router])

  const handleShare = async () => {
    try {
      const shareData = {
        title: `${title} - Results`,
        text: `I scored ${percentCorrect}% (${performance.level}) on the ${title} flashcard quiz! ${performance.emoji}`,
        url: window.location.href,
      }
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
        // You could add a toast notification here
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  // Always extract answers/questions from result if present
  const resultAnswers = result?.answers && Array.isArray(result.answers) ? result.answers : answers;
  const resultQuestions = result?.questions && Array.isArray(result.questions) ? result.questions : questions;

  // Helper for enhancing answers with question data
  const enhancedAnswers = useMemo(() => {
    if (!resultAnswers || !resultQuestions) return [];
    return resultAnswers.map((answer) => {
      const question = resultQuestions.find(q => String(q.id) === String(answer.questionId)) || {};
      return {
        ...answer,
        question: question.question || "Unknown question",
        correctAnswer: question.answer || "Unknown answer",
        difficulty: question.difficulty || "medium",
        saved: question.saved || false
      }
    })
  }, [resultAnswers, resultQuestions]);

  // Enhanced reviewable cards functionality with better mapping
  const reviewableCards = useMemo(() => {
    // Prefer result.reviewCards/stillLearningCards if available
    if (result?.reviewCards?.length > 0 || result?.stillLearningCards?.length > 0) {
      return {
        incorrect: (result.reviewCards || []).map((id: number) => ({
          questionId: id,
          answer: "incorrect"
        })),
        stillLearning: (result.stillLearningCards || []).map((id: number) => ({
          questionId: id,
          answer: "still_learning"
        }))
      };
    }
    // Otherwise use enhancedAnswers
    const incorrect = enhancedAnswers.filter((a: any) => a.answer === "incorrect" || a.isCorrect === false);
    const stillLearning = enhancedAnswers.filter((a: any) => a.answer === "still_learning");
    return { incorrect, stillLearning };
  }, [result, enhancedAnswers]);

  // State for card click visual feedback
  const [clickedCardId, setClickedCardId] = useState<string | number | null>(null);
  // State for review loading indicator
  const [isReviewLoading, setIsReviewLoading] = useState<'incorrect' | 'stillLearning' | null>(null);
  // State to track clicked details cards for visual feedback
  const [clickedDetailCardIds, setClickedDetailCardIds] = useState<Set<string>>(new Set());
  // State for option selection visual feedback
  const [selectedOption, setSelectedOption] = useState<{
    questionId: string | number;
    selection: 'correct' | 'still_learning' | 'incorrect';
  } | null>(null);

  // Handle click on detail card with visual feedback
  const handleDetailCardClick = useCallback((cardId: string) => {
    setClickedDetailCardIds(prev => {
      const newSet = new Set(prev);
      newSet.add(cardId);
      // Remove the card ID after animation completes
      setTimeout(() => {
        setClickedDetailCardIds(prevSet => {
          const updatedSet = new Set(prevSet);
          updatedSet.delete(cardId);
          return updatedSet;
        });
      }, 500);
      return newSet;
    });
  }, []);
  // Handle option selection with visual feedback
  const handleOptionSelect = useCallback((
    questionId: string | number,
    selection: 'correct' | 'still_learning' | 'incorrect'
  ) => {
    setSelectedOption({ questionId, selection });
    // Clear the selection after animation completes
    setTimeout(() => {
      setSelectedOption(null);
    }, 800);
  }, []);
  
  // Helper function for showing visual feedback and navigating
  const showVisualFeedbackAndNavigate = useCallback((type: 'incorrect' | 'stillLearning', callback: () => void) => {
    // Set the card ID for visual feedback
    setClickedCardId(type === 'incorrect' ? 'review-incorrect' : 'review-learning');
    
    // Set loading state
    setIsReviewLoading(type);
    
    // Use requestAnimationFrame to ensure visual feedback happens before navigating
    requestAnimationFrame(() => {
      try {
        callback();
      } catch (error) {
        console.error('Error in navigation callback:', error);
      } finally {
        // Reset loading state after a delay to ensure user sees feedback
        setTimeout(() => setIsReviewLoading(null), 1000);
      }
    });
  }, []);

  // Enhanced review handlers with direct navigation and debugging
  const handleReview = useCallback(() => {
    try {
      if (reviewableCards?.incorrect?.length > 0) {
        const reviewCardIds = reviewableCards.incorrect.map((a: ReviewableCard) => 
          typeof a.questionId === 'string' ? parseInt(a.questionId, 10) : a.questionId
        ).filter(Boolean); // Filter out any null or undefined values
        
        // Add visual feedback before navigating
        setClickedCardId('review-incorrect');
        
        if (reviewCardIds.length === 0) {
          console.warn('No valid review card IDs were found');
          return;
        }
        
        // Create the review URL with timestamp to prevent caching
        const timestamp = Date.now();
        const reviewUrl = `/dashboard/flashcard/${slug}?review=true&cards=${reviewCardIds.join(',')}&t=${timestamp}`;
        console.log('Navigating to review incorrect cards:', reviewUrl);
        
        // Navigate directly
        window.location.href = reviewUrl;
      } else {
        console.warn('No incorrect cards to review');
      }
    } catch (err) {
      console.error('Error in handleReview:', err);
    }
  }, [reviewableCards?.incorrect, slug]);

  const handleReviewStillLearning = useCallback(() => {
    try {
      if (reviewableCards?.stillLearning?.length > 0) {
        const reviewCardIds = reviewableCards.stillLearning.map((a: ReviewableCard) => 
          typeof a.questionId === 'string' ? parseInt(a.questionId, 10) : a.questionId
        ).filter(Boolean); // Filter out any null or undefined values
        
        // Add visual feedback before navigating
        setClickedCardId('review-learning');
        
        if (reviewCardIds.length === 0) {
          console.warn('No valid review card IDs were found');
          return;
        }
        
        // Create the review URL with timestamp to prevent caching
        const timestamp = Date.now();
        const reviewUrl = `/dashboard/flashcard/${slug}?review=true&cards=${reviewCardIds.join(',')}&t=${timestamp}`;
        console.log('Navigating to review still learning cards:', reviewUrl);
        
        // Navigate directly
        window.location.href = reviewUrl;
      } else {
        console.warn('No still learning cards to review');
      }
    } catch (err) {
      console.error('Error in handleReviewStillLearning:', err);
    }
  }, [reviewableCards?.stillLearning, slug]);  // Direct fallback method for review navigation
  const navigateToReview = useCallback((cardIds: (string | number)[]) => {
    try {
      if (!cardIds || cardIds.length === 0) {
        console.error('No card IDs provided for review');
        return;
      }
      
      // Format card IDs
      const formattedIds = cardIds
        .map(id => {
          if (typeof id === 'string') {
            const parsed = parseInt(id, 10);
            return isNaN(parsed) ? null : parsed;
          }
          return id;
        })
        .filter(id => id !== null && id !== undefined);
      
      if (formattedIds.length === 0) {
        console.error('No valid card IDs for review');
        return;
      }
      
      // Create review URL with additional timestamp to force reload
      const timestamp = new Date().getTime();
      const reviewUrl = `/dashboard/flashcard/${slug}?review=true&cards=${formattedIds.join(',')}&ts=${timestamp}`;
      console.log('Navigating directly to:', reviewUrl);
      
      // Use direct window location for most reliable navigation
      window.location.href = reviewUrl;
    } catch (err) {
      console.error('Error in navigateToReview:', err);
    }
  }, [slug]);
  // Enhanced redirect handling from sign-in with persistence
  useEffect(() => {
    // Check for redirect parameters or localStorage flag for sign-in redirect
    const searchParams = new URLSearchParams(window.location.search);
    const fromSignIn = searchParams.get('fromSignIn') === 'true' || localStorage.getItem('flashcard_from_signin') === 'true';
    
    if (fromSignIn) {
      // When returning from sign-in, we want to ensure results are displayed
      if (result || answers.length > 0 || (correctAnswers > 0 && totalQuestions > 0)) {
        // Show confetti animation if score is good and we're coming back from sign-in
        if (percentCorrect >= 70) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }

        // Update localStorage to prevent repeated animations on page refresh
        localStorage.setItem('flashcard_results_shown', 'true');
        
        // Replace URL to remove the redirect parameter
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete('fromSignIn');
        window.history.replaceState(null, '', currentUrl.toString());
        
        // Clear the sign-in flag
        localStorage.removeItem('flashcard_from_signin');
      }
    }
  }, [result, percentCorrect, answers.length, correctAnswers, totalQuestions]);

  // Try to load cached results if available
  useEffect(() => {
    // Only try to load from localStorage if we don't have explicit results yet
    if ((!result || Object.keys(result).length === 0) && 
        totalQuestions === 0 && 
        localStorage.getItem('flashcard_temp_results')) {
      try {
        const cachedResults = JSON.parse(localStorage.getItem('flashcard_temp_results') || '{}');
        if (cachedResults.totalQuestions && cachedResults.correctAnswers !== undefined) {
          // Set internal state from cached results
          const updatedCalculatedResults = {
            totalQuestions: cachedResults.totalQuestions,
            correctAnswers: cachedResults.correctAnswers,
            stillLearningAnswers: cachedResults.stillLearningAnswers || 0,
            incorrectAnswers: cachedResults.incorrectAnswers || 0,
          };
          
          // This is a bit of a hack to update the calculated results,
          // but we're not changing the props directly
          Object.assign(calculatedResults, updatedCalculatedResults);
          
          // Show confetti if it's a good score
          if ((cachedResults.correctAnswers / cachedResults.totalQuestions) >= 0.7 && 
              !hasShownConfettiRef.current) {
            hasShownConfettiRef.current = true;
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
          }
          
          // Clean up after using
          localStorage.removeItem('flashcard_temp_results');
        }
      } catch (error) {
        console.error('Error loading cached results:', error);
        localStorage.removeItem('flashcard_temp_results');
      }
    }
  }, [result, totalQuestions]);



  // If no data
  if (totalQuestions === 0) {
    return (
      <NoResults
        variant="quiz"
        title="No Results Available"
        description="No flashcard results were found. Try taking the quiz again."
        action={{
          label: "Start Flashcards",
          onClick: onRestart || handleGoToFlashcards,
          icon: <RefreshCw className="h-4 w-4" />,
        }}
      />
    )
  }

  // Main result UI
  if (totalQuestions > 0) {
    return (
      <div className="space-y-8">
        {showConfetti && <Confetti isActive={showConfetti} />}
        <FlashCardHeader title={internalTitle} performance={performance} />
        <FlashCardScoreOverview
          percentCorrect={percentCorrect}
          percentStillLearning={percentStillLearning}
          percentIncorrect={percentIncorrect}
          correctAnswers={correctAnswers}
          totalQuestions={totalQuestions}
          stillLearningAnswers={stillLearningAnswers}
          incorrectAnswers={incorrectAnswers}
          formattedTime={formattedTime}
          avgTimePerCard={avgTimePerCard}
        />
        <FlashCardActionButtons
          onRestart={onRestart}
          handleGoToFlashcards={handleGoToFlashcards}
          reviewableCards={reviewableCards}
          clickedCardId={clickedCardId}
          isReviewLoading={isReviewLoading}
          showVisualFeedbackAndNavigate={showVisualFeedbackAndNavigate}
          onReview={onReview}
          handleReview={handleReview}
          navigateToReview={navigateToReview}
          slug={slug}
          onReviewStillLearning={onReviewStillLearning}
          handleReviewStillLearning={handleReviewStillLearning}
          setShowDetailedResults={setShowDetailedResults}
          showDetailedResults={showDetailedResults}
          handleShare={handleShare}
        />
        <FlashCardDetailedResults
          showDetailedResults={showDetailedResults}
          enhancedAnswers={enhancedAnswers}
          clickedDetailCardIds={clickedDetailCardIds}
          handleDetailCardClick={handleDetailCardClick}
          selectedOption={selectedOption}
          handleOptionSelect={handleOptionSelect}
        />
      </div>
    );
  }

  // Loading state
  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <h2 className="text-2xl font-bold">Loading Results...</h2>
      <p className="text-center text-muted-foreground">
        Please wait while we fetch your flashcard results. This may take a few seconds.
      </p>
      <div className="animate-spin h-10 w-10 rounded-full border-4 border-t-4 border-primary" />
    </div>
  );
}

// Define missing subcomponents within the file

// FlashCardHeader component
function FlashCardHeader({ title, performance }: { title: string; performance: any }) {
  return (
    <motion.div
      className="text-center space-y-6 relative bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-8 border-2 border-primary/20 shadow-lg"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <h1 className="text-4xl font-bold">{title}</h1>
      <p className="text-lg font-medium text-primary">{performance.level} {performance.emoji}</p>
    </motion.div>
  );
}

// FlashCardScoreOverview component
function FlashCardScoreOverview({
  percentCorrect,
  percentStillLearning,
  percentIncorrect,
  correctAnswers,
  totalQuestions,
  stillLearningAnswers,
  incorrectAnswers,
  formattedTime,
  avgTimePerCard,
}: any) {
  return (
    <motion.div
      className="overflow-hidden rounded-3xl shadow-2xl border-2 border-primary/10"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      }}
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <h2 className="text-2xl font-bold">{percentCorrect}%</h2>
              <p className="text-sm text-primary">Correct</p>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{percentStillLearning}%</h2>
              <p className="text-sm text-primary">Still Learning</p>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{percentIncorrect}%</h2>
              <p className="text-sm text-primary">Incorrect</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-8 pt-0">
          <p className="text-sm text-center">Time: {formattedTime} | Avg/Card: {avgTimePerCard}s</p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// FlashCardActionButtons component
function FlashCardActionButtons({
  onRestart,
  handleGoToFlashcards,
  reviewableCards,
  clickedCardId,
  isReviewLoading,
  showVisualFeedbackAndNavigate,
  onReview,
  handleReview,
  navigateToReview,
  slug,
  onReviewStillLearning,
  handleReviewStillLearning,
  setShowDetailedResults,
  showDetailedResults,
  handleShare,
}: any) {
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap gap-4 justify-center">
        <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}>
          <Button
            onClick={onRestart || handleGoToFlashcards}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            size="lg"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
        </motion.div>
        {reviewableCards.incorrect.length > 0 && (
          <motion.div
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            animate={{ scale: clickedCardId === "review-incorrect" ? [1, 0.95, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              onClick={handleReview}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-400"
              size="lg"
            >
              Review Incorrect
            </Button>
          </motion.div>
        )}
        {reviewableCards.stillLearning.length > 0 && (
          <motion.div
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            animate={{ scale: clickedCardId === "review-learning" ? [1, 0.95, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              onClick={handleReviewStillLearning}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400"
              size="lg"
            >
              Review Still Learning
            </Button>
          </motion.div>
        )}
        <Button
          onClick={() => setShowDetailedResults((v: boolean) => !v)}
          variant="outline"
          className="flex items-center gap-2"
          size="lg"
        >
          <Eye className="h-4 w-4" />
          {showDetailedResults ? "Hide" : "Show"} Details
        </Button>
        <Button
          onClick={handleShare}
          variant="outline"
          className="flex items-center gap-2"
          size="lg"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  );
}

// FlashCardDetailedResults component
function FlashCardDetailedResults({
  showDetailedResults,
  enhancedAnswers,
  clickedDetailCardIds,
  handleDetailCardClick,
  selectedOption,
  handleOptionSelect,
}: any) {
  if (!showDetailedResults || enhancedAnswers.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <h3 className="text-2xl font-bold text-center">Detailed Results</h3>
      <div className="space-y-3">
        {enhancedAnswers.map((answer: any, index: number) => {
          const isCorrect = answer.answer === "correct" || answer.isCorrect === true;
          const isStillLearning = answer.answer === "still_learning";
          const isIncorrect = answer.answer === "incorrect" || answer.isCorrect === false;
          const cardId = `${answer.questionId}-${index}`;
          const isCardClicked = clickedDetailCardIds.has(cardId);

          return (
            <motion.div
              key={cardId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                scale: isCardClicked ? 0.98 : 1,
                boxShadow: isCardClicked ? '0 0 0 3px rgba(0,0,0,0.1)' : 'none'
              }}
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleDetailCardClick(cardId)}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isCorrect 
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
                  : isStillLearning
                  ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800'
                  : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'                    } ${isCardClicked ? 'ring-2 ring-offset-1 ring-primary/30' : ''} 
              ${selectedOption && String(selectedOption.questionId) === String(answer.questionId) ? 'shadow-lg transform scale-[1.01]' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 ${
                  isCorrect 
                    ? 'text-green-500'
                    : isStillLearning
                    ? 'text-yellow-500'
                    : 'text-red-500'
                }`}>
                  <motion.div
                    animate={{
                      scale: selectedOption && 
                             String(selectedOption.questionId) === String(answer.questionId) ? 
                             [1, 1.4, 1] : 1,
                      rotate: selectedOption && 
                              String(selectedOption.questionId) === String(answer.questionId) ? 
                              [0, 15, -15, 0] : 0
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : isStillLearning ? (
                      <Activity className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                  </motion.div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm mb-2">
                    Question {index + 1}
                    {answer.difficulty && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {answer.difficulty}
                      </Badge>
                    )}
                    {answer.saved && (
                      <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700">
                        Saved
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {answer.question}
                  </div>
                  <div className="text-sm">
                    <strong>Answer:</strong> {answer.correctAnswer}
                  </div>
                  {answer.timeSpent !== undefined && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Time spent: {answer.timeSpent}s
                    </div>
                  )}
                  
                  {/* Option feedback buttons */}
                  <div className="flex gap-2 mt-3">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionSelect(answer.questionId, 'correct');
                      }}
                      className={`rounded-full p-1.5 ${
                        isCorrect ? 'bg-green-100 text-green-600 ring-1 ring-green-300' : 'bg-muted/40 hover:bg-green-50 hover:text-green-500'
                      } transition-all`}
                    >
                      <ThumbsUp size={14} />
                    </motion.button>
                    
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionSelect(answer.questionId, 'still_learning');
                      }}
                      className={`rounded-full p-1.5 ${
                        isStillLearning ? 'bg-yellow-100 text-yellow-600 ring-1 ring-yellow-300' : 'bg-muted/40 hover:bg-yellow-50 hover:text-yellow-500'
                      } transition-all`}
                    >
                      <Activity size={14} />
                    </motion.button>
                    
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionSelect(answer.questionId, 'incorrect');
                      }}
                      className={`rounded-full p-1.5 ${
                        isIncorrect ? 'bg-red-100 text-red-600 ring-1 ring-red-300' : 'bg-muted/40 hover:bg-red-50 hover:text-red-500'
                      } transition-all`}
                    >
                      <ThumbsDown size={14} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
    </div>
  </motion.div>
);
}

