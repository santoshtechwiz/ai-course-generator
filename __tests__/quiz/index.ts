/**
 * Quiz tests entry point
 * 
 * This file imports all quiz-related tests
 */

// Import tests for different quiz types
import './code/CodeQuizWrapper.test';
import './blanks/BlankQuizWrapper.test';
import './mcq/McqQuizWrapper.test';
import './openended/OpenEndedQuizWrapper.test';

// Import utility tests
import '../utils/QuizHelpers.test';
import '../utils/quiz-submission-utils.test';

// Import slice tests related to quizzes
import '../slices/quizSlice.test';
import '../slices/textQuizSlice.test';
