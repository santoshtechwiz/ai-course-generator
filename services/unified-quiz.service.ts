/**
 * Unified Quiz Service
 * 
 * Centralizes logic for quiz completion across all types:
 * - MCQ, Fill-in-Blanks, Open-ended, Coding, Flashcards, Ordering
 * 
 * COMMIT: Ensures consistent streak tracking, badge unlocks, and progress sync
 * 
 * UPDATED: Now uses universal-streak service for ALL quiz types
 */
import { updateUniversalStreak, getUserStreakStats } from './universal-streak'
import { badgeService } from './badge.service'
import { usageLimitService } from './usage-limit.service'
import prisma from '@/lib/db'

type QuizType = 'mcq' | 'blanks' | 'openended' | 'code' | 'flashcard' | 'ordering'

interface QuizCompletionData {
  userId: string
  quizId: string | number
  quizType: QuizType
  score?: number
  correctAnswers: number
  totalQuestions: number
  timeSpent: number
  difficulty?: string
  hintsUsed?: number
}

interface QuizCompletionResult {
  success: boolean
  attemptId: number
  newBadges: any[]
  streakUpdated: boolean
  streakInfo?: {
    current: number
    longest: number
    continued?: boolean
    isNewRecord?: boolean
  }
}

class UnifiedQuizService {
  /**
   * Handle quiz completion with unified logic
   * 
   * COMMIT: Called after ANY quiz type completion
   * - Updates User.streak and User.longestStreak
   * - Checks and unlocks badges
   * - Increments usage limits
   * - Tracks adaptive learning metrics
   */
  async handleQuizCompletion(data: QuizCompletionData): Promise<QuizCompletionResult> {
    const { userId, quizId, quizType, score, correctAnswers, totalQuestions, timeSpent, hintsUsed = 0 } = data
    
    try {
      console.log(`[UnifiedQuizService] Processing ${quizType} completion:`, {
        userId,
        quizId,
        score,
        correctAnswers,
        totalQuestions
      })

      // UPDATED: Use universal streak tracking for ALL quiz types (not just flashcards)
      const streakResult = await updateUniversalStreak(userId)
      console.log(`[UnifiedQuizService] Universal streak updated:`, streakResult)
      
      // COMMIT: Check badge unlocks for all quiz types
      // Run asynchronously to not block quiz completion
      const badgePromise = Promise.all([
        // Check flashcard badges
        badgeService.checkAndUnlockBadges(userId),
        // Check quiz completion badges for all quiz types
        quizType !== 'flashcard' ? badgeService.checkQuizBadges(userId, quizType) : Promise.resolve([]),
        // Check perfect score badge
        (score === 100 && quizType !== 'flashcard') 
          ? badgeService.checkPerfectScoreBadge(userId, quizType, score) 
          : Promise.resolve(null)
      ])
        .then(([flashcardBadges, quizBadges, perfectBadge]) => {
          const allBadges = [
            ...flashcardBadges,
            ...quizBadges,
            ...(perfectBadge ? [perfectBadge] : [])
          ]
          if (allBadges.length > 0) {
            console.log(`[UnifiedQuizService] Unlocked ${allBadges.length} badges:`, 
              allBadges.map(b => b.badge?.name))
          }
          return allBadges
        })
        .catch(error => {
          console.error('[UnifiedQuizService] Error checking badges:', error)
          return []
        })
      
      // COMMIT: Increment usage limits for free tier monetization
      if (quizType !== 'flashcard') { // Flashcards already tracked in /api/flashcards/review
        await usageLimitService.incrementUsage(userId, 'quiz_attempts')
          .catch(error => {
            console.error('[UnifiedQuizService] Error incrementing usage:', error)
            // Don't fail completion if usage tracking fails
          })
      }
      
      // COMMIT: Track adaptive learning performance (non-blocking)
      if (data.difficulty) {
        this.trackAdaptivePerformance(userId, {
          quizId: String(quizId),
          quizType,
          isCorrect: (correctAnswers / totalQuestions) >= 0.7,
          difficulty: data.difficulty as 'EASY' | 'MEDIUM' | 'HARD',
          timeSpent,
          score: score || 0,
          hintsUsed
        }).catch(error => {
          console.error('[UnifiedQuizService] Error tracking adaptive performance:', error)
        })
      }
      
      // COMMIT: Save quiz attempt to database (upsert to handle retakes)
      const userQuizIdNumber = typeof quizId === 'number' ? quizId : parseInt(quizId)
      const calculatedScore = score || Math.round((correctAnswers / totalQuestions) * 100)
      
      const attempt = await prisma.userQuizAttempt.upsert({
        where: {
          userId_userQuizId: {
            userId,
            userQuizId: userQuizIdNumber
          }
        },
        update: {
          score: calculatedScore,
          accuracy: (correctAnswers / totalQuestions) * 100,
          timeSpent,
          updatedAt: new Date()
        },
        create: {
          userId,
          userQuizId: userQuizIdNumber,
          score: calculatedScore,
          accuracy: (correctAnswers / totalQuestions) * 100,
          timeSpent
        }
      })
      
      // COMMIT: Update UserQuiz.bestScore if this is a new best score
      // This ensures dashboard displays the correct best score
      const existingUserQuiz = await prisma.userQuiz.findUnique({
        where: { id: userQuizIdNumber },
        select: { bestScore: true }
      })
      
      if (!existingUserQuiz?.bestScore || calculatedScore > existingUserQuiz.bestScore) {
        await prisma.userQuiz.update({
          where: { id: userQuizIdNumber },
          data: { 
            bestScore: calculatedScore,
            lastAttempted: new Date(),
            timeEnded: new Date()
          }
        })
        console.log(`[UnifiedQuizService] Updated UserQuiz.bestScore to ${calculatedScore} for quiz ${userQuizIdNumber}`)
      }
      
      // Wait for badge checks to complete
      const newBadges = await badgePromise
      
      console.log(`[UnifiedQuizService] Quiz completion processed successfully:`, {
        userId,
        quizId,
        quizType,
        attemptId: attempt.id,
        streak: streakResult.currentStreak,
        newRecord: streakResult.isNewRecord,
        newBadgesCount: newBadges.length
      })
      
      return {
        success: true,
        attemptId: attempt.id,
        newBadges,
        streakUpdated: true,
        streakInfo: {
          current: streakResult.currentStreak,
          longest: streakResult.longestStreak,
          continued: streakResult.streakContinued,
          isNewRecord: streakResult.isNewRecord
        }
      }
    } catch (error) {
      console.error('[UnifiedQuizService] Error handling quiz completion:', error)
      throw error
    }
  }
  
  /**
   * Track adaptive learning performance
   * 
   * COMMIT: Integrates existing adaptive-learning.ts service
   */
  private async trackAdaptivePerformance(userId: string, data: {
    quizId: string
    quizType: string
    isCorrect: boolean
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
    timeSpent: number
    score: number
    hintsUsed: number
  }): Promise<void> {
    try {
      const { trackPerformance } = await import('./adaptive-learning')
      
      await trackPerformance(userId, {
        topic: `${data.quizType}_${data.quizId}`,
        isCorrect: data.isCorrect,
        difficulty: data.difficulty,
        timeSpent: data.timeSpent,
        hintsUsed: data.hintsUsed
      })
      
      console.log(`[UnifiedQuizService] Adaptive performance tracked for ${data.quizType}`)
    } catch (error) {
      console.error('[UnifiedQuizService] Error tracking adaptive performance:', error)
      // COMMIT: Don't fail quiz completion if adaptive tracking fails
    }
  }
  
  /**
   * Get quiz statistics for a user
   * 
   * COMMIT: Unified stats across all quiz types
   */
  async getUserQuizStats(userId: string, quizType?: QuizType) {
    try {
      const attempts = await prisma.userQuizAttempt.findMany({
        where: {
          userId,
          ...(quizType && {
            userQuiz: {
              quizType: quizType as any
            }
          })
        },
        include: {
          userQuiz: {
            select: {
              id: true,
              title: true,
              quizType: true,
              difficulty: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
      
      const totalAttempts = attempts.length
      const averageScore = totalAttempts > 0 
        ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts 
        : 0
      const totalTimeSpent = attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0)
      
      return {
        attempts,
        stats: {
          totalAttempts,
          averageScore: Math.round(averageScore),
          totalTimeSpent,
          bestScore: Math.max(...attempts.map(a => a.score || 0), 0)
        }
      }
    } catch (error) {
      console.error('[UnifiedQuizService] Error fetching stats:', error)
      throw error
    }
  }
}

export const unifiedQuizService = new UnifiedQuizService()
