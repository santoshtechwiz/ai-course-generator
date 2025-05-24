import { MCQQuestion } from "@/app/types/quiz-types";
import { UserAnswer } from "./types";

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
      const qId = question.id?.toString() || '';
      const aId = a.questionId?.toString() || '';
      
      return qId === aId;
    });
    
    if (!q) {
      console.warn(`Question not found for ID: ${a.questionId}`);
      return false;
    }
    
    return a.isCorrect || (a.selectedOption === (q.correctAnswer || q.answer));
  }).length;

  // Format questions with answers
  const formattedQuestions = questions.map(question => {
    // Find user answer, handling both string and number ID types
    const userAns = answers.find(a => {
      const qId = question.id?.toString() || '';
      const aId = a.questionId?.toString() || '';
      
      return qId === aId;
    });
    
    const userAnswer = userAns?.selectedOption || userAns?.answer || "";
    const correctAns = question.correctAnswer || question.answer || "";
    const isCorrect = userAns?.isCorrect || userAnswer === correctAns;
    
    return {
      id: question.id?.toString() || "",
      question: question.question || "",
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
