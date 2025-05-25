import { McqQuestion, QuizResultsPreview, UserAnswer } from "./types";

interface ResultsPreviewParams {
  questions: McqQuestion[];
  answers: UserAnswer[];
  quizTitle: string;
  slug: string;
}

/**
 * Creates a formatted preview of MCQ quiz results
 */
export function createMcqResultsPreview({
  questions,
  answers,
  quizTitle,
  slug
}: ResultsPreviewParams): QuizResultsPreview {
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
    
    // Handle different property naming
    const correctAnswer = q.correctAnswer || q.answer || q.correctOptionId || "";
    const userAnswer = a.selectedOption || a.selectedOptionId || a.answer || "";
    
    return a.isCorrect || userAnswer === correctAnswer;
  }).length;

  // Format questions with answers
  const formattedQuestions = questions.map(question => {
    // Find user answer, handling both string and number ID types
    const userAns = answers.find(a => {
      const qId = question.id?.toString() || '';
      const aId = a.questionId?.toString() || '';
      
      return qId === aId;
    });
    
    // Handle different property naming in answers
    const userAnswer = userAns?.selectedOption || userAns?.selectedOptionId || userAns?.answer || "";
    
    // Handle different property naming in questions
    const correctAnswer = question.correctAnswer || question.answer || question.correctOptionId || "";
    const isCorrect = userAns?.isCorrect || userAnswer === correctAnswer;
    
    return {
      id: question.id,
      question: question.question || question.text || "",
      userAnswer,
      correctAnswer,
      isCorrect
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
 * Formats question options to ensure consistent structure
 */
export function formatQuestionOptions(
  options: Array<{ id: string; text: string }> | string[]
): Array<{ id: string; text: string }> {
  if (!options) return [];
  
  // If options is already in the correct format
  if (options.length > 0 && typeof options[0] === 'object' && 'id' in options[0] && 'text' in options[0]) {
    return options as Array<{ id: string; text: string }>;
  }
  
  // If options is an array of strings, convert to objects
  return (options as string[]).map((text, index) => ({
    id: `opt${index + 1}`,
    text
  }));
}

/**
 * Formats quiz data to ensure consistent structure
 */
export function formatQuizData(quizData: any) {
  if (!quizData) return null;
  
  return {
    id: quizData.id?.toString(),
    type: "mcq",
    title: quizData.title || "MCQ Quiz",
    description: quizData.description || "",
    questions: Array.isArray(quizData.questions)
      ? quizData.questions.map(q => ({
        id: q.id || `q-${Math.random().toString(36).substring(2, 11)}`,
        text: q.question || q.text || "Missing question text",
        type: "mcq",
        options: formatQuestionOptions(q.options || []),
        correctOptionId: q.answer || q.correctAnswer || q.correctOptionId || "",
      }))
      : []
  };
}
