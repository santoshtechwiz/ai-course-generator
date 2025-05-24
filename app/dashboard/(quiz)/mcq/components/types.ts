export interface McqQuizContentProps {
  quizData: any
  slug: string
  userId?: string
  quizId: string
}

export interface McqQuizWrapperProps {
  quizData?: any
  slug: string
  userId?: string
  quizId?: string
  isPublic?: boolean
  isFavorite?: boolean
  ownerId?: string
}

export interface McqQuestion {
  id: string
  question: string
  options: string[]
  answer: string
}

export interface McqAnswer {
  questionId: string | number
  question: string
  selectedOption: string
  correctOption: string
  isCorrect: boolean
  timeSpent: number
  index: number
}

// Add UserAnswer interface to match what the tests expect
export interface UserAnswer {
  questionId: string | number;
  selectedOption?: string;
  selectedOptionId?: string;
  answer?: string;
  isCorrect?: boolean;
  timeSpent?: number;
}

export interface MCQQuestionType {
  id: string | number;
  question: string;
  options: string[];
  answer: string;
  correctAnswer?: string;
  type: "mcq";
}
