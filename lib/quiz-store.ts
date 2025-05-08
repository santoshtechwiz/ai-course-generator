// A persistent storage solution using IndexedDB

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
  
  const DB_NAME = "quizAppDB"
  const DB_VERSION = 1
  const QUIZ_STORE = "quizzes"
  
  class IndexedDBStore {
    private db: IDBDatabase | null = null
    private dbReady: Promise<boolean>
    private dbReadyResolver!: (value: boolean) => void
  
    constructor() {
      this.dbReady = new Promise((resolve) => {
        this.dbReadyResolver = resolve
      })
      this.initDB()
    }
  
    private initDB(): void {
      if (!window.indexedDB) {
        console.error("Your browser doesn't support IndexedDB")
        return
      }
  
      const request = window.indexedDB.open(DB_NAME, DB_VERSION)
  
      request.onerror = (event) => {
        console.error("IndexedDB error:", event)
      }
  
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result
        this.dbReadyResolver(true)
      }
  
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
  
        // Create object store for quizzes
        if (!db.objectStoreNames.contains(QUIZ_STORE)) {
          const store = db.createObjectStore(QUIZ_STORE, { keyPath: "id" })
          store.createIndex("createdAt", "createdAt", { unique: false })
        }
      }
    }
  
    private async ensureDBReady(): Promise<void> {
      await this.dbReady
      if (!this.db) {
        throw new Error("Database not initialized")
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
        const transaction = this.db!.transaction([QUIZ_STORE], "readwrite")
  
        transaction.oncomplete = () => {
          resolve(quiz)
        }
  
        transaction.onerror = (event) => {
          reject(`Error saving quiz: ${event}`)
        }
  
        const store = transaction.objectStore(QUIZ_STORE)
        store.add(quiz)
      })
    }
  
    async updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz | null> {
      await this.ensureDBReady()
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([QUIZ_STORE], "readwrite")
        const store = transaction.objectStore(QUIZ_STORE)
        const request = store.get(id)
  
        request.onsuccess = () => {
          const quiz = request.result
          if (!quiz) {
            resolve(null)
            return
          }
  
          const updatedQuiz = { ...quiz, ...updates }
          const updateRequest = store.put(updatedQuiz)
  
          updateRequest.onsuccess = () => {
            resolve(updatedQuiz)
          }
  
          updateRequest.onerror = (event) => {
            reject(`Error updating quiz: ${event}`)
          }
        }
  
        request.onerror = (event) => {
          reject(`Error retrieving quiz: ${event}`)
        }
      })
    }
  
    async getAllQuizzes(): Promise<Quiz[]> {
      await this.ensureDBReady()
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([QUIZ_STORE], "readonly")
        const store = transaction.objectStore(QUIZ_STORE)
        const index = store.index("createdAt")
        const request = index.openCursor(null, "prev") // Sort by newest first
  
        const quizzes: Quiz[] = []
  
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (cursor) {
            quizzes.push(cursor.value)
            cursor.continue()
          } else {
            resolve(quizzes)
          }
        }
  
        request.onerror = (event) => {
          reject(`Error retrieving quizzes: ${event}`)
        }
      })
    }
  
    async getQuiz(id: string): Promise<Quiz | null> {
      await this.ensureDBReady()
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([QUIZ_STORE], "readonly")
        const store = transaction.objectStore(QUIZ_STORE)
        const request = store.get(id)
  
        request.onsuccess = () => {
          resolve(request.result || null)
        }
  
        request.onerror = (event) => {
          reject(`Error retrieving quiz: ${event}`)
        }
      })
    }
  
    async deleteQuiz(id: string): Promise<boolean> {
      await this.ensureDBReady()
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([QUIZ_STORE], "readwrite")
        const store = transaction.objectStore(QUIZ_STORE)
        const request = store.delete(id)
  
        request.onsuccess = () => {
          resolve(true)
        }
  
        request.onerror = (event) => {
          reject(`Error deleting quiz: ${event}`)
        }
      })
    }
  }
  
  // Create a singleton instance
  export const quizStore = new IndexedDBStore()
  
  