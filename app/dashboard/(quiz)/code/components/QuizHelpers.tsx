import { CodeQuizQuestion } from "@/app/types/code-quiz-types";
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
  questions: CodeQuizQuestion[];
  answers: UserAnswer[];
  quizTitle: string;
  slug: string;
}

/**
 * Creates a formatted preview of quiz results
 */
export function createResultsPreview({
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

  // Construct and return preview data
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
 * Security check to validate submission data for tests
 */
export function validateSecureSubmission(answers: UserAnswer[]): boolean {
  if (!Array.isArray(answers) || answers.length === 0) {
    return false;
  }

  // Check for any suspicious patterns in answers
  const suspicious = answers.some(a => {
    const answer = a.answer;
    if (typeof answer === 'string') {
      const lowerAnswer = answer.toLowerCase();
      
      // Check for script injection attempts
      if (lowerAnswer.includes('<script') || lowerAnswer.includes('javascript:')) {
        return true;
      }
      
      // Check for SQL injection patterns
      if (lowerAnswer.includes('union select') || lowerAnswer.includes('drop table')) {
        return true;
      }
    }
    return false;
  });

  return !suspicious;
}

/**
 * Formats validation results from server for display
 */
export function formatServerValidation(result: any) {
  if (!result) return null;
  
  // For server-side validation test
  if (result.validationError) {
    return { 
      error: result.validationError,
      passed: false,
      score: result.score,
      maxScore: result.maxScore
    };
  }
  
  return {
    passed: true,
    score: result.score,
    maxScore: result.maxScore
  };
}
