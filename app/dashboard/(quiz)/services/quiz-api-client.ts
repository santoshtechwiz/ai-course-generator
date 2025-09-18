import { createApiClient } from "@/lib/api-client";

// Define quiz API endpoints with strong typing
const quizEndpoints = {
  getQuiz: (slug: string) => `/api/quizzes/${slug}`,
  getQuizzes: (params: { category?: string, search?: string, page?: number, limit?: number, type?: string }) => ({
    url: '/api/quizzes',
    method: 'GET',
    options: { params }
  }),
  getQuizAttempts: (quizId: string, params?: { limit?: number, offset?: number }) => ({
    url: `/api/quizzes/${quizId}/attempts`,
    method: 'GET',
    options: { params }
  }),
  submitQuizAttempt: (quizId: string, data: any) => ({
    url: `/api/quizzes/${quizId}/attempt`,
    method: 'POST',
    data
  }),
  getQuizProgress: (quizId: string) => `/api/user/quiz-progress/${quizId}`,
  updateQuizProgress: (quizId: string, data: any) => ({
    url: `/api/user/quiz-progress/${quizId}`,
    method: 'POST',
    data
  }),
  getUserQuizAttempts: (params?: { limit?: number, offset?: number }) => ({
    url: '/api/user/quiz-attempts',
    method: 'GET',
    options: { params }
  }),
  getQuizStats: (quizId: string) => `/api/quizzes/${quizId}/stats`,
  rateQuiz: (data: { type: 'quiz', id: string, rating: number }) => ({
    url: '/api/rating',
    method: 'POST',
    data
  }),
  getQuizRating: (quizId: string) => ({
    url: '/api/rating',
    method: 'GET',
    options: { params: { type: 'quiz', id: quizId } }
  }),
  getRelatedQuizzes: (quizId: string, params?: { limit?: number }) => ({
    url: `/api/quizzes/${quizId}/related`,
    method: 'GET',
    options: { params }
  }),
  getQuizCategories: () => '/api/quizzes/categories',
  searchQuizzes: (query: string, params?: { type?: string, limit?: number }) => ({
    url: '/api/search/quizzes',
    method: 'GET',
    options: { params: { q: query, ...params } }
  })
};

// Create and export a pre-configured API client for quizzes
export const quizApiClient = createApiClient('', quizEndpoints);