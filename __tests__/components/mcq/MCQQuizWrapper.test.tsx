import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { mockQuizData } from '../../mocks/quiz-mock-data';
import * as authHooks from '@/hooks/useAuth';
import * as quizHooks from '@/hooks/useQuizState';
import { createStore } from '@reduxjs/toolkit';
import McqQuizWrapper from '@/app/dashboard/(quiz)/mcq/components/McqQuizWrapper';

// Mock the hooks
jest.mock('@/hooks/useAuth', () => ({
  __esModule: true,
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useQuizState', () => ({
  __esModule: true,
  useQuiz: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    promise: jest.fn().mockImplementation((promise) => promise),
  },
}));

describe('MCQQuizWrapper', () => {
  // Set up store and mocks before each test
  let store: ReturnType<typeof createStore>;
  
  beforeEach(() => {
    store = createStore();
    
    // Mock useAuth hook
    (authHooks.useAuth as jest.Mock).mockReturnValue({
      userId: 'test-user-id',
      status: 'authenticated',
      fromAuth: false,
    });
    
    // Mock useQuiz hook with the simplest implementation
    (quizHooks.useQuiz as jest.Mock).mockReturnValue({
      quiz: {
        data: mockQuizData,
        currentQuestion: 0,
        userAnswers: [],
        isLastQuestion: false,
      },
      status: {
        isLoading: false,
        errorMessage: null,
      },
      actions: {
        loadQuiz: jest.fn().mockResolvedValue({}),
        submitQuiz: jest.fn().mockResolvedValue({}),
        saveAnswer: jest.fn(),
        reset: jest.fn(),
      },
      navigation: {
        next: jest.fn(),
        toQuestion: jest.fn(),
      },
    });
  });

  it('renders without crashing', () => {
    render(
      <Provider store={store}>
        <MCQQuizWrapper
          slug="test-slug"
          quizId="test-quiz-id"
          userId="test-user"
          quizData={mockQuizData}
        />
      </Provider>
    );
    
    expect(screen.getByTestId('mcq-quiz')).toBeInTheDocument();
  });

  it('handles quiz submission with isCorrect flags', async () => {
    // Mock the quiz state with prepared answers
    const submitQuizMock = jest.fn().mockResolvedValue({});
    (quizHooks.useQuiz as jest.Mock).mockReturnValue({
      quiz: {
        data: mockQuizData,
        currentQuestion: mockQuizData.questions.length - 1, // Last question
        userAnswers: mockQuizData.questions.map((q, i) => ({
          questionId: q.id,
          answer: 'Option A', // Mock answer
          isCorrect: i % 2 === 0 // Make some answers correct
        })),
        isLastQuestion: true,
      },
      status: {
        isLoading: false,
        errorMessage: null,
      },
      actions: {
        loadQuiz: jest.fn().mockResolvedValue({}),
        submitQuiz: submitQuizMock,
        saveAnswer: jest.fn(),
        reset: jest.fn(),
      },
      navigation: {
        next: jest.fn(),
        toQuestion: jest.fn(),
      },
    });

    render(
      <Provider store={store}>
        <McqQuizWrapper
          slug="test-slug"
          quizId="test-quiz-id"
          userId="test-user"
          quizData={mockQuizData}
        />
      </Provider>
    );
    
    // Select an option and submit the quiz
    const option = screen.getByTestId('option-0');
    fireEvent.click(option);
    
    const submitButton = screen.getByTestId('submit-answer');
    fireEvent.click(submitButton);
    
    // Wait for the results preview to appear
    await waitFor(() => {
      expect(screen.getByTestId('mcq-quiz-result-preview')).toBeInTheDocument();
    });
    
    // Click the submit results button
    const submitResultsButton = screen.getByTestId('submit-results');
    fireEvent.click(submitResultsButton);
    
    // Verify the submit function was called with proper isCorrect flags
    await waitFor(() => {
      expect(submitQuizMock).toHaveBeenCalled();
      
      // Get the call argument and check it has properly formatted answers with isCorrect
      const submitPayload = submitQuizMock.mock.calls[0][0];
      expect(submitPayload).toHaveProperty('answers');
      expect(Array.isArray(submitPayload.answers)).toBe(true);
      
      // Check that each answer has isCorrect property
      submitPayload.answers.forEach((answer: any) => {
        expect(answer).toHaveProperty('isCorrect');
        expect(typeof answer.isCorrect).toBe('boolean');
      });
      
      // Check score is properly calculated based on isCorrect values
      const correctCount = submitPayload.answers.filter((a: any) => a.isCorrect).length;
      expect(submitPayload).toHaveProperty('score', correctCount);
    });
  });

  // More tests here...
});
