/**
 * Action Generator Service
 * 
 * Generates contextual actions (view, create, upgrade) based on:
 * - Search results from RAG
 * - User subscription status
 * - User intent
 */

import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { checkSubscriptionLimits, getUpgradeMessage, type SubscriptionStatus } from '../subscriptionLimits'

type ActionType = 'view_course' | 'take_quiz' | 'create_course' | 'create_quiz' | 'upgrade_plan' | 'view_all_courses'

export interface ChatAction {
  type: ActionType
  label: string
  url: string
  metadata?: {
    courseId?: number
    courseName?: string
    quizId?: number
    quizName?: string
    requiresAuth?: boolean
  }
  disabled?: boolean
  disabledReason?: string
}

interface ActionContext {
  userId: string
  query: string
  relevantDocuments: Array<{
    content: string
    metadata: {
      type: 'course' | 'chapter' | 'quiz' | 'question'
      courseId?: number
      chapterId?: number
      quizId?: number
      title?: string
      slug?: string
    }
    similarity: number
  }>
  subscriptionStatus: SubscriptionStatus
}

/**
 * Detect user intent from query
 */
function detectIntent(query: string): {
  wants_to_view: boolean
  wants_to_create: boolean
  wants_to_learn: boolean
  mentions_course: boolean
  mentions_quiz: boolean
} {
  const lowerQuery = query.toLowerCase()
  
  return {
    wants_to_view: /\b(show|view|see|find|where|which|what.*available)\b/.test(lowerQuery),
    wants_to_create: /\b(create|make|generate|new|start|build)\b/.test(lowerQuery),
    wants_to_learn: /\b(learn|study|understand|explain|teach|help.*with)\b/.test(lowerQuery),
    mentions_course: /\bcourse[s]?\b/.test(lowerQuery),
    mentions_quiz: /\b(quiz|test|assessment|question)[s]?\b/.test(lowerQuery)
  }
}

/**
 * Generate actions based on context
 */
export async function generateActions(context: ActionContext): Promise<ChatAction[]> {
  const actions: ChatAction[] = []
  const intent = detectIntent(context.query)
  
  try {
    // Extract unique courses from relevant documents
    const courseIds = new Set<number>()
    const quizIds = new Set<number>()
    
    for (const doc of context.relevantDocuments) {
      if (doc.metadata.courseId) {
        courseIds.add(doc.metadata.courseId)
      }
      if (doc.metadata.quizId) {
        quizIds.add(doc.metadata.quizId)
      }
    }

    // Generate view course actions
    if (courseIds.size > 0 && (intent.wants_to_view || intent.wants_to_learn)) {
      const courses = await prisma.course.findMany({
        where: {
          id: { in: Array.from(courseIds) }
        },
        select: {
          id: true,
          title: true,
          slug: true
        },
        take: 3 // Limit to top 3 courses
      })

      for (const course of courses) {
        actions.push({
          type: 'view_course',
          label: `View: ${course.title}`,
          url: `/dashboard/course/${course.slug || course.id}`,
          metadata: {
            courseId: course.id,
            courseName: course.title,
            requiresAuth: true
          }
        })
      }
    }

    // Generate take quiz actions
    if (quizIds.size > 0 && (intent.wants_to_view || intent.mentions_quiz)) {
      // Try to find in both CourseQuiz and UserQuiz
      const [courseQuizzes, userQuizzes] = await Promise.all([
        prisma.courseQuiz.findMany({
          where: {
            id: { in: Array.from(quizIds) }
          },
          select: {
            id: true,
            question: true
          },
          take: 2
        }),
        prisma.userQuiz.findMany({
          where: {
            id: { in: Array.from(quizIds) }
          },
          select: {
            id: true,
            title: true
          },
          take: 2
        })
      ])

      // Add course quizzes
      for (const quiz of courseQuizzes) {
        actions.push({
          type: 'take_quiz',
          label: `Take Quiz`,
          url: `/dashboard/quiz/course/${quiz.id}`,
          metadata: {
            quizId: quiz.id,
            quizName: quiz.question || 'Course Quiz',
            requiresAuth: true
          }
        })
      }
      
      // Add user quizzes
      for (const quiz of userQuizzes) {
        actions.push({
          type: 'take_quiz',
          label: `Take Quiz: ${quiz.title}`,
          url: `/dashboard/quiz/${quiz.id}`,
          metadata: {
            quizId: quiz.id,
            quizName: quiz.title,
            requiresAuth: true
          }
        })
      }
    }

    // Generate create course action
    if (intent.wants_to_create && intent.mentions_course) {
      const canCreate = context.subscriptionStatus.canCreate.course
      
      if (canCreate) {
        actions.push({
          type: 'create_course',
          label: '✨ Create New Course',
          url: '/dashboard/create',
          metadata: {
            requiresAuth: true
          }
        })
      } else {
        actions.push({
          type: 'create_course',
          label: '✨ Create New Course',
          url: '/dashboard/create',
          disabled: true,
          disabledReason: getUpgradeMessage(context.subscriptionStatus.tier, 'course'),
          metadata: {
            requiresAuth: true
          }
        })
        
        // Add upgrade action
        actions.push({
          type: 'upgrade_plan',
          label: '⬆️ Upgrade Plan',
          url: '/dashboard/billing',
          metadata: {
            requiresAuth: true
          }
        })
      }
    }

    // Generate create quiz action
    if (intent.wants_to_create && intent.mentions_quiz) {
      const canCreate = context.subscriptionStatus.canCreate.quiz
      
      if (canCreate) {
        actions.push({
          type: 'create_quiz',
          label: '✨ Create New Quiz',
          url: '/dashboard/quiz/create',
          metadata: {
            requiresAuth: true
          }
        })
      } else {
        actions.push({
          type: 'create_quiz',
          label: '✨ Create New Quiz',
          url: '/dashboard/quiz/create',
          disabled: true,
          disabledReason: getUpgradeMessage(context.subscriptionStatus.tier, 'quiz'),
          metadata: {
            requiresAuth: true
          }
        })
        
        // Add upgrade action if not already added
        if (!actions.some(a => a.type === 'upgrade_plan')) {
          actions.push({
            type: 'upgrade_plan',
            label: '⬆️ Upgrade Plan',
            url: '/dashboard/billing',
            metadata: {
              requiresAuth: true
            }
          })
        }
      }
    }

    // Add "View All Courses" if user is exploring
    if (intent.wants_to_view && intent.mentions_course && actions.length < 3) {
      actions.push({
        type: 'view_all_courses',
        label: '📚 Browse All Courses',
        url: '/dashboard/home',
        metadata: {
          requiresAuth: true
        }
      })
    }

    // Limit total actions to 4
    return actions.slice(0, 4)
  } catch (error) {
    logger.error('[ActionGenerator] Failed to generate actions:', error)
    return []
  }
}

/**
 * Generate course-specific actions after viewing/completing
 */
async function generateCourseActions(
  courseId: number,
  userId: string,
  subscriptionStatus: SubscriptionStatus
): Promise<ChatAction[]> {
  const actions: ChatAction[] = []

  try {
    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        courseUnits: {
          include: {
            chapters: {
              include: {
                courseQuizzes: {
                  take: 1
                }
              }
            }
          }
        }
      }
    })

    if (!course) return actions

    // View course action
    actions.push({
      type: 'view_course',
      label: `Continue: ${course.title}`,
      url: `/dashboard/course/${course.slug || course.id}`,
      metadata: {
        courseId: course.id,
        courseName: course.title,
        requiresAuth: true
      }
    })

    // Find available quizzes
    const quizzes = course.courseUnits
      .flatMap(unit => unit.chapters)
      .flatMap(chapter => chapter.courseQuizzes)
      .slice(0, 2)

    for (const quiz of quizzes) {
      actions.push({
        type: 'take_quiz',
        label: `Take Quiz`,
        url: `/dashboard/quiz/${quiz.id}`,
        metadata: {
          quizId: quiz.id,
          courseId: course.id,
          requiresAuth: true
        }
      })
    }

    // Create new course action
    if (subscriptionStatus.canCreate.course) {
      actions.push({
        type: 'create_course',
        label: '✨ Create Similar Course',
        url: `/dashboard/create?template=${course.id}`,
        metadata: {
          requiresAuth: true
        }
      })
    } else {
      actions.push({
        type: 'upgrade_plan',
        label: '⬆️ Upgrade to Create More',
        url: '/dashboard/billing',
        metadata: {
          requiresAuth: true
        }
      })
    }

    return actions.slice(0, 4)
  } catch (error) {
    logger.error('[ActionGenerator] Failed to generate course actions:', error)
    return []
  }
}

/**
 * Generate quiz-specific actions after completing
 */
async function generateQuizActions(
  quizId: number,
  userId: string,
  subscriptionStatus: SubscriptionStatus
): Promise<ChatAction[]> {
  const actions: ChatAction[] = []

  try {
    // Try to find quiz in UserQuiz first
    const userQuiz = await prisma.userQuiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        title: true,
        userId: true
      }
    })

    if (userQuiz) {
      // Retake user quiz action
      actions.push({
        type: 'take_quiz',
        label: `Retake: ${userQuiz.title}`,
        url: `/dashboard/quiz/${userQuiz.id}`,
        metadata: {
          quizId: userQuiz.id,
          quizName: userQuiz.title,
          requiresAuth: true
        }
      })
    }

    // Create new quiz action
    if (subscriptionStatus.canCreate.quiz) {
      actions.push({
        type: 'create_quiz',
        label: '✨ Create Similar Quiz',
        url: `/dashboard/quiz/create`,
        metadata: {
          requiresAuth: true
        }
      })
    } else {
      actions.push({
        type: 'upgrade_plan',
        label: '⬆️ Upgrade to Create More',
        url: '/dashboard/billing',
        metadata: {
          requiresAuth: true
        }
      })
    }

    // Browse more quizzes
    actions.push({
      type: 'view_all_courses',
      label: '📚 Browse More Quizzes',
      url: '/dashboard/quiz',
      metadata: {
        requiresAuth: true
      }
    })

    return actions.slice(0, 4)
  } catch (error) {
    logger.error('[ActionGenerator] Failed to generate quiz actions:', error)
    return []
  }
}
