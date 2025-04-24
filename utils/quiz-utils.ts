/**
 * Quiz utility functions
 */

// Get performance level based on score
export function getPerformanceLevel(score: number) {
  if (score >= 90) {
    return {
      label: "Excellent",
      message: "Outstanding performance! You've mastered this topic.",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-600 dark:bg-green-500",
    }
  } else if (score >= 75) {
    return {
      label: "Good",
      message: "Great job! You have a solid understanding of this topic.",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500 dark:bg-green-400",
    }
  } else if (score >= 60) {
    return {
      label: "Satisfactory",
      message: "Good effort! You're on the right track.",
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-500 dark:bg-yellow-400",
    }
  } else if (score >= 40) {
    return {
      label: "Needs Improvement",
      message: "You're making progress, but this topic needs more review.",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-500 dark:bg-orange-400",
    }
  } else {
    return {
      label: "Review Required",
      message: "This topic requires significant review. Don't give up!",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-500 dark:bg-red-400",
    }
  }
}

// Get answer class name based on similarity
export function getAnswerClassName(similarity: number) {
  if (similarity === 100) {
    return "font-bold text-green-600 dark:text-green-400"
  } else if (similarity > 80) {
    return "font-semibold text-yellow-600 dark:text-yellow-400"
  } else if (similarity > 50) {
    return "font-medium text-orange-600 dark:text-orange-400"
  } else {
    return "font-normal text-red-600 dark:text-red-400"
  }
}

// Format time for display
export function formatQuizTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}

// Create a standardized quiz result object
export function createQuizResult(
  quizId: string,
  slug: string,
  quizType: string,
  score: number,
  answers: any[],
  totalTime: number,
) {
  return {
    quizId,
    slug,
    quizType,
    score,
    answers,
    totalTime,
    timestamp: Date.now(),
    isCompleted: true,
  }
}

// Safely parse URL parameters
export function getUrlParams(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams()
  return new URLSearchParams(window.location.search)
}

// Check if a quiz is completed from URL
export function isQuizCompletedFromUrl(): boolean {
  return getUrlParams().get("completed") === "true"
}
