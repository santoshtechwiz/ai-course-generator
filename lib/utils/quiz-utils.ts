/**
 * Calculates the performance level based on a score percentage
 * @param percentage Score percentage (0-100)
 * @returns Performance level descriptor
 */
export function calculatePerformanceLevel(percentage: number): string {
  if (percentage >= 90) return "Excellent"
  if (percentage >= 80) return "Very Good"
  if (percentage >= 70) return "Good" 
  if (percentage >= 60) return "Fair"
  if (percentage >= 50) return "Needs Work"
  return "Poor"
}

/**
 * Formats time in seconds to a human-readable string
 * @param seconds Total seconds
 * @returns Formatted time string
 */
export function formatTimeSpent(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} sec`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSecs = seconds % 60
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSecs}s`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMins = minutes % 60
  
  return `${hours}h ${remainingMins}m ${remainingSecs}s`
}

/**
 * Gets the appropriate color based on score percentage
 * @param percentage Score percentage (0-100)
 * @returns CSS color class
 */
export function getScoreColor(percentage: number): string {
  if (percentage >= 90) return "text-emerald-600 dark:text-emerald-400"
  if (percentage >= 80) return "text-blue-600 dark:text-blue-400"
  if (percentage >= 70) return "text-green-600 dark:text-green-400"
  if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400"
  if (percentage >= 50) return "text-orange-600 dark:text-orange-400"
  return "text-red-600 dark:text-red-400"
}


/**
 * Performance level calculation with enhanced feedback
 */
export function getPerformanceLevel(percentage: number) {
  if (percentage >= 90)
    return {
      level: "Excellent",
      message: "Outstanding! You've mastered this topic.",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      emoji: "🏆",
      grade: "A+",
      insights: "You demonstrate exceptional understanding. Consider teaching others!"
    }
  if (percentage >= 80)
    return {
      level: "Very Good",
      message: "Great job! You have strong understanding.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      emoji: "🎯",
      grade: "A",
      insights: "Excellent work! Review the few mistakes to achieve perfection."
    }
  if (percentage >= 70)
    return {
      level: "Good",
      message: "Well done! Your knowledge is solid.",
      color: "text-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      emoji: "✅",
      grade: "B",
      insights: "Good foundation! Focus on the areas you missed for improvement."
    }
  if (percentage >= 60)
    return {
      level: "Fair",
      message: "Good effort! Keep studying to improve.",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      emoji: "📚",
      grade: "C",
      insights: "You're on the right track. More practice will boost your confidence."
    }
  if (percentage >= 50)
    return {
      level: "Needs Work",
      message: "You're making progress. More study needed.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      emoji: "💪",
      grade: "D",
      insights: "Don't give up! Review the material and try again."
    }
  return {
    level: "Poor",
    message: "Keep learning! Review the material thoroughly.",
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    emoji: "📖",
    grade: "F",
    insights: "This is a learning opportunity. Take time to study the concepts."
  }
}
export function extractUserAnswers(result: { title?: string; slug?: string; quizId?: string; score: number; maxScore: number; percentage: number; completedAt?: string; submittedAt?: string; totalTime?: number; questions?: Array<any>; answers?: Array<any>; questionResults: Array<{ questionId: string; question: string; userAnswer: string; correctAnswer: string; isCorrect: boolean; type: string; options?: Array<QuestionOption>; selectedOptionId?: string }> }): any {
  return result.questionResults.map((q) => {
    const options = q.options || []
    const userAnswerId = options.find(opt => opt.text === q.userAnswer)?.id || null
    const correctAnswerId = options.find(opt => opt.text === q.correctAnswer)?.id || null

    return {
      questionId: q.questionId,
      question: q.question,
      userAnswer: q.userAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect: q.isCorrect,
      type: q.type,
      options: options.map(opt => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect
      })),
      userAnswerId,
      correctAnswerId,
      timeSpent: result.totalTime ? result.totalTime / result.questions.length : 0 // Average time per question
    }
  })
}
