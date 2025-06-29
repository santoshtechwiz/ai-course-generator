import { NextResponse } from "next/server"

import { prisma } from "@/lib/db"
import { generateSlug } from "@/lib/utils"
import { generateOpenEndedFillIntheBlanks } from "@/lib/chatgpt/userMcqQuiz"
import { getAuthSession } from "@/lib/auth"

interface OpenEndedFillInTheBlanksQuestion {
  question: string
  correct_answer: string
  hints: string[]
  difficulty: string
  tags: string[]
}
export async function POST(req: Request) {
  try {
    const session = await getAuthSession()
    const { title, amount, topic, difficulty } = await req.json()
    const userId = session?.user.id

    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }
    const creditDeduction = amount > 5 ? 2 : 1

    if (session.user.credits < creditDeduction) {
      return { error: "Insufficient credits", status: 403 }
    }

    // Move quiz and slug generation outside the transaction
    const quiz = await generateOpenEndedFillIntheBlanks(topic, amount, "")
    let baseSlug = generateSlug(topic)
    let slug = baseSlug
    let suffix = 2

    // Ensure unique slug
    while (await prisma.userQuiz.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`
    }

    const userQuiz = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: creditDeduction } },
      })

      // Only DB operations inside transaction
      return await tx.userQuiz.create({
        data: {
          userId,
          title,
          timeStarted: new Date(),
          quizType: "blanks",
          slug: slug,
          questions: {
            create: (quiz.questions as unknown as OpenEndedFillInTheBlanksQuestion[]).map(
              (q) => ({
                question: q.question,
                answer: q.correct_answer,
                questionType: "blanks",
                openEndedQuestion: {
                  create: {
                    hints: (q?.hints ?? []).join("|"),
                    difficulty: q?.difficulty,
                    tags: (q?.tags ?? []).join("|"),
                  },
                },
              }),
            ),
          },
        },
        include: {
          questions: {
            include: {
              openEndedQuestion: true,
            },
          },
        },
      })
    }, { timeout: 15000 }) // Increased transaction timeout to 15 seconds

    return NextResponse.json({ quizId: userQuiz.id, slug: userQuiz.slug })
  } catch (error) {
    console.error("Error generating quiz:", error)
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 })
  }
}
