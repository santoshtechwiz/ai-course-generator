import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import McqQuiz from '@/app/dashboard/(quiz)/mcq/components/McqQuiz';

// Mock the framer-motion module
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => 
      <div data-testid="motion-div" {...props}>{children}</div>,
    button: ({ children, ...props }: React.ComponentProps<'button'>) => 
      <button data-testid="motion-button" {...props}>{children}</button>,
    span: ({ children, ...props }: React.ComponentProps<'span'>) => 
      <span data-testid="motion-span" {...props}>{children}</span>
  }
}));

describe('McqQuiz Component', () => {
  const mockOnAnswer = jest.fn();
  const defaultProps = {
    question: {
      id: 'q1',
      text: 'What is React?',
      type: 'mcq' as const,
      options: [
        { id: 'opt1', text: 'A JavaScript library' },
        { id: 'opt2', text: 'A programming language' },
        { id: 'opt3', text: 'A database' }
      ],
      correctOptionId: 'opt1'
    },
    questionNumber: 1,
    totalQuestions: 10,
    onAnswer: mockOnAnswer,
    isLastQuestion: false,
    isSubmitting: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the question text correctly', () => {
    render(<McqQuiz {...defaultProps} />);
    expect(screen.getByText('What is React?')).toBeInTheDocument();
  });

  it('displays the question number and total questions', () => {
    render(<McqQuiz {...defaultProps} />);
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders all answer options', () => {
    render(<McqQuiz {...defaultProps} />);
    expect(screen.getByText('A JavaScript library')).toBeInTheDocument();
    expect(screen.getByText('A programming language')).toBeInTheDocument();
    expect(screen.getByText('A database')).toBeInTheDocument();
  });

  it('selects an option when clicked', async () => {
    render(<McqQuiz {...defaultProps} />);
    
    // Get the option by its text and click it
    const option = screen.getByText('A JavaScript library');
    fireEvent.click(option);
    
    // The button should now be disabled after selection
    const submitButton = screen.getByText('Next Question');
    expect(submitButton).not.toBeDisabled();
  });

  it('calls onAnswer with correct parameters when submitting', async () => {
    render(<McqQuiz {...defaultProps} />);
    
    // Select an option
    const option = screen.getByText('A JavaScript library');
    fireEvent.click(option);
    
    // Click submit button
    const submitButton = screen.getByText('Next Question');
    fireEvent.click(submitButton);
    
    // Wait for the callback to be called (after animation delay)
    await waitFor(() => {
      expect(mockOnAnswer).toHaveBeenCalled();
    }, { timeout: 350 }); // Allow for animation delay
    
    // Verify the parameters (selected option ID, timer value, and isCorrect flag)
    expect(mockOnAnswer.mock.calls[0][0]).toBe('opt1');
    // We can't test the exact timer value as it depends on execution time
    expect(typeof mockOnAnswer.mock.calls[0][1]).toBe('number');
    // The answer is correct because we selected opt1 which matches correctOptionId
    expect(mockOnAnswer.mock.calls[0][2]).toBe(true);
  });

  it('displays "Submit Quiz" text when isLastQuestion is true', () => {
    render(<McqQuiz {...defaultProps} isLastQuestion={true} />);
    
    // Select an option to enable the button
    const option = screen.getByText('A JavaScript library');
    fireEvent.click(option);
    
    expect(screen.getByText('Submit Quiz')).toBeInTheDocument();
  });

  it('starts with pre-selected option if existingAnswer is provided', () => {
    render(<McqQuiz {...defaultProps} existingAnswer="opt2" />);
    
    // The submit button should be enabled
    const submitButton = screen.getByText('Next Question');
    expect(submitButton).not.toBeDisabled();
  });

  it('disables the submit button when isSubmitting is true', () => {
    render(<McqQuiz {...defaultProps} isSubmitting={true} />);
    
    // Select an option
    const option = screen.getByText('A JavaScript library');
    fireEvent.click(option);
    
    // The button should be disabled
    const submitButton = screen.getByText('Submitting...');
    expect(submitButton).toBeDisabled();
  });
});
