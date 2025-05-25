/**
 * Session management utilities for quiz module
 */

// Generate a unique session ID for quiz tracking
export const generateSessionId = (): string => {
  return `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Save quiz session data to browser storage
export const saveQuizSession = (
  sessionId: string,
  quizId: string,
  answers: Record<string, any>
): void => {
  try {
    const sessionData = {
      quizId,
      answers,
      lastSaved: Date.now(),
    };
    
    localStorage.setItem(`quiz_session_${sessionId}`, JSON.stringify(sessionData));
  } catch (error) {
    console.error('Failed to save quiz session:', error);
  }
};

// Get quiz session data from browser storage
export const getQuizSession = (sessionId: string): {
  quizId: string;
  answers: Record<string, any>;
  lastSaved: number;
} | null => {
  try {
    const sessionData = localStorage.getItem(`quiz_session_${sessionId}`);
    
    if (!sessionData) {
      return null;
    }
    
    return JSON.parse(sessionData);
  } catch (error) {
    console.error('Failed to get quiz session:', error);
    return null;
  }
};

// Save quiz results to browser storage
export const saveQuizResults = (sessionId: string, results: any): void => {
  try {
    localStorage.setItem(`quiz_results_${sessionId}`, JSON.stringify(results));
  } catch (error) {
    console.error('Failed to save quiz results:', error);
  }
};

// Get quiz results from browser storage
export const getQuizResults = (sessionId: string): any | null => {
  try {
    const results = localStorage.getItem(`quiz_results_${sessionId}`);
    
    if (!results) {
      return null;
    }
    
    return JSON.parse(results);
  } catch (error) {
    console.error('Failed to get quiz results:', error);
    return null;
  }
};

// Clear quiz session data from browser storage
export const clearQuizSession = (sessionId: string): void => {
  try {
    localStorage.removeItem(`quiz_session_${sessionId}`);
    localStorage.removeItem(`quiz_results_${sessionId}`);
  } catch (error) {
    console.error('Failed to clear quiz session:', error);
  }
};

// Check if a quiz session exists
export const hasQuizSession = (quizId: string): boolean => {
  try {
    const keys = Object.keys(localStorage);
    const sessionKeys = keys.filter(key => key.startsWith('quiz_session_'));
    
    for (const key of sessionKeys) {
      const sessionData = localStorage.getItem(key);
      if (sessionData) {
        const data = JSON.parse(sessionData);
        if (data.quizId === quizId) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Failed to check quiz session:', error);
    return false;
  }
};
