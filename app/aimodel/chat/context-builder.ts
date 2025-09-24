/**
 * Context Builder
 * 
 * Builds intelligent context for chat conversations by:
 * - Analyzing user's learning progress and preferences
 * - Incorporating relevant course/quiz content
 * - Creating personalized system prompts
 * - Providing contextual recommendations
 */

import { EmbeddingDocument } from "../core/embedding-manager"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"

export interface UserLearningContext {
  completedCourses: Array<{ title: string; category?: string }>
  inProgressCourses: Array<{ title: string; progress: number; category?: string }>
  recentQuizAttempts: Array<{ title: string; score: number; quizType: string }>
  preferredTopics: string[]
  weakAreas: string[]
  learningGoals: string[]
  activityLevel: 'low' | 'medium' | 'high'
}

export class ContextBuilder {
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  }

  /**
   * Build a comprehensive system message with user context
   */
  async buildSystemMessage(userId: string, relevantDocs: EmbeddingDocument[]): Promise<string> {
    try {
      // Get user learning context
      const userContext = await this.getUserLearningContext(userId)
      
      // Build the system message
      let systemMessage = this.getBaseSystemPrompt()
      
      // Add user context
      systemMessage += this.buildUserContextSection(userContext)
      
      // Add relevant content
      if (relevantDocs.length > 0) {
        systemMessage += this.buildRelevantContentSection(relevantDocs)
      }
      
      // Add guidelines and capabilities
      systemMessage += this.buildGuidelinesSection(userContext)
      
      return systemMessage

    } catch (error) {
      logger.error('Failed to build system message', { error, userId })
      return this.getFallbackSystemPrompt()
    }
  }

  /**
   * Get base system prompt
   */
  private getBaseSystemPrompt(): string {
    return `You are CourseAI, an intelligent learning assistant for an online education platform. You help students with their learning journey by providing personalized guidance, answering questions about courses and quizzes, and offering study recommendations.

Key Capabilities:
- Answer questions about courses, quizzes, and learning content
- Provide study guidance and learning strategies
- Offer personalized recommendations based on user progress
- Help with technical questions about the platform
- Motivate and encourage learners

Guidelines:
- Be helpful, encouraging, and supportive
- Provide accurate and relevant information
- Use the user's learning context to personalize responses
- Keep responses concise but informative
- Always maintain a positive, educational tone

`
  }

  /**
   * Build user context section
   */
  private buildUserContextSection(context: UserLearningContext): string {
    let section = "## User Learning Profile:\n"
    
    if (context.completedCourses.length > 0) {
      section += `**Completed Courses:** ${context.completedCourses.map(c => c.title).join(', ')}\n`
    }
    
    if (context.inProgressCourses.length > 0) {
      const progressInfo = context.inProgressCourses
        .map(c => `${c.title} (${Math.round(c.progress * 100)}% complete)`)
        .join(', ')
      section += `**In Progress:** ${progressInfo}\n`
    }
    
    if (context.recentQuizAttempts.length > 0) {
      const avgScore = Math.round(
        context.recentQuizAttempts.reduce((sum, q) => sum + q.score, 0) / context.recentQuizAttempts.length
      )
      section += `**Recent Quiz Performance:** Average score ${avgScore}%\n`
    }
    
    if (context.preferredTopics.length > 0) {
      section += `**Preferred Topics:** ${context.preferredTopics.join(', ')}\n`
    }
    
    if (context.weakAreas.length > 0) {
      section += `**Areas for Improvement:** ${context.weakAreas.join(', ')}\n`
    }
    
    section += `**Activity Level:** ${context.activityLevel}\n\n`
    
    return section
  }

  /**
   * Build relevant content section
   */
  private buildRelevantContentSection(docs: EmbeddingDocument[]): string {
    let section = "## Relevant Content:\n"
    
    docs.forEach(doc => {
      const metadata = doc.metadata
      if (metadata.type === 'course') {
        const courseUrl = `${this.baseUrl}/dashboard/course/${metadata.slug}`
        section += `**Course:** [${metadata.title}](${courseUrl})\n`
        if (metadata.category) {
          section += `  Category: ${metadata.category}\n`
        }
      } else if (metadata.type === 'quiz') {
        const quizUrl = `${this.baseUrl}/dashboard/${metadata.quizType}/${metadata.slug}`
        section += `**Quiz:** [${metadata.title}](${quizUrl}) (${metadata.quizType})\n`
      }
      
      // Add content preview
      const preview = doc.content.length > 200 
        ? doc.content.substring(0, 200) + '...' 
        : doc.content
      section += `  ${preview}\n\n`
    })
    
    return section
  }

  /**
   * Build guidelines section based on user context
   */
  private buildGuidelinesSection(context: UserLearningContext): string {
    let section = "## Personalized Guidelines:\n"
    
    // Customize based on activity level
    if (context.activityLevel === 'low') {
      section += "- Encourage regular learning habits and small daily goals\n"
      section += "- Suggest short, manageable learning sessions\n"
    } else if (context.activityLevel === 'high') {
      section += "- Acknowledge their dedication and progress\n"
      section += "- Suggest advanced challenges and deeper topics\n"
    }
    
    // Customize based on performance
    if (context.recentQuizAttempts.length > 0) {
      const avgScore = context.recentQuizAttempts.reduce((sum, q) => sum + q.score, 0) / context.recentQuizAttempts.length
      
      if (avgScore >= 80) {
        section += "- Recognize their strong performance\n"
        section += "- Suggest more challenging content or new topics\n"
      } else if (avgScore < 60) {
        section += "- Provide encouraging support and study strategies\n"
        section += "- Suggest reviewing fundamentals before advancing\n"
      }
    }
    
    // Customize based on weak areas
    if (context.weakAreas.length > 0) {
      section += `- Focus on helping with: ${context.weakAreas.join(', ')}\n`
      section += "- Suggest practice materials for improvement areas\n"
    }
    
    section += "\nWhen providing recommendations, always include direct links to relevant courses or quizzes.\n"
    
    return section
  }

  /**
   * Get user learning context from database
   */
  private async getUserLearningContext(userId: string): Promise<UserLearningContext> {
    try {
      // Get user's course progress
      const courseProgress = await prisma.courseProgress.findMany({
        where: { userId },
        include: {
          course: {
            select: {
              title: true,
              category: { select: { name: true } }
            }
          }
        },
        orderBy: { lastAccessedAt: 'desc' },
        take: 20
      })

      // Get recent quiz attempts
      const quizAttempts = await prisma.userQuizAttempt.findMany({
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
        take: 10
      })

      // Analyze the data
      const completedCourses = courseProgress
        .filter(cp => cp.isCompleted)
        .map(cp => ({
          title: cp.course.title,
          category: cp.course.category?.name
        }))

      const inProgressCourses = courseProgress
        .filter(cp => !cp.isCompleted && cp.progress > 0)
        .map(cp => ({
          title: cp.course.title,
          progress: cp.progress,
          category: cp.course.category?.name
        }))

      const recentQuizAttempts = quizAttempts.map(qa => ({
        title: qa.userQuiz?.title || 'Untitled Quiz',
        score: qa.score || 0,
        quizType: qa.userQuiz?.quizType || 'quiz'
      }))

      // Extract preferred topics from completed courses
      const topicCounts = new Map<string, number>()
      completedCourses.forEach(course => {
        if (course.category) {
          topicCounts.set(course.category, (topicCounts.get(course.category) || 0) + 1)
        }
      })

      const preferredTopics = Array.from(topicCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([topic]) => topic)

      // Identify weak areas from quiz performance
      const topicScores = new Map<string, number[]>()
      recentQuizAttempts.forEach(attempt => {
        const topic = this.extractTopicFromQuizTitle(attempt.title)
        if (!topicScores.has(topic)) {
          topicScores.set(topic, [])
        }
        topicScores.get(topic)!.push(attempt.score)
      })

      const weakAreas = Array.from(topicScores.entries())
        .map(([topic, scores]) => ({
          topic,
          avgScore: scores.reduce((sum, score) => sum + score, 0) / scores.length
        }))
        .filter(item => item.avgScore < 70)
        .sort((a, b) => a.avgScore - b.avgScore)
        .slice(0, 3)
        .map(item => item.topic)

      // Determine activity level
      const totalTimeSpent = courseProgress.reduce((sum, cp) => sum + (cp.timeSpent || 0), 0)
      const recentActivity = courseProgress.filter(cp => {
        try {
          const lastAccessed = cp.lastAccessedAt ? new Date(cp.lastAccessedAt) : null
          if (!lastAccessed || Number.isNaN(lastAccessed.getTime())) return false
          const daysSinceAccess = (Date.now() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24)
          return daysSinceAccess <= 7
        } catch (e) {
          // If date parsing fails, don't count it as recent activity
          return false
        }
      }).length

      let activityLevel: 'low' | 'medium' | 'high' = 'low'
      if (recentActivity >= 5 || totalTimeSpent > 10000) {
        activityLevel = 'high'
      } else if (recentActivity >= 2 || totalTimeSpent > 3000) {
        activityLevel = 'medium'
      }

      return {
        completedCourses,
        inProgressCourses,
        recentQuizAttempts,
        preferredTopics,
        weakAreas,
        learningGoals: [], // Could be enhanced with user-defined goals
        activityLevel
      }

    } catch (error) {
      logger.error('Failed to get user learning context', { error, userId })
      return this.getDefaultContext()
    }
  }

  /**
   * Extract topic from quiz title
   */
  private extractTopicFromQuizTitle(title: string): string {
    // Simple topic extraction - could be enhanced with NLP
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

    // Fallback to first word
    return title.split(' ')[0] || 'General'
  }

  /**
   * Get default context for new users
   */
  private getDefaultContext(): UserLearningContext {
    return {
      completedCourses: [],
      inProgressCourses: [],
      recentQuizAttempts: [],
      preferredTopics: [],
      weakAreas: [],
      learningGoals: [],
      activityLevel: 'low'
    }
  }

  /**
   * Fallback system prompt for errors
   */
  private getFallbackSystemPrompt(): string {
    return `You are CourseAI, a helpful learning assistant. 
    
Help users with their learning journey by:
- Answering questions about courses and quizzes
- Providing study guidance
- Offering encouragement and support
- Suggesting relevant learning resources

Keep responses helpful, encouraging, and educational.`
  }

  /**
   * Build context for specific course recommendations
   */
  async buildCourseRecommendationContext(userId: string, topic?: string): Promise<string> {
    try {
      const context = await this.getUserLearningContext(userId)
      
      let prompt = "Based on the user's learning profile, recommend relevant courses:\n\n"
      
      if (context.preferredTopics.length > 0) {
        prompt += `User is interested in: ${context.preferredTopics.join(', ')}\n`
      }
      
      if (context.weakAreas.length > 0) {
        prompt += `Areas needing improvement: ${context.weakAreas.join(', ')}\n`
      }
      
      if (topic) {
        prompt += `Specifically looking for: ${topic}\n`
      }
      
      prompt += `Activity level: ${context.activityLevel}\n`
      prompt += `Completed courses: ${context.completedCourses.length}\n`
      
      return prompt

    } catch (error) {
      logger.error('Failed to build course recommendation context', { error, userId })
      return "Recommend beginner-friendly courses based on popular topics."
    }
  }
}
