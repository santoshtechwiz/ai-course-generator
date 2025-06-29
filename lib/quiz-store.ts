import type { QuizQuestion } from "@/app/types/quiz-types"

export type DocumentQuestion = QuizQuestion & {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  codeSnippet?: string
}

export interface Quiz {
  id: string
  title: string
  questions: DocumentQuestion[]
  createdAt: number
}

export interface DocumentQuizAttempt {
  id: string
  quizId: string
  answers: number[]
  score: number
  completed: boolean
  startedAt: number
  completedAt?: number
}

const DB_NAME = "quizAppDB"
const DB_VERSION = 2 // ✅ Incremented to force upgrade and add "quizAttempts" store
const QUIZ_STORE = "quizzes"
const ATTEMPT_STORE = "quizAttempts"
const isBrowser = typeof window !== "undefined"

class IndexedDBStore {
  private db: IDBDatabase | null = null
  private dbReady: Promise<boolean>
  private dbReadyResolver!: (value: boolean) => void
  private isInitialized = false

  constructor() {
    this.dbReady = new Promise((resolve) => {
      this.dbReadyResolver = resolve
    })

    if (isBrowser) {
      this.initDB()
    } else {
      this.dbReadyResolver(false)
    }
  }

  private initDB(): void {
    if (!isBrowser || this.isInitialized) return
    this.isInitialized = true

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error("IndexedDB init failed:", request.error)
      this.dbReadyResolver(false)
    }

    request.onsuccess = () => {
      this.db = request.result
      this.dbReadyResolver(true)
    }

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(QUIZ_STORE)) {
        const quizStore = db.createObjectStore(QUIZ_STORE, { keyPath: "id" })
        quizStore.createIndex("createdAt", "createdAt", { unique: false })
      }
      if (!db.objectStoreNames.contains(ATTEMPT_STORE)) {
        const attemptStore = db.createObjectStore(ATTEMPT_STORE, { keyPath: "id" })
        attemptStore.createIndex("quizId", "quizId", { unique: false })
      }
    }
  }

  private async ensureDBReady(): Promise<void> {
    if (!isBrowser) return
    const isReady = await this.dbReady
    if (isReady && !this.db) {
      throw new Error("IndexedDB initialized but db is null")
    }
  }

  async saveQuiz(title: string, questions: Question[]): Promise<Quiz> {
    await this.ensureDBReady()

    const quiz: Quiz = {
      id: crypto.randomUUID(),
      title,
      questions,
      createdAt: Date.now(),
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(QUIZ_STORE, "readwrite")
      const store = tx.objectStore(QUIZ_STORE)
      const req = store.add(quiz)

      req.onsuccess = () => resolve(quiz)
      req.onerror = () => reject(req.error)
    })
  }

  async updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz | null> {
    await this.ensureDBReady()

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(QUIZ_STORE, "readwrite")
      const store = tx.objectStore(QUIZ_STORE)
      const getReq = store.get(id)

      getReq.onerror = () => reject(getReq.error)

      getReq.onsuccess = () => {
        const quiz = getReq.result as Quiz | undefined
        if (!quiz) return resolve(null)

        const updated = { ...quiz, ...updates }
        const putReq = store.put(updated)

        putReq.onsuccess = () => resolve(updated)
        putReq.onerror = () => reject(putReq.error)
      }
    })
  }

  async getAllQuizzes(): Promise<Quiz[]> {
    await this.ensureDBReady()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(QUIZ_STORE, "readonly")
      const store = tx.objectStore(QUIZ_STORE)
      const index = store.index("createdAt")
      const request = index.openCursor(null, "prev")

      const quizzes: Quiz[] = []

      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          quizzes.push(cursor.value as Quiz)
          cursor.continue()
        } else {
          resolve(quizzes)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  async getQuiz(id: string): Promise<Quiz | null> {
    await this.ensureDBReady()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(QUIZ_STORE, "readonly")
      const store = tx.objectStore(QUIZ_STORE)
      const req = store.get(id)

      req.onsuccess = () => {
        const quiz = req.result as Quiz | undefined
        resolve(quiz || null)
      }

      req.onerror = () => reject(req.error)
    })
  }

  async deleteQuiz(id: string): Promise<boolean> {
    await this.ensureDBReady()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(QUIZ_STORE, "readwrite")
      const store = tx.objectStore(QUIZ_STORE)
      const req = store.delete(id)

      req.onsuccess = () => resolve(true)
      req.onerror = () => reject(req.error)
    })
  }

  // ✅ Attempts Logic Below
  async startQuizAttempt(quizId: string): Promise<string> {
    await this.ensureDBReady()

    const attemptId = crypto.randomUUID()
    const attempt: QuizAttempt = {
      id: attemptId,
      quizId,
      answers: [],
      score: 0,
      completed: false,
      startedAt: Date.now(),
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(ATTEMPT_STORE, "readwrite")
      const store = tx.objectStore(ATTEMPT_STORE)
      const req = store.add(attempt)

      req.onsuccess = () => resolve(attemptId)
      req.onerror = () => reject(req.error)
    })
  }

  async saveQuizAnswer(attemptId: string, questionIndex: number, answerIndex: number): Promise<void> {
    await this.ensureDBReady()

    // Add a runtime check for attemptId
    if (!attemptId) {
      throw new Error("Invalid attemptId passed to saveQuizAnswer")
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(ATTEMPT_STORE, "readwrite")
      const store = tx.objectStore(ATTEMPT_STORE)
      const req = store.get(attemptId)

      req.onsuccess = () => {
        const attempt = req.result as QuizAttempt
        attempt.answers[questionIndex] = answerIndex
        store.put(attempt)
        resolve()
      }

      req.onerror = () => reject(req.error)
    })
  }

  async completeQuizAttempt(attemptId: string): Promise<QuizAttempt | null> {
    await this.ensureDBReady()

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([ATTEMPT_STORE, QUIZ_STORE], "readwrite")
      const attemptStore = tx.objectStore(ATTEMPT_STORE)
      const quizStore = tx.objectStore(QUIZ_STORE)

      const attemptReq = attemptStore.get(attemptId)

      attemptReq.onerror = () => reject(attemptReq.error)

      attemptReq.onsuccess = () => {
        const attempt = attemptReq.result as QuizAttempt
        if (!attempt) return resolve(null)

        const quizReq = quizStore.get(attempt.quizId)

        quizReq.onsuccess = () => {
          const quiz = quizReq.result as Quiz
          let score = 0

          quiz.questions.forEach((q, index) => {
            if (attempt.answers[index] === q.correctAnswer) score++
          })

          attempt.score = score
          attempt.completed = true
          attempt.completedAt = Date.now()

          attemptStore.put(attempt)

          resolve(attempt)
        }

        quizReq.onerror = () => reject(quizReq.error)
      }
    })
  }
}

export const quizStore = new IndexedDBStore()

if (isBrowser) {
  console.debug("✅ IndexedDB: Quiz store initialized")
}
