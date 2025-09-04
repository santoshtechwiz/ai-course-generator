import { Bookmark } from "@prisma/client"

export interface CreateNoteData {
  courseId: number
  chapterId?: number
  note: string
  title?: string
}

export interface UpdateNoteData {
  note: string
  title?: string
}

export interface NoteFilters {
  courseId?: number
  chapterId?: number
  limit?: number
  offset?: number
}

// Simple in-memory cache for notes
interface CacheEntry {
  data: any
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class NotesCache {
  private cache = new Map<string, CacheEntry>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  private getCacheKey(filters: NoteFilters): string {
    return JSON.stringify(filters)
  }

  get(filters: NoteFilters): any | null {
    const key = this.getCacheKey(filters)
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  set(filters: NoteFilters, data: any, ttl?: number): void {
    const key = this.getCacheKey(filters)
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
  }

  invalidate(filters?: NoteFilters): void {
    if (filters) {
      const key = this.getCacheKey(filters)
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

const notesCache = new NotesCache()

// Clean up cache every 10 minutes
setInterval(() => notesCache.cleanup(), 10 * 60 * 1000)

class NoteService {
  private baseUrl = "/api/notes"

  // Note CRUD operations
  async getNotes(filters: NoteFilters = {}): Promise<{
    notes: Bookmark[]
    pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  }> {
    // Check rate limit
    if (!apiRateLimiter.canMakeCall('getNotes')) {
      const waitTime = apiRateLimiter.getRemainingTime('getNotes')
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`)
    }

    // Check cache first
    const cached = notesCache.get(filters)
    if (cached) {
      return cached
    }

    const params = new URLSearchParams()

    if (filters.courseId) params.append("courseId", filters.courseId.toString())
    if (filters.chapterId) params.append("chapterId", filters.chapterId.toString())
    if (filters.limit) params.append("limit", filters.limit.toString())
    if (filters.offset) params.append("offset", filters.offset.toString())

    const response = await fetch(`${this.baseUrl}?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch notes: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    // Cache the result
    notesCache.set(filters, result)
    
    return result
  }

  async createNote(data: CreateNoteData): Promise<Bookmark> {
    // Check rate limit
    if (!apiRateLimiter.canMakeCall('createNote')) {
      const waitTime = apiRateLimiter.getRemainingTime('createNote')
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`)
    }

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to create note")
    }

    const result = await response.json()
    
    // Invalidate cache for related queries
    notesCache.invalidate({ courseId: data.courseId })
    if (data.chapterId) {
      notesCache.invalidate({ courseId: data.courseId, chapterId: data.chapterId })
    }
    
    return result
  }

  async updateNote(id: string, data: UpdateNoteData): Promise<Bookmark> {
    // Check rate limit
    if (!apiRateLimiter.canMakeCall('updateNote')) {
      const waitTime = apiRateLimiter.getRemainingTime('updateNote')
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`)
    }

    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to update note")
    }

    const result = await response.json()
    
    // Invalidate cache for all note queries (since we don't know the exact filters)
    notesCache.invalidate()
    
    return result
  }

  async deleteNote(id: string): Promise<void> {
    // Check rate limit
    if (!apiRateLimiter.canMakeCall('deleteNote')) {
      const waitTime = apiRateLimiter.getRemainingTime('deleteNote')
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`)
    }

    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to delete note")
    }
    
    // Invalidate cache for all note queries
    notesCache.invalidate()
  }

  async getNote(id: string): Promise<Bookmark> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to fetch note")
    }
    return response.json()
  }

  // Utility methods
  async getNotesForCourse(courseId: number): Promise<Bookmark[]> {
    const { notes } = await this.getNotes({ courseId, limit: 100 })
    return notes
  }

  async getNotesForChapter(courseId: number, chapterId: number): Promise<Bookmark[]> {
    const { notes } = await this.getNotes({ courseId, chapterId, limit: 100 })
    return notes
  }

  async searchNotes(query: string, courseId?: number): Promise<Bookmark[]> {
    // This would require a more advanced search implementation
    // For now, we'll fetch all notes and filter client-side
    const filters: NoteFilters = { limit: 100 }
    if (courseId) filters.courseId = courseId

    const { notes } = await this.getNotes(filters)
    return notes.filter(note =>
      note.note?.toLowerCase().includes(query.toLowerCase())
    )
  }

  async getRecentNotes(limit: number = 10): Promise<Bookmark[]> {
    const { notes } = await this.getNotes({ limit })
    return notes
  }
}

// Simple rate limiter for API calls
class ApiRateLimiter {
  private callCounts = new Map<string, { count: number; resetTime: number }>()
  private maxCallsPerMinute = 30 // Reasonable limit for notes API

  private getKey(endpoint: string, userId?: string): string {
    return `${endpoint}:${userId || 'anonymous'}`
  }

  canMakeCall(endpoint: string, userId?: string): boolean {
    const key = this.getKey(endpoint, userId)
    const now = Date.now()
    const entry = this.callCounts.get(key)

    if (!entry || now > entry.resetTime) {
      // Reset or new entry
      this.callCounts.set(key, { count: 1, resetTime: now + 60000 }) // 1 minute
      return true
    }

    if (entry.count >= this.maxCallsPerMinute) {
      return false
    }

    entry.count++
    return true
  }

  getRemainingTime(endpoint: string, userId?: string): number {
    const key = this.getKey(endpoint, userId)
    const entry = this.callCounts.get(key)
    if (!entry) return 0
    return Math.max(0, entry.resetTime - Date.now())
  }
}

const apiRateLimiter = new ApiRateLimiter()

export const noteService = new NoteService()
export default noteService
