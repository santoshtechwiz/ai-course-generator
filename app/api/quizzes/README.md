# Quiz API Structure

This directory contains all quiz-related API endpoints, organized by quiz type and common functionality.

## Directory Structure

\`\`\`
/api/quizzes/
  /code/                  # Code quiz specific endpoints
    /[slug]/route.ts      # Get a specific code quiz by slug
    /route.ts             # Create a new code quiz
    /generator.ts         # Generate code quiz questions
  /mcq/                   # Multiple choice quiz endpoints
    /[slug]/route.ts      # Get a specific MCQ quiz by slug
  /openended/             # Open-ended quiz endpoints
    /[slug]/route.ts      # Get a specific open-ended quiz by slug
  /blanks/                # Fill-in-the-blanks quiz endpoints
    /[slug]/route.ts      # Get a specific blanks quiz by slug
  /flashcard/             # Flashcard quiz endpoints
    /[slug]/route.ts      # Get a specific flashcard quiz by slug
    /route.ts             # Create and manage flashcards
  /common/                # Common quiz operations
    /[slug]/route.ts      # Get, update, or delete a quiz by slug
    /[slug]/complete/route.ts  # Complete a quiz and save results
    /random/route.ts      # Get random quizzes
    /route.ts             # General quiz operations
  /list/                  # List quizzes with filtering
    /route.ts             # Get a list of quizzes
\`\`\`

## API Endpoints

### Code Quizzes

- `GET /api/quizzes/code/[slug]` - Get a specific code quiz
- `POST /api/quizzes/code` - Create a new code quiz

### MCQ Quizzes

- `GET /api/quizzes/mcq/[slug]` - Get a specific MCQ quiz

### Open-ended Quizzes

- `GET /api/quizzes/openended/[slug]` - Get a specific open-ended quiz

### Fill-in-the-blanks Quizzes

- `GET /api/quizzes/blanks/[slug]` - Get a specific fill-in-the-blanks quiz

### Flashcard Quizzes

- `GET /api/quizzes/flashcard?slug=[slug]` - Get a specific flashcard quiz
- `POST /api/quizzes/flashcard` - Create a new flashcard quiz
- `PATCH /api/quizzes/flashcard` - Update a flashcard

### Common Quiz Operations

- `GET /api/quizzes/common/[slug]` - Get a quiz by slug
- `PATCH /api/quizzes/common/[slug]` - Update a quiz (visibility, favorite status)
- `DELETE /api/quizzes/common/[slug]` - Delete a quiz
- `POST /api/
