'use client'

import { useEffect } from 'react'
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
import { QuizType } from '@/types/quiz'

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

  // Load quiz data on mount
  useEffect(() => {
    if (quizStatus === 'idle') {
      const quizPayload = quizData?.questions?.length
        ? {
            slug,
            data: {
              slug,
              title: quizData.title || 'Code Quiz',
              questions: quizData.questions,
              type: 'code' as QuizType,
            },
            type: 'code' as QuizType,
          }
        : { slug, type: 'code' as QuizType };

      dispatch(fetchQuiz(quizPayload));
    }
  }, [quizStatus, dispatch, slug, quizData]);

  // Handle quiz completion
  useEffect(() => {
    if (!isQuizComplete) return;

    const safeSlug = typeof slug === 'string' ? slug : String(slug);

    if (isAuthenticated) {
      dispatch(submitQuiz())
        .then((res: any) => {
          if (res?.payload) {
            dispatch(setQuizResults(res.payload));
            router.push(`/dashboard/code/${safeSlug}/results`);
          } else {
            console.error("Submit quiz failed: payload is undefined", res);
          }
        })
        .catch((error) => {
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

  const handleAnswerQuestion = (selectedOption: string | undefined) => {
    if (!selectedOption || !currentQuestion || answers[currentQuestion.id]?.selectedOptionId) return;

    // Simple check for plain array of options
    if (!Array.isArray(currentQuestion.options)) return;
    if (!currentQuestion.options.includes(selectedOption)) return;

    dispatch(saveAnswer({
      questionId: currentQuestion.id,
      answer: {
        questionId: currentQuestion.id,
        selectedOptionId: selectedOption,
        timestamp: Date.now(),
        type: 'code',
      },
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1));
    } else {
      dispatch({ type: "quiz/setQuizCompleted" });
    }
  };

  const handleFinish = () => {
    dispatch({ type: "quiz/setQuizCompleted" });
  };

  const handleTimerComplete = () => {
    dispatch({ type: "quiz/setQuizCompleted" });
  };

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
          isSubmitting={props.isSubmitting}
          existingAnswer={answers[question.id]?.selectedOptionId || null}
          onNext={handleNext}
        />
      )}
      existingAnswer={existingAnswer}
      timerSeconds={1800}
      onTimerComplete={handleTimerComplete}
    />
  );
}
