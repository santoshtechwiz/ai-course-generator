import { createApiClient } from "@/lib/api-client";
import type { QuizType } from "@/app/types/quiz-types";

// Define quiz API endpoints with strong typing
const quizEndpoints = {
  getQuiz: (type: QuizType, slug: string) => `/api/quizzes/${type}/${slug}`,
  getRandomQuiz: (type: QuizType) => `/api/quizzes/${type}/random`,
  createQuiz: (type: QuizType) => ({
    url: `/api/quizzes/${type}`,
    method: 'POST'
  }),
  submitQuizResult: (slug: string) => ({
    url: `/api/quizzes/common/${slug}/complete`,
    method: 'POST'
  }),
  getUserQuizzes: (params: { page?: number, limit?: number, filter?: string }) => ({
    url: '/api/quizzes/user',
    method: 'GET',
    options: { params }
  }),
  toggleFavorite: (slug: string, isFavorite: boolean) => ({
    url: `/api/quizzes/common/${slug}`,
    method: 'PATCH',
    data: { isFavorite }
  }),
  togglePublic: (slug: string, isPublic: boolean) => ({
    url: `/api/quizzes/common/${slug}`,
    method: 'PATCH',
    data: { isPublic }
  }),
  deleteQuiz: (slug: string) => ({
    url: `/api/quizzes/common/${slug}`,
    method: 'DELETE'
  }),
  generateFlashcards: (data: { title: string, count: number }) => ({
    url: '/api/quizzes/flashcard',
    method: 'POST',
    data
  }),
};

// Create and export a pre-configured API client for quizzes
export const quizApiClient = createApiClient('', quizEndpoints);
