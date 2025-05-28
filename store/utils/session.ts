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
  if (!sessionId) {
    console.error("Cannot save quiz session: sessionId is required");
    return;
  }

  // Add defensive checks for required parameters
  if (!quizId) {
    console.warn("Missing quizId in saveQuizSession call");
  }
  
  if (!quizType) {
    console.warn("Missing quizType in saveQuizSession call, defaulting to 'mcq'");
    quizType = 'mcq'; // Provide a default
  }

  const key = `quiz_session_${sessionId}`;

  // Avoid saving proxies (e.g., Redux state slices) directly
  let safeAnswers: Record<string, any>;
  try {
    // Try to serialize and deserialize to remove proxies
    safeAnswers = JSON.parse(JSON.stringify(answers));
  } catch (err) {
    console.error("Failed to serialize answers:", err);
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
      currentQuestionIndex: meta.currentQuestionIndex || 0,
      isCompleted: meta.isCompleted || false,
      lastSaved: meta.lastSaved || Date.now(),
      title: meta.title || null,
    };
    // Try to serialize the whole session object to catch any remaining proxies
    JSON.stringify(sessionObj);
  } catch (err) {
    console.error("Failed to serialize session object:", err);
    // If the session object still contains a proxy, remove answers
    sessionObj = {
      quizId,
      quizType,
      answers: {},
      currentQuestionIndex: meta.currentQuestionIndex || 0,
      isCompleted: meta.isCompleted || false,
      lastSaved: Date.now(),
      title: meta.title || null,
    };
  }

  // Add more debug information
  console.log(`Saving quiz session for ${quizId}:`, { 
    currentQuestionIndex: meta.currentQuestionIndex, 
    answersCount: Object.keys(answers).length,
    timestamp: new Date().toLocaleTimeString()
  });

  // Clear existing timer for this session
  if (debounceTimers[key]) {
    clearTimeout(debounceTimers[key]);
  }

  // Use a shorter debounce time to improve responsiveness
  debounceTimers[key] = setTimeout(() => {
    // Use try-catch to handle any storage issues
    try {
      sessionStorage.setItem(key, JSON.stringify(sessionObj));
    } catch (err) {
      console.error("Failed to save session:", err);
    }
    delete debounceTimers[key];
  }, 100); // Reduce debounce time from 300ms to 100ms
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
      saveQuizSession(sessionId, quizId, 'mcq', answers, { lastSaved: Date.now() });
      console.log('Auto-saved quiz progress at', new Date().toLocaleTimeString());
    }
  }, interval);
  
  // Return cleanup function
  return () => clearInterval(intervalId);
};

/**
 * Set up periodic sync with IndexedDB for more reliable storage
 */
export const setupSessionPersistence = (
  sessionId: string,
  getState: () => any,
  interval = 60000 // Default: 1 minute
): () => void => {
  // Only setup if browser APIs available
  if (typeof window === 'undefined' || !window.indexedDB) {
    console.warn('IndexedDB not available for quiz persistence');
    return () => {};
  }
  
  // Create/open database
  const request = indexedDB.open('quizSessions', 1);
  
  request.onupgradeneeded = (event) => {
    const db = request.result;
    if (!db.objectStoreNames.contains('sessions')) {
      db.createObjectStore('sessions', { keyPath: 'id' });
    }
  };
  
  // Set up periodic sync
  const intervalId = setInterval(() => {
    try {
      const state = getState();
      const db = request.result;
      
      if (db) {
        const transaction = db.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');
        store.put({
          id: sessionId,
          state: JSON.stringify({
            timestamp: Date.now(),
            data: state
          }),
        });
      }
    } catch (err) {
      console.error('Error syncing quiz state to IndexedDB:', err);
    }
  }, interval);
  
  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    try {
      request.result?.close();
    } catch (err) {
      // Ignore close errors
    }
  };
};



/**
 * Recover a quiz session from IndexedDB if available
 */
export const recoverQuizSession = async (
  sessionId: string
): Promise<any | null> => {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return null;
  }
  
  return new Promise((resolve) => {
    const request = indexedDB.open('quizSessions', 1);
    
    request.onerror = () => {
      resolve(null);
    };
    
    request.onsuccess = () => {
      try {
        const db = request.result;
        const transaction = db.transaction(['sessions'], 'readonly');
        const store = transaction.objectStore('sessions');
        const getRequest = store.get(sessionId);
        
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            try {
              const parsed = JSON.parse(getRequest.result.state);
              resolve(parsed.data);
            } catch (err) {
              console.error('Error parsing recovered session:', err);
              resolve(null);
            }
          } else {
            resolve(null);
          }
        };
        
        getRequest.onerror = () => {
          resolve(null);
        };
      } catch (err) {
        console.error('Error recovering session:', err);
        resolve(null);
      }
    };
  });
};

/**
 * Utility to get sessionId from URL or sessionStorage for auth flow
 */
export const getSessionIdFromUrlOrStorage = (): string | null => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("sessionId");
  if (sessionId) return sessionId;
  // Optionally, check sessionStorage for a stored sessionId
  return sessionStorage.getItem("currentSessionId") || null;
};
