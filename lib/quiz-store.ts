// Enhanced quiz store with better persistence
// Define local storage with a fallback for non-browser environments
const localStorage = typeof window !== 'undefined' && window.localStorage ? window.localStorage : {
  getItem: (key: string) => null,
  setItem: (key: string, value: string) => {},
  removeItem: (key: string) => {}
};

export interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

export interface Quiz {
  id: string
  title: string
  questions: Question[]
  createdAt: number
}

interface QuizAttempt {
  id: string
  quizId: string
  answers: number[]
  score: number
  completed: boolean
  startedAt: number
  completedAt?: number
}

const QUIZZES_KEY = 'quizApp_quizzes';
const ATTEMPTS_KEY = 'quizApp_attempts';

class QuizStore {
  private quizzes: Quiz[] = [];
  private attempts: QuizAttempt[] = [];
  private initialized = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      // Load quizzes
      const quizzesJson = localStorage.getItem(QUIZZES_KEY);
      if (quizzesJson) {
        this.quizzes = JSON.parse(quizzesJson);
      }

      // Load attempts
      const attemptsJson = localStorage.getItem(ATTEMPTS_KEY);
      if (attemptsJson) {
        this.attempts = JSON.parse(attemptsJson);
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error loading from storage:', error);
      // Initialize with empty arrays if there's an error
      this.quizzes = [];
      this.attempts = [];
      this.initialized = true;
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(QUIZZES_KEY, JSON.stringify(this.quizzes));
      localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(this.attempts));
      return true;
    } catch (error) {
      console.error('Error saving to storage:', error);
      return false;
    }
  }

  // Ensure storage is loaded before any operations
  private ensureInitialized() {
    if (!this.initialized) {
      this.loadFromStorage();
    }
  }

  // Quiz CRUD operations
  getAllQuizzes(): Quiz[] {
    this.ensureInitialized();
    return [...this.quizzes];
  }

  getQuiz(id: string): Quiz | null {
    this.ensureInitialized();
    return this.quizzes.find(quiz => quiz.id === id) || null;
  }

  saveQuiz(title: string, questions: Question[]): Quiz {
    this.ensureInitialized();
    
    const quiz: Quiz = {
      id: crypto.randomUUID(),
      title,
      questions,
      createdAt: Date.now()
    };

    this.quizzes.push(quiz);
    this.saveToStorage();
    return quiz;
  }

  updateQuiz(id: string, updates: Partial<Quiz>): Quiz | null {
    this.ensureInitialized();
    
    const index = this.quizzes.findIndex(quiz => quiz.id === id);
    if (index === -1) return null;

    const updatedQuiz = { ...this.quizzes[index], ...updates };
    this.quizzes[index] = updatedQuiz;
    this.saveToStorage();
    return updatedQuiz;
  }

  deleteQuiz(id: string): boolean {
    this.ensureInitialized();
    
    const initialLength = this.quizzes.length;
    this.quizzes = this.quizzes.filter(quiz => quiz.id !== id);
    
    // Also delete related attempts
    this.attempts = this.attempts.filter(attempt => attempt.quizId !== id);
    
    this.saveToStorage();
    return this.quizzes.length < initialLength;
  }

  // Quiz attempt operations
  startQuizAttempt(quizId: string): string {
    this.ensureInitialized();
    
    const quiz = this.getQuiz(quizId);
    if (!quiz) return '';

    const attempt: QuizAttempt = {
      id: crypto.randomUUID(),
      quizId,
      answers: new Array(quiz.questions.length).fill(-1),
      score: 0,
      completed: false,
      startedAt: Date.now()
    };

    this.attempts.push(attempt);
    this.saveToStorage();
    return attempt.id;
  }

  saveQuizAnswer(attemptId: string, questionIndex: number, answerIndex: number): boolean {
    this.ensureInitialized();
    
    const attemptIndex = this.attempts.findIndex(a => a.id === attemptId);
    if (attemptIndex === -1) return false;

    const attempt = this.attempts[attemptIndex];
    if (attempt.completed) return false;

    attempt.answers[questionIndex] = answerIndex;
    this.attempts[attemptIndex] = attempt;
    this.saveToStorage();
    return true;
  }

  completeQuizAttempt(attemptId: string): QuizAttempt | null {
    this.ensureInitialized();
    
    const attemptIndex = this.attempts.findIndex(a => a.id === attemptId);
    if (attemptIndex === -1) return null;

    const attempt = this.attempts[attemptIndex];
    if (attempt.completed) return attempt;

    const quiz = this.getQuiz(attempt.quizId);
    if (!quiz) return null;

    // Calculate score
    let score = 0;
    attempt.answers.forEach((answer, index) => {
      if (index < quiz.questions.length && answer === quiz.questions[index].correctAnswer) {
        score++;
      }
    });

    // Update attempt
    attempt.score = score;
    attempt.completed = true;
    attempt.completedAt = Date.now();
    this.attempts[attemptIndex] = attempt;
    this.saveToStorage();
    return attempt;
  }

  getQuizAttempts(quizId: string): QuizAttempt[] {
    this.ensureInitialized();
    return this.attempts.filter(attempt => attempt.quizId === quizId);
  }
}

// Create a singleton instance
export const quizStore = new QuizStore();
