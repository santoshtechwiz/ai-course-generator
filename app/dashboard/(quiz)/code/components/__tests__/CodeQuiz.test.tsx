import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import CodeQuiz from '../CodeQuiz'
import quizReducer from '@/store/slices/quiz-slice'
import { act } from 'react-dom/test-utils'

// Mock framer-motion to avoid animation-related issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useAnimation: () => ({ start: jest.fn() }),
}))

// Mock the components that CodeQuiz depends on
jest.mock('../CodeQuizOptions', () => ({
  __esModule: true,
  default: ({ options, selectedOption, onSelect }: any) => (
    <div data-testid="code-quiz-options">
      {options.map((option: string, index: number) => (
        <button
          key={index}
          data-testid={`option-${index}`}
          onClick={() => onSelect(option)}
          className={selectedOption === option ? 'selected' : ''}
        >
          {option}
        </button>
      ))}
    </div>
  ),
}))

jest.mock('@/components/quiz/QuizContainer', () => ({
  QuizContainer: ({ children }: any) => <div data-testid="quiz-container">{children}</div>,
}))

jest.mock('@/components/quiz/QuizFooter', () => ({
  QuizFooter: () => <div data-testid="quiz-footer">Quiz Footer</div>,
}))

// Mock SyntaxHighlighter
jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }: any) => <pre data-testid="syntax-highlighter">{children}</pre>,
}))

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  vscDarkPlus: {},
}))

// Sample question for testing
const mockQuestion = {
  id: '1',
  text: 'What will the following code output?',
  options: ['Option A', 'Option B', 'Option C', 'Option D'],
  correctOptionId: 'Option A',
  codeSnippet: 'console.log("Hello, world!");',
  language: 'javascript',
}

// Set up Redux store
const createTestStore = () => configureStore({
  reducer: {
    quiz: quizReducer,
  },
})

describe('CodeQuiz Component', () => {
  const onAnswer = jest.fn()
  const onNext = jest.fn()
  const onSubmit = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders correctly with all props', () => {
    render(
      <Provider store={createTestStore()}>
        <CodeQuiz
          question={mockQuestion}
          onAnswer={onAnswer}
          questionNumber={1}
          totalQuestions={5}
          onNext={onNext}
          onSubmit={onSubmit}
        />
      </Provider>
    )

    // Check if the question text is rendered
    expect(screen.getByText('What will the following code output?')).toBeInTheDocument()

    // Check if code snippet is shown
    expect(screen.getByTestId('syntax-highlighter')).toBeInTheDocument()
    expect(screen.getByTestId('syntax-highlighter')).toHaveTextContent('console.log("Hello, world!");')

    // Check if the options are rendered
    expect(screen.getByTestId('code-quiz-options')).toBeInTheDocument()

    // Check if the quiz footer is rendered
    expect(screen.getByTestId('quiz-footer')).toBeInTheDocument()
  })

  test('handles option selection correctly', () => {
    render(
      <Provider store={createTestStore()}>
        <CodeQuiz
          question={mockQuestion}
          onAnswer={onAnswer}
          questionNumber={1}
          totalQuestions={5}
          onNext={onNext}
          onSubmit={onSubmit}
        />
      </Provider>
    )

    // Click on the first option
    fireEvent.click(screen.getByTestId('option-0'))

    // Check if onAnswer was called with the correct option
    expect(onAnswer).toHaveBeenCalledWith('Option A')
  })

  test('renders without code snippet when not provided', () => {
    const questionWithoutCode = { ...mockQuestion, codeSnippet: undefined }
    
    render(
      <Provider store={createTestStore()}>
        <CodeQuiz
          question={questionWithoutCode}
          onAnswer={onAnswer}
          questionNumber={1}
          totalQuestions={5}
          onNext={onNext}
          onSubmit={onSubmit}
        />
      </Provider>
    )

    // Code snippet should not be rendered
    expect(screen.queryByTestId('syntax-highlighter')).not.toBeInTheDocument()
  })

  test('handles existing answer correctly', () => {
    render(
      <Provider store={createTestStore()}>
        <CodeQuiz
          question={mockQuestion}
          onAnswer={onAnswer}
          questionNumber={1}
          totalQuestions={5}
          existingAnswer="Option B"
          onNext={onNext}
          onSubmit={onSubmit}
        />
      </Provider>
    )

    // The option with the existing answer should be selected
    const options = screen.getByTestId('code-quiz-options')
    expect(options.querySelector('.selected')).not.toBeNull()
  })

  test('copy button functionality', async () => {
    // Mock clipboard API
    const mockClipboard = {
      writeText: jest.fn().mockImplementation(() => Promise.resolve()),
    }
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      configurable: true,
    })

    render(
      <Provider store={createTestStore()}>
        <CodeQuiz
          question={mockQuestion}
          onAnswer={onAnswer}
          questionNumber={1}
          totalQuestions={5}
          onNext={onNext}
          onSubmit={onSubmit}
        />
      </Provider>
    )

    // Find and click the copy button
    const copyButton = screen.getByRole('button', { name: '' }) // Copy button has no text, just an icon
    
    await act(async () => {
      fireEvent.click(copyButton)
    })

    // Check if clipboard API was called with correct text
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('console.log("Hello, world!");')
  })
})
