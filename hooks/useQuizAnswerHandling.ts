import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import {
  saveAnswer,
  submitQuiz,
  setCurrentQuestionIndex,
  selectCurrentQuestionIndex,
  selectQuestions,
  selectAnswers,
  selectCurrentQuestion
} from '../store/quizSlice';
import { createResultsPreview } from '../utils/quiz-calculation';
import { Answer } from '../types/quiz';

/**
 * Custom hook for handling quiz answers and submissions
 * 
 * @param slug - The slug of the quiz
 * @param quizId - The ID of the quiz
 * @param quizType - The type of quiz (mcq, code, etc.)
 * @param quizTitle - The title of the quiz
 * @returns Object containing answer handling functions and quiz state
 */
export const useQuizAnswerHandling = (
  slug: string,
  quizId: string | number,
  quizType: string,
  quizTitle?: string
) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Get quiz data from Redux store
  const questions = useSelector(selectQuestions);
  const answers = useSelector(selectAnswers);
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex);
  const currentQuestion = useSelector(selectCurrentQuestion);
  
  // Handle answer submission
  const handleAnswer = useCallback(
    (answer: any, timeSpent?: number, isCorrect?: boolean) => {
      if (!currentQuestion) return { isLastQuestion: false, tempResults: null };

      // Prepare answer object based on quiz type
      let answerObj: Answer;
      
      switch (quizType) {
        case 'code':
          answerObj = {
            questionId: currentQuestion.id,
            answer,
            isCorrect,
            timeSpent,
            timestamp: Date.now()
          } as Answer;
          break;
        case 'mcq':
          answerObj = {
            questionId: currentQuestion.id,
            selectedOptionId: answer,
            timestamp: Date.now()
          } as Answer;
          break;
        case 'openended':
          answerObj = {
            questionId: currentQuestion.id,
            text: answer,
            timestamp: Date.now()
          } as Answer;
          break;
        default:
          answerObj = {
            questionId: currentQuestion.id,
            timestamp: Date.now(),
            ...answer
          } as Answer;
      }

      // Save the answer to Redux state
      dispatch(saveAnswer({ 
        questionId: currentQuestion.id, 
        answer: answerObj
      }));

      // Check if this is the last question
      const isLastQuestion = currentQuestionIndex === questions.length - 1;
      let tempResults = null;
      
      if (isLastQuestion) {
        // Create a preview of results for the last question
        const allAnswers = [
          ...Object.values(answers),
          { questionId: currentQuestion.id, ...answerObj }
        ];
        
        tempResults = createResultsPreview({
          questions,
          answers: allAnswers,
          quizTitle: quizTitle || "",
          slug,
          type: quizType
        });
      } else {
        // Navigate to next question
        dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1));
      }
      
      return { isLastQuestion, tempResults };
    },
    [currentQuestion, currentQuestionIndex, questions, answers, quizTitle, slug, quizType, dispatch]
  );

  // Handle quiz submission
  const handleSubmitQuiz = useCallback(
    async () => {
      try {
        // Calculate total time spent
        const totalTime = Object.values(answers).reduce(
          (sum, a: any) => sum + (a.timeSpent || 0), 
          0
        );

        // Submit quiz to backend
        const result = await dispatch(submitQuiz({
          slug,
          quizId,
          type: quizType,
          timeTaken: totalTime
        })).unwrap();

        return { success: true, result };
      } catch (error) {
        console.error("Error submitting quiz:", error);
        return { success: false, error };
      }
    },
    [dispatch, answers, slug, quizId, quizType]
  );

  return {
    currentQuestion,
    currentQuestionIndex,
    totalQuestions: questions.length,
    isLastQuestion: currentQuestionIndex === questions.length - 1,
    handleAnswer,
    handleSubmitQuiz
  };
};
