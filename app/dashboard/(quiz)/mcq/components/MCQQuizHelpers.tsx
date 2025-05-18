import { MCQQuestion } from "@/app/types/quiz-types";
import { UserAnswer } from "@/app/types/quiz-types";
import { getCorrectAnswer, isAnswerCorrect } from "@/lib/utils/quiz-type-utils";

interface PreviewResults {
  score: number;
  maxScore: number;
  percentage: number;
  title: string;
  slug: string;
  questions: Array<{
    id: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}

interface ResultsPreviewParams {
  questions: MCQQuestion[];
  answers: UserAnswer[];
  quizTitle: string;
  slug: string;
}

/**
 * Creates a formatted preview of MCQ quiz results
 */
export function createMCQResultsPreview({
  questions,
  answers,
  quizTitle,
  slug
}: ResultsPreviewParams): PreviewResults {
  // Calculate correct answers
  const correctAnswers = answers.filter(a => {
    const q = questions.find(question => question.id === a.questionId);
    if (!q) return false;
    return isAnswerCorrect(q, a.answer);
  }).length;

  // Format questions with answers
  const formattedQuestions = questions.map(question => {
    const userAns = answers.find(a => a.questionId === question.id)?.answer || "";
    const correctAns = getCorrectAnswer(question);
    
    return {
      id: question.id,
      question: question.question,
      userAnswer: typeof userAns === "string" ? userAns : JSON.stringify(userAns),
      correctAnswer: typeof correctAns === "string" ? correctAns : JSON.stringify(correctAns),
      isCorrect: isAnswerCorrect(question, userAns)
    };
  });

  // Calculate score percentage
  const maxScore = questions.length;
  const percentage = Math.round((correctAnswers / maxScore) * 100);

  // Return formatted results
  return {
    score: correctAnswers,
    maxScore,
    percentage,
    questions: formattedQuestions,
    title: quizTitle,
    slug
  };
}

/**
 * Prepares submission payload to ensure all required fields are properly included
 */
export function prepareMCQSubmissionPayload({
  answers,
  quizId,
  slug,
  timeTaken = 600
}: {
  answers: UserAnswer[],
  quizId?: string,
  slug: string,
  timeTaken?: number
}) {
  // Ensure answers are properly formatted
  const formattedAnswers = answers.map(answer => ({
    questionId: answer.questionId,
    answer: typeof answer.answer === 'string' 
      ? answer.answer 
      : JSON.stringify(answer.answer)
  }));
  
  // Build complete payload with all required fields
  return {
    quizId: quizId || slug, // Use slug as fallback if no quizId
    slug, // Include slug for routing
    type: "mcq" as const,
    answers: formattedAnswers,
    timeTaken: timeTaken || 600 // Default to 10 minutes if not provided
  };
}

/**
 * Formats MCQ question for display
 */
export function formatMCQQuestion(questionText: string): string {
  return questionText.replace(/\n/g, '<br>');
}

/**
 * Calculates MCQ quiz time based on number of questions
 */
export function calculateMCQQuizTime(questions: MCQQuestion[]): number {
  // Allow an average of 30 seconds per question
  return Math.max(questions.length * 30, 60); // At least 1 minute
}
