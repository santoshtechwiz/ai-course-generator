# MCQ Quiz Components

This directory contains components for the MCQ Quiz feature, which allows users to take multiple-choice programming quizzes.

## Component Structure

- `McqQuizWrapper.tsx`: Main wrapper component that handles authentication, quiz state, and rendering the appropriate UI based on the quiz state.
- `McqQuiz.tsx`: The quiz component that displays questions and multiple-choice options.
- `McqQuizResult.tsx`: Component for displaying quiz results.
- `McqResultPreview.tsx`: Component for displaying a preview of quiz results before submission.
- `McqQuizClient.tsx`: Client component that initializes the quiz data and handles API interactions.
- `McqResultsClient.tsx`: Client component for displaying quiz results.
- `types.ts`: Type definitions used across MCQ components.

## State Management

The MCQ quiz components use Redux via the quizSlice for state management. The components connect to the store using `useAppDispatch` and `useAppSelector` hooks.

## Authentication Flow

When a non-authenticated user completes a quiz, they are prompted to sign in to save their results. The quiz state is temporarily stored in Redux and can be recovered after authentication.

## Usage

To use the MCQ quiz components, you need to:

1. Import the `McqQuizWrapper` component
2. Provide the required props: `slug`, `userId`, and optionally `quizData`
3. Ensure the Redux provider is available in the parent component

Example:
```tsx
import McqQuizWrapper from "@/app/dashboard/(quiz)/mcq/components/McqQuizWrapper"

export default function McqQuizPage({ slug, userId, quizData }) {
  return (
    <McqQuizWrapper 
      slug={slug} 
      userId={userId} 
      quizData={quizData} 
    />
  )
}
```
