'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch } from '@/store'
import {
  selectQuestions,
  selectAnswers,
  selectQuizStatus,
  selectQuizError,
  selectCurrentQuestionIndex,
  selectCurrentQuestion,
  selectQuizTitle,
  selectIsQuizComplete,
  setCurrentQuestionIndex,
  saveAnswer,
  fetchQuiz,
  submitQuiz,
  setQuizResults,
  setPendingQuiz,
} from '@/store/slices/quizSlice'
import { selectIsAuthenticated } from '@/store/slices/authSlice'

import CodeQuiz from './CodeQuiz'
import { QuizLoadingSteps } from '../../components/QuizLoadingSteps'
import QuizWrapper from '../../components/QuizWrapper'
import { CodeQuestion } from './types'

interface CodeQuizWrapperProps {
  slug: string;
  quizData?: {
    title?: string;
    questions?: CodeQuestion[];
  };
}

export default function CodeQuizWrapper({ slug, quizData }: CodeQuizWrapperProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  // Redux selectors
  const questions = useSelector(selectQuestions);
  const answers = useSelector(selectAnswers);
  const quizStatus = useSelector(selectQuizStatus);
  const error = useSelector(selectQuizError);
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex);
  const currentQuestion = useSelector(selectCurrentQuestion);
  const quizTitle = useSelector(selectQuizTitle);
  const isQuizComplete = useSelector(selectIsQuizComplete);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Local state for feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | null>(null);
  const feedbackTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load quiz data on mount
  useEffect(() => {
    if (quizStatus === 'idle') {
      if (quizData?.questions?.length) {
        dispatch(fetchQuiz({
          slug, // Use slug consistently
          data: {
            slug, // Use slug consistently
            title: quizData.title || 'Code Quiz',
            questions: quizData.questions,
            type: 'code',
          },
          type: 'code',
        }));
      } else {
        dispatch(fetchQuiz({ slug, type: 'code' })); // Use slug consistently
      }
    }
  }, [quizStatus, dispatch, slug, quizData]);

  // Handle quiz completion
  useEffect(() => {
    if (!isQuizComplete) return;

    const safeSlug = typeof slug === 'string' ? slug : String(slug);

    if (isAuthenticated) {
      dispatch(submitQuiz()).then((res: any) => {
        if (res?.payload) {
          dispatch(setQuizResults(res.payload));
          router.push(`/dashboard/code/${safeSlug}/results`);
        }
      }).catch((error) => {
        console.error("Error submitting quiz:", error);
      });
    } else {
      dispatch(setPendingQuiz({
        slug,
        quizData: {
          title: quizTitle,
          questions,
        },
        currentState: {
          answers,
          currentQuestionIndex,
          isCompleted: true,
          showResults: true,
        },
      }));
      router.push(`/dashboard/code/${safeSlug}/results`);
    }
  }, [isQuizComplete, isAuthenticated, dispatch, router, slug, quizTitle, questions, answers, currentQuestionIndex]);

  const handleAnswerQuestion = (selectedOption: string) => {
    if (!currentQuestion || answers[currentQuestion.id]?.selectedOptionId) return;

    try {
      const validOptions = currentQuestion.options?.map(option => option.id) || [];
      if (!validOptions.includes(selectedOption)) {
        console.error(`Invalid option selected: "${selectedOption}"`);
        return;
      }

      const isCorrect = selectedOption === currentQuestion.correctOptionId;

      dispatch(saveAnswer({
        questionId: currentQuestion.id,
        answer: {
          questionId: currentQuestion.id,
          selectedOptionId: selectedOption,
          timestamp: Date.now(),
          type: 'code',
          isCorrect,
        },
      }));

      setShowFeedback(true);
      setFeedbackType(isCorrect ? 'correct' : 'incorrect');

      if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);

      feedbackTimeout.current = setTimeout(() => {
        setShowFeedback(false);
        setFeedbackType(null);

        if (currentQuestionIndex < questions.length - 1) {
          dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1));
        }
      }, 1500);
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    setFeedbackType(null);

    if (feedbackTimeout.current) {
      clearTimeout(feedbackTimeout.current);
      feedbackTimeout.current = null;
    }

    try {
      if (currentQuestionIndex < questions.length - 1) {
        dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1));
      } else {
        dispatch({ type: "quiz/setQuizCompleted" });
      }
    } catch (error) {
      console.error("Error navigating to next question:", error);
    }
  };

  const handleFinish = () => {
    setShowFeedback(false);
    setFeedbackType(null);

    if (feedbackTimeout.current) {
      clearTimeout(feedbackTimeout.current);
      feedbackTimeout.current = null;
    }

    try {
      dispatch({ type: "quiz/setQuizCompleted" });
    } catch (error) {
      console.error("Error finishing quiz:", error);
    }
  };

  const handleTimerComplete = () => {
    try {
      dispatch({ type: "quiz/setQuizCompleted" });
    } catch (error) {
      console.error("Error handling timer completion:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (feedbackTimeout.current) {
        clearTimeout(feedbackTimeout.current);
      }
    };
  }, []);

  if (quizStatus === 'loading') {
    return <QuizLoadingSteps steps={[{ label: 'Loading quiz data', status: 'loading' }]} />;
  }

  if (quizStatus === 'failed') {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-xl font-bold mb-4">Quiz Not Found</h2>
        <p className="text-muted-foreground mb-6">{error || 'Unable to load quiz data.'}</p>
        <div className="space-x-4">
          <button onClick={() => window.location.reload()}>
            Try Again
          </button>
          <button onClick={() => router.push('/dashboard/quizzes')}>Back to Quizzes</button>
        </div>
      </div>
    );
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-xl font-bold mb-4">No Questions Available</h2>
        <p className="text-muted-foreground mb-6">This quiz has no questions.</p>
        <button onClick={() => router.push('/dashboard/quizzes')}>Back to Quizzes</button>
      </div>
    );
  }

  if (!currentQuestion) {
    return <QuizLoadingSteps steps={[{ label: 'Initializing quiz', status: 'loading' }]} />;
  }

  const currentAnswer = answers[currentQuestion.id];
  const existingAnswer = currentAnswer?.selectedOptionId;

  return (
    <QuizWrapper
      quizTitle={quizTitle || "Code Quiz"}
      questions={questions}
      currentQuestionIndex={currentQuestionIndex}
      isSubmitting={quizStatus === 'submitting'}
      isQuizComplete={isQuizComplete}
      onNext={handleNext}
      onFinish={handleFinish}
      renderQuestion={(question, props) => (
        <CodeQuiz
          question={question}
          onAnswer={handleAnswerQuestion}
          questionNumber={props.questionNumber}
          totalQuestions={props.totalQuestions}
          isSubmitting={props.isSubmitting || showFeedback}
          existingAnswer={existingAnswer}
          feedbackType={showFeedback ? feedbackType : null}
        />
      )}
      existingAnswer={existingAnswer}
      feedbackType={showFeedback ? feedbackType : null}
      timerSeconds={1800}
      onTimerComplete={handleTimerComplete}
    />
  );
}
