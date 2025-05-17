# Code Quiz Components

This directory contains components for the Code Quiz feature, which allows users to take programming quizzes with code editing capabilities.

## Component Structure

- `CodeQuizWrapper.tsx`: Main wrapper component that handles authentication, quiz state, and rendering the appropriate UI based on the quiz state.
- `CodingQuiz.tsx`: The actual quiz component that displays questions, code editor, and options.
- `CodeQuizEditor.tsx`: Monaco editor component for code editing.
- `CodeQuizOptions.tsx`: Component for displaying multiple-choice options.
- `CodeQuizResult.tsx`: Component for displaying quiz results.
- `CodeQuizResultsPage.tsx`: Page component for displaying detailed quiz results.
- `CodeQuizForm.tsx`: Form component for creating new code quizzes.

## State Management

The code quiz components use Redux for state management through the `useQuiz` hook from `@/hooks/useQuizState.ts`. This hook provides access to the quiz state and actions from the `quizSlice.ts` Redux slice.

Key state properties:
- `quizData`: The quiz data including questions
- `currentQuestion`: Index of the current question
- `userAnswers`: Array of user answers
- `isLoading`: Loading state
- `error`: Error state
- `results`: Quiz results

Key actions:
- `loadQuiz`: Load quiz data
- `saveAnswer`: Save a user's answer
- `submitQuiz`: Submit the entire quiz
- `nextQuestion`: Move to the next question
- `resetQuizState`: Reset the quiz state

## Authentication Flow

The authentication flow is handled in the `CodeQuizWrapper.tsx` component:

1. Check if the user is authenticated using `useSession` from `next-auth/react`
2. If not authenticated, store the current path in `sessionStorage` and redirect to the sign-in page
3. After authentication, the user is redirected back to the quiz page
4. The quiz state is restored from Redux or initialized with the provided quiz data

## Authentication Handling

The quiz functionality handles authentication in multiple ways:

1. Initial Authentication Check:
   - When loading a quiz, the component checks if the user is authenticated
   - If not,lets user to play the quiz. URL

2. Submission Authentication:
   - When submitting a quiz, if a 401 error is received, the system:
     - Stores the current quiz state
     - Redirects to the sign-in page
     - Returns the user to the quiz after authentication
     - Recovers their previous answers

3. Results Authentication:
   - Results page requires authentication
   - Unauthenticated users are prompted to sign in
   - After signing in, they are returned to view their results

4. Error Handling:
   - Authentication errors are detected and handled gracefully
   - The user's session state is preserved during the authentication flow

This approach ensures a seamless experience even when authentication is required mid-quiz.

## API Integration

The code quiz components interact with the following API endpoints:

- `/api/quizzes/code/[slug]`: Get quiz data for a specific slug
- `/api/quizzes/common/[slug]/complete`: Submit an answer for a question
- `/api/quizzes/common/submit`: Submit the entire quiz
- `/api/quizzes/common/[slug]/results`: Get quiz results

## Usage

To use the code quiz components, you need to:

1. Import the `CodeQuizWrapper` component
2. Provide the required props: `quizData`, `slug`, `userId`, and `quizId`
3. Wrap the component with the Redux provider

Example:
\`\`\`tsx
import CodeQuizWrapper from "@/app/dashboard/(quiz)/code/components/CodeQuizWrapper"

export default function CodeQuizPage({ quizData, slug, userId, quizId }) {
  return (
    <CodeQuizWrapper 
      quizData={quizData} 
      slug={slug} 
      userId={userId} 
      quizId={quizId} 
    />
  )
}
\`\`\`

## Testing

The code quiz components are tested using Jest and React Testing Library. The tests are located in:

- `app/__tests__/CodeQuizWrapper.test.tsx`: Unit tests for the CodeQuizWrapper component
- `app/__tests__/CodeQuizTest.test.tsx`: Integration tests for the code quiz feature

The tests cover:
- Authentication flow
- Quiz data loading
- Answer submission
- Quiz navigation
- Error handling
- Quiz completion

## Best Practices

1. Always use the Redux state through the `useQuiz` hook instead of local state for quiz data
2. Handle authentication properly by checking the session status
3. Provide appropriate error and loading states
4. Use memoization to prevent unnecessary re-renders
5. Clean up resources when unmounting components
6. Validate quiz data before rendering to prevent runtime errors

## Troubleshooting

Common issues:
- Authentication errors: Make sure the user is signed in and has the necessary permissions
- Quiz data loading errors: Check the API endpoints and network requests
- State management issues: Ensure the Redux store is properly configured and the useQuiz hook is used correctly
- Rendering issues: Validate the quiz data structure before rendering components
