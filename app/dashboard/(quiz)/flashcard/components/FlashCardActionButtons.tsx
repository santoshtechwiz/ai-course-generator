
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { RotateCcw, Eye, Share2 } from "lucide-react";

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

  export default FlashCardActionButtons;