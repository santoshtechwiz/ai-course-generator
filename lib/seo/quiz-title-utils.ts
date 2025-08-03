/**
 * Quiz Title Utilities for SEO
 * Provides fallback titles and improved SEO for quiz pages without relying on slugs
 */

import { getQuizTypeLabel } from "./core-utils";

/**
 * Generate SEO-friendly quiz title without using slugs
 */
export function generateQuizTitle(options: {
  actualTitle?: string;
  quizType?: string;
  category?: string;
  difficulty?: string;
}): string {
  const { actualTitle, quizType, category, difficulty } = options;

  // Always prefer actual title if available
  if (actualTitle && actualTitle.trim()) {
    return `${actualTitle} | CourseAI`;
  }

  // Generate descriptive title based on type and metadata
  const typeLabel = getQuizTypeLabel(quizType);
  const difficultyText = difficulty ? ` - ${difficulty} Level` : "";
  const categoryText = category ? ` in ${category}` : "";

  return `${typeLabel}${categoryText}${difficultyText} | CourseAI`;
}

/**
 * Generate SEO-friendly quiz description without using slugs
 */
export function generateQuizDescription(options: {
  actualDescription?: string;
  quizType?: string;
  category?: string;
  difficulty?: string;
  questionsCount?: number;
}): string {
  const { actualDescription, quizType, category, difficulty, questionsCount } = options;

  // Always prefer actual description if available
  if (actualDescription && actualDescription.trim()) {
    return actualDescription;
  }

  // Generate descriptive fallback
  const typeLabel = getQuizTypeLabel(quizType)?.toLowerCase() || "interactive quiz";
  const categoryText = category ? ` about ${category}` : "";
  const difficultyText = difficulty ? ` at ${difficulty} level` : "";
  const questionsText = questionsCount ? ` with ${questionsCount} questions` : "";

  return `Test your knowledge with this ${typeLabel}${categoryText}${difficultyText}${questionsText}. Challenge yourself and enhance your learning!`;
}

/**
 * Quiz type specific descriptions for better SEO
 */
export const QUIZ_TYPE_DESCRIPTIONS = {
  mcq: "Test your knowledge with multiple choice questions. Choose the best answer from the given options and see how well you score!",
  code: "Challenge your programming skills with hands-on coding exercises. Write code, solve problems, and improve your development abilities!",
  blanks: "Complete the missing information in this fill-in-the-blanks exercise. Enhance your understanding of key concepts!",
  openended: "Express your knowledge through detailed answers in this open-ended quiz. Provide comprehensive responses and test your understanding!",
  flashcard: "Study with interactive flashcards. Review key concepts, test your memory, and reinforce your learning!",
  default: "Engage with this interactive learning experience designed to test and improve your knowledge!"
};

/**
 * Get quiz type specific description
 */
export function getQuizTypeDescription(quizType?: string): string {
  const normalizedType = quizType?.toLowerCase() as keyof typeof QUIZ_TYPE_DESCRIPTIONS;
  return QUIZ_TYPE_DESCRIPTIONS[normalizedType] || QUIZ_TYPE_DESCRIPTIONS.default;
}
