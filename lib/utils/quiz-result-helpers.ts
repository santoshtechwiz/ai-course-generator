import { calculateAnswerSimilarity, getSimilarityFeedback } from "./similarity-scoring";

/**
 * Common utility functions for quiz result components to ensure consistency
 */

/**
 * Determines the performance level based on percentage score
 */
export function getPerformanceLevel(percentage: number) {
  if (percentage >= 90)
    return {
      level: "Excellent",
      message: "Outstanding! You've mastered this topic.",
      color: "text-green-500",
      bgColor: "bg-green-50", 
      borderColor: "border-green-200",
      emoji: "🏆",
    }
  if (percentage >= 80)
    return {
      level: "Very Good",
      message: "Great job! You have strong understanding.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      emoji: "🎯",
    }
  if (percentage >= 70)
    return {
      level: "Good",
      message: "Well done! Your knowledge is solid.",
      color: "text-green-500", 
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      emoji: "✅",
    }
  if (percentage >= 60)
    return {
      level: "Satisfactory",
      message: "Good effort! Keep studying to improve.",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      emoji: "📚",
    }
  if (percentage >= 50)
    return {
      level: "Needs Improvement",
      message: "You're making progress. More study needed.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      emoji: "💪",
    }
  return {
    level: "Study Required",
    message: "Keep learning! Review the material thoroughly.",
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    emoji: "📖",
  }
}

/**
 * Convert a similarity score to a user-friendly label
 */
export function getSimilarityLabel(similarity: number) {
  if (similarity >= 0.9) return "Correct"
  if (similarity >= 0.7) return "Almost Correct"
  if (similarity >= 0.5) return "Close"
  return "Incorrect"
}

/**
 * Calculate whether an answer should receive credit based on similarity score
 * and determine the color and visual indicators
 */
export function getAnswerVisualElements(similarity: number) {
  if (similarity >= 0.9) {
    return {
      color: "text-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
      label: "Correct",
      emoji: "✓",
      isCorrect: true,
      isPartiallyCorrect: false
    }
  } else if (similarity >= 0.7) {
    return {
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200", 
      textColor: "text-blue-700",
      label: "Almost Correct",
      emoji: "~",
      isCorrect: false,
      isPartiallyCorrect: true
    }
  } else if (similarity >= 0.5) {
    return {
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-700", 
      label: "Close",
      emoji: "⚠️",
      isCorrect: false,
      isPartiallyCorrect: false
    }
  } else {
    return {
      color: "text-red-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-700",
      label: "Incorrect",
      emoji: "✗",
      isCorrect: false, 
      isPartiallyCorrect: false
    }
  }
}

/**
 * Process a raw answer object to ensure consistent presentation and scoring
 * across all quiz types
 */
export function processQuizAnswer({
  userAnswer,
  correctAnswer,
  isCorrect,
  similarity
}: {
  userAnswer: string;
  correctAnswer: string;
  isCorrect?: boolean;
  similarity?: number;
}) {
  // Calculate similarity if not provided
  const simScore = similarity !== undefined ? similarity : 
    calculateAnswerSimilarity(userAnswer, correctAnswer).similarity;
  
  // Determine correctness based on similarity if not explicitly set
  const isAnswerCorrect = isCorrect !== undefined ? isCorrect : simScore >= 0.7;
  
  // Generate visual elements and feedback based on similarity
  const visuals = getAnswerVisualElements(simScore);
  
  return {
    userAnswer,
    correctAnswer,
    similarity: simScore,
    isCorrect: isAnswerCorrect,
    similarityLabel: getSimilarityLabel(simScore),
    feedback: getSimilarityFeedback(simScore),
    visualElements: visuals,
    points: simScore >= 0.9 ? 1 : simScore >= 0.7 ? 0.5 : 0
  };
}
