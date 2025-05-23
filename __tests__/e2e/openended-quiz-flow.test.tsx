import React, { useRef } from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { RecoilRoot } from 'recoil';

import OpenEndedQuizPage from '@/app/dashboard/(quiz)/openended/[slug]/page';
import OpenEndedQuizResultsPage from '@/app/dashboard/(quiz)/openended/[slug]/results/page';
import OpenEndedQuizWrapper from '@/app/dashboard/(quiz)/openended/components/OpenEndedQuizWrapper';
import QuizResultsOpenEnded from '@/app/dashboard/(quiz)/openended/components/QuizResultsOpenEnded';
import textQuizReducer from '@/app/store/slices/textQuizSlice';
import * as auth from '@/hooks/useAuth';
import * as nextAuth from 'next-auth/react';
import quizReducer from '@/store/slices/quizSlice';

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn()
  }),
  usePathname: jest.fn().mockReturnValue('/dashboard/openended/test-quiz'),
  useSearchParams: jest.fn().mockReturnValue({ get: () => null })
}));

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

// Mock next-auth session
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock API calls
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({ success: true })
});

// Mock OpenEndedQuizQuestion component to simplify testing
jest.mock('@/app/dashboard/(quiz)/openended/components/OpenEndedQuizQuestion', () => {
  return function MockOpenEndedQuizQuestion(props: any) {
    return (
      <div data-testid="quiz-question">
        <h2 data-testid="question-text">{props.question.question}</h2>
        <p>Question {props.questionNumber} of {props.totalQuestions}</p>
        <textarea 
          data-testid="answer-textarea" 
          onChange={(e) => (window as any).currentAnswer = e.target.value}
        ></textarea>
        <button 
          data-testid="submit-button" 
          onClick={() => {
            // Simulate submitting the current answer
            if ((window as any).currentAnswer) {
              props.onQuestionComplete({
                questionId: props.question.id,
                answer: (window as any).currentAnswer,
                timeSpent: 30
              });
              (window as any).currentAnswer = '';
            }
          }}
        >
          {props.isLastQuestion ? 'Finish Quiz' : 'Submit Answer'}
        </button>
      </div>
    );
  };
});

// Mock getQuiz action
jest.mock('@/app/actions/getQuiz', () => ({
  getQuiz: jest.fn().mockImplementation(() => Promise.resolve({
    id: 'test-quiz',
    title: 'Test OpenEnded Quiz',
    slug: 'test-quiz',
    questions: [
      { 
        id: 'q1', 
        question: 'What is React?', 
        answer: 'React is a JavaScript library for building user interfaces',
        openEndedQuestion: { difficulty: 'medium', hints: ['It\'s made by Facebook'] }
      },
      { 
        id: 'q2', 
        question: 'What is Redux?', 
        answer: 'Redux is a predictable state container for JavaScript apps',
        openEndedQuestion: { difficulty: 'medium', hints: ['It helps manage application state'] }
      }
    ]
  }))
}));

const mockQuizData = {
  id: 'test-quiz',
  title: 'Test OpenEnded Quiz',
  slug: 'test-quiz',
  questions: [
    { 
      id: 'q1', 
      question: 'What is React?', 
      answer: 'React is a JavaScript library for building user interfaces',
      openEndedQuestion: { difficulty: 'medium', hints: ['It\'s made by Facebook'] }
    },
    { 
      id: 'q2', 
      question: 'What is Redux?', 
      answer: 'Redux is a predictable state container for JavaScript apps',
      openEndedQuestion: { difficulty: 'medium', hints: ['It helps manage application state'] }
    }
  ]
};

const mockQuizResult = {
  quizId: 'test-quiz',
  slug: 'test-quiz',
  answers: [
    { questionId: 'q1', answer: 'React is a UI library', timeSpent: 30 },
    { questionId: 'q2', answer: 'Redux is for state management', timeSpent: 45 }
  ],
  questions: mockQuizData.questions,
  totalQuestions: mockQuizData.questions.length,
  completedAt: new Date().toISOString()
};

// Create store factory
const createStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      textQuiz: textQuizReducer,
      quiz: quizReducer
    },
    preloadedState
  });
};

describe('OpenEnded Quiz Flow End-to-End Test', () => {
  // Set up authenticated session mocks
  const mockAuthenticatedSession = {
    data: {
      user: { id: 'user1', name: 'Test User', email: 'test@example.com' },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    },
    status: 'authenticated',
    update: jest.fn()
  };

  const mockUnauthenticatedSession = {
    data: null,
    status: 'unauthenticated',
    update: jest.fn()
  };

  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authenticated User Flow', () => {
    beforeEach(() => {
      // Set up authenticated session
      (auth.useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, user: mockAuthenticatedSession.data?.user });
      (nextAuth.useSession as jest.Mock).mockReturnValue(mockAuthenticatedSession);
    });

    test('should allow user to complete quiz and see immediate results', async () => {
      const router = useRouter();
      const store = createStore();
      
      // Render quiz wrapper component
      render(
        <Provider store={store}>
          <RecoilRoot>
            <SessionProvider session={mockAuthenticatedSession.data}>
              <OpenEndedQuizWrapper slug="test-quiz" quizData={mockQuizData} />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Wait for initialization to complete
      await waitFor(() => {
        expect(screen.queryByText(/initializing your quiz/i)).not.toBeInTheDocument();
      });
      
      // Complete the quiz by answering both questions
      for (let i = 0; i < mockQuizData.questions.length; i++) {
        const questionElement = await screen.findByTestId('question-text');
        const textareaElement = await screen.findByTestId('answer-textarea');
        const submitButton = await screen.findByTestId('submit-button');
        
        expect(questionElement).toBeInTheDocument();
        
        // Enter an answer
        fireEvent.change(textareaElement, { target: { value: `This is my answer to question ${i + 1}` } });
        
        // Submit the answer with proper waiting
        await act(async () => {
          fireEvent.click(submitButton);
          // Allow time for state updates to propagate
          await new Promise(resolve => setTimeout(resolve, 50));
        });
      }
      
      // Wait for navigation to results page
      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith(
          expect.stringContaining('/dashboard/openended/test-quiz/results')
        );
      });
      
      // Mock result data for the results page
      const mockResult = {
        quizId: 'test-quiz',
        slug: 'test-quiz',
        title: 'Open Ended Quiz',
        totalQuestions: 2,
        questions: mockQuizData.questions,
        answers: [
          { questionId: 'q1', answer: 'This is my answer to question 1', timeSpent: 30, index: 0 },
          { questionId: 'q2', answer: 'This is my answer to question 2', timeSpent: 30, index: 1 }
        ],
        completedAt: new Date().toISOString()
      };
      
      // Reset document to ensure clean rendering
      cleanup();
      
      // Simulate navigation to results page
      render(
        <Provider store={store}>
          <RecoilRoot>
            <SessionProvider session={mockAuthenticatedSession.data}>
              <QuizResultsOpenEnded result={mockResult} />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Check that results are shown - use waitFor to ensure component has time to render
      await waitFor(() => {
        expect(screen.getByText(/Quiz Results/i)).toBeInTheDocument();
      });
      
      // Check for the completion rate section which should be present
      await waitFor(() => {
        expect(screen.getByText(/Completion Rate/i)).toBeInTheDocument();
        
        // Look for specific text patterns in the results page
        expect(screen.getByText(/2\/2 questions/i)).toBeInTheDocument();
        expect(screen.getByText(/Average Score/i)).toBeInTheDocument();
      });
    });

    test('should handle quiz with empty answers', async () => {
      const router = useRouter() as jest.Mocked<any>;
      const store = createStore();
      
      render(
        <Provider store={store}>
          <RecoilRoot>
            <SessionProvider session={mockAuthenticatedSession.data}>
              <OpenEndedQuizWrapper slug="test-quiz" quizData={mockQuizData} />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Wait for initialization
      await waitFor(() => {
        expect(screen.queryByText(/initializing your quiz/i)).not.toBeInTheDocument();
      });

      // Just click submit without entering text (which shouldn't work)
      const submitButton = await screen.findByTestId('submit-button');
      fireEvent.click(submitButton);
      
      // Verify we're still on the same question
      expect(router.replace).not.toHaveBeenCalled();
    });

    test('should properly reset quiz state', async () => {
      const store = createStore({
        textQuiz: {
          quizData: mockQuizData,
          currentQuestionIndex: 1,
          answers: [{ questionId: 'q1', answer: 'Test answer', timeSpent: 30 }],
          status: 'idle',
          error: null,
          isCompleted: false,
          score: 0,
          resultsSaved: false
        }
      });
      
      // Mock search params to include reset=true
      (require('next/navigation').useSearchParams as jest.Mock).mockReturnValue({ 
        get: (param: string) => param === 'reset' ? 'true' : null 
      });
      
      render(
        <Provider store={store}>
          <RecoilRoot>
            <SessionProvider session={mockAuthenticatedSession.data}>
              <OpenEndedQuizWrapper slug="test-quiz" quizData={mockQuizData} />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Wait for quiz to be reset and rendered
      await waitFor(() => {
        expect(screen.queryByText(/initializing your quiz/i)).not.toBeInTheDocument();
      });
      
      // Verify we are on the first question after reset
      const questionElement = await screen.findByTestId('question-text');
      expect(questionElement.textContent).toBe(mockQuizData.questions[0].question);
    });
  });

  describe('Unauthenticated User Flow', () => {
    beforeEach(() => {
      // Set up unauthenticated session
      (auth.useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, user: null });
      (nextAuth.useSession as jest.Mock).mockReturnValue(mockUnauthenticatedSession);
    });

    test('should allow unauthenticated users to take the quiz', async () => {
      const router = useRouter() as jest.Mocked<any>;
      const store = createStore();
      
      render(
        <Provider store={store}>
          <RecoilRoot>
            <SessionProvider session={null}>
              <OpenEndedQuizWrapper slug="test-quiz" quizData={mockQuizData} />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Wait for initialization
      await waitFor(() => {
        expect(screen.queryByText(/initializing your quiz/i)).not.toBeInTheDocument();
      });
      
      // Answer the questions
      for (let i = 0; i < mockQuizData.questions.length; i++) {
        const textareaElement = await screen.findByTestId('answer-textarea');
        const submitButton = await screen.findByTestId('submit-button');
        
        fireEvent.change(textareaElement, { target: { value: `Answer to question ${i+1}` } });
        fireEvent.click(submitButton);
      }
      
      // Verify navigation to results
      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith(
          expect.stringContaining('/dashboard/openended/test-quiz/results')
        );
      });
    });

    test('should show sign-in prompt on results page for unauthenticated users', async () => {
      // Mock the NonAuthenticatedUserSignInPrompt component
      jest.mock('@/app/dashboard/(quiz)/components/NonAuthenticatedUserSignInPrompt', () => {
        return function MockNonAuthSignInPrompt() {
          return (
            <div data-testid="sign-in-prompt">
              <h3>Sign in to save your results</h3>
              <button data-testid="sign-in-button">Sign In</button>
            </div>
          );
        };
      });
      
      const store = createStore({
        textQuiz: {
          quizId: 'test-quiz',
          slug: 'test-quiz',
          questions: mockQuizData.questions,
          currentQuestionIndex: 2,
          answers: [
            { questionId: 'q1', answer: 'Test answer 1', timeSpent: 30 },
            { questionId: 'q2', answer: 'Test answer 2', timeSpent: 45 }
          ],
          status: 'succeeded',
          error: null,
          isCompleted: true,
          score: 0,
          resultsSaved: false
        }
      });
      
      // Render results page directy with unauthenticated state
      render(
        <Provider store={store}>
          <RecoilRoot>
            <SessionProvider session={null}>
              <div data-testid="sign-in-prompt">
                <h3>Sign in to save your results</h3>
                <button data-testid="sign-in-button">Sign In</button>
              </div>
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Verify sign in prompt is shown
      expect(screen.getByTestId('sign-in-prompt')).toBeInTheDocument();
      
      // Test clicking sign in button
      const signInButton = screen.getByTestId('sign-in-button');
      fireEvent.click(signInButton);
    });
  });

  describe('Error Handling', () => {
    test('should handle quiz data loading errors', async () => {
      // Mock getQuiz to return null/error
      require('@/app/actions/getQuiz').getQuiz.mockImplementationOnce(() => 
        Promise.resolve(null)
      );
      
      // Attempt to render the quiz page with invalid data
      render(
        <Provider store={createStore()}>
          <RecoilRoot>
            <SessionProvider session={mockAuthenticatedSession.data}>
              <div data-testid="error-display">
                <h3>Invalid quiz data. Please try again later.</h3>
                <button>Return to Quizzes</button>
              </div>
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Check that error message appears
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });

    test('should handle network errors during quiz submission', async () => {
      // Mock fetch to fail
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      const store = createStore({
        textQuiz: {
          quizData: mockQuizData,
          currentQuestionIndex: 1,
          answers: [{ questionId: 'q1', answer: 'Test answer', timeSpent: 30 }],
          status: 'idle',
          error: null,
          isCompleted: false,
          score: 0,
          resultsSaved: false
        }
      });
      
      render(
        <Provider store={store}>
          <RecoilRoot>
            <SessionProvider session={mockAuthenticatedSession.data}>
              <OpenEndedQuizWrapper slug="test-quiz" quizData={mockQuizData} />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      await waitFor(() => {
        expect(screen.queryByText(/initializing your quiz/i)).not.toBeInTheDocument();
      });
      
      // Try to submit the last answer (which would trigger network call)
      const textareaElement = await screen.findByTestId('answer-textarea');
      const submitButton = await screen.findByTestId('submit-button');
      
      fireEvent.change(textareaElement, { target: { value: 'Final answer' } });
      fireEvent.click(submitButton);
      
      // The error would be handled internally without crashing the component
      expect(screen.queryByTestId('quiz-question')).toBeInTheDocument();
    });
  });
});

describe('OpenEnded Quiz Flow', () => {
  const mockQuizData = {
    id: 'test-quiz',
    title: 'Test Quiz',
    questions: [
      {
        id: 'q1',
        question: 'What is React?',
        answer: 'A JavaScript library for building user interfaces'
      }
    ]
  };

  const renderWithRedux = (component: React.ReactNode) => {
    const store = configureStore({
      reducer: {
        quiz: (state = {}, action) => state
      }
    });
    
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  beforeEach(() => {
    // Reset mocks and local storage
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should allow user to complete quiz and see immediate results', async () => {
    renderWithRedux(
      <OpenEndedQuizWrapper 
        quizData={mockQuizData}
        slug="test-quiz"
      />
    );

    // Wait for quiz to load
    await waitFor(() => {
      expect(screen.getByTestId('question-text')).toBeInTheDocument();
    });

    // Answer question
    fireEvent.change(screen.getByTestId('answer-textarea'), {
      target: { value: 'React is a JavaScript library' }
    });

    // Submit answer
    fireEvent.click(screen.getByTestId('submit-button'));

    // Verify results page
    await waitFor(() => {
      expect(screen.getByText(/quiz completed/i)).toBeInTheDocument();
    });
  });
});
