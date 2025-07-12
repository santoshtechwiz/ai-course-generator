# Quiz Module Architecture

This document outlines the architecture of the Quiz module, which has been refactored to use a repository and service pattern for improved maintainability and extensibility.

## Architecture Overview

The architecture follows a layered approach:

```
API Routes -> Services -> Repositories -> Database
```

### Key Components

1. **Repositories**: Handle direct database operations
2. **Services**: Implement business logic and use repositories for data access
3. **API Routes**: Handle HTTP requests and use services to process them

## Repository Pattern

Repositories abstract database operations and provide a clean interface to the data layer.

### Base Repository

A generic base repository that implements common CRUD operations:

- `findById`: Find a record by ID
- `findBy`: Find a record by a specific field
- `findAll`: Find all records with optional filtering
- `create`: Create a new record
- `update`: Update an existing record
- `delete`: Delete a record

### Specific Repositories

- `QuizRepository`: Handles quiz-related database operations
- `QuestionRepository`: Handles question-related database operations
- `UserRepository`: Handles user-related database operations

## Service Pattern

Services implement the business logic and use repositories to access data.

### Base Service

The `BaseQuizService` provides common functionality for all quiz types:

- `getQuizBySlug`: Get a quiz by its slug
- `updateQuizProperties`: Update a quiz's public/favorite status
- `completeQuiz`: Mark a quiz as complete

### Specific Services

- `CodeQuizService`: Handles code quiz-specific business logic
- `QuizListService`: Handles quiz listing and filtering

## Factory Pattern

The `QuizServiceFactory` creates the appropriate service based on the quiz type:

```typescript
// Example usage
const quizService = QuizServiceFactory.getQuizService(quizType);
```

## Benefits of the New Architecture

1. **Separation of Concerns**: Each component has a well-defined responsibility
2. **Code Reuse**: Common functionality is abstracted and shared
3. **Testability**: Services and repositories can be tested in isolation
4. **Maintainability**: Changes to database schema only affect repositories
5. **Extensibility**: New quiz types can be added by extending base classes

## Adding a New Quiz Type

To add a new quiz type:

1. Create a new service class extending `BaseQuizService`
2. Implement the `formatQuestions` method for the specific quiz type
3. Update the `QuizServiceFactory` to return the new service

## API Routes

API routes have been simplified to use the service pattern:

- `/api/quizzes/code`: Uses `CodeQuizService` to create and fetch code quizzes
- `/api/quizzes/list`: Uses `QuizListService` to list quizzes
- `/api/quizzes/quiz/random`: Uses `QuizListService` to fetch random quizzes
- `/api/quizzes/quiz/[slug]`: Uses factory-created service based on quiz type
