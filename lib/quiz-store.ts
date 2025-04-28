// Define types for our quiz store
export interface Question {
    id: string
    question: string
    options: string[]
    correctAnswer: number
  }
  
  export interface Quiz {
    id: string
    title: string
    description: string
    questions: Question[]
    createdAt: string
    updatedAt: string
    authorId?: string
    category?: string
    difficulty?: "easy" | "medium" | "hard"
    tags?: string[]
  }
  
  export interface QuizAttempt {
    id: string
    quizId: string
    startedAt: string
    completedAt?: string
    answers: Record<number, number> // questionIndex -> selectedAnswerIndex
    score?: number
  }
  
  // Helper to generate unique IDs
  const generateId = () => Math.random().toString(36).substring(2, 15)
  
  // Local storage keys
  const QUIZZES_STORAGE_KEY = "courseai_quizzes"
  const ATTEMPTS_STORAGE_KEY = "courseai_quiz_attempts"
  
  // Helper functions for localStorage with error handling
  const getFromStorage = <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error retrieving ${key} from localStorage:`, error);
      return defaultValue;
    }
  };
  
  const saveToStorage = <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };
  
  // Quiz store implementation
  class QuizStore {
    private quizzes: Record<string, Quiz> = {};
    private attempts: Record<string, QuizAttempt> = {};
    private initialized = false;
  
    constructor() {
      this.init();
    }
  
    private init() {
      if (typeof window === 'undefined' || this.initialized) return;
      
      // Load data from localStorage
      this.quizzes = getFromStorage<Record<string, Quiz>>(QUIZZES_STORAGE_KEY, {});
      this.attempts = getFromStorage<Record<string, QuizAttempt>>(ATTEMPTS_STORAGE_KEY, {});
      this.initialized = true;
    }
  
    // Quiz methods
    getQuiz(quizId: string): Quiz | null {
      this.init(); // Ensure data is loaded
      return this.quizzes[quizId] || null;
    }
  
    getAllQuizzes(): Quiz[] {
      this.init(); // Ensure data is loaded
      return Object.values(this.quizzes);
    }
  
    saveQuiz(quiz: Quiz): Quiz {
      this.init(); // Ensure data is loaded
      
      // Generate ID if not provided
      if (!quiz.id) {
        quiz.id = generateId();
      }
      
      // Set timestamps
      const now = new Date().toISOString();
      if (!quiz.createdAt) {
        quiz.createdAt = now;
      }
      quiz.updatedAt = now;
      
      // Save to store
      this.quizzes[quiz.id] = quiz;
      saveToStorage(QUIZZES_STORAGE_KEY, this.quizzes);
      
      return quiz;
    }
  
    deleteQuiz(quizId: string): boolean {
      this.init(); // Ensure data is loaded
      
      if (!this.quizzes[quizId]) return false;
      
      delete this.quizzes[quizId];
      saveToStorage(QUIZZES_STORAGE_KEY, this.quizzes);
      
      // Also delete related attempts
      const attemptIds = Object.keys(this.attempts).filter(
        id => this.attempts[id].quizId === quizId
      );
      
      attemptIds.forEach(id => delete this.attempts[id]);
      saveToStorage(ATTEMPTS_STORAGE_KEY, this.attempts);
      
      return true;
    }
  
    // Quiz attempt methods
    startQuizAttempt(quizId: string): string {
      this.init(); // Ensure data is loaded
      
      const quiz = this.getQuiz(quizId);
      if (!quiz) throw new Error(`Quiz with ID ${quizId} not found`);
      
      const attemptId = generateId();
      const attempt: QuizAttempt = {
        id: attemptId,
        quizId,
        startedAt: new Date().toISOString(),
        answers: {},
      };
      
      this.attempts[attemptId] = attempt;
      saveToStorage(ATTEMPTS_STORAGE_KEY, this.attempts);
      
      return attemptId;
    }
  
    saveQuizAnswer(attemptId: string, questionIndex: number, answerIndex: number): boolean {
      this.init(); // Ensure data is loaded
      
      const attempt = this.attempts[attemptId];
      if (!attempt) return false;
      
      // Don't allow changing answers for completed attempts
      if (attempt.completedAt) return false;
      
      attempt.answers[questionIndex] = answerIndex;
      saveToStorage(ATTEMPTS_STORAGE_KEY, this.attempts);
      
      return true;
    }
  
    completeQuizAttempt(attemptId: string): QuizAttempt | null {
      this.init(); // Ensure data is loaded
      
      const attempt = this.attempts[attemptId];
      if (!attempt || attempt.completedAt) return null;
      
      const quiz = this.getQuiz(attempt.quizId);
      if (!quiz) return null;
      
      // Calculate score
      let score = 0;
      Object.entries(attempt.answers).forEach(([questionIndexStr, answerIndex]) => {
        const questionIndex = parseInt(questionIndexStr);
        if (quiz.questions[questionIndex]?.correctAnswer === answerIndex) {
          score++;
        }
      });
      
      // Update attempt
      attempt.completedAt = new Date().toISOString();
      attempt.score = score;
      saveToStorage(ATTEMPTS_STORAGE_KEY, this.attempts);
      
      return attempt;
    }
  
    getQuizAttempt(attemptId: string): QuizAttempt | null {
      this.init(); // Ensure data is loaded
      return this.attempts[attemptId] || null;
    }
  
    getQuizAttempts(quizId: string): QuizAttempt[] {
      this.init(); // Ensure data is loaded
      return Object.values(this.attempts).filter(
        attempt => attempt.quizId === quizId
      );
    }
  
  
  }
  
  // Create and export a singleton instance
  export const quizStore = new QuizStore();
  