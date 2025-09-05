// This file contains a list of routes that require subscription checks
export const PROTECTED_ROUTES = [
  '/dashboard/create/course',
  '/dashboard/create/quiz',
  '/dashboard/create/flashcards',
  '/api/ai/generate',
  '/api/courses/create',
  // Quiz creation routes use type-specific endpoints now
  '/api/quizzes/mcq/create',
  '/api/quizzes/code/create',
  '/api/quizzes/blanks/create',
  '/api/quizzes/openended/create',
  '/api/quizzes/flashcard/create',
] as const;

// List of actions that require subscription validation
export const PROTECTED_ACTIONS = {
  CREATE_COURSE: 'create:course',
  CREATE_QUIZ: 'create:quiz',
  CREATE_FLASHCARDS: 'create:flashcards',
  GENERATE_CONTENT: 'generate:content',
  DOWNLOAD_PDF: 'download:pdf',
  ACCESS_API: 'access:api',
} as const;

// Routes that don't need subscription checks
export const PUBLIC_ROUTES = [
  '/dashboard',
  '/dashboard/explore',
  '/dashboard/learn',
  '/profile',
] as const;

export type ProtectedRoute = typeof PROTECTED_ROUTES[number];
export type ProtectedAction = typeof PROTECTED_ACTIONS[keyof typeof PROTECTED_ACTIONS];
export type PublicRoute = typeof PUBLIC_ROUTES[number];
