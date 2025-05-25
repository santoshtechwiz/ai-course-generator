/**
 * Root test entry point
 * 
 * This file serves as a central registry for all tests
 */

// Import quiz tests by type
import './quiz/code/CodeQuizWrapper.test';
import './quiz/blanks/BlankQuizWrapper.test';
import './quiz/mcq/McqQuizWrapper.test';
import './quiz/openended/OpenEndedQuizWrapper.test';

// Import utility tests
import './utils/QuizHelpers.test';
import './utils/quiz-submission-utils.test';

// Import slice tests
import './slices/quizSlice.test';
import './slices/textQuizSlice.test';

// Import API tests
import './api/quizzes/common/slug/complete/route.test';

// Import integration and E2E tests
import './integration/quizSubmission.test';
import './quiz-navigation.test';
import './e2e/mcq-quiz-flow.test';
import './e2e/openended-quiz-flow.test';
import './e2e/code-quiz-flow.test';
import './e2e/blanks-quiz-flow.test';
