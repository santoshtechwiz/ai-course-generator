import { MCQQuestion } from "@/app/types/quiz-types";
import { UserAnswer } from "./types";
import { getCorrectAnswer, isAnswerCorrect } from "@/lib/utils/quiz-type-utils";
import { prepareSubmissionPayload } from "@/lib/utils/quiz-submission-utils";

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
    // Find question by ID, handling both string and number types
    const q = questions.find(question => {
      const qId = question.id;
      const aId = a.questionId;
      
      // Direct comparison if types match
      if (typeof qId === typeof aId) return qId === aId;
      
      // Convert string to number if it's numeric
      if (typeof qId === 'string' && typeof aId === 'number') {
        return /^\d+$/.test(qId) && parseInt(qId, 10) === aId;
      }
      
      // Convert number to string for comparison
      if (typeof qId === 'number' && typeof aId === 'string') {
        return qId.toString() === aId;
      }
      
      return false;
    });
    
    if (!q) {
      console.warn(`Question not found for ID: ${a.questionId}`);
      return false;
    }
    
    return a.isCorrect || (a.selectedOption === q.answer);
  }).length;

  // Format questions with answers
  const formattedQuestions = questions.map(question => {
    // Find user answer, handling both string and number ID types
    const userAns = answers.find(a => {
      const qId = question.id;
      const aId = a.questionId;
      
      // Direct comparison if types match
      if (typeof qId === typeof aId) return qId === aId;
      
      // Handle type conversions
      if (typeof qId === 'string' && typeof aId === 'number') {
        return /^\d+$/.test(qId) && parseInt(qId, 10) === aId;
      }
      
      if (typeof qId === 'number' && typeof aId === 'string') {
        return qId.toString() === aId;
      }
      
      return false;
    });
    
    const userAnswer = userAns?.selectedOption || userAns?.answer || "";
    const correctAns = question.answer;
    const isCorrect = userAns?.isCorrect || userAnswer === correctAns;
    
    return {
      id: question.id,
      question: question.question,
      userAnswer: userAnswer,
      correctAnswer: correctAns,
      isCorrect: isCorrect
    };
  });

  // Calculate score percentage
  const maxScore = questions.length;
  const percentage = maxScore > 0 ? Math.round((correctAnswers / maxScore) * 100) : 0;

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
 * @deprecated Use the shared prepareSubmissionPayload from quiz-submission-utils instead
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
  // For backwards compatibility, use the shared utility
  return prepareSubmissionPayload({
    answers,
    quizId,
    slug,
    type: "mcq",
    timeTaken
  });
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
