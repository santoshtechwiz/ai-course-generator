# Quiz Flow Integration Tests

This directory contains comprehensive integration tests for the quiz flow functionality.

## Test Structure

```
__tests__/
├── integration/
│   └── quiz-flow/
│       ├── quiz-flow.test.tsx      # Main quiz flow integration tests
│       └── quiz-api.test.ts        # Quiz API endpoint tests
├── unit/
│   ├── quiz-slice.test.ts          # Redux slice unit tests
│   └── storage-manager.test.ts     # Storage manager unit tests
└── utils/
    └── test-utils.tsx              # Shared test utilities and helpers
```

## Test Categories

### Integration Tests (`__tests__/integration/`)

#### Quiz Flow Tests (`quiz-flow.test.tsx`)
- **Quiz Loading Flow**: Tests quiz fetching, loading states, and error handling
- **Question Navigation Flow**: Tests moving between questions and navigation boundaries
- **Answer Submission Flow**: Tests saving answers and validation
- **Quiz Submission Flow**: Tests quiz completion and result handling
- **Authentication Flow**: Tests auth-required scenarios and redirects
- **Quiz Reset Flow**: Tests quiz state reset functionality

#### Quiz API Tests (`quiz-api.test.ts`)
- **GET /api/quizzes/[quizType]/[slug]**: Quiz fetching endpoint
- **POST /api/quizzes/[quizType]/[slug]/submit**: Quiz submission endpoint
- **GET /api/quizzes/related**: Related quizzes endpoint
- **GET /api/quizzes/common/random**: Random quizzes endpoint
- **Error Handling**: Network errors, timeouts, malformed responses
- **Authentication**: Header handling and session management

### Unit Tests (`__tests__/unit/`)

#### Quiz Slice Tests (`quiz-slice.test.ts`)
- **Actions**: fetchQuiz, submitQuiz, resetQuiz, saveAnswer, setCurrentQuestionIndex
- **Reducers**: State updates for all actions
- **Selectors**: All exported selectors for state access
- **Async Thunks**: Pending, fulfilled, and rejected states

#### Storage Manager Tests (`storage-manager.test.ts`)
- **Quiz Progress Storage**: Save, retrieve, and clear quiz progress
- **Temp Results Storage**: Handle temporary quiz results for unauthenticated users
- **Data Integrity**: Validation and error handling
- **Cleanup**: Automatic cleanup of expired data
- **Error Handling**: localStorage errors and corrupted data

## Test Utilities (`__tests__/utils/`)

### Test Utils (`test-utils.tsx`)
- **Custom Render**: `renderWithProviders` with all necessary providers
- **Mock Factories**: `createMockQuiz`, `createMockUser`, `createMockSession`
- **API Mocks**: `mockFetch`, `mockFetchError`, `mockFetchWithStatus`
- **State Helpers**: `waitForState` for async state changes
- **Cleanup**: `cleanup` function for test isolation

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Integration Tests Only
```bash
npm run test:integration
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run Specific Test File
```bash
npm test -- quiz-flow.test.tsx
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

## Test Configuration

### Jest Configuration
- **Integration Tests**: `jest.config.integration.ts`
- **Unit Tests**: `jest.config.ts`
- **Setup Files**: `jest.setup.ts` for global test setup

### Test Environment
- **DOM Testing**: Uses `jsdom` for React component testing
- **API Testing**: Uses MSW (Mock Service Worker) for API mocking
- **Async Testing**: Built-in Jest async/await support

## Mock Strategy

### External Dependencies
- **Next.js Router**: Mocked to prevent navigation during tests
- **NextAuth**: Mocked session and authentication
- **Sonner**: Mocked toast notifications
- **localStorage/sessionStorage**: Mocked for storage testing

### API Endpoints
- **MSW**: Used for mocking HTTP requests
- **Fetch API**: Globally mocked for consistent behavior
- **Error Scenarios**: Network errors, timeouts, and server errors

## Test Data

### Mock Quiz Structure
```typescript
{
  id: 'test-quiz-1',
  slug: 'javascript-basics-test',
  title: 'JavaScript Basics Quiz',
  quizType: 'code',
  questions: [
    {
      id: 'q1',
      question: 'What is the output of console.log(typeof null)?',
      type: 'code',
      options: ['null', 'object', 'undefined', 'boolean'],
      answer: 'object',
      codeSnippet: 'console.log(typeof null)',
      language: 'javascript',
    },
    // ... more questions
  ]
}
```

### Mock User Structure
```typescript
{
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  image: null,
}
```

## Best Practices

### Test Organization
- **Describe Blocks**: Group related tests with clear descriptions
- **Test Naming**: Use descriptive names that explain what is being tested
- **Arrange-Act-Assert**: Follow AAA pattern in test bodies
- **Isolation**: Each test should be independent and not rely on others

### Mock Management
- **Reset Mocks**: Use `cleanup()` between tests
- **Specific Mocks**: Mock only what's necessary for the test
- **Realistic Data**: Use realistic mock data that matches production

### Async Testing
- **Wait For**: Use `waitFor` for async state changes
- **Timeouts**: Set appropriate timeouts for async operations
- **Error Handling**: Test both success and error scenarios

### Component Testing
- **Providers**: Use `renderWithProviders` for full context
- **User Events**: Use `@testing-library/user-event` for interactions
- **Accessibility**: Test with screen reader queries when possible

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 85%
- **Lines**: > 80%

## Continuous Integration

Tests are configured to run in CI with:
- **Parallel Execution**: Tests run in parallel for faster execution
- **Coverage Reports**: Generated and uploaded to coverage service
- **Failure Notifications**: Alerts on test failures
- **Performance Monitoring**: Track test execution times

## Debugging Tests

### Common Issues
1. **Async Timing**: Use `waitFor` for state changes
2. **Mock Conflicts**: Reset mocks between tests
3. **Provider Context**: Ensure all providers are included
4. **DOM Updates**: Wait for DOM updates before assertions

### Debug Tools
- **Jest Debug**: Use `--verbose` flag for detailed output
- **DOM Inspection**: Use `screen.debug()` to inspect DOM
- **State Inspection**: Log Redux state during tests
- **Network Inspection**: Check MSW request handlers

## Future Enhancements

- **Visual Regression**: Add visual testing with Playwright
- **Performance Testing**: Add performance benchmarks
- **E2E Testing**: Add Cypress/Playwright for full user journeys
- **Load Testing**: Add tests for concurrent quiz submissions
- **Accessibility Testing**: Add a11y-specific test cases
