import { Bookmark } from "@prisma/client"

export interface CreateBookmarkData {
  courseId?: number
  chapterId?: number
  note?: string
}

export interface UpdateBookmarkData {
  note?: string
}

export interface BookmarkFilters {
  courseId?: number
  chapterId?: number
  limit?: number
  offset?: number
}

interface NoteFilters {
  courseId?: number
  chapterId?: number
  limit?: number
  offset?: number
}

class BookmarkService {
  private baseUrl = "/api/bookmarks"

  // Bookmark CRUD operations
  async getBookmarks(filters: BookmarkFilters = {}): Promise<{
    bookmarks: Bookmark[]
    pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  }> {
    const params = new URLSearchParams()

    if (filters.courseId) params.append("courseId", filters.courseId.toString())
    if (filters.chapterId) params.append("chapterId", filters.chapterId.toString())
    if (filters.limit) params.append("limit", filters.limit.toString())
    if (filters.offset) params.append("offset", filters.offset.toString())

    const response = await fetch(`${this.baseUrl}?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch bookmarks: ${response.statusText}`)
    }
    return response.json()
  }

  async createBookmark(data: CreateBookmarkData): Promise<Bookmark> {
    // Whitelist only allowed fields to avoid sending stale/unsupported keys (e.g., deprecated timestamp)
    const payload: Record<string, any> = {}
    if (typeof data.courseId === 'number') payload.courseId = data.courseId
    if (typeof data.chapterId === 'number') payload.chapterId = data.chapterId
    if (typeof data.note === 'string') payload.note = data.note

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to create bookmark")
    }

    return response.json()
  }

  async updateBookmark(id: number, data: UpdateBookmarkData): Promise<Bookmark> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to update bookmark")
    }

    return response.json()
  }

  async deleteBookmark(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to delete bookmark")
    }
  }

  async getBookmark(id: number): Promise<Bookmark> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to fetch bookmark")
    }
    return response.json()
  }

  // Note operations (using bookmarks with notes)
  async getNotes(filters: NoteFilters = {}): Promise<{
    notes: Bookmark[]
    pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  }> {
    const params = new URLSearchParams()

    if (filters.courseId) params.append("courseId", filters.courseId.toString())
    if (filters.chapterId) params.append("chapterId", filters.chapterId.toString())
    if (filters.limit) params.append("limit", filters.limit.toString())
    if (filters.offset) params.append("offset", filters.offset.toString())

    const response = await fetch(`/api/notes?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch notes: ${response.statusText}`)
    }
    return response.json()
  }

  async createNote(courseId: number, chapterId: number | undefined, note: string): Promise<Bookmark> {
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        courseId,
        chapterId,
        note,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to create note")
    }

    return response.json()
  }

  async updateNote(id: number, note: string): Promise<Bookmark> {
    const response = await fetch(`/api/notes/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ note }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to update note")
    }

    return response.json()
  }

  async deleteNote(id: number): Promise<void> {
    const response = await fetch(`/api/notes/${id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to delete note")
    }
  }

  // Utility methods
  async toggleBookmark(courseId: number, chapterId?: number): Promise<{ bookmarked: boolean; bookmark?: Bookmark }> {
    try {
      // Check if bookmark exists
      const { bookmarks } = await this.getBookmarks({
        courseId,
        chapterId,
        limit: 1,
      })

      if (bookmarks.length > 0) {
        // Remove bookmark
        await this.deleteBookmark(bookmarks[0].id)
        return { bookmarked: false }
      } else {
        // Create bookmark
        const bookmark = await this.createBookmark({
          courseId,
          chapterId,
        })
        return { bookmarked: true, bookmark }
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error)
      throw error
    }
  }

  async hasBookmark(courseId: number, chapterId?: number): Promise<boolean> {
    try {
      const { bookmarks } = await this.getBookmarks({
        courseId,
        chapterId,
        limit: 1,
      })
      return bookmarks.length > 0
    } catch (error) {
      console.error("Error checking bookmark status:", error)
      return false
    }
  }
}

export const bookmarkService = new BookmarkService()

