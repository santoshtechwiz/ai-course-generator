import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NonAuthenticatedUserSignInPrompt from '../NonAuthenticatedUserSignInPrompt';

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

describe('NonAuthenticatedUserSignInPrompt', () => {
  test('renders with default props', () => {
    render(
      <NonAuthenticatedUserSignInPrompt 
        quizType="code" 
      />
    );
    
    expect(screen.getByTestId('non-authenticated-prompt')).toBeInTheDocument();
    expect(screen.getByTestId('sign-in-button')).toBeInTheDocument();
  });

  test('calls onSignIn when sign-in button is clicked', () => {
    const mockOnSignIn = jest.fn();
    
    render(
      <NonAuthenticatedUserSignInPrompt 
        quizType="code" 
        onSignIn={mockOnSignIn}
      />
    );
    
    fireEvent.click(screen.getByTestId('sign-in-button'));
    expect(mockOnSignIn).toHaveBeenCalled();
  });

  test('displays save message when showSaveMessage is true', () => {
    render(
      <NonAuthenticatedUserSignInPrompt 
        quizType="code" 
        showSaveMessage={true}
      />
    );
    
    expect(screen.getByTestId('save-message')).toBeInTheDocument();
  });

  test('does not display save message when showSaveMessage is false', () => {
    render(
      <NonAuthenticatedUserSignInPrompt 
        quizType="code" 
        showSaveMessage={false}
      />
    );
    
    expect(screen.queryByTestId('save-message')).not.toBeInTheDocument();
  });

  test('displays custom message when provided', () => {
    const customMessage = 'Custom authentication message';
    
    render(
      <NonAuthenticatedUserSignInPrompt 
        quizType="code" 
        message={customMessage}
      />
    );
    
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  test('redirects to default route when onSignIn not provided', () => {
    const mockPush = jest.fn();
    require('next/navigation').useRouter.mockReturnValue({ push: mockPush });
    
    render(
      <NonAuthenticatedUserSignInPrompt 
        quizType="code" 
      />
    );
    
    fireEvent.click(screen.getByTestId('sign-in-button'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/auth/signin?callbackUrl='));
  });
});
