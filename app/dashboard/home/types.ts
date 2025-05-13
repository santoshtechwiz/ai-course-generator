// Add these types to your types.ts file if they don't already exist

export interface UserStats {
  totalQuizzes: number
  totalAttempts: number
  averageScore: number
  highestScore: number
  completedCourses: number
  totalCourses: number
  totalTimeSpent: number
  averageTimePerQuiz: number
  topPerformingTopics: TopicPerformance[]
  recentImprovement: number
  quizzesPerMonth: number
  courseCompletionRate: number
  consistencyScore: number
  learningEfficiency: number
  difficultyProgression: number
  averageAccuracy: number
  streakDays: number
  engagementScore: number
  quizTypeDistribution: Record<string, number>
  learningPatterns: {
    morningQuizzes: number
    afternoonQuizzes: number
    eveningQuizzes: number
    nightQuizzes: number
  }
  strengthAreas: string[]
  improvementAreas: string[]
}

export interface TopicPerformance {
  topic: string
  title: string
  averageScore: number
  attempts: number
  averageTimeSpent: number
  difficulty?: string
}

export interface UserQuiz {
  id: number;
  title: string;
  slug: string;
  quizType: string; // Ensure this matches the QuizType enum
  bestScore?: number;
  progress?: number;
  timeEnded?: Date | null;
}

// Make sure your UserQuizAttempt type includes these fields
export interface UserQuizAttempt {
  id: number
  userId: string
  userQuizId: number
  score?: number
  timeSpent?: number
  improvement?: number
  accuracy?: number
  createdAt: Date
  updatedAt: Date
  userQuiz: {
    id: number
    title: string
    quizType?: string
    difficulty?: string
    questions: {
      id: number
      question: string
      answer: string
      questionType?: string
      openEndedQuestion?: {
        hints: string[]
        difficulty: string
        tags: string[]
      }
    }[]
  }
  attemptQuestions: {
    id: number
    questionId: number
    userAnswer?: string
    isCorrect?: boolean
    timeSpent: number
  }[]
}
