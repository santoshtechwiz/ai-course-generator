import { configureStore } from '@reduxjs/toolkit';
import { render as rtlRender } from '@testing-library/react';
import { Provider } from 'react-redux';
import React from 'react';
import quizReducer from '@/store/slices/quiz/quiz-slice';

// Function to render components with Redux provider for testing
export function renderWithRedux(
  ui: React.ReactElement,
  {
    initialState = {},
    store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
      preloadedState: {
        quiz: {
          navigationHistory: [],
          quizId: null,
          quizType: null,
          title: '',
          questions: [],
          currentQuestionIndex: 0,
          answers: {},
          isCompleted: false,
          results: null,
          error: null,
          status: 'idle',
          sessionId: null,
          pendingQuiz: null,
          authRedirectState: null,
          shouldRedirectToAuth: false,
          shouldRedirectToResults: false,
          authStatus: 'idle',
          slug: null,
          isSaving: false,
          isSaved: false,
          saveError: null,
          isProcessingResults: false,
          wasReset: false,
          ...initialState
        }
      }
    }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock for framer-motion components
export const mockFramerMotion = () => {
  jest.mock('framer-motion', () => ({
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
      h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
      p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
      li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useAnimation: () => ({ start: jest.fn() }),
  }));
};

// Sample question data for testing
export const mockCodeQuestion = {
  id: '1',
  text: 'What will the following code output?',
  options: ['Option A', 'Option B', 'Option C', 'Option D'],
  correctOptionId: 'Option A',
  codeSnippet: 'console.log("Hello, world!");',
  language: 'javascript',
};

// Mock navigator.clipboard for testing copy functionality
export const mockClipboard = () => {
  const mockClipboardObj = {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
  };
  
  Object.defineProperty(navigator, 'clipboard', {
    value: mockClipboardObj,
    configurable: true,
  });
  
  return mockClipboardObj;
};
