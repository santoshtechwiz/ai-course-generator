/**
 * Session utility functions for quiz application
 */

/**
 * Generate a unique session ID for unauthenticated users
 */
export const generateSessionId = (): string => {
  return `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Save quiz session to sessionStorage
 */
export const saveQuizSession = (
  sessionId: string,
  quizId: string,
  answers: Record<string, any>,
): void => {
  sessionStorage.setItem(`quiz_session_${sessionId}`, JSON.stringify({
    quizId,
    answers,
    lastSaved: Date.now(),
  }));
};

/**
 * Retrieve quiz session from sessionStorage
 */
export const getQuizSession = (sessionId: string): {
  quizId: string;
  answers: Record<string, any>;
  lastSaved: number;
} | null => {
  const sessionData = sessionStorage.getItem(`quiz_session_${sessionId}`);
  if (!sessionData) return null;
  
  try {
    return JSON.parse(sessionData);
  } catch (error) {
    console.error('Failed to parse session data:', error);
    return null;
  }
};

/**
 * Save quiz results to sessionStorage
 */
export const saveQuizResults = (
  sessionId: string,
  results: any,
): void => {
  sessionStorage.setItem(`quiz_results_${sessionId}`, JSON.stringify(results));
};

/**
 * Retrieve quiz results from sessionStorage
 */
export const getQuizResults = (sessionId: string): any | null => {
  const resultsData = sessionStorage.getItem(`quiz_results_${sessionId}`);
  if (!resultsData) return null;
  
  try {
    return JSON.parse(resultsData);
  } catch (error) {
    console.error('Failed to parse results data:', error);
    return null;
  }
};

/**
 * Clear quiz session and results from sessionStorage
 */
export const clearQuizSession = (sessionId: string): void => {
  sessionStorage.removeItem(`quiz_session_${sessionId}`);
  sessionStorage.removeItem(`quiz_results_${sessionId}`);
};

/**
 * Check if a quiz session exists
 */
export const hasQuizSession = (sessionId: string): boolean => {
  return !!sessionStorage.getItem(`quiz_session_${sessionId}`);
};

/**
 * Auto-save quiz answers at regular intervals
 */
export const setupAutoSave = (
  sessionId: string,
  quizId: string,
  getAnswers: () => Record<string, any>,
  interval = 30000, // Default: 30 seconds
): () => void => {
  const intervalId = setInterval(() => {
    const answers = getAnswers();
    if (Object.keys(answers).length > 0) {
      saveQuizSession(sessionId, quizId, answers);
      console.log('Auto-saved quiz progress at', new Date().toLocaleTimeString());
    }
  }, interval);
  
  // Return cleanup function
  return () => clearInterval(intervalId);
};
