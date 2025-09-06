"use server"

import prisma from "@/lib/db"

export interface QuizAttemptData {
  id: string
  quizId: string
  score: number
  accuracy: number
  timeSpent: number
  createdAt: string
  quiz: {
    title: string
    slug: string
    quizType: string
    questionCount: number
  }
}

export interface QuizProgressData {
  id: string
  quizId: number
  progress: number
  isCompleted: boolean
  bestScore: number
  attempts: number
  lastAttemptAt: string
  quiz: {
    title: string
    slug: string
    difficulty: string
    questionCount: number
  }
}

export interface PerformanceStats {
  totalQuizzes: number
  completedQuizzes: number
  averageScore: number
  averageAccuracy: number
  totalTimeSpent: number
  bestStreak: number
  currentStreak: number
  improvementRate: number
}

export interface WeakArea {
  topic: string
  averageScore: number
  attempts: number
  improvement: number
}

export interface QuizPerformanceResponse {
  recentAttempts: QuizAttemptData[]
  quizProgresses: QuizProgressData[]
  performanceStats: PerformanceStats
  weakAreas: WeakArea[]
}

export async function getUserQuizPerformance(userId: string): Promise<QuizPerformanceResponse> {
  try {
    // Get recent quiz attempts with quiz details using proper join
    const recentAttempts = await prisma.userQuizAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        userQuiz: {
          select: {
            id: true,
            title: true,
            slug: true,
            quizType: true,
            questions: {
              select: { id: true }
            }
          }
        }
      }
    })

    // Get all quiz attempts for stats calculation using aggregation
    const attemptsStats = await prisma.userQuizAttempt.aggregate({
      where: { userId },
      _avg: {
        score: true,
        accuracy: true,
        timeSpent: true
      },
      _count: {
        id: true
      }
    })

    // Get user's quiz progresses with proper join
    const userQuizzes = await prisma.userQuiz.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        quizType: true,
        questions: {
          select: { id: true }
        },
        attempts: {
          select: {
            score: true,
            accuracy: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    // Calculate performance stats
    const totalQuizzes = userQuizzes.length
    const completedQuizzes = userQuizzes.filter(quiz => quiz.attempts.length > 0).length

    const averageScore = attemptsStats._avg.score || 0
    const averageAccuracy = attemptsStats._avg.accuracy || 0
    const totalTimeSpent = (attemptsStats._avg.timeSpent || 0) * attemptsStats._count.id

    // Calculate streak (simplified - consecutive days with quiz activity)
    const currentStreak = calculateCurrentStreak(recentAttempts.map(a => a.createdAt))
    const bestStreak = Math.max(currentStreak, calculateBestStreak(recentAttempts.map(a => a.createdAt)))

    // Calculate improvement rate (comparing first half vs second half of attempts)
    const improvementRate = calculateImprovementRate(recentAttempts.map(a => a.score || 0))

    // Transform recent attempts data
    const recentAttemptsData: QuizAttemptData[] = recentAttempts.map(attempt => ({
      id: attempt.id.toString(),
      quizId: attempt.userQuizId.toString(),
      score: attempt.score || 0,
      accuracy: attempt.accuracy || 0,
      timeSpent: attempt.timeSpent || 0,
      createdAt: attempt.createdAt.toISOString(),
      quiz: {
        title: attempt.userQuiz.title,
        slug: attempt.userQuiz.slug || 'untitled',
        quizType: attempt.userQuiz.quizType || 'mcq',
        questionCount: attempt.userQuiz.questions.length
      }
    }))

    // Transform quiz progress data
    const quizProgressesData: QuizProgressData[] = userQuizzes.map(quiz => {
      const attempts = quiz.attempts
      const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score || 0)) : 0
      const isCompleted = attempts.length > 0 && bestScore >= 70 // Assuming 70% is passing

      return {
        id: quiz.id.toString(),
        quizId: quiz.id,
        progress: isCompleted ? 100 : (attempts.length > 0 ? 50 : 0), // Simplified progress calculation
        isCompleted,
        bestScore,
        attempts: attempts.length,
        lastAttemptAt: attempts.length > 0 ? attempts[0].createdAt.toISOString() : new Date().toISOString(),
        quiz: {
          title: quiz.title,
          slug: quiz.slug || 'untitled',
          difficulty: quiz.difficulty || 'medium',
          questionCount: quiz.questions.length
        }
      }
    })

    // Calculate weak areas (simplified - based on quiz topics)
    const weakAreas: WeakArea[] = calculateWeakAreas(userQuizzes)

    return {
      recentAttempts: recentAttemptsData,
      quizProgresses: quizProgressesData,
      performanceStats: {
        totalQuizzes,
        completedQuizzes,
        averageScore: Math.round(averageScore),
        averageAccuracy: Math.round(averageAccuracy),
        totalTimeSpent: Math.round(totalTimeSpent),
        bestStreak,
        currentStreak,
        improvementRate: Math.round(improvementRate * 100) / 100
      },
      weakAreas
    }
  } catch (error) {
    console.error('Error fetching quiz performance:', error)
    return {
      recentAttempts: [],
      quizProgresses: [],
      performanceStats: {
        totalQuizzes: 0,
        completedQuizzes: 0,
        averageScore: 0,
        averageAccuracy: 0,
        totalTimeSpent: 0,
        bestStreak: 0,
        currentStreak: 0,
        improvementRate: 0
      },
      weakAreas: []
    }
  }
}

function calculateCurrentStreak(dates: Date[]): number {
  if (dates.length === 0) return 0
  
  const sortedDates = dates.sort((a, b) => b.getTime() - a.getTime())
  const today = new Date()
  const oneDayMs = 24 * 60 * 60 * 1000
  
  let streak = 0
  let currentDate = today
  
  for (const date of sortedDates) {
    const daysDiff = Math.floor((currentDate.getTime() - date.getTime()) / oneDayMs)
    if (daysDiff <= 1) {
      streak++
      currentDate = date
    } else {
      break
    }
  }
  
  return streak
}

function calculateBestStreak(dates: Date[]): number {
  if (dates.length === 0) return 0
  
  const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime())
  const oneDayMs = 24 * 60 * 60 * 1000
  
  let maxStreak = 1
  let currentStreak = 1
  
  for (let i = 1; i < sortedDates.length; i++) {
    const daysDiff = Math.floor((sortedDates[i].getTime() - sortedDates[i-1].getTime()) / oneDayMs)
    if (daysDiff <= 1) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 1
    }
  }
  
  return maxStreak
}

function calculateImprovementRate(scores: number[]): number {
  if (scores.length < 4) return 0
  
  const halfPoint = Math.floor(scores.length / 2)
  const firstHalf = scores.slice(0, halfPoint)
  const secondHalf = scores.slice(halfPoint)
  
  const firstHalfAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length
  const secondHalfAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length
  
  return secondHalfAvg - firstHalfAvg
}

function calculateWeakAreas(quizzes: any[]): WeakArea[] {
  // Simplified implementation - extract topics from quiz titles
  const topicPerformance: { [topic: string]: { scores: number[], attempts: number } } = {}
  
  quizzes.forEach(quiz => {
    // Extract topic from title (simplified)
    const topic = extractTopicFromTitle(quiz.title)
    if (!topicPerformance[topic]) {
      topicPerformance[topic] = { scores: [], attempts: 0 }
    }
    
    quiz.attempts.forEach((attempt: any) => {
      topicPerformance[topic].scores.push(attempt.score || 0)
      topicPerformance[topic].attempts++
    })
  })
  
  // Convert to weak areas (topics with below average performance)
  const weakAreas: WeakArea[] = []
  const overallAverage = 75 // Assuming 75% is the target average
  
  Object.entries(topicPerformance).forEach(([topic, data]) => {
    if (data.scores.length > 0) {
      const averageScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
      if (averageScore < overallAverage) {
        // Calculate improvement trend (simplified)
        const improvement = data.scores.length > 1 
          ? data.scores[data.scores.length - 1] - data.scores[0]
          : 0
        
        weakAreas.push({
          topic,
          averageScore: Math.round(averageScore),
          attempts: data.attempts,
          improvement: Math.round(improvement * 10) / 10
        })
      }
    }
  })
  
  return weakAreas.slice(0, 5) // Return top 5 weak areas
}

function extractTopicFromTitle(title: string): string {
  // Simplified topic extraction - you can enhance this based on your quiz naming patterns
  const commonTopics = ['JavaScript', 'React', 'Node.js', 'CSS', 'HTML', 'TypeScript', 'Python', 'Database']
  
  for (const topic of commonTopics) {
    if (title.toLowerCase().includes(topic.toLowerCase())) {
      return topic
    }
  }
  
  // Fallback to first word or "General"
  return title.split(' ')[0] || 'General'
}
