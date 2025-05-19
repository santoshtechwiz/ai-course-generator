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

// Add integration tests
import './integration/quizSubmission.test';
