import { signIn } from "next-auth/react";
import { AppDispatch } from "../index";

// ========== Constants ==========
const SESSION_PREFIX = "quiz_session_";
const RESULTS_PREFIX = "quiz_results_";
const DEBOUNCE_DELAY = 300;
const MAX_QUEUE_BATCH = 5;

// ========== Types ==========
export type QuizType = 'mcq' | 'code' | 'blanks' | 'openended' | 'flashcard';

interface AuthRedirectParams {
  slug: string;
  quizId: string | number;
  type: QuizType;
  answers: Record<string, any>;
  currentQuestionIndex: number;
  tempResults?: any;
}

interface QuizSessionData {
  quizId: string;
  answers: Record<string, any>;
  lastSaved: number;
}

// ========== Mutex for Storage ==========
let isStorageLocked = false;
const waitForUnlock = async (): Promise<void> => {
  while (isStorageLocked) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
};
const lockStorage = () => (isStorageLocked = true);
const unlockStorage = () => (isStorageLocked = false);

// ========== Queue Management ==========
const storageQueue: Array<() => void> = [];
let isProcessingQueue = false;

const processStorageQueue = async () => {
  if (isProcessingQueue || storageQueue.length === 0) return;

  isProcessingQueue = true;
  const batch = storageQueue.splice(0, MAX_QUEUE_BATCH);
  await waitForUnlock();

  lockStorage();
  batch.forEach((op) => op());
  unlockStorage();

  isProcessingQueue = false;
  if (storageQueue.length > 0) {
    setTimeout(processStorageQueue, 0);
  }
};

const enqueueStorageOperation = (operation: () => void) => {
  storageQueue.push(operation);
  if (!isProcessingQueue) {
    setTimeout(processStorageQueue, 0);
  }
};

// ========== Auth Helpers ==========

export const handleAuthRedirect = (
  dispatch: AppDispatch,
  params: AuthRedirectParams
) => {
  saveAuthRedirectState({
    slug: params.slug,
    quizId: params.quizId.toString(),
    type: params.type,
    answers: params.answers,
    currentQuestionIndex: params.currentQuestionIndex,
    tempResults: params.tempResults
  });

  return signIn(undefined, {
    callbackUrl: `/dashboard/${params.type}/${params.slug}?fromAuth=true`,
  });
};

export const getAuthCallbackUrl = (
  quizType: QuizType,
  slug: string,
  showResults = false
): string => {
  const url = new URLSearchParams({ fromAuth: "true" });
  if (showResults) url.set("showResults", "true");
  return `/dashboard/${quizType}/${slug}?${url.toString()}`;
};

export const isReturningFromAuth = (params: URLSearchParams): boolean =>
  params.get("fromAuth") === "true";

export const shouldShowResults = (params: URLSearchParams): boolean =>
  params.get("showResults") === "true";

// ========== Session ID ==========

export const generateSessionId = (): string =>
  `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// ========== Storage Utilities ==========

const debounceTimers: Record<string, NodeJS.Timeout> = {};

export const saveQuizSession = (
  sessionId: string,
  quizId: string,
  answers: Record<string, any>
): void => {
  const key = `${SESSION_PREFIX}${sessionId}`;
  if (debounceTimers[key]) clearTimeout(debounceTimers[key]);

  debounceTimers[key] = setTimeout(() => {
    enqueueStorageOperation(() => {
      try {
        const data: QuizSessionData = {
          quizId,
          answers,
          lastSaved: Date.now()
        };
        sessionStorage.setItem(key, JSON.stringify(data));
      } catch (err) {
        console.error("Failed to save session:", err);
      }
    });
    delete debounceTimers[key];
  }, DEBOUNCE_DELAY);
};

export const getQuizSession = (sessionId: string): QuizSessionData | null => {
  const data = sessionStorage.getItem(`${SESSION_PREFIX}${sessionId}`);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to parse session:", err);
    return null;
  }
};

export const saveQuizResults = (sessionId: string, results: any): void => {
  enqueueStorageOperation(() => {
    try {
      sessionStorage.setItem(`${RESULTS_PREFIX}${sessionId}`, JSON.stringify(results));
    } catch (err) {
      console.error("Failed to save results:", err);
    }
  });
};

export const getQuizResults = (sessionId: string): any | null => {
  const data = sessionStorage.getItem(`${RESULTS_PREFIX}${sessionId}`);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to parse results:", err);
    return null;
  }
};

export const clearQuizSession = (sessionId: string): void => {
  sessionStorage.removeItem(`${SESSION_PREFIX}${sessionId}`);
  sessionStorage.removeItem(`${RESULTS_PREFIX}${sessionId}`);
};

export const hasQuizSession = (sessionId: string): boolean => {
  return !!sessionStorage.getItem(`${SESSION_PREFIX}${sessionId}`);
};

export const setupAutoSave = (
  sessionId: string,
  quizId: string,
  getAnswers: () => Record<string, any>,
  interval = 30_000
): () => void => {
  const intervalId = setInterval(() => {
    const answers = getAnswers();
    if (Object.keys(answers).length > 0) {
      saveQuizSession(sessionId, quizId, answers);
      console.log("Auto-saved at", new Date().toLocaleTimeString());
    }
  }, interval);

  return () => clearInterval(intervalId);
};

// ========== Stub: Implement this based on your Redux slice ==========
const saveAuthRedirectState = (state: any) => {
  // You must implement this to store in Redux slice or local/sessionStorage as needed
};
