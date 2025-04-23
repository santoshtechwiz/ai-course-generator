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

// Calculate score based on answers
export function calculateScore(answers: any[], quizType: string): number {
  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return 0
  }

  switch (quizType) {
    case "mcq":
      // For MCQ, count correct answers
      const correctCount = answers.filter((a) => a && a.isCorrect).length
      return Math.round((correctCount / answers.length) * 100)

    case "blanks":
      // For fill-in-the-blanks, average the similarity scores
      const totalSimilarity = answers.reduce((sum, a) => sum + (a.similarity || 0), 0)
      return Math.round(totalSimilarity / answers.length)

    case "openended":
      // For open-ended, average the similarity scores
      const openEndedSimilarity = answers.reduce((sum, a) => sum + (a.similarity || 0), 0)
      return Math.round(openEndedSimilarity / answers.length)

    case "code":
      // For code quizzes, count correct answers
      const codeCorrectCount = answers.filter((a) => a && a.isCorrect).length
      return Math.round((codeCorrectCount / answers.length) * 100)

    default:
      // Default scoring method
      const defaultCorrectCount = answers.filter((a) => a && a.isCorrect).length
      return Math.round((defaultCorrectCount / answers.length) * 100)
  }
}

