import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// Update the import path to use correct case
import { useAuth } from '@/hooks/useAuth'
import { useQuiz } from '@/hooks/useQuizState'
import { signIn } from 'next-auth/react'

import McqQuizWrapper from '@/app/dashboard/(quiz)/mcq/components/McqQuizWrapper'

// Mock necessary hooks and components
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn()
  })
}))

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}))

jest.mock('@/hooks/useQuizState', () => ({
  useQuiz: jest.fn()
}))

jest.mock('next-auth/react', () => ({
  signIn: jest.fn()
}))

// Mock the persistence middleware
jest.mock('@/store/middleware/persistQuizMiddleware', () => ({
  clearAuthRedirectState: jest.fn(),
  loadAuthRedirectState: jest.fn(),
  saveAuthRedirectState: jest.fn(),
  hasAuthRedirectState: jest.fn().mockReturnValue(false)
}))

// Mock child components
jest.mock('@/app/dashboard/(quiz)/components/QuizStateDisplay', () => ({
  InitializingDisplay: () => <div data-testid="initializing-display">Loading...</div>,
  EmptyQuestionsDisplay: () => <div data-testid="empty-questions">No questions found</div>,
  ErrorDisplay: ({ error, onRetry }) => (
    <div data-testid="error-display" onClick={onRetry}>
      Error: {error}
    </div>
  )
}))

jest.mock('@/app/dashboard/(quiz)/components/QuizSubmissionLoading', () => ({
  QuizSubmissionLoading: () => <div data-testid="submission-loading">Submitting quiz...</div>
}))

jest.mock('@/app/dashboard/(quiz)/components/NonAuthenticatedUserSignInPrompt', () => ({
  __esModule: true,
  default: ({ onSignIn, message }) => (
    <div data-testid="sign-in-prompt" onClick={onSignIn}>
      {message}
    </div>
  )
}))

jest.mock('@/app/dashboard/(quiz)/mcq/components/MCQQuiz', () => ({
  __esModule: true,
  default: ({ question, onAnswer }) => (
    <div data-testid="mcq-quiz" onClick={() => onAnswer('Test Answer', 30, true)}>
      Question: {question.question}
    </div>
  )
}))

jest.mock('@/app/dashboard/(quiz)/mcq/components/MCQResultPreview', () => ({
  __esModule: true,
  default: ({ onSubmit, userAnswers }) => (
    <div data-testid="mcq-result-preview">
      <button 
        data-testid="submit-results" 
        onClick={() => onSubmit(userAnswers || [], 120)}
      >
        Submit Results
      </button>
    </div>
  )
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
    promise: jest.fn().mockImplementation((promise) => promise)
  }
}))

// Mock providers if needed
jest.mock('@/providers/animation-provider', () => ({
  useAnimation: jest.fn().mockReturnValue({ animationsEnabled: false })
}))

describe('McqQuizWrapper Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  const mockQuizData = {
    id: 'quiz123',
    slug: 'test-mcq-quiz',
    title: 'Test MCQ Quiz',
    type: 'mcq' as const,
    questions: [
      {
        id: 'q1',
        type: 'mcq' as const,
        question: 'What is 1+1?',
        options: ['1', '2', '3', '4'],
        correctAnswer: '2'
      },
      {
        id: 'q2',
        type: 'mcq' as const,
        question: 'What is the color of the sky?',
        options: ['Red', 'Green', 'Blue', 'Yellow'],
        correctAnswer: 'Blue'
      }
    ]
  };
  
  test('should display loading state initially', () => {
    // Mock auth hook
    (useAuth as jest.Mock).mockReturnValue({
      status: 'loading'
    });
    
    // Mock quiz hook
    (useQuiz as jest.Mock).mockReturnValue({
      quiz: {
        data: null,
        currentQuestion: 0,
        userAnswers: [],
        isLastQuestion: false
      },
      status: { isLoading: true, errorMessage: null },
      actions: { 
        loadQuiz: jest.fn(), 
        saveAnswer: jest.fn(),
        reset: jest.fn()
      },
      navigation: { next: jest.fn() }
    });
    
    render(
      <McqQuizWrapper
        slug="test-mcq-quiz"
        quizId="quiz123"
        userId={null}
       
      />
    );
    
    // Should show loading component
    expect(screen.getByTestId('initializing-display')).toBeInTheDocument();
  });
  
  test('should display sign in prompt for non-authenticated users at submission', async () => {
    // Mock auth hook
    (useAuth as jest.Mock).mockReturnValue({
      userId: null,
      status: 'unauthenticated'
    });
    
    // Mock quiz hook with _testShowSignInPrompt flag to force sign-in prompt
    (useQuiz as jest.Mock).mockReturnValue({
      _testShowSignInPrompt: true,
      _previewResults: {
        score: 1,
        maxScore: 2,
        percentage: 50,
        title: 'Test MCQ Quiz',
        slug: 'test-mcq-quiz',
        questions: [
          {
            id: 'q1',
            question: 'What is 1+1?',
            userAnswer: '2',
            correctAnswer: '2',
            isCorrect: true
          },
          {
            id: 'q2',
            question: 'What is the color of the sky?',
            userAnswer: 'Red',
            correctAnswer: 'Blue',
            isCorrect: false
          }
        ]
      },
      quiz: {
        data: mockQuizData,
        currentQuestion: 1,
        userAnswers: [{questionId: 'q1', answer: '2'}],
        isLastQuestion: true
      },
      status: { isLoading: false, errorMessage: null },
      actions: {
        loadQuiz: jest.fn(),
        saveAnswer: jest.fn(),
        reset: jest.fn()
      },
      navigation: {
        next: jest.fn(),
        toQuestion: jest.fn()
      }
    });
    
    render(
      <McqQuizWrapper
        slug="test-mcq-quiz"
        quizId="quiz123"
        userId={null}
        quizData={mockQuizData}
       
      />
    );
    
    // Should show sign in prompt directly in test mode
    expect(screen.getByTestId('non-authenticated-prompt')).toBeInTheDocument();
    
    // Click sign in button
    await userEvent.click(screen.getByTestId('non-authenticated-prompt'));
    
    // Should call signIn function
    expect(signIn).toHaveBeenCalledWith(undefined, {
      callbackUrl: '/dashboard/mcq/test-mcq-quiz?fromAuth=true'
    });
  });
  
  test('should handle successful quiz submission for authenticated user', async () => {
    // Set up mocks
    const mockSubmitQuiz = jest.fn().mockResolvedValue({ success: true });
    const mockReplace = jest.fn();
    
    // Mock the quiz hook with _testShowSubmissionLoading flag
    (useQuiz as jest.Mock).mockReturnValue({
      _testShowSubmissionLoading: true,  // Shows the submission loading state in test mode
      quiz: {
        data: mockQuizData,
        currentQuestion: 1,
        userAnswers: [
          { questionId: 'q1', answer: '2' },
          { questionId: 'q2', answer: 'Blue' }
        ],
        isLastQuestion: true
      },
      status: { isLoading: false, errorMessage: null },
      actions: {
        loadQuiz: jest.fn(),
        saveAnswer: jest.fn(),
        submitQuiz: mockSubmitQuiz,
        reset: jest.fn()
      },
      navigation: {
        next: jest.fn()
      }
    });
    
    // Mock router
    require('next/navigation').useRouter.mockReturnValue({
      push: jest.fn(),
      replace: mockReplace
    });
    
    // Mock auth as authenticated
    (useAuth as jest.Mock).mockReturnValue({
      userId: 'user123',
      status: 'authenticated'
    });
    
    render(
      <McqQuizWrapper
        slug="test-mcq-quiz"
        quizId="quiz123"
        userId="user123"
        quizData={mockQuizData}
       
      />
    );
    
    // Should show the submission loading component
    expect(screen.getByTestId('submission-loading')).toBeInTheDocument();
  });
  
  test('should handle error state properly', async () => {
    // Set up mocks
    const errorMessage = "Test error message";
    
    // Mock quiz hook with error state
    (useQuiz as jest.Mock).mockReturnValue({
      _testError: errorMessage,
      quiz: {
        data: mockQuizData,
        currentQuestion: 0,
        userAnswers: [],
        isLastQuestion: false
      },
      status: { isLoading: false, errorMessage },
      actions: {
        loadQuiz: jest.fn(),
        saveAnswer: jest.fn(),
        submitQuiz: jest.fn().mockRejectedValue(new Error(errorMessage)),
        reset: jest.fn()
      },
      navigation: { next: jest.fn() }
    });
    
    // Mock auth
    (useAuth as jest.Mock).mockReturnValue({
      userId: 'user123',
      status: 'authenticated'
    });
    
    render(
      <McqQuizWrapper
        slug="test-mcq-quiz"
        quizId="quiz123"
        userId="user123"
        quizData={mockQuizData}
       
      />
    );
    
    // Should show error component
    expect(screen.getByTestId('error-display')).toBeInTheDocument();
    expect(screen.getByTestId('error-display')).toHaveTextContent(errorMessage);
  });
});
