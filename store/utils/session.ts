/**
 * Session utility functions for quiz application
 */

// Queue for batching session storage operations
const storageQueue: Array<() => void> = [];
let isProcessingQueue = false;

/**
 * Process the storage queue in batches to avoid blocking the main thread
 */
const processStorageQueue = () => {
  if (isProcessingQueue || storageQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  // Process up to 5 operations at a time
  const operations = storageQueue.splice(0, 5);
  
  // Execute operations
  operations.forEach(operation => operation());
  
  // Continue processing if there are more operations
  if (storageQueue.length > 0) {
    setTimeout(processStorageQueue, 0);
  } else {
    isProcessingQueue = false;
  }
};

/**
 * Add an operation to the storage queue
 */
const enqueueStorageOperation = (operation: () => void) => {
  storageQueue.push(operation);
  
  // Start processing the queue if it's not already being processed
  if (!isProcessingQueue) {
    setTimeout(processStorageQueue, 0);
  }
};

/**
 * Generate a unique session ID for unauthenticated users
 */
export const generateSessionId = (): string => {
  return `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Debounce map to avoid excessive storage operations
const debounceTimers: Record<string, NodeJS.Timeout> = {};

/**
 * Save quiz session to sessionStorage with debouncing
 * Supports all quiz types (mcq, code, blanks, openended)
 */
export const saveQuizSession = (
  sessionId: string,
  quizId: string,
  quizType: string,
  answers: Record<string, any>,
  meta: {
    currentQuestionIndex?: number,
    status?: string,
    isCompleted?: boolean,
    results?: any,
    title?: string,
    description?: string,
    questions?: any[],
    lastSaved?: number
  } = {}
): void => {
  const key = `quiz_session_${sessionId}`;

  // Avoid saving proxies (e.g., Redux state slices) directly
  let safeAnswers: Record<string, any>;
  try {
    // Try to serialize and deserialize to remove proxies
    safeAnswers = JSON.parse(JSON.stringify(answers));
  } catch (err) {
    // Fallback: shallow copy, filter out proxies
    safeAnswers = {};
    for (const k in answers) {
      try {
        // Try to serialize each answer individually
        safeAnswers[k] = JSON.parse(JSON.stringify(answers[k]));
      } catch {
        // If even that fails, skip this answer
        continue;
      }
    }
  }

  // Prepare generic session object
  let sessionObj: Record<string, any>;
  try {
    sessionObj = {
      quizId,
      quizType,
      answers: safeAnswers,
      lastSaved: Date.now(),
      ...meta,
    };
    // Try to serialize the whole session object to catch any remaining proxies
    JSON.stringify(sessionObj);
  } catch (err) {
    // If the session object still contains a proxy, remove answers
    sessionObj = {
      quizId,
      quizType,
      answers: {},
      lastSaved: Date.now(),
      ...meta,
    };
  }

  // Clear existing timer for this session
  if (debounceTimers[key]) {
    clearTimeout(debounceTimers[key]);
  }

  debounceTimers[key] = setTimeout(() => {
    enqueueStorageOperation(() => {
      try {
        sessionStorage.setItem(key, JSON.stringify(sessionObj));
      } catch (err) {
        // If error is due to revoked proxy, just skip saving
        if (
          err &&
          typeof err.message === "string" &&
          err.message.includes("proxy that has been revoked")
        ) {
          // Optionally log or ignore
          return;
        }
        console.error("Failed to save session:", err);
      }
    });
    delete debounceTimers[key];
  }, 300);
};

/**
 * Retrieve quiz session from sessionStorage (generic for all quiz types)
 */
export const getQuizSession = (sessionId: string): any | null => {
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
  enqueueStorageOperation(() => {
    sessionStorage.setItem(`quiz_results_${sessionId}`, JSON.stringify(results));
  });
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
