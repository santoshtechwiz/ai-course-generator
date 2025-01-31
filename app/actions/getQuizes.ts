'use server'

import { prisma } from "@/lib/db";
import { QuizListItem, QuizWithQuestionsAndTags } from "../types";

export async function getQuizzes(
    page = 1,
    limit = 10,
    searchTerm = "",
  ): Promise<{ quizzes: QuizListItem[]; hasMore: boolean }> {
    try {
      const skip = (page - 1) * limit;
      const quizzes: QuizWithQuestionsAndTags[] = await prisma.userQuiz.findMany({
        where: {
          topic: {
            contains: searchTerm,
            mode: "insensitive",
          },
          isPublic: true,
        },
        include: {
          questions: true,
          
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: skip,
      })
  
      const quizListItems = quizzes.map(
        (quiz): QuizListItem => ({
          id: quiz.id,
          topic: quiz.topic,
          slug: quiz.slug,
          questionCount: quiz.questions.length,
          questions: quiz.questions,
          isPublic: quiz.isPublic ?? true,
          quizType: quiz.quizType,
          tags: []
        }),
      );
  
      const hasMore = quizzes.length > page * limit;
  
      return { quizzes: quizListItems, hasMore };
    } catch (error) {
      console.error("Failed to fetch quizzes:", error);
      return { quizzes: [], hasMore: false };
    }
  }