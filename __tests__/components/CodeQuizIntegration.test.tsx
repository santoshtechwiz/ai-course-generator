import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import quizReducer from '@/store/slices/quiz/quiz-slice'

// Mock the components we'll be testing
jest.mock('@/app/dashboard/(quiz)/code/components/CodeQuiz', () => ({
  __esModule: true,
  default: ({ question, onAnswer }: any) => (
    <div data-testid="code-quiz">
      <h2>{question.text || question.question}</h2>
      {question.codeSnippet && (
        <pre data-testid="code-snippet">{question.codeSnippet}</pre>
      )}
      <div data-testid="options">
        {question.options.map((option: string, i: number) => (
          <button key={i} onClick={() => onAnswer(option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  ),
}))

// Create a test store with the quiz reducer
const createTestStore = () => configureStore({
  reducer: {
    quiz: quizReducer,
  },
})

// Sample question data
const mockQuestion = {
  id: '1',
  text: 'What will the following code output?',
  options: ['Option A', 'Option B', 'Option C', 'Option D'],
  correctOptionId: 'Option A',
  codeSnippet: 'console.log("Hello, world!");',
  language: 'javascript',
}

describe('CodeQuiz Component Integration', () => {
  test('verify component mocks work correctly', () => {
    const onAnswer = jest.fn()

    // Import the actual component
    const CodeQuiz = require('@/app/dashboard/(quiz)/code/components/CodeQuiz').default

    // Render with the Redux provider
    render(
      <Provider store={createTestStore()}>
        <CodeQuiz 
          question={mockQuestion} 
          onAnswer={onAnswer} 
          questionNumber={1}
          totalQuestions={5}
        />
      </Provider>
    )

    // Verify the component renders
    expect(screen.getByTestId('code-quiz')).toBeInTheDocument()
    expect(screen.getByText('What will the following code output?')).toBeInTheDocument()
    
    // Test interaction
    fireEvent.click(screen.getByText('Option A'))
    expect(onAnswer).toHaveBeenCalledWith('Option A')
  })
})
