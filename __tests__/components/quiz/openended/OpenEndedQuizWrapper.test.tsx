import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import quizReducer from '@/store/slices/quizSlice';
import OpenEndedQuizWrapper from '@/app/dashboard/(quiz)/openended/components/OpenEndedQuizWrapper';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  })
}));

// Create a mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      quiz: quizReducer
    },
    preloadedState: initialState
  });
};

describe('OpenEndedQuizWrapper', () => {
  const mockQuizData = {
    id: 'test-quiz',
    title: 'Test Open-Ended Quiz',
    questions: [
      {
        id: 'q1',
        question: 'What is your favorite programming language?',
        answer: 'Any reasonable answer',
        hints: ['Think about your experience', 'Consider what you use most']
      },
      {
        id: 'q2',
        question: 'Describe a challenging problem you solved with code',
        answer: 'Any reasonable answer with details',
        hints: ['Think about the problem scope', 'What technologies did you use?']
      }
    ]
  };

  it('initializes and displays the first question', async () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <OpenEndedQuizWrapper quizData={mockQuizData} slug="test-quiz" />
      </Provider>
    );
    
    // Allow initialization to complete
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Should display the first question
    expect(screen.getByText('What is your favorite programming language?')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
  });

  it('handles invalid quiz data gracefully', async () => {
    const store = createMockStore();
    
    // Provide invalid quiz data (missing questions)
    render(
      <Provider store={store}>
        <OpenEndedQuizWrapper quizData={{id: 'invalid'}} slug="invalid-quiz" />
      </Provider>
    );
    
    // Allow initialization to complete
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Should show error message
    expect(screen.getByText(/Invalid quiz data/i)).toBeInTheDocument();
  });

  it('provides hint functionality', async () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <OpenEndedQuizWrapper quizData={mockQuizData} slug="test-quiz" />
      </Provider>
    );
    
    // Allow initialization to complete
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Hint button should be present
    const hintButton = screen.getByText(/Need a hint/i);
    expect(hintButton).toBeInTheDocument();
    
    // Click hint button
    fireEvent.click(hintButton);
    
    // Should show the first hint
    expect(screen.getByText(/Think about your experience/i)).toBeInTheDocument();
  });

  // Add more tests as needed
});
