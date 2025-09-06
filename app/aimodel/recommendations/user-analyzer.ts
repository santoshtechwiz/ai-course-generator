/**
 * User Analyzer
 * 
 * Analyzes user learning patterns and behaviors to create comprehensive profiles
 */

import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

export interface UserProfile {
  userId: string
  level: 'beginner' | 'intermediate' | 'advanced'
  activityLevel: 'low' | 'medium' | 'high'
  preferredTopics: string[]
  recentTopics: string[]
  completedCourses: Array<{ id: string; title: string; category?: string }>
  attemptedQuizzes: Array<{ id: string; title: string; type: string; score: number }>
  weakAreas: Array<{ topic: string; averageScore: number }>
  strongAreas: Array<{ topic: string; averageScore: number }>
  learningVelocity: number // courses completed per month
  currentStreak: number // days of continuous learning
  totalLearningTime: number // in minutes
  lastActivityDate: Date | null
  preferences: {
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    contentTypes: string[]
    studyTime: 'short' | 'medium' | 'long'
  }
}

export class UserAnalyzer {
  private profileCache: Map<string, { profile: UserProfile; expiry: number }> = new Map()
  private readonly CACHE_TTL = 30 * 60 * 1000 // 30 minutes

  async initialize(): Promise<void> {
    logger.info('User Analyzer initialized')
  }

  /**
   * Analyze user and create comprehensive profile
   */
  async analyzeUser(userId: string): Promise<UserProfile> {
    // Check cache
    const cached = this.profileCache.get(userId)
    if (cached && Date.now() < cached.expiry) {
      return cached.profile
    }

    try {
      const profile = await this.buildUserProfile(userId)
      
      // Cache the profile
      this.profileCache.set(userId, {
        profile,
        expiry: Date.now() + this.CACHE_TTL
      })

      return profile
    } catch (error) {
      logger.error('Failed to analyze user', { error, userId })
      return this.getDefaultProfile(userId)
    }
  }

  /**
   * Build comprehensive user profile
   */
  private async buildUserProfile(userId: string): Promise<UserProfile> {
    const [
      courseProgress,
      quizAttempts,
      learningEvents,
      userPreferences
    ] = await Promise.all([
      this.getCourseProgress(userId),
      this.getQuizAttempts(userId),
      this.getLearningEvents(userId),
      this.getUserPreferences(userId)
    ])

    const completedCourses = courseProgress
      .filter(cp => cp.isCompleted)
      .map(cp => ({
        id: String(cp.courseId),
        title: cp.course.title,
        category: cp.course.category?.name
      }))

    const attemptedQuizzes = quizAttempts.map(qa => ({
      id: String(qa.userQuizId),
      title: qa.userQuiz.title,
      type: qa.userQuiz.quizType,
      score: qa.score || 0
    }))

    // Analyze learning patterns
    const preferredTopics = this.extractPreferredTopics(courseProgress, learningEvents)
    const recentTopics = this.extractRecentTopics(learningEvents)
    const weakAreas = this.analyzeWeakAreas(quizAttempts)
    const strongAreas = this.analyzeStrongAreas(quizAttempts)
    const level = this.determineUserLevel(courseProgress, quizAttempts)
    const activityLevel = this.determineActivityLevel(learningEvents, courseProgress)
    const learningVelocity = this.calculateLearningVelocity(courseProgress)
    const currentStreak = this.calculateStreak(learningEvents)
    const totalLearningTime = this.calculateTotalLearningTime(courseProgress, quizAttempts)
    const lastActivityDate = this.getLastActivityDate(learningEvents, courseProgress)

    return {
      userId,
      level,
      activityLevel,
      preferredTopics,
      recentTopics,
      completedCourses,
      attemptedQuizzes,
      weakAreas,
      strongAreas,
      learningVelocity,
      currentStreak,
      totalLearningTime,
      lastActivityDate,
      preferences: userPreferences || {
        difficulty: level,
        contentTypes: ['course', 'quiz'],
        studyTime: activityLevel === 'high' ? 'long' : activityLevel === 'medium' ? 'medium' : 'short'
      }
    }
  }

  /**
   * Get course progress data
   */
  private async getCourseProgress(userId: string) {
    return await prisma.courseProgress.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            title: true,
            category: { select: { name: true } }
          }
        }
      },
      orderBy: { lastAccessedAt: 'desc' }
    })
  }

  /**
   * Get quiz attempts data
   */
  private async getQuizAttempts(userId: string) {
    return await prisma.userQuizAttempt.findMany({
      where: { userId },
      include: {
        userQuiz: {
          select: {
            title: true,
            quizType: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
  }

  /**
   * Get learning events data
   */
  private async getLearningEvents(userId: string) {
    return await prisma.learningEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
  }

  /**
   * Get user preferences (mock implementation)
   */
  private async getUserPreferences(userId: string) {
    // This would typically fetch from user preferences table
    return null
  }

  /**
   * Extract preferred topics from user activity
   */
  private extractPreferredTopics(courseProgress: any[], learningEvents: any[]): string[] {
    const topicCounts = new Map<string, number>()

    // Count from completed courses
    courseProgress
      .filter(cp => cp.isCompleted)
      .forEach(cp => {
        if (cp.course.category?.name) {
          const topic = cp.course.category.name
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 2) // Weight completed courses higher
        }
      })

    // Count from learning events
    learningEvents.forEach(event => {
      if (event.metadata?.topic) {
        const topic = event.metadata.topic
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
      }
    })

    return Array.from(topicCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic)
  }

  /**
   * Extract recent topics from learning events
   */
  private extractRecentTopics(learningEvents: any[]): string[] {
    const recentEvents = learningEvents.slice(0, 20)
    const topicCounts = new Map<string, number>()

    recentEvents.forEach(event => {
      if (event.metadata?.topic) {
        const topic = event.metadata.topic
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
      }
    })

    return Array.from(topicCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic)
  }

  /**
   * Analyze weak areas from quiz performance
   */
  private analyzeWeakAreas(quizAttempts: any[]): Array<{ topic: string; averageScore: number }> {
    const topicScores = new Map<string, number[]>()

    quizAttempts.forEach(attempt => {
      const topic = this.extractTopicFromTitle(attempt.userQuiz.title)
      if (!topicScores.has(topic)) {
        topicScores.set(topic, [])
      }
      topicScores.get(topic)!.push(attempt.score || 0)
    })

    return Array.from(topicScores.entries())
      .map(([topic, scores]) => ({
        topic,
        averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length
      }))
      .filter(item => item.averageScore < 70 && item.averageScore > 0)
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 3)
  }

  /**
   * Analyze strong areas from quiz performance
   */
  private analyzeStrongAreas(quizAttempts: any[]): Array<{ topic: string; averageScore: number }> {
    const topicScores = new Map<string, number[]>()

    quizAttempts.forEach(attempt => {
      const topic = this.extractTopicFromTitle(attempt.userQuiz.title)
      if (!topicScores.has(topic)) {
        topicScores.set(topic, [])
      }
      topicScores.get(topic)!.push(attempt.score || 0)
    })

    return Array.from(topicScores.entries())
      .map(([topic, scores]) => ({
        topic,
        averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length
      }))
      .filter(item => item.averageScore >= 80)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 3)
  }

  /**
   * Determine user skill level
   */
  private determineUserLevel(courseProgress: any[], quizAttempts: any[]): 'beginner' | 'intermediate' | 'advanced' {
    const completedCourses = courseProgress.filter(cp => cp.isCompleted).length
    const averageQuizScore = quizAttempts.length > 0 
      ? quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / quizAttempts.length 
      : 0

    if (completedCourses >= 10 && averageQuizScore >= 80) {
      return 'advanced'
    } else if (completedCourses >= 3 && averageQuizScore >= 60) {
      return 'intermediate'
    } else {
      return 'beginner'
    }
  }

  /**
   * Determine activity level
   */
  private determineActivityLevel(learningEvents: any[], courseProgress: any[]): 'low' | 'medium' | 'high' {
    const recentActivity = learningEvents.filter(event => {
      const daysSince = (Date.now() - new Date(event.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      return daysSince <= 7
    }).length

    const totalTimeSpent = courseProgress.reduce((sum, cp) => sum + (cp.timeSpent || 0), 0)

    if (recentActivity >= 10 || totalTimeSpent > 20000) {
      return 'high'
    } else if (recentActivity >= 3 || totalTimeSpent > 5000) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  /**
   * Calculate learning velocity (courses per month)
   */
  private calculateLearningVelocity(courseProgress: any[]): number {
    const completedCourses = courseProgress.filter(cp => cp.isCompleted)
    
    if (completedCourses.length === 0) return 0

    const oldestCompletion = completedCourses.reduce((oldest, current) => {
      return new Date(current.lastAccessedAt) < new Date(oldest.lastAccessedAt) ? current : oldest
    })

    const monthsSinceStart = (Date.now() - new Date(oldestCompletion.lastAccessedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
    
    return monthsSinceStart > 0 ? completedCourses.length / monthsSinceStart : completedCourses.length
  }

  /**
   * Calculate current learning streak
   */
  private calculateStreak(learningEvents: any[]): number {
    if (learningEvents.length === 0) return 0

    const today = new Date()
    let streak = 0
    let currentDate = new Date(today)

    // Check each day going backwards
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const dayStart = new Date(currentDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(currentDate)
      dayEnd.setHours(23, 59, 59, 999)

      const hasActivity = learningEvents.some(event => {
        const eventDate = new Date(event.createdAt)
        return eventDate >= dayStart && eventDate <= dayEnd
      })

      if (hasActivity) {
        streak++
      } else if (i > 0) { // Allow for today to have no activity yet
        break
      }

      currentDate.setDate(currentDate.getDate() - 1)
    }

    return streak
  }

  /**
   * Calculate total learning time
   */
  private calculateTotalLearningTime(courseProgress: any[], quizAttempts: any[]): number {
    const courseTime = courseProgress.reduce((sum, cp) => sum + (cp.timeSpent || 0), 0)
    const quizTime = quizAttempts.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0)
    return courseTime + quizTime
  }

  /**
   * Get last activity date
   */
  private getLastActivityDate(learningEvents: any[], courseProgress: any[]): Date | null {
    const dates: Date[] = []

    if (learningEvents.length > 0) {
      dates.push(new Date(learningEvents[0].createdAt))
    }

    if (courseProgress.length > 0) {
      const latestProgress = courseProgress.reduce((latest, current) => {
        return new Date(current.lastAccessedAt) > new Date(latest.lastAccessedAt) ? current : latest
      })
      dates.push(new Date(latestProgress.lastAccessedAt))
    }

    return dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null
  }

  /**
   * Extract topic from quiz title
   */
  private extractTopicFromTitle(title: string): string {
    const commonTopics = [
      'JavaScript', 'React', 'Node.js', 'CSS', 'HTML', 'TypeScript',
      'Python', 'Java', 'C++', 'SQL', 'Database', 'Machine Learning',
      'AI', 'Data Science', 'Web Development', 'Mobile Development'
    ]

    for (const topic of commonTopics) {
      if (title.toLowerCase().includes(topic.toLowerCase())) {
        return topic
      }
    }

    return title.split(' ')[0] || 'General'
  }

  /**
   * Get default profile for new users
   */
  private getDefaultProfile(userId: string): UserProfile {
    return {
      userId,
      level: 'beginner',
      activityLevel: 'low',
      preferredTopics: [],
      recentTopics: [],
      completedCourses: [],
      attemptedQuizzes: [],
      weakAreas: [],
      strongAreas: [],
      learningVelocity: 0,
      currentStreak: 0,
      totalLearningTime: 0,
      lastActivityDate: null,
      preferences: {
        difficulty: 'beginner',
        contentTypes: ['course', 'quiz'],
        studyTime: 'short'
      }
    }
  }

  /**
   * Clear cached profile for user
   */
  clearCache(userId: string): void {
    this.profileCache.delete(userId)
  }

  /**
   * Get cached profile if available
   */
  getCachedProfile(userId: string): UserProfile | null {
    const cached = this.profileCache.get(userId)
    if (cached && Date.now() < cached.expiry) {
      return cached.profile
    }
    return null
  }
}
