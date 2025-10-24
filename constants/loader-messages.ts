/**
 * Loader Messages Constants
 * 
 * Centralized loader messages for consistent user experience across the quiz module.
 * These messages provide context-specific feedback during different loading states.
 */

export const LOADER_MESSAGES = {
  // Initial Loading States
  LOADING_QUIZ_QUESTIONS: "Loading quiz questions...",
  LOADING_FLASHCARDS: "Loading flashcards...",
  LOADING_QUIZ: "Loading quiz...",
  LOADING_QUIZ_DATA: "Fetching quiz data...",

  // Calculating/Processing States
  CALCULATING_RESULTS: "Calculating your results...",
  ANALYZING_PERFORMANCE: "Analyzing your performance...",
  PROCESSING_ANSWERS: "Processing your answers...",

  // Quiz Type Specific Loading
  LOADING_MCQ: "Loading multiple choice quiz...",
  LOADING_OPENENDED: "Loading open-ended quiz...",
  LOADING_BLANKS: "Loading fill-in-the-blanks quiz...",
  LOADING_CODE: "Loading code challenge...",
  LOADING_DOCUMENT_QUIZ: "Loading document quiz...",
  LOADING_FLASHCARD_QUIZ: "Loading flashcard quiz...",
  LOADING_ORDERING: "Loading ordering quiz...",

  // Generation/Creation States
  GENERATING_QUIZ: "Generating quiz...",
  CREATING_FLASHCARDS: "Creating flashcards...",
  CREATING_QUIZ: "Creating your quiz...",

  // Result States
  LOADING_RESULTS: "Loading quiz results...",
  REDIRECTING_TO_QUIZ: "Redirecting to quiz...",
  REDIRECTING_TO_RESULTS: "Redirecting to results...",

  // Review Mode
  LOADING_REVIEW: "Loading review...",
  PREPARING_REVIEW: "Preparing your review session...",

  // Navigation States
  LOADING_NEXT_QUESTION: "Loading next question...",
  LOADING_PREVIOUS_QUESTION: "Loading previous question...",
  SUBMITTING_ANSWER: "Submitting answer...",

  // Error Recovery
  RETRYING: "Retrying...",
  REFRESHING: "Refreshing data...",
} as const

type LoaderMessage = typeof LOADER_MESSAGES[keyof typeof LOADER_MESSAGES]
