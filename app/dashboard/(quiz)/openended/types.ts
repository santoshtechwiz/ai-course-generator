export interface OpenEndedQuizQuestion {
  id: string;
  question: string;
  answer?: string;
  hints?: string[];
}

export interface OpenEndedQuizData {
  id: string;
  title: string;
  questions: OpenEndedQuizQuestion[];
  slug?: string;
  userId?: string;
  type?: 'openended';
}

export interface OpenEndedQuizProps {
  question: OpenEndedQuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  isLastQuestion: boolean;
  onQuestionComplete?: () => void;
}
