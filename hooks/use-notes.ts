import { useCallback, useMemo } from "react"
import useSWR from "swr"
import { Bookmark } from "@prisma/client"
import { noteService, CreateNoteData, UpdateNoteData, NoteFilters } from "@/lib/note-service"
import { useAuth } from "@/modules/auth"

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch notes: ${response.statusText}`)
  }
  return response.json()
}

export function useNotes(filters: NoteFilters = {}) {
  const { isAuthenticated } = useAuth()
  
  // Create cache key from filters
  const cacheKey = useMemo(() => {
    if (!isAuthenticated) return null // Don't make API call if not authenticated
    
    const params = new URLSearchParams()
    if (filters.courseId) params.append("courseId", filters.courseId.toString())
    if (filters.chapterId) params.append("chapterId", filters.chapterId.toString())
    if (filters.limit) params.append("limit", filters.limit.toString())
    if (filters.offset) params.append("offset", filters.offset.toString())
    return `/api/notes?${params.toString()}`
  }, [filters, isAuthenticated])

  const {
    data,
    error,
    isLoading: loading,
    mutate
  } = useSWR(cacheKey, fetcher, {
    dedupingInterval: 30_000, // 30 seconds
    revalidateOnFocus: false,
    revalidateIfStale: true,
    revalidateOnReconnect: true,
  })

  const notes = data?.notes || []
  const pagination = data?.pagination || null

  const createNote = useCallback(async (data: CreateNoteData) => {
    try {
      const newNote = await noteService.createNote(data)
      
      // Optimistically update cache
      await mutate(
        (current: any) => current ? {
          ...current,
          notes: [newNote, ...current.notes],
          pagination: current.pagination ? { 
            ...current.pagination, 
            total: current.pagination.total + 1 
          } : null
        } : undefined,
        { revalidate: false }
      )
      
      return newNote
    } catch (err) {
      // Revalidate on error
      mutate()
      throw err
    }
  }, [mutate])

  const updateNote = useCallback(async (id: string, data: UpdateNoteData) => {
    try {
      const updatedNote = await noteService.updateNote(id, data)
      
      // Optimistically update cache
      await mutate(
        (current: any) => current ? {
          ...current,
          notes: current.notes.map((note: Bookmark) =>
            note.id === id ? updatedNote : note
          )
        } : undefined,
        { revalidate: false }
      )
      
      return updatedNote
    } catch (err) {
      // Revalidate on error
      mutate()
      throw err
    }
  }, [mutate])

  const deleteNote = useCallback(async (id: string) => {
    try {
      await noteService.deleteNote(id)
      
      // Optimistically update cache
      await mutate(
        (current: any) => current ? {
          ...current,
          notes: current.notes.filter((note: Bookmark) => note.id !== id),
          pagination: current.pagination ? {
            ...current.pagination,
            total: current.pagination.total - 1
          } : null
        } : undefined,
        { revalidate: false }
      )
    } catch (err) {
      // Revalidate on error
      mutate()
      throw err
    }
  }, [mutate])

  const searchNotes = useCallback(async (query: string) => {
    try {
      const searchResults = await noteService.searchNotes(query, filters.courseId)
      
      // Update cache with search results
      await mutate(
        (current: any) => current ? {
          ...current,
          notes: searchResults
        } : { notes: searchResults, pagination: null },
        { revalidate: false }
      )
    } catch (err) {
      // Revalidate on error
      mutate()
      throw err
    }
  }, [filters.courseId, mutate])

  return {
    notes,
    loading,
    error: error?.message || null,
    pagination,
    refetch: mutate,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
  }
}

export function useNotesForCourse(courseId: number) {
  return useNotes({ courseId, limit: 100 })
}

export function useNotesForChapter(courseId: number, chapterId: number) {
  return useNotes({ courseId, chapterId, limit: 100 })
}

export function useRecentNotes(limit: number = 10) {
  const cacheKey = `/api/notes?limit=${limit}`
  
  const {
    data,
    error,
    isLoading: loading,
    mutate
  } = useSWR(cacheKey, fetcher, {
    dedupingInterval: 60_000, // 1 minute for recent notes
    revalidateOnFocus: false,
  })

  const notes = data?.notes || []

  return {
    notes,
    loading,
    error: error?.message || null,
    refetch: mutate,
  }
}
