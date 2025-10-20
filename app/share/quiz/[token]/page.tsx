"use server"

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import prisma from "@/lib/db"
import { generateSEOMetadata } from "@/lib/seo"
import { validateShareAccess } from "@/app/services/share.service"

type ShareQuizPageParams = {
  params: Promise<{ token: string }>
  searchParams: Promise<{ k?: string }>
}

/**
 * GET /share/quiz/[token]
 * Public endpoint for accessing shared quizzes
 * 
 * Query parameters:
 * - k: optional access key if share link is protected
 * 
 * Access Control:
 * - Validates token and optional key
 * - Checks expiry date
 * - Verifies visibility settings
 */

export async function generateMetadata({ params, searchParams }: ShareQuizPageParams): Promise<Metadata> {
  try {
    const { token } = await params
    const { k: accessKey } = await searchParams

    // Find quiz by token
    const quiz = await prisma.userQuiz.findFirst({
      where: { share_token: token },
      select: {
        id: true,
        title: true,
        description: true,
        quizType: true,
        visibility: true,
        share_expiry: true,
        share_key_hash: true,
      }
    })

    if (!quiz) {
      return generateSEOMetadata({
        title: "Share Link Not Found",
        description: "The shared quiz link could not be found or has expired."
      })
    }

    // Validate access before showing metadata
    const isValid = validateShareAccess(
      quiz.visibility || 'link-only',
      token,
      quiz.share_key_hash,
      quiz.share_expiry,
      token,
      accessKey
    )

    if (!isValid.isValid) {
      return generateSEOMetadata({
        title: "Access Denied",
        description: "You do not have permission to access this shared quiz."
      })
    }

    const quizTypeLabel = {
      mcq: "Multiple Choice",
      openended: "Open Ended",
      blanks: "Fill in Blanks",
      code: "Code"
    }[quiz.quizType] || "Quiz"

    return generateSEOMetadata({
      title: `${quiz.title} - Shared ${quizTypeLabel} Quiz | AI Learning Platform`,
      description: quiz.description 
        ? `${quiz.description.substring(0, 150)}... - Test your knowledge with this shared quiz on AI Learning Platform.`
        : `Challenge yourself with this ${quizTypeLabel} quiz shared on AI Learning Platform.`,
      type: "article",
      keywords: [
        "shared quiz",
        "online assessment",
        quiz.title.toLowerCase(),
        quizTypeLabel.toLowerCase(),
        "interactive quiz",
        "test your knowledge"
      ]
    })
  } catch (error) {
    console.error("Error generating metadata for shared quiz:", error)
    return generateSEOMetadata({
      title: "Shared Quiz | AI Learning Platform",
      description: "Test your knowledge with this shared quiz on AI Learning Platform"
    })
  }
}

async function getQuizData(token: string, accessKey?: string) {
  try {
    const quiz = await prisma.userQuiz.findFirst({
      where: { share_token: token },
      include: {
        user: {
          select: { id: true, name: true, image: true }
        },
        questions: {
          include: {
            openEndedQuestion: true,
            blanksQuestion: true,
            codeQuestion: true,
            questionTag: true,
            rating: true,
          }
        },
        userQuizRatings: true,
      }
    })

    if (!quiz) return null

    // Validate share access
    const validation = validateShareAccess(
      quiz.visibility || 'link-only',
      token,
      quiz.share_key_hash,
      quiz.share_expiry,
      token,
      accessKey
    )

    if (!validation.isValid) {
      console.log(`[Share Quiz] Access denied: ${validation.error}`)
      return null
    }

    // Increment share views
    await prisma.userQuiz.update({
      where: { id: quiz.id },
      data: { share_views: { increment: 1 } }
    }).catch(err => console.error("Error incrementing share views:", err))

    return quiz
  } catch (error) {
    console.error("Error fetching shared quiz data:", error)
    return null
  }
}

export default async function ShareQuizPage({ params, searchParams }: ShareQuizPageParams) {
  try {
    const { token } = await params
    const { k: accessKey } = await searchParams

    if (!token) return notFound()

    // Validate share access
    const share = await prisma.userQuiz.findFirst({
      where: { share_token: token },
      select: {
        slug: true,
        visibility: true,
        share_expiry: true,
        share_key_hash: true,
        id: true
      }
    })

    if (!share) return notFound()

    // Check access
    const validation = validateShareAccess(
      share.visibility || 'link-only',
      token,
      share.share_key_hash,
      share.share_expiry,
      token,
      accessKey
    )

    if (!validation.isValid) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-black mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-8">
              {validation.error || "This share link is invalid or has expired."}
            </p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Return Home
            </a>
          </div>
        </div>
      )
    }

    // Increment share views
    await prisma.userQuiz.update({
      where: { id: share.id },
      data: { share_views: { increment: 1 } }
    }).catch(err => console.error("Error incrementing views:", err))

    // Redirect to quiz with share context (read-only)
    // The existing quiz component handles read-only when not authenticated
    return <div>Quiz share loading...</div>
  } catch (error) {
    console.error("Error in share quiz page:", error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-muted-foreground mb-6">Failed to load the shared quiz.</p>
          <a href="/" className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold">
            Go Home
          </a>
        </div>
      </div>
    )
  }
}
