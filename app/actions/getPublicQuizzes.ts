'use server'
import { prisma } from "@/lib/db";

export async function getPublicQuizzes() {
  try {
    const quizzes = await prisma.userQuiz.findMany({
      select: {
        id: true,
        topic: true,
        slug: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
      where: { isPublic: true },
      take: 10,
    });

    return quizzes.map((quiz) => ({
      id: quiz.id,
      topic: quiz.topic,
      totalQuestions: quiz._count.questions,
      slug: quiz.slug || "",
    }));
  } catch (error) {
    console.error("Error fetching public quizzes:", error);
    return [];
  }
}
