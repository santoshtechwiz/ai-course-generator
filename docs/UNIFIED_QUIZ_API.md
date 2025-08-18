# Unified Quiz API Documentation

This document describes the unified API structure for quizzes in the AI Learning platform.

## API Structure

The unified API provides a consistent interface for all quiz types, while maintaining backward compatibility with the existing specialized endpoints.

### Base URL: `/api/quizzes`

## Endpoints

### Main Entry Points

1. **GET `/api/quizzes`**
   - Returns a list of quizzes with optional filters
   - Query parameters:
     - `limit`: Maximum number of quizzes to return (default: 10)
     - `type`: Filter by quiz type (mcq, code, blanks, openended, flashcard)
     - `search`: Search term for quiz title
     - `favorites`: Set to "true" to get only favorite quizzes (requires authentication)
     - `slug`: If provided, redirects to the specific quiz endpoint

2. **POST `/api/quizzes`**
   - Creates a new quiz
   - Requires authentication
   - Body parameters:
     - `type` or `quizType`: Required. The type of quiz to create (mcq, code, blanks, openended, flashcard)
     - Additional parameters based on quiz type

### Unified Dynamic Routes

1. **GET `/api/quizzes/[quizType]`**
   - Returns a list of quizzes of the specified type
   - Special cases:
     - `list`: Returns filtered quizzes (similar to main entry point)
     - `random`: Returns random quizzes

2. **POST `/api/quizzes/[quizType]`**
   - Creates a new quiz of the specified type
   - Requires authentication

3. **GET `/api/quizzes/[quizType]/[slug]`**
   - Returns a specific quiz by slug
   - Requires authentication for private quizzes

4. **PATCH `/api/quizzes/[quizType]/[slug]`**
   - Updates a specific quiz (isPublic, isFavorite)
   - Requires authentication and ownership

5. **DELETE `/api/quizzes/[quizType]/[slug]`**
   - Deletes a specific quiz
   - Requires authentication and ownership

6. **POST `/api/quizzes/[quizType]/[slug]/submit`**
   - Submits answers for a quiz
   - Requires authentication

## Legacy Support

The unified API maintains backward compatibility with the existing specialized endpoints. All existing routes will continue to work as before:

- `/api/quizzes/mcq/[slug]`
- `/api/quizzes/code/[slug]`
- `/api/quizzes/blanks/[slug]`
- `/api/quizzes/openended/[slug]`
- `/api/quizzes/flashcard/[slug]`

## Future Improvements

In the future, we can further simplify the API by:

1. Consolidating service methods to have a more consistent interface
2. Creating a common quiz interface that all quiz types implement
3. Gradually migrating clients to use the unified endpoints
4. Eventually deprecating and removing the specialized endpoints once all clients have migrated

## Example Usage

### Creating a quiz:

```typescript
// Create an MCQ quiz
const response = await fetch('/api/quizzes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'mcq',
    title: 'JavaScript Basics',
    amount: 5,
    difficulty: 'medium',
  }),
});

const quiz = await response.json();
```

### Getting a specific quiz:

```typescript
const response = await fetch(`/api/quizzes?slug=${quizSlug}`);
const quiz = await response.json();
```

Or using the direct route:

```typescript
const response = await fetch(`/api/quizzes/${quizType}/${quizSlug}`);
const quiz = await response.json();
```
