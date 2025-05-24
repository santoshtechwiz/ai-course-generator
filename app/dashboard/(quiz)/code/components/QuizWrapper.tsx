import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { AppDispatch, fetchQuiz, recoverSession, RootState, submitQuiz } from '@/store';
import { QuizSubmissionLoading } from '../../components';
import { ResultPreview } from '../../components/ResultPreview';

import { QuizRenderer } from '../../components/QuizRenderer';
import { SignInPromptModal } from '../../components/SignInPromptModal';
import QuizProgress from '../../components/QuizProgress';



interface QuizWrapperProps {
  quizId: string;
  quizType: 'mcq' | 'code' | 'blanks' | 'openended';
}

export const QuizWrapper: React.FC<QuizWrapperProps> = ({ quizId, quizType }) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  
  // Redux selectors
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const quizStatus = useSelector((state: RootState) => state.quiz.status);
  const quizError = useSelector((state: RootState) => state.quiz.error);
  const quizResults = useSelector((state: RootState) => state.quiz.results);
  const sessionId = useSelector((state: RootState) => state.quiz.sessionId);
  const questions = useSelector((state: RootState) => state.quiz.questions);
  const answers = useSelector((state: RootState) => state.quiz.answers);
  
  // Derived state
  const isLoading = quizStatus === 'loading';
  const isSubmitting = quizStatus === 'submitting';
  const isSubmitted = quizStatus === 'submitted';
  const hasError = quizStatus === 'error';
  
  const answeredQuestionsCount = Object.keys(answers).length;
  const totalQuestionsCount = questions.length;
  const isQuizComplete = answeredQuestionsCount === totalQuestionsCount && totalQuestionsCount > 0;
  
  // Load quiz on mount
  useEffect(() => {
    dispatch(fetchQuiz(quizId));
  }, [dispatch, quizId]);
  
  // Recover session if available
  useEffect(() => {
    const storedSessionId = sessionStorage.getItem('current_quiz_session_id');
    if (storedSessionId) {
      dispatch(recoverSession(storedSessionId));
    }
  }, [dispatch]);
  
  // Save session ID to storage when it changes
  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem('current_quiz_session_id', sessionId);
    }
  }, [sessionId]);
  
  // Handle quiz submission
  const handleSubmitQuiz = async () => {
    if (!isQuizComplete) {
      return;
    }
    
    if (isAuthenticated) {
      await dispatch(submitQuiz());
      // Navigate to results page after submission
      if (quizResults) {
        router.push(`/${quizType}/${quizId}/results`);
      }
    } else {
      setShowSignInPrompt(true);
    }
  };
  
  // Handle sign in completion
  const handleSignInComplete = async () => {
    setShowSignInPrompt(false);
    
    // If user is now authenticated, submit the quiz
    if (isAuthenticated) {
      await dispatch(submitQuiz());
      router.push(`/${quizType}/${quizId}/results`);
    }
  };
  
  // Handle sign in cancellation
  const handleSignInCancel = () => {
    setShowSignInPrompt(false);
    
    // For non-authenticated users, calculate and show results locally
    dispatch(submitQuiz());
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading quiz...</div>;
  }
  
  if (hasError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h2 className="text-xl font-bold text-red-600">Error loading quiz</h2>
        <p className="text-gray-700">{quizError}</p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => dispatch(fetchQuiz(quizId))}
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (isSubmitting) {
    return <QuizSubmissionLoading />;
  }
  
  if (isSubmitted && quizResults) {
    return <ResultPreview results={quizResults} quizType={quizType} quizId={quizId} />;
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <QuizProgress 
        current={answeredQuestionsCount} 
        total={totalQuestionsCount} 
      />
      
      <QuizRenderer 
        quizType={quizType} 
        quizId={quizId}
      />
      
      <div className="mt-8 flex justify-end">
        <button
          className={`px-6 py-2 rounded-lg text-white font-medium ${
            isQuizComplete 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          disabled={!isQuizComplete}
          onClick={handleSubmitQuiz}
        >
          Submit Quiz
        </button>
      </div>
      
      {showSignInPrompt && (
        <SignInPromptModal
          onComplete={handleSignInComplete}
          onCancel={handleSignInCancel}
        />
      )}
    </div>
  );
};
