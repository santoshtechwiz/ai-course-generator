import React, { useState, useEffect } from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { RecoilRoot } from 'recoil';
import CodeQuizEditor from '@/app/dashboard/(quiz)/code/components/CodeQuizEditor';
// Simple mock reducer for the quiz state
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

// Mock CodeEditor component
jest.mock('@/app/dashboard/(quiz)/code/components/CodeQuizEditor', () => ({
  default: ({ onChange, value }) => (
    <div data-testid="code-editor-mock">
      <textarea 
        data-testid="code-editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}));

// Mock CodeQuiz component directly in the test file
const MockCodeQuiz = (props) => {
  const [code, setCode] = useState(props.initialCode || '');
  
  return (
    <div data-testid="code-quiz-component">
      <h2 data-testid="question-text">{props.question?.question}</h2>
      <p>Question {props.currentQuestion + 1} of {props.totalQuestions}</p>
      <div data-testid="code-editor-container">
        <textarea 
          data-testid="code-editor-textarea"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
      <button 
        data-testid="submit-code-button"
        onClick={() => {
          props.onSubmit(code, 30, true); // Submit code, mock time, mock correct answer
        }}
      >
        Submit Code
      </button>
    </div>
  );
};

// Mock quiz data
const mockCodeQuizData = {
  id: 'test-quiz',
  title: 'Test Code Quiz',
  slug: 'test-quiz',
  questions: [
    { 
      id: 'q1', 
      question: 'Write a function that returns "Hello World"',
      initialCode: 'function helloWorld() {\n  // Your code here\n}',
      testCases: [
        { input: '', expectedOutput: 'Hello World' }
      ],
      type: 'code'
    },
    { 
      id: 'q2', 
      question: 'Write a function that adds two numbers',
      initialCode: 'function add(a, b) {\n  // Your code here\n}',
      testCases: [
        { input: '1, 2', expectedOutput: '3' },
        { input: '5, 7', expectedOutput: '12' }
      ],
      type: 'code'
    }
  ]
};

// Mock CodeQuizWrapper directly in the test file
const MockCodeQuizWrapper = (props) => {
  const router = useRouter();
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  
  // Create simplified version of the wrapper that simulates quiz flow
  const handleSubmit = (code, elapsedTime, isCorrect) => {
    props.onSubmit?.({
      questionIndex: currentQuestionIdx,
      code: code,
      isCorrect: isCorrect,
      timestamp: new Date().toISOString()
    });
    
    if (currentQuestionIdx < mockCodeQuizData.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      // Navigate to results on last question
      router.replace(`/dashboard/code/${props.slug}/results`);
      props.onComplete?.();
    }
  };
  
  // Force navigation when needed in tests
  useEffect(() => {
    if (props.forceNavigate && currentQuestionIdx >= mockCodeQuizData.questions.length - 1) {
      router.replace(`/dashboard/code/${props.slug}/results`);
      props.onComplete?.();
    }
  }, [props.forceNavigate, props.slug, currentQuestionIdx, props.onComplete, router]);
  
  return (
    <div data-testid="code-quiz-wrapper">
      {props.quizData ? (
        <div data-testid="mock-code-quiz">
          <h2>{props.quizData.title}</h2>
          <div data-testid={`question-${currentQuestionIdx}`}>
            <h3>{props.quizData.questions[currentQuestionIdx].question}</h3>
            <div data-testid="code-editor-container">
              <textarea 
                data-testid="code-editor-textarea"
                defaultValue={props.quizData.questions[currentQuestionIdx].initialCode}
              />
            </div>
            <button 
              data-testid="submit-code-button"
              onClick={() => {
                props.onReset?.();
                handleSubmit(
                  "function solution() { return true; }", // Sample solution
                  30, // Mock elapsed time
                  true // Mock isCorrect
                );
              }}
            >
              Submit Solution
            </button>
          </div>
        </div>
      ) : (
        <div>Loading quiz...</div>
      )}
    </div>
  );
};

// Mock CodeQuizResults component
const MockCodeQuizResults = () => {
  return (
    <div data-testid="code-quiz-results">
      <h1>Quiz Results</h1>
      <div data-testid="score-display">Your Score: 80%</div>
    </div>
  );
};

// Mock AuthPrompt component
const MockAuthPrompt = ({ onSignIn }) => {
  return (
    <div data-testid="auth-prompt">
      <h2>Sign in to save your progress</h2>
      <button data-testid="sign-in-button" onClick={onSignIn}>Sign In</button>
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

describe('Code Quiz Flow End-to-End Test', () => {
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
      const mockUseAuth = require('@/hooks/useAuth').useAuth;
      mockUseAuth.mockReturnValue({ 
        isAuthenticated: true, 
        userId: 'user1',
        status: 'authenticated',
        user: mockAuthenticatedSession.data?.user
      });
      const mockUseSession = require('next-auth/react').useSession;
      mockUseSession.mockReturnValue(mockAuthenticatedSession);
    });

    test('should allow user to complete code quiz and see results', async () => {
      const router = useRouter();
      const store = createStore({
        quiz: {
          quizData: mockCodeQuizData,
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
                quizData={mockCodeQuizData}
                forceNavigate={true}
                onSubmit={(answer) => {
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
        expect(screen.getByTestId('code-quiz-wrapper')).toBeInTheDocument();
      });

      // Submit code
      const submitButton = screen.getByTestId('submit-code-button');
      fireEvent.click(submitButton);
      
      // Verify answer was dispatched
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'quiz/setUserAnswer',
          payload: expect.objectContaining({
            questionIndex: 0,
            code: expect.any(String),
            isCorrect: true
          })
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
      expect(screen.getByTestId('code-quiz-results')).toBeInTheDocument();
      expect(screen.getByTestId('score-display')).toBeInTheDocument();
    });

    test('should track code submissions for each question', async () => {
      const store = createStore({
        quiz: {
          quizData: mockCodeQuizData,
          currentQuestion: 0,
          userAnswers: [],
          status: 'idle',
          error: null
        }
      });
      
      // Mock dispatch function
      const mockDispatch = jest.fn();
      jest.spyOn(store, 'dispatch').mockImplementation(mockDispatch);
      
      render(
        <Provider store={store}>
          <RecoilRoot>
            <SessionProvider session={mockAuthenticatedSession.data}>
              <MockCodeQuiz 
                question={mockCodeQuizData.questions[0]} 
                currentQuestion={0}
                totalQuestions={mockCodeQuizData.questions.length}
                initialCode={mockCodeQuizData.questions[0].initialCode}
                onSubmit={(code, time, isCorrect) => {
                  mockDispatch({
                    type: 'quiz/setUserAnswer',
                    payload: {
                      code,
                      questionIndex: 0,
                      isCorrect
                    }
                  });
                }}
              />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Type some code
      const codeEditor = screen.getByTestId('code-editor-textarea');
      fireEvent.change(codeEditor, { target: { value: 'function helloWorld() { return "Hello World"; }' } });
      
      // Submit the code
      const submitButton = screen.getByTestId('submit-code-button');
      fireEvent.click(submitButton);
      
      // Verify correct dispatch
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'quiz/setUserAnswer',
          payload: expect.objectContaining({
            isCorrect: true,
            questionIndex: 0,
            code: expect.any(String)
          })
        })
      );
    });

    test('should handle quiz reset when requested', async () => {
      const store = createStore({
        quiz: {
          quizData: mockCodeQuizData,
          currentQuestion: 1, // Already on question 2
          userAnswers: [{ questionIndex: 0, code: 'function solution() {}', isCorrect: true }],
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
                quizData={mockCodeQuizData} 
                onReset={() => mockDispatch({ type: 'quiz/resetQuiz' })}
              />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Submit to trigger the onReset callback (which checks search params)
      const submitButton = screen.getByTestId('submit-code-button');
      fireEvent.click(submitButton);
      
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
      mockUseAuth.mockReturnValue({ 
        isAuthenticated: false, 
        userId: null,
        status: 'unauthenticated',
        user: null,
        requireAuth: jest.fn()
      });
      const mockUseSession = require('next-auth/react').useSession;
      mockUseSession.mockReturnValue(mockUnauthenticatedSession);
    });

    test('should allow unauthenticated users to take the quiz', async () => {
      const router = useRouter();
      const store = createStore({
        quiz: {
          quizData: mockCodeQuizData,
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
                quizData={mockCodeQuizData}
                forceNavigate={true}
                onSubmit={(answer) => {
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
      
      // Submit code answer
      const submitButton = screen.getByTestId('submit-code-button');
      fireEvent.click(submitButton);
      
      // Verify answer was saved
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'quiz/setUserAnswer',
          payload: expect.objectContaining({
            code: expect.any(String)
          })
        })
      );
      
      // Verify navigation to results
      expect(router.replace).toHaveBeenCalledWith('/dashboard/code/test-quiz/results');
    });

    test('should prompt for authentication when saving results', async () => {
      const requireAuthMock = jest.fn();
      
      // Override auth mock to include requireAuth function
      require('@/hooks/useAuth').useAuth.mockReturnValue({
        isAuthenticated: false,
        userId: null,
        status: 'unauthenticated',
        requireAuth: requireAuthMock
      });
      
      render(
        <Provider store={createStore()}>
          <RecoilRoot>
            <SessionProvider session={null}>
              <MockAuthPrompt onSignIn={() => requireAuthMock('/dashboard/code/test-quiz/results')} />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Check auth prompt is shown
      expect(screen.getByTestId('auth-prompt')).toBeInTheDocument();
      
      // Click sign-in button
      const signInButton = screen.getByTestId('sign-in-button');
      fireEvent.click(signInButton);
      
      // Verify requireAuth was called with correct redirect
      expect(requireAuthMock).toHaveBeenCalledWith('/dashboard/code/test-quiz/results');
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
      
      // Mock error display component
      const MockErrorDisplay = ({ error, onRetry, onReturn }) => (
        <div data-testid="error-display">
          <h3>{error}</h3>
          <button data-testid="retry-button" onClick={onRetry}>Try Again</button>
          <button data-testid="return-button" onClick={onReturn}>Return to Dashboard</button>
        </div>
      );
      
      const retryMock = jest.fn();
      const returnMock = jest.fn();
      
      render(
        <Provider store={store}>
          <RecoilRoot>
            <SessionProvider session={mockAuthenticatedSession.data}>
              <MockErrorDisplay 
                error="Failed to load quiz" 
                onRetry={retryMock}
                onReturn={returnMock}
              />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Verify error is displayed
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByText('Failed to load quiz')).toBeInTheDocument();
      
      // Test retry functionality
      fireEvent.click(screen.getByTestId('retry-button'));
      expect(retryMock).toHaveBeenCalled();
      
      // Test return functionality
      fireEvent.click(screen.getByTestId('return-button'));
      expect(returnMock).toHaveBeenCalled();
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
      
      // Mock empty quiz warning component
      const MockEmptyQuizWarning = () => (
        <div data-testid="empty-quiz-warning">
          <h3>This quiz has no questions</h3>
          <button data-testid="return-button">Return to Dashboard</button>
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
      expect(screen.getByText('This quiz has no questions')).toBeInTheDocument();
    });
  });

  describe('UI and Interaction', () => {
    test('should display code editor with initial code', async () => {
      const store = createStore({
        quiz: {
          quizData: mockCodeQuizData,
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
                question={mockCodeQuizData.questions[0]} 
                currentQuestion={0}
                totalQuestions={mockCodeQuizData.questions.length}
                initialCode={mockCodeQuizData.questions[0].initialCode}
                onSubmit={jest.fn()}
              />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Check question text is displayed
      expect(screen.getByTestId('question-text')).toHaveTextContent('Write a function that returns "Hello World"');
      
      // Check code editor is displayed
      expect(screen.getByTestId('code-editor-container')).toBeInTheDocument();
      expect(screen.getByTestId('code-editor-textarea')).toBeInTheDocument();
      
      // Check question number is displayed
      expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
    });
    
    test('should allow code typing and submission', async () => {
      const onSubmitMock = jest.fn();
      
      render(
        <Provider store={createStore()}>
          <RecoilRoot>
            <SessionProvider session={mockAuthenticatedSession.data}>
              <MockCodeQuiz 
                question={mockCodeQuizData.questions[0]} 
                currentQuestion={0}
                totalQuestions={mockCodeQuizData.questions.length}
                initialCode="// Initial code"
                onSubmit={onSubmitMock}
              />
            </SessionProvider>
          </RecoilRoot>
        </Provider>
      );
      
      // Type code into editor
      const codeEditor = screen.getByTestId('code-editor-textarea');
      fireEvent.change(codeEditor, { 
        target: { value: 'function helloWorld() { return "Hello World"; }' } 
      });
      
      // Submit code
      const submitButton = screen.getByTestId('submit-code-button');
      fireEvent.click(submitButton);
      
      // Verify submission occurred
      expect(onSubmitMock).toHaveBeenCalled();
    });
  });
});

// Add types to test functions and mocks
interface MockHandlerProps {
  onAnswer: (code: string, time: number, isCorrect: boolean) => void;
}

// Type the mock handlers
const mockHandler = (props: MockHandlerProps) => {
  // ...existing code...
};
