# MCQ Quiz Components

This directory contains components for the MCQ Quiz feature, which allows users to take multiple-choice programming quizzes.

## Component Structure

- `MCQQuizWrapper.tsx`: Main wrapper component that handles authentication, quiz state, and rendering the appropriate UI based on the quiz state.
- `MCQQuiz.tsx`: The quiz component that displays questions and multiple-choice options.
- `MCQQuizResult.tsx`: Component for displaying quiz results.
- `MCQResultPreview.tsx`: Component for displaying a preview of quiz results before submission.
- `MCQQuizHelpers.tsx`: Helper functions specific to MCQ quiz functionality.

## State Management

The MCQ quiz components use the same state management approach as the Code Quiz components, utilizing the `useQuiz` hook from `@/hooks/useQuizState.ts`.

## Authentication Flow

The authentication flow is identical to the Code Quiz implementation, with quiz state preserved during the authentication process.

## Usage

To use the MCQ quiz components, you need to:

1. Import the `MCQQuizWrapper` component
2. Provide the required props: `quizData`, `slug`, `userId`, and `quizId`
3. Wrap the component with the Redux provider

Example:
```tsx
import MCQQuizWrapper from "@/app/dashboard/(quiz)/mcq/components/MCQQuizWrapper"

export default function MCQQuizPage({ quizData, slug, userId, quizId }) {
  return (
    <MCQQuizWrapper 
      quizData={quizData} 
      slug={slug} 
      userId={userId} 
      quizId={quizId} 
    />
  )
}
```
