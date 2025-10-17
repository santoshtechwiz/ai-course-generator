import { PrismaClient } from '@prisma/client'
import { format, addDays, addHours, startOfDay, isAfter, isBefore } from 'date-fns'

const prisma = new PrismaClient()

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class EmailService {
  /**
   * Schedule a daily review reminder email
   */
  async scheduleDailyReminder(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          name: true,
          notificationSettings: true,
          lastReviewDate: true
        }
      })

      if (!user?.email) return

      const settings = user.notificationSettings as any || {}
      if (!settings.emailDigest || settings.emailDigest === 'never') return

      // Get due cards count
      const dueCount = await prisma.flashCardReview.count({
        where: {
          userId,
          nextReviewDate: {
            lte: new Date()
          }
        }
      })

      if (dueCount === 0) return

      // Schedule email for tomorrow at 9 AM
      const scheduledFor = addHours(addDays(startOfDay(new Date()), 1), 9)

      await prisma.$executeRaw`
        INSERT INTO "EmailQueue" ("id", "userId", "type", "data", "scheduledFor", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid()::text,
          ${userId},
          'daily_reminder',
          ${JSON.stringify({ dueCount, userName: user.name })}::jsonb,
          ${scheduledFor},
          NOW(),
          NOW()
        )
        ON CONFLICT DO NOTHING
      `

      console.log(`[EmailService] Scheduled daily reminder for user ${userId}`)
    } catch (error) {
      console.error('[EmailService] Error scheduling daily reminder:', error)
    }
  }

  /**
   * Schedule a streak danger alert email
   */
  async scheduleStreakAlert(userId: string, hoursRemaining: number): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          name: true,
          streak: true,
          notificationSettings: true
        }
      })

      if (!user?.email) return

      const settings = user.notificationSettings as any || {}
      if (!settings.streakAlerts) return

      // Schedule email immediately
      await prisma.$executeRaw`
        INSERT INTO "EmailQueue" ("id", "userId", "type", "data", "scheduledFor", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid()::text,
          ${userId},
          'streak_danger',
          ${JSON.stringify({ 
            streak: user.streak, 
            hoursRemaining,
            userName: user.name 
          })}::jsonb,
          NOW(),
          NOW(),
          NOW()
        )
        ON CONFLICT DO NOTHING
      `

      console.log(`[EmailService] Scheduled streak alert for user ${userId}`)
    } catch (error) {
      console.error('[EmailService] Error scheduling streak alert:', error)
    }
  }

  /**
   * Schedule a badge unlock notification email
   */
  async scheduleBadgeNotification(userId: string, badgeName: string, badgeIcon: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          name: true,
          notificationSettings: true
        }
      })

      if (!user?.email) return

      const settings = user.notificationSettings as any || {}
      if (!settings.pushEnabled) return

      await prisma.$executeRaw`
        INSERT INTO "EmailQueue" ("id", "userId", "type", "data", "scheduledFor", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid()::text,
          ${userId},
          'badge_unlock',
          ${JSON.stringify({ 
            badgeName,
            badgeIcon,
            userName: user.name 
          })}::jsonb,
          NOW(),
          NOW(),
          NOW()
        )
        ON CONFLICT DO NOTHING
      `

      console.log(`[EmailService] Scheduled badge notification for user ${userId}`)
    } catch (error) {
      console.error('[EmailService] Error scheduling badge notification:', error)
    }
  }

  /**
   * Generate email template for daily reminder
   */
  getDailyReminderTemplate(userName: string, dueCount: number): EmailTemplate {
    return {
      subject: `📚 You have ${dueCount} flashcards ready for review!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
            .header { text-align: center; margin-bottom: 30px; }
            .button { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .stats { background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧠 Time to Review!</h1>
            </div>
            <p>Hi ${userName},</p>
            <p>You have <strong>${dueCount} flashcard${dueCount > 1 ? 's' : ''}</strong> ready for review today.</p>
            <div class="stats">
              <p>📅 Regular reviews help you retain knowledge long-term</p>
              <p>🔥 Keep your streak alive by reviewing today</p>
              <p>⏰ It only takes a few minutes!</p>
            </div>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard/flashcard/review" class="button">
                Start Reviewing Now
              </a>
            </p>
            <p style="color: #6B7280; font-size: 14px;">
              You're receiving this email because you have flashcards due for review. 
              You can adjust your notification preferences in your account settings.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${userName},\n\nYou have ${dueCount} flashcard${dueCount > 1 ? 's' : ''} ready for review today.\n\nRegular reviews help you retain knowledge long-term. Keep your streak alive by reviewing today!\n\nVisit: ${process.env.NEXTAUTH_URL}/dashboard/flashcard/review`
    }
  }

  /**
   * Generate email template for streak danger alert
   */
  getStreakDangerTemplate(userName: string, streak: number, hoursRemaining: number): EmailTemplate {
    return {
      subject: `🔥 Your ${streak}-day streak is at risk!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #FEF2F2; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; border: 3px solid #EF4444; }
            .header { text-align: center; margin-bottom: 30px; }
            .button { display: inline-block; padding: 12px 30px; background: #EF4444; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .warning { background: #FEE2E2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Streak Alert!</h1>
            </div>
            <p>Hi ${userName},</p>
            <div class="warning">
              <p style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
                🔥 Your ${streak}-day streak is about to break!
              </p>
              <p>You have only <strong>${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}</strong> left to review flashcards and keep your streak alive.</p>
            </div>
            <p>Don't let all your hard work go to waste! A quick review session will save your streak.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard/flashcard/review" class="button">
                Save My Streak!
              </a>
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${userName},\n\n⚠️ Your ${streak}-day streak is about to break!\n\nYou have only ${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''} left to review flashcards.\n\nVisit: ${process.env.NEXTAUTH_URL}/dashboard/flashcard/review`
    }
  }

  /**
   * Generate email template for badge unlock
   */
  getBadgeUnlockTemplate(userName: string, badgeName: string, badgeIcon: string): EmailTemplate {
    return {
      subject: `🏆 Achievement Unlocked: ${badgeName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #FEF3C7; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
            .header { text-align: center; margin-bottom: 30px; }
            .badge { font-size: 80px; text-align: center; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #F59E0B; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations!</h1>
            </div>
            <p>Hi ${userName},</p>
            <div class="badge">${badgeIcon}</div>
            <h2 style="text-align: center; color: #F59E0B;">Achievement Unlocked!</h2>
            <h3 style="text-align: center;">${badgeName}</h3>
            <p style="text-align: center; color: #6B7280;">
              You've reached a new milestone in your learning journey. Keep up the great work!
            </p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard/flashcard/review" class="button">
                View All Badges
              </a>
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${userName},\n\n🏆 Congratulations! You've unlocked the "${badgeName}" badge ${badgeIcon}\n\nKeep up the great work!\n\nVisit: ${process.env.NEXTAUTH_URL}/dashboard/flashcard/review`
    }
  }
}

export const emailService = new EmailService()
