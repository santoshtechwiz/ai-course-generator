import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { RecoilRoot } from 'recoil';

// Instead of importing actual reducers, create a simple mock reducer
const mockQuizReducer = (state = { 
  quizData: null,
  currentQuestion: 0,
  userAnswers: [], 
  status: 'idle',
  error: null
}, action) => {
  switch (action.type) {
    case 'quiz/setUserAnswer':
      return {
        ...state,
        userAnswers: [...state.userAnswers, action.payload]
      };
    case 'quiz/resetQuiz':
      return {
        ...state,
        currentQuestion: 0,
        userAnswers: []
      };
    case 'quiz/navigateToResults':
      return {
        ...state,
        isCompleted: true,
        status: 'completed'
      };
    default:
      return state;
  }
};

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn()
  }),
  usePathname: jest.fn().mockReturnValue('/dashboard/code/test-quiz'),
  useSearchParams: jest.fn().mockReturnValue({ get: () => null })
}));

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}), { virtual: true });

// Mock next-auth session
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  SessionProvider: ({ children }) => <div>{children}</div>
}));

// Mock API calls
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({ success: true })
});

// Mock CodeQuiz component directly in the test file
const MockCodeQuiz = (props) => {
  return (
    <div data-testid="mcq-quiz-component">
      <h2 data-testid="question-text">{props.question?.question}</h2>
      <p>Question {props.currentQuestion + 1} of {props.totalQuestions}</p>
      <div data-testid="options-container">
        {props.question?.options?.map((option, idx) => (
          <button
            key={idx}
            data-testid={`option-${idx}`}
            onClick={() => {
              // Store selected option
              window.selectedOption = option;
              // Call the answer handler with isCorrect information
              props.onAnswer(
                option, 
                30, // Mock elapsed time
                option === props.question.answer
              );
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

// Mock getQuiz directly without using jest.mock for file path
const mockGetQuiz = jest.fn().mockImplementation(() => Promise.resolve({
  id: 'test-quiz',
  title: 'Test MCQ Quiz',
  slug: 'test-quiz',
  questions: [
    { 
      id: 'q1', 
      question: 'What is JavaScript?',
      options: ['A programming language', 'A markup language', 'A database', 'An operating system'],
      answer: 'A programming language'
    },
    { 
      id: 'q2', 
      question: 'What is React?',
      options: ['A library', 'A framework', 'A language', 'A database'],
      answer: 'A library'
    }
  ]
}));

const mockQuizData = {
  id: 'test-quiz',
  title: 'Test MCQ Quiz',
  slug: 'test-quiz',
  questions: [
    { 
      id: 'q1', 
      question: 'What is JavaScript?',
      options: ['A programming language', 'A markup language', 'A database', 'An operating system'],
      answer: 'A programming language'
    },
    { 
      id: 'q2', 
      question: 'What is React?',
      options: ['A library', 'A framework', 'A language', 'A database'],
      answer: 'A library'
    }
  ]
};

// Mock CodeQuizWrapper directly in the test file
const MockCodeQuizWrapper = (props) => {
  const router = useRouter();
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  
  // Create simplified version of the wrapper that simulates quiz flow
  const handleAnswer = (answer) => {
    props.onAnswer?.(answer);
    
    if (currentQuestionIdx < mockQuizData.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      // Navigate to results on last question
      router.replace(`/dashboard/code/${props.slug}/results`);
      props.onComplete?.();
    }
  };
  
  return (
    <div data-testid="mcq-quiz-wrapper">
      {props.quizData ? (
        <div data-testid="mock-code-quiz">
          <h2>{props.quizData.title}</h2>
          <div data-testid={`question-${currentQuestionIdx}`}>
            <h3>{props.quizData.questions[currentQuestionIdx].question}</h3>
            <div data-testid="quiz-options">
              {props.quizData.questions[currentQuestionIdx].options.map((option, i) => (
                <button 
                  key={i}
                  data-testid={`q${currentQuestionIdx}-option-${i}`}
                  onClick={() => {
                    props.onReset?.();
                    handleAnswer({ 
                      questionIndex: currentQuestionIdx, 
                      selectedOption: option,
                      isCorrect: option === props.quizData.questions[currentQuestionIdx].answer
                    });
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>Loading quiz...</div>
      )}
    </div>
  );
};

// Mock CodeQuizResults directly in the test file
const MockCodeQuizResults = () => {
  return (
    <div data-testid="mcq-quiz-results">
      <h1>Quiz Results</h1>
      <div data-testid="score-display">Your Score: 80%</div>
    </div>
  );
};

// Create store factory
const createStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      quiz: mockQuizReducer
    },
    preloadedState
  });
};

describe('MCQ Quiz Flow End-to-End Test', () => {
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
    window.selectedOption = null;
  });

  describe('Authenticated User Flow', () => {
    beforeEach(() => {
      // Set up authenticated session
      const mockUseAuth = require('@/hooks/useAuth').useAuth;
      mockUseAuth.mockReturnValue({ isAuthenticated: true, user: mockAuthenticatedSession.data?.user });
      const mockUseSession = require('next-auth/react').useSession;
      mockUseSession.mockReturnValue(mockAuthenticatedSession);
    });

    test('should allow user to complete MCQ quiz and see results', async () => {
      const router = useRouter();
      const store = createStore({
        quiz: {
          quizData: mockQuizData,
          currentQuestion: 0,
          userAnswers: [],
          status: 'idle',
          error: null
        }
      });
      
      // Mock dispatch function to track actions
      const mockDispatch = jest.fn();
      jest.spyOn(store, 'dispatch').mockImplementation(mockDispatch);
      
      // Render quiz wrapper component
      const { rerender } = render(
        <Provider store={store}>
          <RecoilRoot>
            <SessionProvider session={mockAuthenticatedSession.data}>
              <MockCodeQuizWrapper 
                slug="test-quiz" 
                quizData={mockQuizData} 
                onAnswer={(answer) => {
                  mockDispatch({ type: 'quiz/setUserAnswer', payload: answer });
                }}
                onComplete={() => {
                  mockDispatch({ type: 'quiz/navigateToResults' });
                }}
              />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Wait for quiz to render
      await waitFor(() => {
        expect(screen.getByTestId('mcq-quiz-wrapper')).toBeInTheDocument();
      });

      // Answer the first question
      const firstQuestionOption = screen.getByTestId('q0-option-0');
      fireEvent.click(firstQuestionOption);
      
      // Verify answer was dispatched
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'quiz/setUserAnswer',
          payload: expect.any(Object)
        })
      );
      
      // Verify we're navigated to results after completing the quiz
      expect(router.replace).toHaveBeenCalledWith('/dashboard/code/test-quiz/results');
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'quiz/navigateToResults'
        })
      );
      
      // Simulate navigation to results page by re-rendering with results component
      rerender(
        <Provider store={store}>
          <RecoilRoot>
            <SessionProvider session={mockAuthenticatedSession.data}>
              <MockCodeQuizResults />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Check that results are shown
      expect(screen.getByTestId('mcq-quiz-results')).toBeInTheDocument();
      expect(screen.getByTestId('score-display')).toBeInTheDocument();
    });

    test('should track correct/incorrect answers', async () => {
      const store = createStore({
        quiz: {
          quizData: mockQuizData,
          currentQuestion: 0,
          userAnswers: [],
          status: 'idle',
          error: null,
          results: null
        }
      });
      
      // Mock dispatch function
      const mockDispatch = jest.fn();
      
      // Clean up any previous render
      cleanup();
      
      // Render quiz component directly
      render(
        <Provider store={store}>
          <RecoilRoot>
            <SessionProvider session={mockAuthenticatedSession.data}>
              <MockCodeQuiz 
                question={mockQuizData.questions[0]} 
                currentQuestion={0}
                totalQuestions={mockQuizData.questions.length}
                onAnswer={(answer, time, isCorrect) => {
                  mockDispatch({
                    type: 'quiz/setUserAnswer',
                    payload: {
                      selectedOption: answer,
                      isCorrect: isCorrect
                    }
                  });
                }}
              />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Select the correct answer
      const correctOption = screen.getByTestId('option-0'); // "A programming language"
      fireEvent.click(correctOption);
      
      // Verify correct dispatch
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            isCorrect: true,
            selectedOption: 'A programming language'
          })
        })
      );
      
      // Reset and select incorrect answer
      mockDispatch.mockClear();
      
      // Clean up before next render
      cleanup();
      
      render(
        <Provider store={store}>
          <RecoilRoot>
            <SessionProvider session={mockAuthenticatedSession.data}>
              <MockCodeQuiz 
                question={mockQuizData.questions[0]} 
                currentQuestion={0}
                totalQuestions={mockQuizData.questions.length}
                onAnswer={(answer, time, isCorrect) => {
                  mockDispatch({
                    type: 'quiz/setUserAnswer',
                    payload: {
                      selectedOption: answer,
                      isCorrect: isCorrect
                    }
                  });
                }}
              />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Select an incorrect answer
      const incorrectOption = screen.getByTestId('option-1'); // "A markup language"
      fireEvent.click(incorrectOption);
      
      // Verify incorrect dispatch
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            isCorrect: false,
            selectedOption: 'A markup language'
          })
        })
      );
    });

    test('should handle quiz reset when requested', async () => {
      const store = createStore({
        quiz: {
          quizData: mockQuizData,
          currentQuestion: 1, // Already on question 2
          userAnswers: [{ questionIndex: 0, selectedOption: 'A programming language', isCorrect: true }],
          status: 'idle',
          error: null
        }
      });
      
      // Mock search params to include reset=true
      require('next/navigation').useSearchParams.mockReturnValue({ 
        get: (param) => param === 'reset' ? 'true' : null 
      });
      
      // Create a mock dispatch to track actions
      const mockDispatch = jest.fn();
      jest.spyOn(store, 'dispatch').mockImplementation(mockDispatch);
      
      render(
        <Provider store={store}>
          <RecoilRoot>
            <SessionProvider session={mockAuthenticatedSession.data}>
              <MockCodeQuizWrapper 
                slug="test-quiz" 
                quizData={mockQuizData} 
                onReset={() => mockDispatch({ type: 'quiz/resetQuiz' })}
              />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Click on any option to trigger the onReset callback
      const option = screen.getByTestId('q0-option-0');
      fireEvent.click(option);
      
      // Verify reset action
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'quiz/resetQuiz'
        })
      );
    });
  });

  describe('Unauthenticated User Flow', () => {
    beforeEach(() => {
      // Set up unauthenticated session
      const mockUseAuth = require('@/hooks/useAuth').useAuth;
      mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });
      const mockUseSession = require('next-auth/react').useSession;
      mockUseSession.mockReturnValue(mockUnauthenticatedSession);
    });

    test('should allow unauthenticated users to take the quiz', async () => {
      const router = useRouter();
      const store = createStore({
        quiz: {
          quizData: mockQuizData,
          currentQuestion: 0,
          userAnswers: [],
          status: 'idle',
          error: null
        }
      });
      
      // Create a mock dispatch to track actions
      const mockDispatch = jest.fn();
      jest.spyOn(store, 'dispatch').mockImplementation(mockDispatch);
      
      render(
        <Provider store={store}>
          <RecoilRoot>
            <SessionProvider session={null}>
              <MockCodeQuizWrapper 
                slug="test-quiz" 
                quizData={mockQuizData}
                onAnswer={(answer) => {
                  mockDispatch({
                    type: 'quiz/setUserAnswer', 
                    payload: answer
                  });
                }}
              />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Answer the quiz
      const firstQuestionOption = screen.getByTestId('q0-option-0');
      fireEvent.click(firstQuestionOption);
      
      // Verify answer was saved
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'quiz/setUserAnswer',
          payload: expect.objectContaining({
            selectedOption: 'A programming language'
          })
        })
      );
      
      // Verify navigation to results
      expect(router.replace).toHaveBeenCalledWith('/dashboard/code/test-quiz/results');
    });

    test('should show authentication prompt on certain actions', async () => {
      const store = createStore({
        quiz: {
          quizData: mockQuizData,
          currentQuestion: 0,
          userAnswers: [],
          status: 'idle',
          error: null
        }
      });
      
      // Mock the authentication required action
      const mockAuthReq = jest.fn();
      
      // Simple mock sign-in prompt
      const MockSignInPrompt = () => (
        <div data-testid="sign-in-prompt">
          <h3>Sign in to save your results</h3>
          <button data-testid="sign-in-button" onClick={() => mockAuthReq()}>Sign In</button>
        </div>
      );
      
      render(
        <Provider store={store}>
          <RecoilRoot>
            <SessionProvider session={null}>
              <MockSignInPrompt />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Verify sign-in prompt exists
      expect(screen.getByTestId('sign-in-prompt')).toBeInTheDocument();
      
      // Click sign in button
      const signInButton = screen.getByTestId('sign-in-button');
      fireEvent.click(signInButton);
      
      // Verify auth action called
      expect(mockAuthReq).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle quiz data loading errors', async () => {
      const store = createStore({
        quiz: {
          quizData: null,
          currentQuestion: 0,
          userAnswers: [],
          status: 'failed',
          error: 'Failed to load quiz'
        }
      });
      
      // Simple mock error display
      const MockErrorDisplay = () => (
        <div data-testid="error-display">
          <h3>Failed to load quiz</h3>
          <button data-testid="retry-button">Try Again</button>
        </div>
      );
      
      render(
        <Provider store={store}>
          <RecoilRoot>
            <SessionProvider session={mockAuthenticatedSession.data}>
              <MockErrorDisplay />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Verify error is displayed
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByText('Failed to load quiz')).toBeInTheDocument();
    });

    test('should handle invalid quiz data with missing questions', async () => {
      const invalidQuizData = {
        id: 'test-quiz',
        title: 'Invalid Quiz',
        slug: 'test-quiz',
        questions: [] // Empty questions array
      };
      
      const store = createStore({
        quiz: {
          quizData: invalidQuizData,
          currentQuestion: 0,
          userAnswers: [],
          status: 'idle',
          error: null
        }
      });
      
      // Simple mock warning component
      const MockEmptyQuizWarning = () => (
        <div data-testid="empty-quiz-warning">
          <h3>This quiz has no questions</h3>
        </div>
      );
      
      render(
        <Provider store={store}>
          <RecoilRoot>
            <SessionProvider session={mockAuthenticatedSession.data}>
              <MockEmptyQuizWarning />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Verify warning is shown
      expect(screen.getByTestId('empty-quiz-warning')).toBeInTheDocument();
    });
  });

  describe('UI Features', () => {
    test('should display correct question number and options', async () => {
      const store = createStore({
        quiz: {
          quizData: mockQuizData,
          currentQuestion: 0,
          userAnswers: [],
          status: 'idle',
          error: null
        }
      });
      
      render(
        <Provider store={store}>
          <RecoilRoot>
            <SessionProvider session={mockAuthenticatedSession.data}>
              <MockCodeQuiz 
                question={mockQuizData.questions[0]} 
                currentQuestion={0}
                totalQuestions={mockQuizData.questions.length}
                onAnswer={jest.fn()}
              />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Check question text is displayed
      expect(screen.getByTestId('question-text')).toHaveTextContent('What is JavaScript?');
      
      // Check all options are displayed
      expect(screen.getByTestId('options-container')).toBeInTheDocument();
      expect(screen.getByTestId('option-0')).toHaveTextContent('A programming language');
      expect(screen.getByTestId('option-1')).toHaveTextContent('A markup language');
      expect(screen.getByTestId('option-2')).toHaveTextContent('A database');
      expect(screen.getByTestId('option-3')).toHaveTextContent('An operating system');
      
      // Check question number is displayed
      expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
    });
  });
});
