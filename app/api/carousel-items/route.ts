import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import type { QuizType } from "@/app/types/quiz-types"

interface Quiz {
  id: string;
  title: string;
  slug: string;
  quizType: QuizType;
}

// Simple in-memory cache (for serverless, use edge KV or Redis in prod)
let cached: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 60 * 5 * 1000; // 5 minutes

function generateDescription(item: any, type: "course" | "quiz"): string {
  const templates =
    type === "course"
      ? [
          `Enhance your ${item.title} skills with our project-based learning approach.`,
          `Learn ${item.title} through hands-on exercises and real-world applications.`,
          `Discover the practical aspects of ${item.title} in this comprehensive course.`,
          `Gain valuable insights into ${item.title} with our expert-led tutorials and projects.`,
          `Explore the intricacies of ${item.title} and apply your knowledge to solve real problems.`,
        ]
      : [
          `Assess your understanding of ${item.title} with our carefully crafted ${getQuizTypeDescription(item.quizType)}.`,
          `Put your ${item.title} knowledge to the test in this engaging quiz format.`,
          `Reinforce your learning with practical ${getQuizTypeDescription(item.quizType)} on ${item.title}.`,
          `Challenge yourself and identify areas for improvement in ${item.title} with this interactive quiz.`,
          `Validate your expertise in ${item.title} through our comprehensive set of ${getQuizTypeDescription(item.quizType)}.`,
        ]

  return templates[Math.floor(Math.random() * templates.length)]
}

function getQuizTypeDescription(quizType: QuizType): string {
  const descriptions: Record<QuizType, string> = {
    mcq: "multiple-choice questions",
    openended: "open-ended questions",
    blanks: "fill-in-the-blank exercises",
    code: "coding challenges",
    flashcard: "flashcard reviews",
  }
  return descriptions[quizType] || "interactive questions"
}

export async function GET() {
  // Check cache
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data, {
      headers: {
        "Cache-Control": `public, max-age=${CACHE_TTL / 1000}`,
      },
    })
  }

  try {
    const [courses, quizzes] = await Promise.all([
      prisma.course.findMany({
        where: { isPublic: true },
        take: 5,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
        },
      }),
      prisma.userQuiz.findMany({
        where: { isPublic: true },
        take: 5,
        select: {
          slug: true,
          id: true,
          title: true,
          quizType: true,
        },
      }),
    ])

    const carouselItems = [
      ...courses.map((course) => ({
        id: course.id,
        name: course.title,
        slug: course.slug,
        quizType: "course",
        description: course.description || generateDescription(course, "course"),
        tagline: `Master ${course.title} through practical exercises`,
        type: "course" as const,
      })),
      ...quizzes.map((quiz) => ({
        id: quiz.id,
        name: quiz.title,
        slug: quiz.slug,
        description: generateDescription(quiz, "quiz"),
        tagline: `Evaluate your ${quiz.title} proficiency`,
        quizType: quiz.quizType,
        type: "quiz" as const,
      })),
    ]

    // Store in cache
    cached = { data: carouselItems, timestamp: Date.now() }

    return NextResponse.json(carouselItems, {
      headers: {
        "Cache-Control": `public, max-age=${CACHE_TTL / 1000}`,
      },
    })
  } catch (error) {
    console.error("Error fetching carousel items:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}