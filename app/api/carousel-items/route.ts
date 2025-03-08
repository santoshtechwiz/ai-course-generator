import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
type QuizType = 'mcq' | 'openended' | 'fill-blanks' | 'code';

interface Quiz {
  id: string;
  title: string;
  slug: string;
  quizType: QuizType;
}
function generateCourseDescription(course: any) {
  const descriptions = [
    `Enhance your ${course.name} skills with our project-based learning approach.`,
    `Learn ${course.name} through hands-on exercises and real-world applications.`,
    `Discover the practical aspects of ${course.name} in this comprehensive course.`,
    `Gain valuable insights into ${course.name} with our expert-led tutorials and projects.`,
    `Explore the intricacies of ${course.name} and apply your knowledge to solve real problems.`,
  ]
  return descriptions[Math.floor(Math.random() * descriptions.length)]
}



function generateQuizDescription(quiz: Quiz) {
  const quizTypeDescriptions = {
    mcq: "multiple-choice questions",
    openended: "open-ended questions",
    "fill-blanks": "fill-in-the-blank exercises",
    code: "coding challenges",
  }
  const descriptions = [
    `Assess your understanding of ${quiz.title} with our carefully crafted ${quizTypeDescriptions[quiz.quizType]}.`,
    `Put your ${quiz.title} knowledge to the test in this engaging quiz format.`,
    `Reinforce your learning with practical ${quizTypeDescriptions[quiz.quizType]} on ${quiz.title}.`,
    `Challenge yourself and identify areas for improvement in ${quiz.title} with this interactive quiz.`,
    `Validate your expertise in ${quiz.title} through our comprehensive set of ${quizTypeDescriptions[quiz.quizType]}.`,
  ]
  return descriptions[Math.floor(Math.random() * descriptions.length)]
}

export async function GET() {
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
        description: course.description || generateCourseDescription(course),
        tagline: `Master ${course.title} through practical exercises`,
        type: "course" as const,
      })),
      ...quizzes.map((quiz) => ({
        id: quiz.id,
        name: quiz.title,
        slug: quiz.slug,
        description: generateQuizDescription(quiz),
        tagline: `Evaluate your ${quiz.title} proficiency`,
        quizType: quiz.quizType,
        type: "quiz" as const,
      })),
    ]

    return NextResponse.json(carouselItems)
  } catch (error) {
    console.error("Error fetching carousel items:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

