import { AES, enc } from 'crypto-js';

// Environment variable for storage encryption (should be in .env)
const STORAGE_SECRET = process.env.NEXT_PUBLIC_STORAGE_SECRET || 'quiz-app-secret';

/**
 * Centralized storage service to prevent race conditions between
 * different storage mechanisms
 */
export class StorageService {
  static instance: StorageService;
  
  private constructor() {}
  
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }
  
  // Temporary quiz state (session-only)
  setTemporaryQuizState(key: string, value: any): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(key, JSON.stringify(this.sanitizeData(value)));
    }
  }
  
  getTemporaryQuizState<T>(key: string): T | null {
    if (typeof sessionStorage !== 'undefined') {
      const value = sessionStorage.getItem(key);
      if (value) {
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      }
    }
    return null;
  }
  
  // Persistent quiz state (survives sessions)
  setPersistentQuizState(key: string, value: any): void {
    if (typeof localStorage !== 'undefined') {
      // For sensitive data, encrypt it
      if (key.includes('results') || key.includes('answers')) {
        const encryptedData = AES.encrypt(
          JSON.stringify(this.sanitizeData(value)),
          STORAGE_SECRET
        ).toString();
        localStorage.setItem(key, encryptedData);
      } else {
        localStorage.setItem(key, JSON.stringify(this.sanitizeData(value)));
      }
    }
  }
  
  getPersistentQuizState<T>(key: string): T | null {
    if (typeof localStorage !== 'undefined') {
      const value = localStorage.getItem(key);
      if (!value) return null;
      
      try {
        // Check if the value is encrypted
        if (value.startsWith('U2F') || value.length > 100) {
          const bytes = AES.decrypt(value, STORAGE_SECRET);
          const decryptedString = bytes.toString(enc.Utf8);
          return JSON.parse(decryptedString) as T;
        } else {
          return JSON.parse(value) as T;
        }
      } catch {
        return null;
      }
    }
    return null;
  }
  
  // Store quiz results securely
  storeQuizResults(slug: string, results: any): void {
    // Store both in session (for immediate use) and local storage (for persistence)
    this.setTemporaryQuizState(`quiz_results_${slug}`, results);
    this.setPersistentQuizState(`quiz_results_${slug}`, results);
    
    // Also store as pendingQuizResults for auth workflow
    if (typeof localStorage !== 'undefined') {
      const storeData = {
        slug,
        results,
        title: results.title || "Quiz Results",
        questions: results.questions || [],
        quizType: results.quizType || "mcq",
      };
      localStorage.setItem('pendingQuizResults', JSON.stringify(storeData));
    }
  }
  
  // Clear all temporary state when no longer needed
  clearTemporaryState(key?: string): void {
    if (typeof sessionStorage !== 'undefined') {
      if (key) {
        sessionStorage.removeItem(key);
      } else {
        // Clear all quiz-related temporary state
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith('quiz_') || k.includes('Quiz')) {
            sessionStorage.removeItem(k);
          }
        });
      }
    }
  }
  
  /**
   * Remove sensitive information before storage
   */
  private sanitizeData(data: any): any {
    if (!data) return data;
    
    // Deep clone to avoid modifying original
    const clonedData = JSON.parse(JSON.stringify(data));
    
    // Remove sensitive fields
    if (clonedData.authState) delete clonedData.authState;
    if (clonedData.token) delete clonedData.token;
    
    // Sanitize answer data to remove correctAnswer fields when storing
    // user progress (to prevent cheating)
    if (clonedData.questions && !clonedData.isCompleted) {
      clonedData.questions = clonedData.questions.map((q: any) => {
        const question = { ...q };
        
        // Only keep necessary fields for later display
        if (!clonedData.isCompleted) {
          delete question.answer;
          delete question.correctAnswer;
          delete question.correctOptionId;
        }
        
        return question;
      });
    }
    
    return clonedData;
  }
}
