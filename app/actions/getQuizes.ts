'use server'

import { prisma } from "@/lib/db";
import { QuizListItem, QuizWithQuestionsAndTags } from "../types";

export async function getQuizzes(
  page = 1,
  limit = 10,
  searchTerm = "",
  userId?: string // Make userId optional
): Promise<{ quizzes: QuizListItem[]; hasMore: boolean }> {
  try {
    const skip = (page - 1) * limit;

    // Define quiz filtering conditionally based on login status
    const whereCondition = userId
      ? {
          OR: [
            { userId: userId }, // Fetch user’s own quizzes
            { isPublic: true }  // Fetch public quizzes
          ],
          topic: {
            contains: searchTerm,
            mode: "insensitive",
           
          },
        }
      : {
          isPublic: true, // Fetch only public quizzes if user is not logged in
          topic: {
            contains: searchTerm,
            mode: "insensitive",
          },
        };

    // Fetch quizzes with questions included
    const quizzes: QuizWithQuestionsAndTags[] = await prisma.userQuiz.findMany({
      where: whereCondition,
      include: {
        questions: true, // Ensure questions are included
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit + 1, // Fetch one extra item to determine if there are more items
      skip: skip,
    });

    // Determine if there are more items available
    const hasMore = quizzes.length > limit;

    // Remove the extra item if it exists
    const trimmedQuizzes = hasMore ? quizzes.slice(0, limit) : quizzes;

    const quizListItems = trimmedQuizzes.map(
      (quiz): QuizListItem => ({
        id: quiz.id,
        topic: quiz.topic,
        slug: quiz.slug,
        questionCount: quiz.questions.length,
        questions: quiz.questions, // Ensure this is included
        isPublic: quiz.isPublic ?? true,
        quizType: quiz.quizType,
        tags: []
      })
    );

    return { quizzes: quizListItems, hasMore };
  } catch (error) {
    console.error("Failed to fetch quizzes:", error);
    return { quizzes: [], hasMore: false };
  }
}